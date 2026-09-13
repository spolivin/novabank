from unittest.mock import AsyncMock

import pytest
from supabase_auth.errors import AuthApiError

from dependencies.limiter import limiter


@pytest.fixture(autouse=True)
def reset_limiter():
    limiter.reset()
    yield
    limiter.reset()


async def test_delete_user_success(client, fake_supabase):
    response = await client.delete("/users/me")
    assert response.status_code == 204
    assert response.content == b""
    fake_supabase.auth.admin.delete_user.assert_awaited_once_with("user-123")


async def test_delete_user_does_not_touch_conversations_table(client, fake_supabase):
    await client.delete("/users/me")
    fake_supabase.table.assert_not_called()


async def test_delete_user_not_found(client, fake_supabase):
    fake_supabase.auth.admin.delete_user = AsyncMock(
        side_effect=AuthApiError("User not found", 404, None)
    )
    response = await client.delete("/users/me")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


async def test_delete_user_supabase_error(client, fake_supabase):
    fake_supabase.auth.admin.delete_user = AsyncMock(
        side_effect=AuthApiError("internal error", 500, None)
    )
    response = await client.delete("/users/me")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to delete account"


async def test_delete_user_unexpected_error(client, fake_supabase):
    fake_supabase.auth.admin.delete_user = AsyncMock(side_effect=RuntimeError("boom"))
    response = await client.delete("/users/me")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to delete account"


async def test_delete_user_missing_auth(unauthed_client):
    response = await unauthed_client.delete("/users/me")
    assert response.status_code == 401


async def test_delete_user_rate_limit_blocks_after_limit(client):
    for _ in range(3):
        await client.delete("/users/me")
    response = await client.delete("/users/me")
    assert response.status_code == 429
