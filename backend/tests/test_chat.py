from unittest.mock import AsyncMock, patch

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
