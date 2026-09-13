"""Cover the lifespan wiring and the client providers.

This is the only module that runs the real ``lifespan`` context manager. The
client constructors are patched, so no real HTTP pool is created — and both the
creation and the teardown happen inside a single test function, hence a single
event loop.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import FastAPI

import main
from dependencies.anthropic_client import (
    close_anthropic,
    create_anthropic,
    get_anthropic,
)
from dependencies.supabase import close_supabase, get_supabase


async def test_lifespan_creates_and_closes_clients():
    supa, claude = MagicMock(), MagicMock()
    app = FastAPI()
    with (
        patch("main.create_supabase", new=AsyncMock(return_value=supa)),
        patch("main.create_anthropic", return_value=claude),
        patch("main.close_supabase", new=AsyncMock()) as close_supa,
        patch("main.close_anthropic", new=AsyncMock()) as close_claude,
    ):
        async with main.lifespan(app):
            assert app.state.supabase is supa
            assert app.state.anthropic is claude
    close_supa.assert_awaited_once_with(supa)
    close_claude.assert_awaited_once_with(claude)
    # Cleared so a closed pool can never be handed out afterwards.
    assert app.state.supabase is None
    assert app.state.anthropic is None


async def test_lifespan_closes_clients_when_serving_raises():
    app = FastAPI()
    with (
        patch("main.create_supabase", new=AsyncMock(return_value=MagicMock())),
        patch("main.create_anthropic", return_value=MagicMock()),
        patch("main.close_supabase", new=AsyncMock()) as close_supa,
        patch("main.close_anthropic", new=AsyncMock()) as close_claude,
    ):
        with pytest.raises(RuntimeError, match="serving failed"):
            async with main.lifespan(app):
                raise RuntimeError("serving failed")
    close_supa.assert_awaited_once()
    close_claude.assert_awaited_once()


async def test_anthropic_connect_timeout_tolerates_slow_dns():
    # DNS counts against the async connect budget; a 5s glibc lookup stall must
    # not exhaust it. Built and closed inside this test's own event loop.
    client = create_anthropic()
    try:
        assert client.timeout.connect > 5.0
        assert client.timeout.read == 600.0
    finally:
        await client.close()


async def test_close_supabase_swallows_teardown_errors():
    client = MagicMock()
    client.auth.close = AsyncMock(side_effect=RuntimeError("auth close failed"))
    client.postgrest.aclose = AsyncMock()
    await close_supabase(client)
    # A failing closer must not block the remaining one.
    client.postgrest.aclose.assert_awaited_once()


async def test_close_anthropic_swallows_teardown_errors():
    client = MagicMock()
    client.close = AsyncMock(side_effect=RuntimeError("close failed"))
    await close_anthropic(client)
    client.close.assert_awaited_once()


async def test_providers_raise_when_lifespan_did_not_run():
    request = MagicMock()
    request.app.state = FastAPI().state
    with pytest.raises(RuntimeError, match="Supabase client unavailable"):
        await get_supabase(request)
    with pytest.raises(RuntimeError, match="Anthropic client unavailable"):
        await get_anthropic(request)


async def test_providers_return_the_lifespan_clients():
    request = MagicMock()
    request.app.state = FastAPI().state
    request.app.state.supabase = supa = MagicMock()
    request.app.state.anthropic = claude = MagicMock()
    assert await get_supabase(request) is supa
    assert await get_anthropic(request) is claude
