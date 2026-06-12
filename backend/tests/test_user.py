from unittest.mock import MagicMock, patch

import pytest
from supabase_auth.errors import AuthApiError

from dependencies.limiter import limiter


@pytest.fixture(autouse=True)
def reset_limiter():
    limiter.reset()
    yield
    limiter.reset()


async def test_delete_user_success(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(return_value=None)
        response = await client.delete("/users/me")
    assert response.status_code == 200
    assert response.json() == {"message": "Account deleted successfully"}
    mock_supa.auth.admin.delete_user.assert_called_once_with("user-123")


async def test_delete_user_does_not_touch_conversations_table(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(return_value=None)
        await client.delete("/users/me")
    mock_supa.table.assert_not_called()


async def test_delete_user_not_found(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(
            side_effect=AuthApiError("User not found", 404, None)
        )
        response = await client.delete("/users/me")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


async def test_delete_user_supabase_error(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(
            side_effect=AuthApiError("internal error", 500, None)
        )
        response = await client.delete("/users/me")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to delete account"


async def test_delete_user_unexpected_error(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(
            side_effect=RuntimeError("unexpected")
        )
        response = await client.delete("/users/me")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to delete account"


async def test_delete_user_missing_auth(unauthed_client):
    response = await unauthed_client.delete("/users/me")
    assert response.status_code == 401


async def test_delete_user_rate_limit_blocks_after_limit(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(return_value=None)
        for _ in range(3):
            await client.delete("/users/me")
        response = await client.delete("/users/me")
    assert response.status_code == 429
