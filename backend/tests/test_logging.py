import json
import logging
import re

from httpx import ASGITransport, AsyncClient

from main import _JSONFormatter, _request_id, app


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
