from unittest.mock import AsyncMock, patch

from main import _MAX_BODY


async def test_body_over_limit_returns_413(unauthed_client):
    response = await unauthed_client.post(
        "/ai/chat",
        headers={
            "Content-Length": str(_MAX_BODY + 1024),
            "Content-Type": "application/json",
        },
        content=b"{}",
    )
    assert response.status_code == 413


async def test_body_under_limit_passes_to_auth(unauthed_client):
    response = await unauthed_client.post(
        "/ai/chat",
        headers={
            "Content-Length": str(_MAX_BODY - 1024),
            "Content-Type": "application/json",
        },
        content=b"{}",
    )
    assert response.status_code == 401


async def test_body_under_limit_returns_200(client):
    with patch("routers.ai.ai_service.get_reply", new=AsyncMock(return_value="ok")):
        response = await client.post("/ai/chat", json={"message": "hello"})
    assert response.status_code == 200


async def test_chunked_body_over_limit_returns_413(unauthed_client):
    # A generator body makes httpx stream with Transfer-Encoding: chunked and
    # no Content-Length, so only the measured-body backstop can catch it.
    async def oversized():
        yield b"x" * (_MAX_BODY + 1024)

    response = await unauthed_client.post(
        "/ai/chat",
        headers={"Content-Type": "application/json"},
        content=oversized(),
    )
    assert response.status_code == 413


async def test_malformed_content_length_returns_400(unauthed_client):
    response = await unauthed_client.post(
        "/ai/chat",
        headers={"Content-Length": "not-a-number", "Content-Type": "application/json"},
        content=b"{}",
    )
    assert response.status_code == 400


async def test_413_carries_security_headers(unauthed_client):
    response = await unauthed_client.post(
        "/ai/chat",
        headers={
            "Content-Length": str(_MAX_BODY + 1024),
            "Content-Type": "application/json",
        },
        content=b"{}",
    )
    assert response.status_code == 413
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Content-Security-Policy"] == "default-src 'none'"
