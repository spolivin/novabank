"""Cover the stale-connection retry around PostgREST queries."""

from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from db import execute_with_retry


def _query(execute):
    """A stand-in for a built PostgREST chain with the given ``execute``."""
    chain = MagicMock()
    chain.execute = execute
    return chain


async def test_returns_result_without_retrying():
    execute = AsyncMock(return_value=MagicMock(data=[{"id": "a"}]))
    calls = []

    def build():
        calls.append(1)
        return _query(execute)

    result = await execute_with_retry(build)
    assert result.data == [{"id": "a"}]
    assert len(calls) == 1


async def test_retries_after_goaway_and_succeeds():
    # The failure mode from production: a pooled HTTP/2 connection closed by
    # the server, which httpx surfaces as RemoteProtocolError.
    execute = AsyncMock(
        side_effect=[
            httpx.RemoteProtocolError("<ConnectionTerminated error_code:0>"),
            MagicMock(data=[{"id": "a"}]),
        ]
    )
    result = await execute_with_retry(lambda: _query(execute))
    assert result.data == [{"id": "a"}]
    assert execute.await_count == 2


async def test_rebuilds_the_query_for_each_attempt():
    """No request state is reused across attempts."""
    execute = AsyncMock(
        side_effect=[httpx.ConnectError("no route"), MagicMock(data=[])]
    )
    builds = []

    def build():
        builds.append(1)
        return _query(execute)

    await execute_with_retry(build)
    assert len(builds) == 2


async def test_raises_after_exhausting_attempts():
    execute = AsyncMock(side_effect=httpx.RemoteProtocolError("boom"))
    with pytest.raises(httpx.RemoteProtocolError):
        await execute_with_retry(lambda: _query(execute), attempts=3)
    assert execute.await_count == 3


async def test_does_not_retry_read_timeouts():
    # A read timeout may mean the write was applied but the response was lost,
    # so retrying could duplicate a row.
    execute = AsyncMock(side_effect=httpx.ReadTimeout("slow"))
    with pytest.raises(httpx.ReadTimeout):
        await execute_with_retry(lambda: _query(execute))
    assert execute.await_count == 1


async def test_clear_history_survives_a_goaway(client, fake_supabase):
    """End to end: the request that used to 500 now succeeds after a retry."""
    delete_chain = fake_supabase.table.return_value.delete.return_value.eq.return_value
    delete_chain.execute = AsyncMock(
        side_effect=[
            httpx.RemoteProtocolError("<ConnectionTerminated error_code:0>"),
            MagicMock(data=[{"id": "a"}]),
        ]
    )
    response = await client.delete("/ai/history")
    assert response.status_code == 204
    assert delete_chain.execute.await_count == 2


async def test_does_not_retry_unexpected_errors():
    execute = AsyncMock(side_effect=ValueError("bad query"))
    with pytest.raises(ValueError):
        await execute_with_retry(lambda: _query(execute))
    assert execute.await_count == 1
