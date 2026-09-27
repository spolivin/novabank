import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from dependencies.limiter import limiter
from services.transactions import (
    SEARCH_LIMIT,
    TRANSACTIONS_LIMIT,
    get_transactions,
    search_transactions,
)

_SERVICE = "routers.transactions.transactions_service.get_transactions"

_ROWS = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "date": "2026-09-12",
        "description": "Salary deposit",
        "category": "Income",
        "amount": 5200.0,
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "date": "2026-09-10",
        "description": "Whole Foods",
        "category": "Groceries",
        "amount": -134.72,
    },
]


@pytest.fixture(autouse=True)
def reset_limiter():
    limiter.reset()
    yield
    limiter.reset()


async def test_transactions_success(client):
    with patch(_SERVICE, new=AsyncMock(return_value=_ROWS)):
        response = await client.get("/transactions")
    assert response.status_code == 200
    data = response.json()
    assert [tx["description"] for tx in data] == ["Salary deposit", "Whole Foods"]
    assert data[0]["date"] == "2026-09-12"
    assert data[1]["amount"] == -134.72


async def test_transactions_empty(client):
    with patch(_SERVICE, new=AsyncMock(return_value=[])):
        response = await client.get("/transactions")
    assert response.status_code == 200
    assert response.json() == []


async def test_transactions_passes_user_id_to_service(client):
    mock = AsyncMock(return_value=[])
    with patch(_SERVICE, new=mock):
        await client.get("/transactions")
    assert mock.await_args.args[1] == "user-123"


async def test_transactions_sets_no_store_cache_header(client):
    with patch(_SERVICE, new=AsyncMock(return_value=[])):
        response = await client.get("/transactions")
    assert response.headers["cache-control"] == "no-store"


async def test_transactions_passes_limit_query_to_service(client):
    mock = AsyncMock(return_value=[])
    with patch(_SERVICE, new=mock):
        response = await client.get("/transactions?limit=5")
    assert response.status_code == 200
    assert mock.await_args.kwargs["limit"] == 5


async def test_transactions_defaults_limit(client):
    mock = AsyncMock(return_value=[])
    with patch(_SERVICE, new=mock):
        await client.get("/transactions")
    assert mock.await_args.kwargs["limit"] == TRANSACTIONS_LIMIT


async def test_transactions_rejects_out_of_range_limit(client):
    for bad in ("0", "51", "-1", "abc"):
        response = await client.get(f"/transactions?limit={bad}")
        assert response.status_code == 422


async def test_transactions_service_error_returns_500(client):
    with patch(_SERVICE, new=AsyncMock(side_effect=RuntimeError("db down"))):
        response = await client.get("/transactions")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to fetch transactions"


async def test_transactions_missing_auth(unauthed_client):
    response = await unauthed_client.get("/transactions")
    assert response.status_code == 401


async def test_get_transactions_queries_user_rows_newest_first():
    supabase = MagicMock()
    chain = supabase.table.return_value.select.return_value.eq.return_value
    ordered = chain.order.return_value.order.return_value
    ordered.limit.return_value.execute = AsyncMock(return_value=MagicMock(data=_ROWS))

    rows = await get_transactions(supabase, "user-123", limit=7)

    assert rows == _ROWS
    supabase.table.assert_called_with("transactions")
    supabase.table.return_value.select.return_value.eq.assert_called_with(
        "user_id", "user-123"
    )
    chain.order.assert_called_with("date", desc=True)
    # created_at breaks ties between transactions posted on the same date.
    chain.order.return_value.order.assert_called_with("created_at", desc=True)
    ordered.limit.assert_called_with(7)


# --- search_transactions -------------------------------------------------------


class _RecordingQuery:
    """Fluent PostgREST stand-in that records every chained call."""

    def __init__(self, rows):
        self.calls = []
        self._rows = rows

    def __getattr__(self, name):
        def method(*args, **kwargs):
            self.calls.append((name, args))
            return self

        return method

    async def execute(self):
        limit = next(a[0] for n, a in reversed(self.calls) if n == "limit")
        return MagicMock(data=self._rows[:limit])


def _search_supa(rows=()):
    query = _RecordingQuery(list(rows))
    supa = MagicMock()
    supa.table.return_value = query
    return supa, query


def _filters(query):
    return [c for c in query.calls if c[0] in {"eq", "gte", "lte", "lt", "gt", "ilike"}]


async def test_search_without_filters_scopes_to_user_only():
    supa, query = _search_supa()
    await search_transactions(supa, "user-123")
    supa.table.assert_called_once_with("transactions")
    assert _filters(query) == [("eq", ("user_id", "user-123"))]
    assert ("order", ("date",)) in query.calls
    assert ("limit", (SEARCH_LIMIT + 1,)) in query.calls


async def test_search_applies_date_category_and_text_filters():
    supa, query = _search_supa()
    await search_transactions(
        supa,
        "user-123",
        start_date=datetime.date(2026, 8, 1),
        end_date=datetime.date(2026, 8, 31),
        category="groceries",
        text="whole",
    )
    assert _filters(query)[1:] == [
        ("gte", ("date", "2026-08-01")),
        ("lte", ("date", "2026-08-31")),
        ("ilike", ("category", "groceries")),
        ("ilike", ("description", "%whole%")),
    ]


@pytest.mark.parametrize(
    ("text", "pattern"),
    [
        ("50%", "%50\\%%"),
        ("a_b", "%a\\_b%"),
        ("back\\slash", "%back\\\\slash%"),
        ("AMZN*Mktp", "%AMZN_Mktp%"),
    ],
)
async def test_search_escapes_like_wildcards(text, pattern):
    supa, query = _search_supa()
    await search_transactions(supa, "user-123", text=text)
    assert ("ilike", ("description", pattern)) in query.calls


async def test_search_debit_bounds_are_negated_magnitudes():
    supa, query = _search_supa()
    await search_transactions(
        supa, "user-123", direction="debit", min_amount=10, max_amount=100
    )
    assert _filters(query)[1:] == [
        ("lt", ("amount", 0)),
        ("lte", ("amount", -10)),
        ("gte", ("amount", -100)),
    ]


async def test_search_credit_bounds_are_positive():
    supa, query = _search_supa()
    await search_transactions(
        supa, "user-123", direction="credit", min_amount=10, max_amount=100
    )
    assert _filters(query)[1:] == [
        ("gt", ("amount", 0)),
        ("gte", ("amount", 10)),
        ("lte", ("amount", 100)),
    ]


async def test_search_reports_count_total_and_not_truncated():
    supa, _ = _search_supa(_ROWS)
    result = await search_transactions(supa, "user-123", limit=5)
    assert result["transactions"] == _ROWS
    assert result["count"] == 2
    assert result["total"] == round(5200.0 - 134.72, 2)
    assert result["truncated"] is False


async def test_search_truncates_using_extra_row():
    supa, _ = _search_supa(_ROWS)
    result = await search_transactions(supa, "user-123", limit=1)
    assert [r["description"] for r in result["transactions"]] == ["Salary deposit"]
    assert result["count"] == 1
    assert result["total"] == 5200.0
    assert result["truncated"] is True
