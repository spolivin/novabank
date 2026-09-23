from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from supabase import AsyncClient

from db import execute_with_retry
from schemas.dashboard import TransferDirection


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


async def transfer_savings(
    supabase: AsyncClient,
    user_id: str,
    direction: TransferDirection,
    amount: Decimal,
) -> dict:
    """Move money between the account and savings, recorded as a transaction.

    The ``transfer_savings`` database function checks funds and inserts the
    transaction atomically. One request id is generated here and reused across
    every attempt, so if a retried request did reach Postgres the replay returns
    the current figures instead of transferring again.

    Args:
        supabase: The shared async Supabase client.
        user_id: The user making the transfer.
        direction: ``to_savings`` or ``from_savings``.
        amount: Dollars to move, in whole cents.

    Returns:
        The refreshed summary figures.

    Raises:
        postgrest.exceptions.APIError: With message ``insufficient_funds`` when
            the balance (or amount saved) is below ``amount``.
    """
    request_id = str(uuid4())
    result = await execute_with_retry(
        lambda: supabase.rpc(
            "transfer_savings",
            {
                "p_user_id": user_id,
                "p_direction": direction,
                # JSON can't encode Decimal; Postgres parses the string exactly.
                "p_amount": str(amount),
                "p_request_id": request_id,
            },
        )
    )
    return result.data[0]
