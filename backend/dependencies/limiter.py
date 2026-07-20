import jwt
from fastapi import Request
from slowapi import Limiter

from config import settings


def _client_ip(request: Request) -> str:
    """Return the client IP, honouring only trusted ``X-Forwarded-For`` hops.

    ``X-Forwarded-For`` is client-controllable, so the leftmost entries can be
    forged. With ``trusted_proxy_count`` proxies in front of the app, only the
    rightmost ``trusted_proxy_count`` entries are written by trusted
    infrastructure; the client IP is the entry that many hops from the right.
    When no proxy is trusted (or the chain is shorter than expected), fall back
    to the direct peer, which cannot be spoofed.

    Args:
        request: The incoming request.

    Returns:
        The originating client IP address.
    """
    hops = settings.trusted_proxy_count
    if hops > 0:
        forwarded = [
            part.strip()
            for part in request.headers.get("X-Forwarded-For", "").split(",")
            if part.strip()
        ]
        if len(forwarded) >= hops:
            return forwarded[-hops]
    return request.client.host if request.client else "unknown"


def _user_id_from_request(request: Request) -> str:
    """Derive the rate-limit key for a request.

    Uses the authenticated user id (the JWT ``sub`` claim) when a bearer token
    is present, falling back to the client IP for anonymous requests. The token
    signature is not verified here: this only picks a bucket, and ``verify_jwt``
    still authenticates the request downstream.

    Args:
        request: The incoming request.

    Returns:
        The user id when available, otherwise the client IP.
    """
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(
                auth.removeprefix("Bearer "),
                options={"verify_signature": False},
                algorithms=["ES256"],
            )
            return payload.get("sub", _client_ip(request))
        except Exception:
            pass
    return _client_ip(request)


limiter = Limiter(key_func=_user_id_from_request)
