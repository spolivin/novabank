from unittest.mock import AsyncMock, patch


async def test_history_success(client):
    turns = [
        {"role": "user", "content": "hi"},
        {"role": "assistant", "content": "hello"},
    ]
    with patch("routers.ai.ai_service.get_history", new=AsyncMock(return_value=turns)):
        response = await client.get("/ai/history")
    assert response.status_code == 200
    assert response.json() == turns


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
