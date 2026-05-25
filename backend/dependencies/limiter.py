import jwt
from fastapi import Request
from slowapi import Limiter


def _user_id_from_request(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        try:
            payload = jwt.decode(
                auth.removeprefix("Bearer "),
                options={"verify_signature": False},
                algorithms=["ES256"],
            )
            return payload.get("sub", request.client.host)
        except Exception:
            pass
    return request.client.host


limiter = Limiter(key_func=_user_id_from_request)
