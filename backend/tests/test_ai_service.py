from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.ai import (
    _CONTEXT_LIMIT,
    UI_HISTORY_LIMIT,
    clear_history,
    get_context,
    get_history,
    get_reply,
)

_FAKE_ROW_ID = "aaaaaaaa-0000-0000-0000-000000000000"


def _make_supa_mock(history_data=None):
    """Fake async client: the fluent chain is sync, only ``execute`` is awaited."""
    mock = MagicMock()
    select_chain = mock.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value
    select_chain.execute = AsyncMock(
        return_value=MagicMock(data=history_data or []),
    )
    mock.table.return_value.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": _FAKE_ROW_ID}])
    )
    mock.table.return_value.delete.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    return mock


def _make_limit_honoring_supa_mock(newest_first_rows):
    """Mock whose .limit(n) actually slices, mirroring Supabase's LIMIT."""
    mock = MagicMock()
    chain = (
        mock.table.return_value.select.return_value.eq.return_value.order.return_value
    )

    def limit(n):
        limited = MagicMock()
        limited.execute = AsyncMock(return_value=MagicMock(data=newest_first_rows[:n]))
        return limited

    chain.limit.side_effect = limit
    mock.table.return_value.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": _FAKE_ROW_ID}])
    )
    mock.table.return_value.delete.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    return mock


def _make_claude_mock(reply="Hello from Nova"):
    """Stand-in for the patched ``_call_claude`` coroutine function."""
    return AsyncMock(return_value=reply)


# ``get_reply`` takes the Anthropic client as its second argument. When
# ``_call_claude`` is patched, that client is never touched, so a bare mock does.
def _unused_claude_client():
    return MagicMock()


async def test_get_reply_returns_reply():
    mock_supa = _make_supa_mock()
    with patch("services.ai._call_claude", _make_claude_mock()):
        result = await get_reply(mock_supa, _unused_claude_client(), "user-123", "hi")
    assert result == "Hello from Nova"


async def test_get_reply_prepends_history():
    prior = [
        {"role": "user", "content": "prev"},
        {"role": "assistant", "content": "ok"},
    ]
    new_msg = {"role": "user", "content": "new message"}
    # After the user message is inserted, DB returns all rows newest-first (DESC)
    mock_supa = _make_supa_mock(history_data=list(reversed(prior + [new_msg])))
    mock_claude = _make_claude_mock("reply")
    with patch("services.ai._call_claude", mock_claude):
        await get_reply(mock_supa, _unused_claude_client(), "user-123", "new message")
    # arg 0 is the Anthropic client; the messages are arg 1
    called_messages = mock_claude.call_args[0][1]
    assert called_messages == prior + [new_msg]


async def test_get_reply_saves_to_supabase():
    mock_supa = _make_supa_mock()
    with patch("services.ai._call_claude", _make_claude_mock("reply")):
        await get_reply(mock_supa, _unused_claude_client(), "user-123", "hi")
    insert_mock = mock_supa.table.return_value.insert
    assert insert_mock.call_count == 2
    user_call = insert_mock.call_args_list[0][0][0]
    assert user_call["role"] == "user"
    assert user_call["content"] == "hi"
    assert "created_at" not in user_call
    assistant_call = insert_mock.call_args_list[1][0][0]
    assert assistant_call["role"] == "assistant"
    assert assistant_call["content"] == "reply"


async def test_get_reply_reraises_on_claude_error():
    mock_supa = _make_supa_mock()
    with patch(
        "services.ai._call_claude", AsyncMock(side_effect=RuntimeError("API down"))
    ):
        with pytest.raises(RuntimeError, match="API down"):
            await get_reply(mock_supa, _unused_claude_client(), "user-123", "hi")


async def test_get_reply_cleanup_on_claude_error():
    mock_supa = _make_supa_mock()
    with patch(
        "services.ai._call_claude", AsyncMock(side_effect=RuntimeError("API down"))
    ):
        with pytest.raises(RuntimeError):
            await get_reply(mock_supa, _unused_claude_client(), "user-123", "hi")
    # Only the user insert fires — no assistant insert
    insert_mock = mock_supa.table.return_value.insert
    assert insert_mock.call_count == 1
    assert insert_mock.call_args_list[0][0][0]["role"] == "user"
    # Rollback: orphaned user row deleted by id
    mock_supa.table.return_value.delete.assert_called_once()
    first_eq = mock_supa.table.return_value.delete.return_value.eq.call_args_list[0]
    assert first_eq == (("id", _FAKE_ROW_ID),)


async def test_get_reply_uses_injected_anthropic_client():
    """The injected client is the one the Claude call is made against."""
    mock_supa = _make_supa_mock()
    mock_claude = MagicMock()
    mock_claude.messages.create = AsyncMock(
        return_value=MagicMock(content=[MagicMock(text="from injected client")])
    )
    result = await get_reply(mock_supa, mock_claude, "user-123", "hi")
    assert result == "from injected client"
    mock_claude.messages.create.assert_awaited_once()


async def test_get_history_returns_data():
    history = [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "hi"},
    ]
    # DB returns rows in DESC order (newest first); code reverses them
    mock_supa = _make_supa_mock(history_data=list(reversed(history)))
    result = await get_history(mock_supa, "user-123")
    assert result == history


async def test_get_history_empty():
    mock_supa = _make_supa_mock(history_data=[])
    result = await get_history(mock_supa, "user-123")
    assert result == []


def _limit_arg(mock_supa):
    limit_mock = mock_supa.table.return_value.select.return_value.eq.return_value.order.return_value.limit
    return limit_mock.call_args[0][0]


async def test_get_history_uses_ui_limit_by_default():
    mock_supa = _make_supa_mock()
    await get_history(mock_supa, "user-123")
    assert _limit_arg(mock_supa) == UI_HISTORY_LIMIT


async def test_get_context_uses_context_limit():
    mock_supa = _make_supa_mock()
    await get_context(mock_supa, "user-123")
    assert _limit_arg(mock_supa) == _CONTEXT_LIMIT


async def test_get_reply_uses_context_limit_not_ui_limit():
    mock_supa = _make_supa_mock()
    with patch("services.ai._call_claude", _make_claude_mock("reply")):
        await get_reply(mock_supa, _unused_claude_client(), "user-123", "hi")
    assert _limit_arg(mock_supa) == _CONTEXT_LIMIT


async def test_get_reply_sends_exactly_context_limit_newest_turns_to_claude():
    # 14-message conversation, chronological (oldest -> newest)
    convo = [
        {"role": "user" if i % 2 == 0 else "assistant", "content": f"msg{i}"}
        for i in range(14)
    ]
    # DB returns rows newest-first (ORDER BY created_at DESC), limit slices there
    mock_supa = _make_limit_honoring_supa_mock(list(reversed(convo)))
    mock_claude = _make_claude_mock("reply")
    with patch("services.ai._call_claude", mock_claude):
        await get_reply(mock_supa, _unused_claude_client(), "user-123", "msg13")
    # arg 0 is the Anthropic client; the messages are arg 1
    sent = mock_claude.call_args[0][1]
    # Exactly the last 10 messages, re-ordered oldest -> newest
    assert len(sent) == _CONTEXT_LIMIT
    assert sent == convo[-_CONTEXT_LIMIT:]
    assert sent[0]["content"] == "msg4" and sent[-1]["content"] == "msg13"


def _make_delete_mock(deleted_rows):
    mock = MagicMock()
    mock.table.return_value.delete.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=deleted_rows)
    )
    return mock


async def test_clear_history_deletes_scoped_to_user():
    mock_supa = _make_delete_mock([{"id": "a"}, {"id": "b"}])
    deleted = await clear_history(mock_supa, "user-123")
    assert deleted == 2
    eq_call = mock_supa.table.return_value.delete.return_value.eq.call_args
    assert eq_call == (("user_id", "user-123"),)
    mock_supa.table.assert_called_with("conversations")


async def test_clear_history_returns_zero_when_empty():
    mock_supa = _make_delete_mock([])
    deleted = await clear_history(mock_supa, "user-123")
    assert deleted == 0
