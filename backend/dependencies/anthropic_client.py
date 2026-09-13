"""Shared Anthropic async client and its FastAPI provider."""

import logging

from anthropic import AsyncAnthropic, Timeout
from fastapi import Request

from config import settings

logger = logging.getLogger(__name__)

# The async transport counts DNS resolution against the connect timeout (the
# sync one did not). glibc can stall a lookup for its 5s retry timeout when
# parallel A/AAAA replies are dropped, which exhausts the SDK's default 5s
# connect budget on every retry. 15s absorbs one such stall; the other limits
# keep the SDK defaults.
_TIMEOUT = Timeout(600.0, connect=15.0)


def create_anthropic() -> AsyncAnthropic:
    """Build the Claude API client.

    Called from the app lifespan: the constructor builds an HTTP pool, which
    must not happen at import time.

    Returns:
        The async Anthropic client.
    """
    return AsyncAnthropic(api_key=settings.anthropic_api_key, timeout=_TIMEOUT)


async def close_anthropic(client: AsyncAnthropic) -> None:
    """Close the client's HTTP pool.

    Failures are logged, never raised, so shutdown is never blocked by a
    teardown error.

    Args:
        client: The client created by :func:`create_anthropic`.
    """
    try:
        await client.close()
    except Exception:
        logger.warning("Anthropic client close failed", exc_info=True)


async def get_anthropic(request: Request) -> AsyncAnthropic:
    """FastAPI dependency returning the lifespan-scoped Anthropic client.

    Args:
        request: The incoming request, used to reach ``app.state``.

    Returns:
        The shared async Anthropic client.

    Raises:
        RuntimeError: If the app lifespan did not run.
    """
    client = getattr(request.app.state, "anthropic", None)
    if client is None:
        raise RuntimeError("Anthropic client unavailable: app lifespan did not run")
    return client
