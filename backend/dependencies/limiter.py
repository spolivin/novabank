import jwt
from fastapi import Request
from slowapi import Limiter


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


def _user_id_from_request(request: Request) -> str:
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
