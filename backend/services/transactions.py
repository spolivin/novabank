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
