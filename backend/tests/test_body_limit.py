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


async def test_body_under_limit_not_413(unauthed_client):
    response = await unauthed_client.post(
        "/ai/chat",
        headers={
            "Content-Length": str(_MAX_BODY - 1024),
            "Content-Type": "application/json",
        },
        content=b"{}",
    )
    assert response.status_code != 413
