import json
import time
from unittest.mock import patch

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from jwt import PyJWK
from jwt.algorithms import ECAlgorithm

from dependencies.auth import _ISSUER, verify_token

_KEY = ec.generate_private_key(ec.SECP256R1())
_SIGNING_KEY = PyJWK.from_dict(
    json.loads(ECAlgorithm.to_jwk(_KEY.public_key())), algorithm="ES256"
)


def _token(**overrides) -> str:
    claims = {
        "sub": "user-123",
        "aud": "authenticated",
        "iss": _ISSUER,
        "exp": int(time.time()) + 300,
        **overrides,
    }
    claims = {k: v for k, v in claims.items() if v is not None}
    return jwt.encode(claims, _KEY, algorithm="ES256")


def _verify(token: str) -> dict:
    with patch("dependencies.auth._jwks_client") as mock_jwks:
        mock_jwks.get_signing_key_from_jwt.return_value = _SIGNING_KEY
        return verify_token(token)


def test_verify_token_success():
    assert _verify(_token())["sub"] == "user-123"


def test_verify_token_rejects_wrong_issuer():
    with pytest.raises(jwt.InvalidIssuerError):
        _verify(_token(iss="https://evil.example.com/auth/v1"))


def test_verify_token_rejects_missing_issuer():
    with pytest.raises(jwt.MissingRequiredClaimError):
        _verify(_token(iss=None))


@pytest.mark.parametrize("claim", ["exp", "sub"])
def test_verify_token_requires_claim(claim):
    with pytest.raises(jwt.MissingRequiredClaimError):
        _verify(_token(**{claim: None}))


def test_verify_token_rejects_wrong_audience():
    with pytest.raises(jwt.InvalidAudienceError):
        _verify(_token(aud="anon"))


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


async def test_verify_jwt_expired_token_returns_401(unauthed_client):
    with patch(
        "dependencies.auth.verify_token",
        side_effect=jwt.ExpiredSignatureError("token expired"),
    ):
        response = await unauthed_client.post(
            "/ai/chat",
            json={"message": "hi"},
            headers={"Authorization": "Bearer some.fake.token"},
        )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"


async def test_verify_jwt_wrong_audience_returns_401(unauthed_client):
    with patch(
        "dependencies.auth.verify_token",
        side_effect=jwt.InvalidAudienceError("wrong audience"),
    ):
        response = await unauthed_client.post(
            "/ai/chat",
            json={"message": "hi"},
            headers={"Authorization": "Bearer some.fake.token"},
        )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"


async def test_verify_jwt_jwks_unavailable_returns_401(unauthed_client):
    """PyJWT wraps JWKS fetch failures in PyJWKClientConnectionError (a PyJWTError subclass)."""
    from jwt import PyJWKClientConnectionError

    with patch(
        "dependencies.auth.verify_token",
        side_effect=PyJWKClientConnectionError("JWKS endpoint unreachable"),
    ):
        response = await unauthed_client.post(
            "/ai/chat",
            json={"message": "hi"},
            headers={"Authorization": "Bearer some.fake.token"},
        )
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid token"
