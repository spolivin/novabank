from unittest.mock import MagicMock, patch

from httpx import ASGITransport, AsyncClient

from main import app


async def test_health():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        response = await ac.get("/health/api")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_db_success():
    with patch("routers.health.supabase_admin") as mock_supa:
        mock_supa.table.return_value.select.return_value.limit.return_value.execute.return_value = (
            MagicMock()
        )
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            response = await ac.get("/health/db")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_health_db_unavailable():
    with patch("routers.health.supabase_admin") as mock_supa:
        mock_supa.table.return_value.select.return_value.limit.return_value.execute.side_effect = Exception(
            "connection failed"
        )
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as ac:
            response = await ac.get("/health/db")
    assert response.status_code == 503
    assert response.json()["detail"] == "Database unavailable"
