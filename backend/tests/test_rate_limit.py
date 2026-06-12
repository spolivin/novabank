from unittest.mock import AsyncMock, patch

import pytest

from dependencies.limiter import limiter


@pytest.fixture(autouse=True)
def reset_limiter():
    limiter.reset()
    yield
    limiter.reset()


async def test_chat_rate_limit_allows_up_to_limit(client):
    with patch("routers.ai.ai_service.get_reply", new=AsyncMock(return_value="ok")):
        for _ in range(2):
            r = await client.post("/ai/chat", json={"message": "hi"})
            assert r.status_code == 200


async def test_chat_rate_limit_blocks_after_limit(client):
    with patch("routers.ai.ai_service.get_reply", new=AsyncMock(return_value="ok")):
        for _ in range(2):
            await client.post("/ai/chat", json={"message": "hi"})
        r = await client.post("/ai/chat", json={"message": "hi"})
    assert r.status_code == 429


async def test_history_rate_limit_allows_up_to_limit(client):
    with patch("routers.ai.ai_service.get_history", new=AsyncMock(return_value=[])):
        for _ in range(10):
            r = await client.get("/ai/history")
            assert r.status_code == 200


async def test_history_rate_limit_blocks_after_limit(client):
    with patch("routers.ai.ai_service.get_history", new=AsyncMock(return_value=[])):
        for _ in range(10):
            await client.get("/ai/history")
        r = await client.get("/ai/history")
    assert r.status_code == 429


async def test_rate_limit_is_per_user(client):
    """Exhausting one user's limit does not affect another user's counter."""
    chat_limit = limiter._route_limits["routers.ai.chat"][0]
    original_key_func = chat_limit.key_func
    keys = ["user-a", "user-a", "user-b"]
    call = [0]

    def rotating_key(request):
        key = keys[call[0]]
        call[0] += 1
        return key

    chat_limit.key_func = rotating_key
    try:
        with patch("routers.ai.ai_service.get_reply", new=AsyncMock(return_value="ok")):
            for _ in range(2):
                await client.post("/ai/chat", json={"message": "hi"})
            r = await client.post("/ai/chat", json={"message": "hi"})
        assert r.status_code == 200
    finally:
        chat_limit.key_func = original_key_func
