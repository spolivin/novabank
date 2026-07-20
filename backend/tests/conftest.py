import os

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")

import pytest
from httpx import ASGITransport, AsyncClient

from config import settings
from dependencies.auth import verify_jwt
from main import app

FAKE_USER = {"sub": "user-123", "email": "test@example.com"}


@pytest.fixture(autouse=True)
def _neutral_security_config(monkeypatch):
    """Pin gate settings to known defaults so tests ignore the ambient ``.env``.

    Without this, a developer with ``HEALTH_CHECK_TOKEN`` or
    ``TRUSTED_PROXY_COUNT`` set in their environment would see unrelated tests
    fail. Tests that exercise those features override these values locally.
    """
    monkeypatch.setattr(settings, "health_check_token", "")
    monkeypatch.setattr(settings, "trusted_proxy_count", 0)


def override_verify_jwt():
    return FAKE_USER


@pytest.fixture
def auth_app():
    app.dependency_overrides[verify_jwt] = override_verify_jwt
    yield app
    app.dependency_overrides.clear()


@pytest.fixture
async def client(auth_app):
    async with AsyncClient(
        transport=ASGITransport(app=auth_app), base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
async def unauthed_client():
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
