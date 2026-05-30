import base64
import json
from unittest.mock import MagicMock

from dependencies.limiter import _user_id_from_request


def _make_jwt(payload: dict) -> str:
    def b64(data):
        return base64.urlsafe_b64encode(json.dumps(data).encode()).rstrip(b"=").decode()

    return f"{b64({'alg': 'ES256', 'typ': 'JWT'})}.{b64(payload)}.fakesig"


def _make_request(auth_header=None, client_host="1.2.3.4"):
    request = MagicMock()
    request.headers.get = lambda key, default="": (
        auth_header if auth_header and key == "Authorization" else default
    )
    request.client.host = client_host
    return request


def test_valid_jwt_returns_sub():
    token = _make_jwt({"sub": "user-abc"})
    request = _make_request(auth_header=f"Bearer {token}")
    assert _user_id_from_request(request) == "user-abc"


def test_valid_jwt_without_sub_falls_back_to_host():
    token = _make_jwt({"role": "authenticated"})
    request = _make_request(auth_header=f"Bearer {token}", client_host="5.6.7.8")
    assert _user_id_from_request(request) == "5.6.7.8"


def test_invalid_jwt_falls_back_to_host():
    request = _make_request(
        auth_header="Bearer not.a.real.token", client_host="1.2.3.4"
    )
    assert _user_id_from_request(request) == "1.2.3.4"


def test_no_auth_header_returns_host():
    request = _make_request(client_host="9.9.9.9")
    assert _user_id_from_request(request) == "9.9.9.9"
