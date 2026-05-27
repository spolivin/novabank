from unittest.mock import MagicMock, patch

import pytest

from services.ai import get_history, get_reply


def _make_supa_mock(history_data=None):
    mock = MagicMock()
    select_chain = (
        mock.table.return_value.select.return_value.eq.return_value.order.return_value
    )
    select_chain.execute.return_value.data = history_data or []
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
    history = [
        {"role": "user", "content": "prev"},
        {"role": "assistant", "content": "ok"},
    ]
    mock_supa = _make_supa_mock(history_data=history)
    mock_claude = _make_claude_mock("reply")
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", mock_claude
    ):
        await get_reply("user-123", "new message")
    called_messages = mock_claude.call_args[0][0]
    assert called_messages[:2] == history
    assert called_messages[-1] == {"role": "user", "content": "new message"}


async def test_get_reply_saves_to_supabase():
    mock_supa = _make_supa_mock()
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", _make_claude_mock("reply")
    ):
        await get_reply("user-123", "hi")
    mock_supa.table.return_value.insert.assert_called_once()
    inserted = mock_supa.table.return_value.insert.call_args[0][0]
    assert inserted[0]["role"] == "user"
    assert inserted[0]["content"] == "hi"
    assert inserted[1]["role"] == "assistant"
    assert inserted[1]["content"] == "reply"


async def test_get_reply_reraises_on_claude_error():
    mock_supa = _make_supa_mock()
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", MagicMock(side_effect=RuntimeError("API down"))
    ):
        with pytest.raises(RuntimeError, match="API down"):
            await get_reply("user-123", "hi")


async def test_get_reply_does_not_save_on_claude_error():
    mock_supa = _make_supa_mock()
    with patch("services.ai.supabase_admin", mock_supa), patch(
        "services.ai._call_claude", MagicMock(side_effect=RuntimeError("API down"))
    ):
        with pytest.raises(RuntimeError):
            await get_reply("user-123", "hi")
    mock_supa.table.return_value.insert.assert_not_called()


async def test_get_history_returns_data():
    history = [
        {"role": "user", "content": "hello"},
        {"role": "assistant", "content": "hi"},
    ]
    mock_supa = _make_supa_mock(history_data=history)
    with patch("services.ai.supabase_admin", mock_supa):
        result = await get_history("user-123")
    assert result == history


async def test_get_history_empty():
    mock_supa = _make_supa_mock(history_data=[])
    with patch("services.ai.supabase_admin", mock_supa):
        result = await get_history("user-123")
    assert result == []
