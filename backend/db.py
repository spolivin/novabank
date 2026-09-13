"""Retry helper for Supabase (PostgREST) queries.

The Supabase client is created once in the app lifespan and keeps HTTP/2
connections pooled for the life of the process. After an idle period Supabase's
edge closes an idle connection with a GOAWAY frame; a request assigned to that
connection at that moment fails before it is ever processed. PostgREST's own
``send_with_retry`` does not help — it only retries GET/HEAD requests that
return 503 or 520, never a transport-level failure.
"""

import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any, Protocol

import httpx

logger = logging.getLogger(__name__)

# Failures where the request provably never reached PostgREST, so re-sending
# cannot apply the same write twice:
#   - RemoteProtocolError: GOAWAY on a pooled connection. The frame's
#     ``last_stream_id`` is the server's promise that later streams were
#     not processed.
#   - ConnectError / ConnectTimeout: no connection was established at all.
# Read timeouts are deliberately excluded: the server may have applied the
# write before the response was lost, so retrying could duplicate a row.
_RETRYABLE = (httpx.RemoteProtocolError, httpx.ConnectError, httpx.ConnectTimeout)

_ATTEMPTS = 3
_BACKOFF_SECONDS = 0.1


class _Executable(Protocol):
    """The tail of a PostgREST query chain."""

    def execute(self) -> Awaitable[Any]: ...


async def execute_with_retry(
    build_query: Callable[[], _Executable],
    *,
    attempts: int = _ATTEMPTS,
) -> Any:
    """Execute a PostgREST query, retrying stale-connection failures.

    Args:
        build_query: Zero-argument callable returning a built query chain. It is
            called again for each attempt so no request state is reused.
        attempts: Maximum number of tries, including the first.

    Returns:
        The PostgREST response.

    Raises:
        Exception: Whatever the query raises. Retryable transport errors are
            re-raised only after the final attempt; everything else propagates
            immediately.
    """
    for attempt in range(1, attempts + 1):
        try:
            return await build_query().execute()
        except _RETRYABLE as e:
            if attempt == attempts:
                logger.error("Supabase query failed after %d attempts: %s", attempts, e)
                raise
            logger.warning(
                "Retrying Supabase query after %s (attempt %d/%d)",
                type(e).__name__,
                attempt,
                attempts,
            )
            await asyncio.sleep(_BACKOFF_SECONDS * attempt)
