from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from dependencies.limiter import limiter
from services.dashboard import get_summary, set_savings_goal

_GET = "routers.dashboard.dashboard_service.get_summary"
_SET = "routers.dashboard.dashboard_service.set_savings_goal"

_SUMMARY = {
    "balance": 8412.55,
    "monthly_spending": 1734.2,
    "savings_goal": 10000.0,
    "savings_saved": 1200.0,
}
_ZEROS = dict.fromkeys(_SUMMARY, 0)


@pytest.fixture(autouse=True)
def reset_limiter():
    limiter.reset()
    yield
    limiter.reset()


# --- GET /dashboard/summary ---


async def test_summary_success(client):
    with patch(_GET, new=AsyncMock(return_value=_SUMMARY)):
        response = await client.get("/dashboard/summary")
    assert response.status_code == 200
    assert response.json() == _SUMMARY


async def test_summary_zeros_for_new_user(client):
    with patch(_GET, new=AsyncMock(return_value=_ZEROS)):
        response = await client.get("/dashboard/summary")
    assert response.status_code == 200
    assert response.json() == _ZEROS


async def test_summary_passes_user_id_to_service(client):
    mock = AsyncMock(return_value=_ZEROS)
    with patch(_GET, new=mock):
        await client.get("/dashboard/summary")
    assert mock.await_args.args[1] == "user-123"


async def test_summary_sets_no_store_cache_header(client):
    with patch(_GET, new=AsyncMock(return_value=_ZEROS)):
        response = await client.get("/dashboard/summary")
    assert response.headers["cache-control"] == "no-store"


async def test_summary_service_error_returns_500(client):
    with patch(_GET, new=AsyncMock(side_effect=RuntimeError("db down"))):
        response = await client.get("/dashboard/summary")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to fetch dashboard summary"


async def test_summary_missing_auth(unauthed_client):
    response = await unauthed_client.get("/dashboard/summary")
    assert response.status_code == 401


# --- PUT /dashboard/savings-goal ---


async def test_set_goal_saves_and_returns_refreshed_summary(client):
    set_mock = AsyncMock(return_value=None)
    refreshed = {**_SUMMARY, "savings_goal": 15000.0}
    with (
        patch(_SET, new=set_mock),
        patch(_GET, new=AsyncMock(return_value=refreshed)),
    ):
        response = await client.put(
            "/dashboard/savings-goal", json={"savings_goal": 15000}
        )
    assert response.status_code == 200
    assert response.json()["savings_goal"] == 15000.0
    assert set_mock.await_args.args[1:] == ("user-123", 15000.0)


async def test_set_goal_rejects_invalid_values(client):
    set_mock = AsyncMock()
    with patch(_SET, new=set_mock):
        for bad in (0, -5, 10_000_001, "abc", None):
            response = await client.put(
                "/dashboard/savings-goal", json={"savings_goal": bad}
            )
            assert response.status_code == 422
        response = await client.put("/dashboard/savings-goal", json={})
        assert response.status_code == 422
    set_mock.assert_not_awaited()


async def test_set_goal_service_error_returns_500(client):
    with patch(_SET, new=AsyncMock(side_effect=RuntimeError("db down"))):
        response = await client.put(
            "/dashboard/savings-goal", json={"savings_goal": 500}
        )
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to update savings goal"


async def test_set_goal_missing_auth(unauthed_client):
    response = await unauthed_client.put(
        "/dashboard/savings-goal", json={"savings_goal": 500}
    )
    assert response.status_code == 401


# --- service layer ---


async def test_get_summary_calls_rpc_with_user_id():
    supabase = MagicMock()
    supabase.rpc.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[_SUMMARY])
    )

    summary = await get_summary(supabase, "user-123")

    assert summary == _SUMMARY
    supabase.rpc.assert_called_with("dashboard_summary", {"p_user_id": "user-123"})


async def test_set_savings_goal_upserts_rounded_goal():
    supabase = MagicMock()
    supabase.table.return_value.upsert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )

    await set_savings_goal(supabase, "user-123", 1234.567)

    supabase.table.assert_called_with("accounts")
    payload = supabase.table.return_value.upsert.call_args.args[0]
    assert payload["user_id"] == "user-123"
    assert payload["savings_goal"] == 1234.57
    assert "updated_at" in payload
    assert supabase.table.return_value.upsert.call_args.kwargs == {
        "on_conflict": "user_id"
    }
