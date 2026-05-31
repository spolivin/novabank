from unittest.mock import MagicMock, patch

import pytest

from services.ai import get_history, get_reply

_FAKE_ROW_ID = "aaaaaaaa-0000-0000-0000-000000000000"


def _make_supa_mock(history_data=None):
    mock = MagicMock()
    select_chain = (
        mock.table.return_value.select.return_value.eq.return_value.order.return_value.limit.return_value
    )
    select_chain.execute.return_value.data = history_data or []
    mock.table.return_value.insert.return_value.execute.return_value.data = [
        {"id": _FAKE_ROW_ID}
    ]
    return mock


def _make_claude_mock(reply="Hello from Nova"):
    return MagicMock(return_value=reply)


async def test_get_reply_returns_reply():
    mock_supa = _make_supa_mock()
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", _make_claude_mock()
    ):
        result = await get_reply("user-123", "hi")
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
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", mock_claude
    ):
        await get_reply("user-123", "new message")
    called_messages = mock_claude.call_args[0][0]
    assert called_messages == prior + [new_msg]


async def test_get_reply_saves_to_supabase():
    mock_supa = _make_supa_mock()
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", _make_claude_mock("reply")
    ):
        await get_reply("user-123", "hi")
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
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", MagicMock(side_effect=RuntimeError("API down"))
    ):
        with pytest.raises(RuntimeError, match="API down"):
            await get_reply("user-123", "hi")


async def test_get_reply_cleanup_on_claude_error():
    mock_supa = _make_supa_mock()
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", MagicMock(side_effect=RuntimeError("API down"))
    ):
        with pytest.raises(RuntimeError):
            await get_reply("user-123", "hi")
    # Only the user insert fires — no assistant insert
    insert_mock = mock_supa.table.return_value.insert
    assert insert_mock.call_count == 1
    assert insert_mock.call_args_list[0][0][0]["role"] == "user"
    # Rollback: orphaned user row deleted by id
    mock_supa.table.return_value.delete.assert_called_once()
    first_eq = mock_supa.table.return_value.delete.return_value.eq.call_args_list[0]
    assert first_eq == (("id", _FAKE_ROW_ID),)


async def test_get_history_returns_data():
    history = [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "hi"},
    ]
    # DB returns rows in DESC order (newest first); code reverses them
    mock_supa = _make_supa_mock(history_data=list(reversed(history)))
    with patch("services.ai.supabase_admin", mock_supa):
        result = await get_history("user-123")
    assert result == history


async def test_get_history_empty():
    mock_supa = _make_supa_mock(history_data=[])
    with patch("services.ai.supabase_admin", mock_supa):
        result = await get_history("user-123")
    assert result == []
