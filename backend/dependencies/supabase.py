"""Shared Supabase admin client (service-role) and its FastAPI provider."""

import logging

from fastapi import Request
from supabase import AsyncClient, acreate_client

from config import settings

logger = logging.getLogger(__name__)


async def create_supabase() -> AsyncClient:
    """Build the service-role Supabase client.

    Called from the app lifespan so the client's HTTP pool is created on the
    running event loop rather than at import time.

    Returns:
        A connected async Supabase client.
    """
    return await acreate_client(
        str(settings.supabase_url).rstrip("/"), settings.supabase_service_key
    )


async def close_supabase(client: AsyncClient) -> None:
    """Close the client's HTTP pools.

    The client object itself has no ``close()``; its auth and postgrest
    sub-clients own the pools. Failures are logged, never raised, so shutdown is
    never blocked by a teardown error.

    Args:
        client: The client created by :func:`create_supabase`.
    """
    for closer in (client.auth.close, client.postgrest.aclose):
        try:
            await closer()
        except Exception:
            logger.warning("Supabase client close failed", exc_info=True)


async def get_supabase(request: Request) -> AsyncClient:
    """FastAPI dependency returning the lifespan-scoped Supabase client.

    Args:
        request: The incoming request, used to reach ``app.state``.

    Returns:
        The shared async Supabase client.

    Raises:
        RuntimeError: If the app lifespan did not run (for example an ASGI
            transport that skips lifespan events without a dependency override).
    """
    client = getattr(request.app.state, "supabase", None)
    if client is None:
        raise RuntimeError("Supabase client unavailable: app lifespan did not run")
    return client
