from datetime import UTC, datetime

from supabase import AsyncClient

from db import execute_with_retry


async def get_summary(supabase: AsyncClient, user_id: str) -> dict:
    """Fetch a user's dashboard summary figures.

    Args:
        supabase: The shared async Supabase client.
        user_id: The user whose figures to fetch.

    Returns:
        ``balance``, ``monthly_spending``, ``savings_goal`` and ``savings_saved``;
        all zero for a user with no account row or transactions.
    """
    result = await execute_with_retry(
        lambda: supabase.rpc("dashboard_summary", {"p_user_id": user_id})
    )
    return result.data[0]


async def set_savings_goal(
    supabase: AsyncClient, user_id: str, savings_goal: float
) -> None:
    """Create or update the user's savings goal.

    Args:
        supabase: The shared async Supabase client.
        user_id: The user whose goal to set.
        savings_goal: The new target, rounded to cents.
    """
    await execute_with_retry(
        lambda: supabase.table("accounts").upsert(
            {
                "user_id": user_id,
                "savings_goal": round(savings_goal, 2),
                "updated_at": datetime.now(UTC).isoformat(),
            },
            on_conflict="user_id",
        )
    )
