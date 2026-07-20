import json
import logging
import re
from unittest.mock import AsyncMock, MagicMock, patch

from httpx import ASGITransport, AsyncClient
from supabase_auth.errors import AuthApiError

from dependencies.limiter import limiter
from main import _JSONFormatter, _request_id, app


def _canonical_records(caplog):
    """Canonical access-log lines captured from the middleware."""
    return [r for r in caplog.records if r.name == "main" and hasattr(r, "status")]


def _format(record):
    """Run a record through the JSON formatter and parse the result."""
    return json.loads(_JSONFormatter().format(record))


def _make_record(**extra):
    record = logging.LogRecord(
        name="main",
        level=logging.INFO,
        pathname="main.py",
        lineno=1,
        msg="hello %s",
        args=("world",),
        exc_info=None,
    )
    for key, value in extra.items():
        setattr(record, key, value)
    return record


def test_formatter_emits_core_fields():
    out = _format(_make_record(request_id="abc123"))
    assert out == {
        "level": "INFO",
        "logger": "main",
        "request_id": "abc123",
        "msg": "hello world",
    }


def test_formatter_drops_timestamp():
    out = _format(_make_record(request_id="abc123"))
    assert "ts" not in out
    assert "asctime" not in out
    assert "created" not in out


def test_formatter_defaults_request_id_when_absent():
    out = _format(_make_record())
    assert out["request_id"] == "-"


def test_formatter_emits_extra_structured_fields():
    out = _format(
        _make_record(
            request_id="abc123",
            method="GET",
            path="/x",
            status=200,
            duration_ms=12.3,
        )
    )
    # Exact key set: the 4 core fields plus exactly the 4 extras — nothing else.
    assert set(out) == {
        "level",
        "logger",
        "request_id",
        "msg",
        "method",
        "path",
        "status",
        "duration_ms",
    }
    assert out["method"] == "GET"
    assert out["path"] == "/x"
    assert out["status"] == 200
    assert out["duration_ms"] == 12.3


def test_formatter_does_not_leak_internal_attributes():
    out = _format(_make_record(request_id="abc123", status=500))
    for noise in ("args", "levelno", "pathname", "lineno", "process", "thread"):
        assert noise not in out


def test_formatter_includes_exception():
    try:
        raise ValueError("boom")
    except ValueError:
        import sys

        record = _make_record(request_id="abc123")
        record.exc_info = sys.exc_info()
    out = _format(record)
    assert "exc" in out
    assert "ValueError: boom" in out["exc"]


def test_noisy_third_party_loggers_are_quieted():
    for name in ("httpx", "httpcore", "hpack", "anthropic", "urllib3", "postgrest"):
        assert logging.getLogger(name).level == logging.WARNING


def test_app_loggers_are_not_quieted():
    # Our own loggers inherit the root level (unset), not the third-party level.
    assert logging.getLogger("main").level == logging.NOTSET
    assert logging.getLogger("routers.ai").level == logging.NOTSET


async def test_request_middleware_emits_access_log(caplog):
    _request_id.set("-")
    with caplog.at_level(logging.INFO, logger="main"):
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            await ac.get("/health/api")

    access_logs = [
        r for r in caplog.records if r.name == "main" and hasattr(r, "status")
    ]
    assert len(access_logs) == 1
    record = access_logs[0]
    assert record.method == "GET"
    assert record.path == "/health/api"
    assert record.status == 200
    assert isinstance(record.duration_ms, float)
    # The human-readable message is composed from the printf-style template,
    # e.g. "GET /health/api 200 12ms" (duration varies run to run).
    assert re.fullmatch(r"GET /health/api 200 \d+ms", record.getMessage())
    # And it survives the formatter as proper structured JSON, with exactly
    # the expected keys — no internal LogRecord attributes leaking through.
    out = _format(record)
    assert set(out) == {
        "level",
        "logger",
        "request_id",
        "msg",
        "method",
        "path",
        "status",
        "duration_ms",
    }
    assert out["method"] == "GET"
    assert out["path"] == "/health/api"
    assert out["status"] == 200
    assert re.fullmatch(r"GET /health/api 200 \d+ms", out["msg"])


async def test_canonical_line_merges_handler_fields(client, caplog):
    limiter.reset()
    with caplog.at_level(logging.INFO, logger="main"):
        with patch(
            "routers.ai.ai_service.get_reply",
            new=AsyncMock(return_value="hello world"),
        ):
            r = await client.post("/ai/chat", json={"message": "hi"})
    assert r.status_code == 200

    (record,) = _canonical_records(caplog)
    assert record.levelno == logging.INFO
    assert record.status == 200
    # Fields attached by the handler ride out on the one canonical line.
    assert record.user_id == "user-123"
    assert record.reply_chars == len("hello world")
    out = _format(record)
    # Exact key set for a request that attaches fields: the 4 core keys, the 4
    # access keys, and exactly the 2 handler fields — nothing leaked.
    assert set(out) == {
        "level",
        "logger",
        "request_id",
        "msg",
        "method",
        "path",
        "status",
        "duration_ms",
        "user_id",
        "reply_chars",
    }
    assert out["user_id"] == "user-123"
    assert out["reply_chars"] == 11


async def test_canonical_level_follows_status(client, caplog):
    limiter.reset()
    with caplog.at_level(logging.INFO, logger="main"):
        with patch(
            "routers.ai.ai_service.get_reply",
            new=AsyncMock(side_effect=RuntimeError("upstream boom")),
        ):
            r = await client.post("/ai/chat", json={"message": "hi"})
    assert r.status_code == 500

    (record,) = _canonical_records(caplog)
    assert record.levelno == logging.ERROR  # 5xx -> ERROR, not INFO
    assert record.status == 500
    assert record.error == "RuntimeError"


async def test_canonical_records_action_on_account_deletion(client, caplog):
    limiter.reset()
    with caplog.at_level(logging.INFO, logger="main"):
        with patch("routers.user.supabase_admin") as mock_supa:
            mock_supa.auth.admin.delete_user = MagicMock(return_value=None)
            r = await client.delete("/users/me")
    assert r.status_code == 204

    (record,) = _canonical_records(caplog)
    assert record.levelno == logging.INFO
    assert record.user_id == "user-123"
    assert record.action == "account_deleted"


async def test_canonical_records_turns_on_history(client, caplog):
    limiter.reset()
    turns = [
        {"role": "user", "content": "hi", "created_at": "2026-06-06T10:00:00+00:00"},
        {
            "role": "assistant",
            "content": "hello",
            "created_at": "2026-06-06T10:00:01+00:00",
        },
    ]
    with caplog.at_level(logging.INFO, logger="main"):
        with patch(
            "routers.ai.ai_service.get_history", new=AsyncMock(return_value=turns)
        ):
            r = await client.get("/ai/history")
    assert r.status_code == 200

    (record,) = _canonical_records(caplog)
    assert record.levelno == logging.INFO
    assert record.user_id == "user-123"
    assert record.turns == len(turns)


async def test_canonical_records_user_not_found_error(client, caplog):
    limiter.reset()
    with caplog.at_level(logging.INFO, logger="main"):
        with patch("routers.user.supabase_admin") as mock_supa:
            mock_supa.auth.admin.delete_user = MagicMock(
                side_effect=AuthApiError("User not found", 404, None)
            )
            r = await client.delete("/users/me")
    assert r.status_code == 404

    (record,) = _canonical_records(caplog)
    assert record.levelno == logging.WARNING  # 404 -> WARNING
    assert record.status == 404
    assert record.error == "user_not_found"


async def test_canonical_records_invalid_token_error(unauthed_client, caplog):
    with caplog.at_level(logging.INFO, logger="main"):
        r = await unauthed_client.post(
            "/ai/chat",
            headers={"Authorization": "Bearer not-a-jwt"},
            json={"message": "hi"},
        )
    assert r.status_code == 401

    (record,) = _canonical_records(caplog)
    assert record.levelno == logging.WARNING  # 401 -> WARNING
    assert record.status == 401
    assert record.error == "invalid_token"


async def test_canonical_records_rate_limited_error(client, caplog):
    limiter.reset()
    with caplog.at_level(logging.INFO, logger="main"):
        with patch("routers.ai.ai_service.get_reply", new=AsyncMock(return_value="ok")):
            for _ in range(8):  # chat limit is 8/minute
                await client.post("/ai/chat", json={"message": "hi"})
            r = await client.post("/ai/chat", json={"message": "hi"})
    assert r.status_code == 429

    throttled = [rec for rec in _canonical_records(caplog) if rec.status == 429]
    assert len(throttled) == 1
    assert throttled[0].levelno == logging.WARNING
    assert throttled[0].error == "rate_limited"


async def test_log_fields_do_not_bleed_between_requests(client, caplog):
    limiter.reset()
    with caplog.at_level(logging.INFO, logger="main"):
        with patch(
            "routers.ai.ai_service.get_reply",
            new=AsyncMock(return_value="hi there"),
        ):
            await client.post("/ai/chat", json={"message": "hi"})
        await client.get("/health/api")

    by_path = {r.path: r for r in _canonical_records(caplog)}
    # The chat line carries user context...
    assert hasattr(by_path["/ai/chat"], "user_id")
    # ...but the subsequent health line must be clean — no leaked fields.
    assert not hasattr(by_path["/health/api"], "user_id")
    assert not hasattr(by_path["/health/api"], "reply_chars")
