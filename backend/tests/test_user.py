from unittest.mock import MagicMock, patch

from supabase_auth.errors import AuthApiError


async def test_delete_user_success(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(return_value=None)
        response = await client.delete("/user")
    assert response.status_code == 200
    assert response.json() == {"message": "Account deleted successfully"}


async def test_delete_user_not_found(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(
            side_effect=AuthApiError("User not found", 404, None)
        )
        response = await client.delete("/user")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"


async def test_delete_user_supabase_error(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(
            side_effect=AuthApiError("internal error", 500, None)
        )
        response = await client.delete("/user")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to delete account"


async def test_delete_user_unexpected_error(client):
    with patch("routers.user.supabase_admin") as mock_supa:
        mock_supa.auth.admin.delete_user = MagicMock(
            side_effect=RuntimeError("unexpected")
        )
        response = await client.delete("/user")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to delete account"


async def test_delete_user_missing_auth(unauthed_client):
    response = await unauthed_client.delete("/user")
    assert response.status_code == 401
