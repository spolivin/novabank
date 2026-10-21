import asyncio

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from config import settings
from log_context import add_log_fields

_AUTH_URL = str(settings.supabase_url).rstrip("/") + "/auth/v1"
# The issuer is what Supabase puts in tokens; it can differ from the URL this
# backend uses to reach Supabase, so it is configurable on its own.
_ISSUER = settings.jwt_issuer or _AUTH_URL

_jwks_client = PyJWKClient(
    _AUTH_URL + "/.well-known/jwks.json",
    cache_keys=True,
    lifespan=3600,
)

_bearer = HTTPBearer()


def verify_token(token: str) -> dict:
    """Verify a Supabase JWT against the project's JWKS.

    Args:
        token: The raw bearer token.

    Returns:
        The decoded token claims.

    Raises:
        jwt.PyJWTError: If the signature, audience, issuer, or algorithm is
            invalid, or the ``exp`` or ``sub`` claim is missing.
    """
    signing_key = _jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token,
        signing_key,
        algorithms=["ES256"],
        audience="authenticated",
        issuer=_ISSUER,
        options={"require": ["exp", "sub"]},
    )


async def verify_jwt(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    """FastAPI dependency that authenticates the bearer token.

    Runs the blocking verification off the event loop. A failure is recorded on
    the request's canonical log line (surfaced as a WARNING via the 401 status),
    so no separate log line is emitted here.

    Args:
        credentials: Bearer credentials extracted from the ``Authorization``
            header.

    Returns:
        The decoded token claims for the authenticated user.

    Raises:
        HTTPException: 401 if the token is invalid.
    """
    try:
        return await asyncio.to_thread(verify_token, credentials.credentials)
    except jwt.PyJWTError as e:
        add_log_fields(error="invalid_token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from e
