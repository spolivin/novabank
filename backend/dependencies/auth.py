import asyncio
import logging
import os

import jwt
from fastapi import HTTPException, Security, status

logger = logging.getLogger(__name__)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

_jwks_client = PyJWKClient(
    os.environ["SUPABASE_URL"] + "/auth/v1/.well-known/jwks.json",
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
        logger.warning("JWT validation failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
