from unittest.mock import AsyncMock, patch


async def test_history_success(client):
    turns = [
        {"role": "user", "content": "hi", "created_at": "2026-06-06T10:00:00+00:00"},
        {
            "role": "assistant",
            "content": "hello",
            "created_at": "2026-06-06T10:00:01+00:00",
        },
    ]
    with patch("routers.ai.ai_service.get_history", new=AsyncMock(return_value=turns)):
        response = await client.get("/ai/history")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["role"] == "user" and data[0]["content"] == "hi"
    assert data[1]["role"] == "assistant" and data[1]["content"] == "hello"
    assert "created_at" in data[0] and "created_at" in data[1]


async def test_history_empty(client):
    with patch("routers.ai.ai_service.get_history", new=AsyncMock(return_value=[])):
        response = await client.get("/ai/history")
    assert response.status_code == 200
    assert response.json() == []


async def test_history_missing_auth(unauthed_client):
    response = await unauthed_client.get("/ai/history")
    assert response.status_code == 401


async def test_history_service_error_returns_500(client):
    with patch(
        "routers.ai.ai_service.get_history",
        new=AsyncMock(side_effect=RuntimeError("db failure")),
    ):
        response = await client.get("/ai/history")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to fetch history"
