from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from dependencies.limiter import limiter
from services.transactions import TRANSACTIONS_LIMIT, get_transactions

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
    chain.order.return_value.limit.return_value.execute = AsyncMock(
        return_value=MagicMock(data=_ROWS)
    )

    rows = await get_transactions(supabase, "user-123", limit=7)

    assert rows == _ROWS
    supabase.table.assert_called_with("transactions")
    supabase.table.return_value.select.return_value.eq.assert_called_with(
        "user_id", "user-123"
    )
    chain.order.assert_called_with("date", desc=True)
    chain.order.return_value.limit.assert_called_with(7)
