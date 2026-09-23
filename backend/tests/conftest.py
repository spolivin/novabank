import os

os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_SERVICE_KEY", "test-service-key")
os.environ.setdefault("ANTHROPIC_API_KEY", "test-anthropic-key")

from unittest.mock import AsyncMock, MagicMock

import pytest
from httpx import ASGITransport, AsyncClient

from config import settings
from dependencies.anthropic_client import get_anthropic
from dependencies.auth import verify_jwt
from dependencies.supabase import get_supabase
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


def make_supabase_mock() -> MagicMock:
    """Build a fake ``AsyncClient``: sync fluent chain, awaitable terminals.

    Mirrors postgrest-py's async API, where the query is built synchronously and
    only ``execute()`` is awaited. Covers the four chain shapes the app uses.

    Returns:
        A mock usable anywhere the real async Supabase client is expected.
    """
    mock = MagicMock()
    table = mock.table.return_value
    select = table.select.return_value
    select.eq.return_value.order.return_value.limit.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    # Transactions add a second .order() to break same-date ties.
    select.eq.return_value.order.return_value.order.return_value.limit.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    select.limit.return_value.execute = AsyncMock(return_value=MagicMock(data=[]))
    table.insert.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[{"id": "row-id"}])
    )
    table.delete.return_value.eq.return_value.execute = AsyncMock(
        return_value=MagicMock(data=[])
    )
    mock.auth.admin.delete_user = AsyncMock(return_value=None)
    return mock


@pytest.fixture
def fake_supabase():
    return make_supabase_mock()


@pytest.fixture
def fake_anthropic():
    mock = MagicMock()
    mock.messages.create = AsyncMock(
        return_value=MagicMock(content=[MagicMock(text="Hello from Nova")])
    )
    return mock


@pytest.fixture(autouse=True)
def _override_clients(fake_supabase, fake_anthropic):
    """Serve the fake clients to every request.

    ``ASGITransport`` does not run lifespan events, so without this override the
    providers would raise for want of ``app.state``.
    """
    app.dependency_overrides[get_supabase] = lambda: fake_supabase
    app.dependency_overrides[get_anthropic] = lambda: fake_anthropic
    yield
    app.dependency_overrides.pop(get_supabase, None)
    app.dependency_overrides.pop(get_anthropic, None)


def override_verify_jwt():
    return FAKE_USER


@pytest.fixture
def auth_app():
    app.dependency_overrides[verify_jwt] = override_verify_jwt
    yield app
    # Pop rather than clear: clearing would drop the autouse client overrides.
    app.dependency_overrides.pop(verify_jwt, None)


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
