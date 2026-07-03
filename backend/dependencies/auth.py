import asyncio

import jwt
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from config import settings
from log_context import add_log_fields

_jwks_client = PyJWKClient(
    str(settings.supabase_url).rstrip("/") + "/auth/v1/.well-known/jwks.json",
    cache_keys=True,
    lifespan=3600,
)

_bearer = HTTPBearer()


def verify_token(token: str) -> dict:
    signing_key = _jwks_client.get_signing_key_from_jwt(token)
    return jwt.decode(
        token, signing_key, algorithms=["ES256"], audience="authenticated"
    )


async def verify_jwt(
    credentials: HTTPAuthorizationCredentials = Security(_bearer),
) -> dict:
    try:
        return await asyncio.to_thread(verify_token, credentials.credentials)
    except jwt.PyJWTError as e:
        # Recorded on the request's canonical line (WARNING via the 401 status);
        # no separate log line needed.
        add_log_fields(error="invalid_token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from e
