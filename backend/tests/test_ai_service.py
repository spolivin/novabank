import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from anthropic.types import TextBlock, ToolUseBlock

from services.ai import (
    _CONTEXT_LIMIT,
    _MAX_TOOL_ROUNDS,
    UI_HISTORY_LIMIT,
    _call_claude,
    clear_history,
    get_context,
    get_history,
    get_reply,
)
from services.ai_tools import ToolInputError

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
        return_value=MagicMock(
            stop_reason="end_turn",
            content=[TextBlock(type="text", text="from injected client")],
        )
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


# --- Tool-use loop -----------------------------------------------------------


def _text_response(text="Done"):
    return MagicMock(
        stop_reason="end_turn", content=[TextBlock(type="text", text=text)]
    )


def _tool_response(*calls):
    """A ``tool_use`` turn; each call is ``(tool_use_id, input)``."""
    return MagicMock(
        stop_reason="tool_use",
        content=[
            TextBlock(type="text", text="Let me check."),
            *(
                ToolUseBlock(
                    type="tool_use", id=tid, name="search_transactions", input=inp
                )
                for tid, inp in calls
            ),
        ],
    )


def _claude_returning(*responses):
    claude = MagicMock()
    claude.messages.create = AsyncMock(side_effect=list(responses))
    return claude


async def test_call_claude_without_tools_returns_text():
    claude = _claude_returning(_text_response("Hi"))
    run_tool = AsyncMock()
    reply = await _call_claude(claude, [{"role": "user", "content": "hi"}], run_tool)
    assert reply == "Hi"
    run_tool.assert_not_awaited()


async def test_call_claude_runs_tool_and_returns_result_to_claude():
    claude = _claude_returning(
        _tool_response(("tu_1", {"category": "Groceries"})),
        _text_response("You spent $134.72."),
    )
    run_tool = AsyncMock(return_value='{"count":1}')
    reply = await _call_claude(claude, [{"role": "user", "content": "q"}], run_tool)

    assert reply == "You spent $134.72."
    run_tool.assert_awaited_once_with("search_transactions", {"category": "Groceries"})
    sent = claude.messages.create.call_args_list[1].kwargs["messages"]
    assert sent[-2]["role"] == "assistant"
    assert sent[-1] == {
        "role": "user",
        "content": [
            {"type": "tool_result", "tool_use_id": "tu_1", "content": '{"count":1}'}
        ],
    }


async def test_call_claude_parallel_tool_results_share_one_message():
    claude = _claude_returning(
        _tool_response(("a", {}), ("b", {"text": "amazon"})), _text_response()
    )
    run_tool = AsyncMock(return_value="{}")
    await _call_claude(claude, [{"role": "user", "content": "q"}], run_tool)
    results = claude.messages.create.call_args_list[1].kwargs["messages"][-1]
    assert [r["tool_use_id"] for r in results["content"]] == ["a", "b"]


async def test_call_claude_reports_invalid_tool_input_as_error():
    claude = _claude_returning(
        _tool_response(("tu_1", {"min_amount": 5})), _text_response()
    )
    run_tool = AsyncMock(side_effect=ToolInputError("needs direction"))
    await _call_claude(claude, [{"role": "user", "content": "q"}], run_tool)
    result = claude.messages.create.call_args_list[1].kwargs["messages"][-1]
    assert result["content"] == [
        {
            "type": "tool_result",
            "tool_use_id": "tu_1",
            "content": "needs direction",
            "is_error": True,
        }
    ]


async def test_call_claude_forces_text_after_max_rounds():
    claude = _claude_returning(
        *(_tool_response((f"t{i}", {})) for i in range(_MAX_TOOL_ROUNDS)),
        _text_response("Final"),
    )
    run_tool = AsyncMock(return_value="{}")
    reply = await _call_claude(claude, [{"role": "user", "content": "q"}], run_tool)

    assert reply == "Final"
    calls = claude.messages.create.call_args_list
    assert len(calls) == _MAX_TOOL_ROUNDS + 1
    assert all(c.kwargs["tool_choice"] == {"type": "auto"} for c in calls[:-1])
    assert calls[-1].kwargs["tool_choice"] == {"type": "none"}


async def test_call_claude_does_not_mutate_callers_messages():
    claude = _claude_returning(_tool_response(("t", {})), _text_response())
    messages = [{"role": "user", "content": "q"}]
    await _call_claude(claude, messages, AsyncMock(return_value="{}"))
    assert messages == [{"role": "user", "content": "q"}]


async def test_call_claude_system_has_cached_prompt_then_todays_date():
    claude = _claude_returning(_text_response())
    await _call_claude(claude, [{"role": "user", "content": "q"}], AsyncMock())
    system = claude.messages.create.call_args.kwargs["system"]
    assert system[0]["cache_control"] == {"type": "ephemeral"}
    assert "cache_control" not in system[1]
    assert datetime.date.today().isoformat() in system[1]["text"]


async def test_get_reply_runs_tools_as_the_requesting_user():
    mock_supa = _make_supa_mock()
    claude = _claude_returning(_tool_response(("t", {})), _text_response("ok"))
    with patch("services.ai.ai_tools.run_tool", AsyncMock(return_value="{}")) as rt:
        reply = await get_reply(mock_supa, claude, "user-123", "q")
    assert reply == "ok"
    rt.assert_awaited_once_with(mock_supa, "user-123", "search_transactions", {})


async def test_get_reply_persists_only_final_text():
    mock_supa = _make_supa_mock()
    claude = _claude_returning(_tool_response(("t", {})), _text_response("Answer"))
    with patch("services.ai.ai_tools.run_tool", AsyncMock(return_value="{}")):
        await get_reply(mock_supa, claude, "user-123", "q")
    inserts = [c.args[0] for c in mock_supa.table.return_value.insert.call_args_list]
    assert inserts[-1] == {
        "user_id": "user-123",
        "role": "assistant",
        "content": "Answer",
    }


async def test_get_reply_rolls_back_when_tool_fails():
    mock_supa = _make_supa_mock()
    claude = _claude_returning(_tool_response(("t", {})))
    failing = AsyncMock(side_effect=RuntimeError("db down"))
    with patch("services.ai.ai_tools.run_tool", failing):
        with pytest.raises(RuntimeError):
            await get_reply(mock_supa, claude, "user-123", "q")
    first_eq = mock_supa.table.return_value.delete.return_value.eq.call_args_list[0]
    assert first_eq == (("id", _FAKE_ROW_ID),)
