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


async def test_history_sets_no_store_cache_header(client):
    with patch("routers.ai.ai_service.get_history", new=AsyncMock(return_value=[])):
        response = await client.get("/ai/history")
    assert response.headers["cache-control"] == "no-store"


async def test_history_passes_limit_query_to_service(client):
    mock = AsyncMock(return_value=[])
    with patch("routers.ai.ai_service.get_history", new=mock):
        response = await client.get("/ai/history?limit=5")
    assert response.status_code == 200
    assert mock.await_args.kwargs["limit"] == 5


async def test_history_defaults_limit_to_ui_history_limit(client):
    from services.ai import UI_HISTORY_LIMIT

    mock = AsyncMock(return_value=[])
    with patch("routers.ai.ai_service.get_history", new=mock):
        await client.get("/ai/history")
    assert mock.await_args.kwargs["limit"] == UI_HISTORY_LIMIT


async def test_history_rejects_out_of_range_limit(client):
    for bad in ("0", "201", "-1", "abc"):
        response = await client.get(f"/ai/history?limit={bad}")
        assert response.status_code == 422


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


async def test_clear_history_success(client):
    with patch(
        "routers.ai.ai_service.clear_history", new=AsyncMock(return_value=3)
    ) as mock_clear:
        response = await client.delete("/ai/history")
    assert response.status_code == 204
    assert response.content == b""
    mock_clear.assert_awaited_once()


async def test_clear_history_missing_auth(unauthed_client):
    response = await unauthed_client.delete("/ai/history")
    assert response.status_code == 401


async def test_clear_history_service_error_returns_500(client):
    with patch(
        "routers.ai.ai_service.clear_history",
        new=AsyncMock(side_effect=RuntimeError("db failure")),
    ):
        response = await client.delete("/ai/history")
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to clear history"
