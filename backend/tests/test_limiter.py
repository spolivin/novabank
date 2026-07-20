import base64
import json
from unittest.mock import MagicMock

import pytest

from dependencies.limiter import _client_ip, _user_id_from_request


def _make_jwt(payload: dict) -> str:
    def b64(data):
        return base64.urlsafe_b64encode(json.dumps(data).encode()).rstrip(b"=").decode()

    return f"{b64({'alg': 'ES256', 'typ': 'JWT'})}.{b64(payload)}.fakesig"


def _make_request(auth_header=None, client_host="1.2.3.4", forwarded_for=None):
    headers = {}
    if auth_header:
        headers["Authorization"] = auth_header
    if forwarded_for:
        headers["X-Forwarded-For"] = forwarded_for
    request = MagicMock()
    request.headers.get = lambda key, default="": headers.get(key, default)
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


def test_non_bearer_scheme_falls_back_to_host():
    request = _make_request(auth_header="Token sometoken", client_host="2.2.2.2")
    assert _user_id_from_request(request) == "2.2.2.2"


@pytest.fixture
def trust_proxies(monkeypatch):
    def _set(count):
        monkeypatch.setattr("dependencies.limiter.settings.trusted_proxy_count", count)

    return _set


def test_client_ip_ignores_forwarded_for_without_trusted_proxy():
    # Default trusted_proxy_count is 0: X-Forwarded-For is client-controlled and
    # must not be trusted, so the direct peer is used.
    request = _make_request(client_host="10.0.0.1", forwarded_for="203.0.113.5")
    assert _client_ip(request) == "10.0.0.1"


def test_client_ip_reads_trusted_hop_from_the_right(trust_proxies):
    trust_proxies(1)
    request = _make_request(client_host="10.0.0.1", forwarded_for="203.0.113.5")
    assert _client_ip(request) == "203.0.113.5"


def test_client_ip_ignores_spoofed_leftmost_entries(trust_proxies):
    # A forged leftmost entry cannot displace the real client IP, which the
    # trusted proxy appends on the right.
    trust_proxies(1)
    request = _make_request(
        client_host="10.0.0.1", forwarded_for="1.1.1.1, 203.0.113.5"
    )
    assert _client_ip(request) == "203.0.113.5"


def test_client_ip_falls_back_when_chain_shorter_than_trusted_count(trust_proxies):
    trust_proxies(2)
    request = _make_request(client_host="10.0.0.1", forwarded_for="203.0.113.5")
    assert _client_ip(request) == "10.0.0.1"


def test_client_ip_falls_back_to_host_without_forwarded_for():
    request = _make_request(client_host="10.0.0.1")
    assert _client_ip(request) == "10.0.0.1"
