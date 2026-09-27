import datetime
import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from services.ai_tools import (
    SEARCH_TRANSACTIONS_TOOL,
    ToolInputError,
    run_tool,
)
from services.transactions import SEARCH_LIMIT

_SEARCH = "services.ai_tools.transactions_service.search_transactions"

_RESULT = {
    "transactions": [
        {
            "id": "22222222-2222-2222-2222-222222222222",
            "date": "2026-09-10",
            "description": "Whole Foods",
            "category": "Groceries",
            "amount": "-134.72",
        }
    ],
    "count": 1,
    "total": -134.72,
    "truncated": False,
}


async def _run(tool_input, name="search_transactions", result=None):
    supa = MagicMock()
    search = AsyncMock(return_value=dict(result or _RESULT))
    with patch(_SEARCH, search):
        out = await run_tool(supa, "user-123", name, tool_input)
    return out, search, supa


async def test_runs_search_as_the_caller():
    _, search, supa = await _run({"category": "Groceries"})
    args, kwargs = search.call_args
    assert args == (supa, "user-123")
    assert kwargs["category"] == "Groceries"
    assert kwargs["limit"] == SEARCH_LIMIT


async def test_parses_dates_and_passes_all_filters():
    _, search, _ = await _run(
        {
            "start_date": "2026-08-01",
            "end_date": "2026-08-31",
            "text": "amazon",
            "direction": "debit",
            "min_amount": 10,
            "max_amount": 100,
            "limit": 5,
        }
    )
    kwargs = search.call_args.kwargs
    assert kwargs["start_date"] == datetime.date(2026, 8, 1)
    assert kwargs["end_date"] == datetime.date(2026, 8, 31)
    assert kwargs["direction"] == "debit"
    assert (kwargs["min_amount"], kwargs["max_amount"], kwargs["limit"]) == (10, 100, 5)


async def test_returns_compact_json_without_row_ids():
    out, _, _ = await _run({})
    data = json.loads(out)
    assert data["transactions"] == [
        {
            "date": "2026-09-10",
            "description": "Whole Foods",
            "category": "Groceries",
            "amount": -134.72,
        }
    ]
    assert (data["count"], data["total"], data["truncated"]) == (1, -134.72, False)


@pytest.mark.parametrize(
    "tool_input",
    [
        {"user_id": "someone-else"},
        {"start_date": "not-a-date"},
        {"start_date": "2026-09-01", "end_date": "2026-08-01"},
        {"min_amount": 10},
        {"direction": "debit", "min_amount": 50, "max_amount": 10},
        {"direction": "sideways"},
        {"min_amount": -1, "direction": "debit"},
        {"limit": 0},
        {"limit": SEARCH_LIMIT + 1},
    ],
)
async def test_rejects_invalid_input_without_querying(tool_input):
    supa = MagicMock()
    search = AsyncMock()
    with patch(_SEARCH, search), pytest.raises(ToolInputError):
        await run_tool(supa, "user-123", "search_transactions", tool_input)
    search.assert_not_awaited()


async def test_rejects_unknown_tool():
    with pytest.raises(ToolInputError, match="Unknown tool"):
        await _run({}, name="transfer_money")


def test_schema_properties_match_validator():
    from services.ai_tools import TransactionSearchInput

    schema_props = set(SEARCH_TRANSACTIONS_TOOL["input_schema"]["properties"])
    assert schema_props == set(TransactionSearchInput.model_fields)
