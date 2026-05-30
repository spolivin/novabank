from unittest.mock import MagicMock, patch

import jwt

from dependencies.auth import verify_token


def test_verify_token_success():
    mock_signing_key = MagicMock()
    with (
        patch("dependencies.auth._jwks_client") as mock_jwks,
        patch(
            "dependencies.auth.jwt.decode", return_value={"sub": "user-123"}
        ) as mock_decode,
    ):
        mock_jwks.get_signing_key_from_jwt.return_value = mock_signing_key
        result = verify_token("some.token")

    assert result == {"sub": "user-123"}
    mock_decode.assert_called_once_with(
        "some.token", mock_signing_key, algorithms=["ES256"], audience="authenticated"
    )


async def test_verify_jwt_invalid_token_returns_401(unauthed_client):
    with patch(
        "dependencies.auth.verify_token", side_effect=jwt.PyJWTError("bad token")
    ):
        response = await unauthed_client.post(
            "/ai/chat",
            json={"message": "hi"},
            headers={"Authorization": "Bearer some.fake.token"},
        )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"
