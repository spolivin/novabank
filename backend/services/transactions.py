import datetime
from typing import Literal

from supabase import AsyncClient

from db import execute_with_retry

TRANSACTIONS_LIMIT = 10


async def get_transactions(
    supabase: AsyncClient, user_id: str, *, limit: int = TRANSACTIONS_LIMIT
) -> list[dict]:
    """Fetch a user's most recent transactions, newest first.

    Args:
        supabase: The shared async Supabase client.
        user_id: The user whose transactions to fetch.
        limit: Maximum number of transactions to return.

    Returns:
        Transactions ordered newest to oldest; empty if the user has none.
    """
    result = await execute_with_retry(
        lambda: (
            supabase.table("transactions")
            .select("id, date, description, category, amount")
            .eq("user_id", user_id)
            .order("date", desc=True)
            # ``date`` has no time of day, so same-day rows would otherwise come
            # back in an arbitrary order: newest insert first among them.
            .order("created_at", desc=True)
            .limit(limit)
        )
    )
    return result.data


# Row cap for the assistant's transaction search (same as ``GET /transactions``).
SEARCH_LIMIT = 50


async def search_transactions(
    supabase: AsyncClient,
    user_id: str,
    *,
    start_date: datetime.date | None = None,
    end_date: datetime.date | None = None,
    category: str | None = None,
    text: str | None = None,
    direction: Literal["debit", "credit"] | None = None,
    min_amount: float | None = None,
    max_amount: float | None = None,
    limit: int = SEARCH_LIMIT,
) -> dict:
    """Search a user's transactions with optional filters, newest first.

    Args:
        supabase: The shared async Supabase client.
        user_id: The user whose transactions to search.
        start_date: Earliest posting date to include.
        end_date: Latest posting date to include.
        category: Category to match, case-insensitively.
        text: Substring to match in the description, case-insensitively.
        direction: ``debit`` for money out, ``credit`` for money in.
        min_amount: Smallest magnitude to include; requires ``direction``.
        max_amount: Largest magnitude to include; requires ``direction``.
        limit: Maximum number of transactions to return.

    Returns:
        ``transactions``, ``count``, ``total`` (sum of the returned rows) and
        ``truncated`` (whether more rows matched than were returned).
    """

    def build_query():
        query = (
            supabase.table("transactions")
            .select("id, date, description, category, amount")
            .eq("user_id", user_id)
        )
        if start_date is not None:
            query = query.gte("date", start_date.isoformat())
        if end_date is not None:
            query = query.lte("date", end_date.isoformat())
        if category is not None:
            query = query.ilike("category", _escape_like(category))
        if text is not None:
            query = query.ilike("description", f"%{_escape_like(text)}%")
        # Amounts are signed (negative = debit); bounds are magnitudes.
        if direction == "debit":
            query = query.lt("amount", 0)
            if min_amount is not None:
                query = query.lte("amount", -min_amount)
            if max_amount is not None:
                query = query.gte("amount", -max_amount)
        elif direction == "credit":
            query = query.gt("amount", 0)
            if min_amount is not None:
                query = query.gte("amount", min_amount)
            if max_amount is not None:
                query = query.lte("amount", max_amount)
        return (
            query.order("date", desc=True)
            .order("created_at", desc=True)
            # One extra row tells us whether more matched than we return.
            .limit(limit + 1)
        )

    result = await execute_with_retry(build_query)
    rows = result.data[:limit]
    return {
        "transactions": rows,
        "count": len(rows),
        "total": round(sum(float(r["amount"]) for r in rows), 2),
        "truncated": len(result.data) > limit,
    }


def _escape_like(value: str) -> str:
    """Make ``value`` match literally inside a PostgREST ``ilike`` pattern.

    ``\\``, ``%`` and ``_`` are escaped for Postgres. PostgREST also treats ``*``
    as ``%`` and has no escape for it, so it becomes ``_`` (any one character),
    which still matches a literal ``*`` in descriptions like ``AMZN*Mktp``.
    """
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return escaped.replace("*", "_")
