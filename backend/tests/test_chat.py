from unittest.mock import AsyncMock, patch

import anthropic
import httpx
import pytest

from dependencies.limiter import limiter


@pytest.fixture(autouse=True)
def reset_limiter():
    limiter.reset()
    yield
    limiter.reset()


async def test_chat_success(client):
    with patch("routers.ai.ai_service.get_reply", new=AsyncMock(return_value="Hello!")):
        response = await client.post("/ai/chat", json={"message": "hi"})
    assert response.status_code == 200
    assert response.json() == {"reply": "Hello!"}


async def test_chat_missing_auth(unauthed_client):
    response = await unauthed_client.post("/ai/chat", json={"message": "hi"})
    assert response.status_code == 401


async def test_chat_invalid_body_missing_message(client):
    response = await client.post("/ai/chat", json={})
    assert response.status_code == 422


async def test_chat_invalid_body_empty_message(client):
    response = await client.post("/ai/chat", json={"message": ""})
    assert response.status_code == 422


async def test_chat_invalid_body_message_too_long(client):
    response = await client.post("/ai/chat", json={"message": "x" * 501})
    assert response.status_code == 422


async def test_chat_service_error_returns_500(client):
    with patch(
        "routers.ai.ai_service.get_reply",
        new=AsyncMock(side_effect=RuntimeError("upstream failure")),
    ):
        response = await client.post("/ai/chat", json={"message": "hi"})
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to get reply"


async def test_chat_anthropic_api_error_returns_503(client):
    """A Claude-side rejection (e.g. a configured spend limit) is a distinct,
    honest 503 rather than the generic 500 — Nova is down for everyone, not
    just this request, so the reply shouldn't suggest retrying right away."""
    error = anthropic.BadRequestError(
        "Your credit balance is too low to access the Claude API.",
        response=httpx.Response(400, request=httpx.Request("POST", "https://x")),
        body=None,
    )
    with patch("routers.ai.ai_service.get_reply", new=AsyncMock(side_effect=error)):
        response = await client.post("/ai/chat", json={"message": "hi"})
    assert response.status_code == 503
    assert (
        response.json()["detail"]
        == "Nova is temporarily unavailable. Please try again later."
    )


async def test_chat_timeout_returns_504(client):
    """The chat turn's overall budget running out is a distinct 504, not the
    generic 500 — it's specifically that Claude was too slow, not that
    something broke."""
    with patch(
        "routers.ai.ai_service.get_reply",
        new=AsyncMock(side_effect=TimeoutError()),
    ):
        response = await client.post("/ai/chat", json={"message": "hi"})
    assert response.status_code == 504
    assert (
        response.json()["detail"]
        == "Nova is taking too long to respond. Please try again."
    )


async def test_chat_single_call_timeout_returns_504(client):
    """A single call's own read timeout is a different exception type than
    the turn's overall budget, but the same user-facing situation — same 504."""
    error = anthropic.APITimeoutError(request=httpx.Request("POST", "https://x"))
    with patch("routers.ai.ai_service.get_reply", new=AsyncMock(side_effect=error)):
        response = await client.post("/ai/chat", json={"message": "hi"})
    assert response.status_code == 504
    assert (
        response.json()["detail"]
        == "Nova is taking too long to respond. Please try again."
    )
