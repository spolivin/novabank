import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    Security,
    status,
)
from postgrest.exceptions import APIError
from supabase import AsyncClient

from dependencies.auth import verify_jwt
from dependencies.limiter import limiter
from dependencies.supabase import get_supabase
from log_context import add_log_fields
from schemas.dashboard import DashboardSummary, SavingsGoalUpdate, SavingsTransfer
from services import dashboard as dashboard_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard")


@router.get("/summary", response_model=DashboardSummary)
@limiter.limit("30/minute")
async def get_summary(
    request: Request,
    response: Response,
    user: dict = Security(verify_jwt),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Return the figures for the authenticated user's summary cards.

    Args:
        request: The incoming request (required by the rate limiter).
        response: The outgoing response, used to set cache headers.
        user: Decoded JWT claims for the authenticated user.
        supabase: The shared async Supabase client.

    Returns:
        The user's balance, monthly spending, savings goal and amount saved.

    Raises:
        HTTPException: 500 if the summary cannot be fetched.
    """
    response.headers["Cache-Control"] = "no-store"
    user_id = user["sub"]
    add_log_fields(user_id=user_id)
    try:
        return await dashboard_service.get_summary(supabase, user_id)
    except Exception as e:
        add_log_fields(error=type(e).__name__)
        logger.exception("Dashboard summary fetch failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dashboard summary",
        ) from e


@router.put("/savings-goal", response_model=DashboardSummary)
@limiter.limit("10/minute")
async def set_savings_goal(
    request: Request,
    response: Response,
    body: SavingsGoalUpdate,
    user: dict = Security(verify_jwt),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Set the authenticated user's savings goal.

    Args:
        request: The incoming request (required by the rate limiter).
        response: The outgoing response, used to set cache headers.
        body: The new savings goal.
        user: Decoded JWT claims for the authenticated user.
        supabase: The shared async Supabase client.

    Returns:
        The refreshed summary, so the client can redraw the progress bar at once.

    Raises:
        HTTPException: 500 if the goal cannot be saved.
    """
    response.headers["Cache-Control"] = "no-store"
    user_id = user["sub"]
    add_log_fields(user_id=user_id)
    try:
        await dashboard_service.set_savings_goal(supabase, user_id, body.savings_goal)
        return await dashboard_service.get_summary(supabase, user_id)
    except Exception as e:
        add_log_fields(error=type(e).__name__)
        logger.exception("Savings goal update failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update savings goal",
        ) from e


@router.post("/savings-transfer", response_model=DashboardSummary)
@limiter.limit("10/minute")
async def transfer_savings(
    request: Request,
    response: Response,
    body: SavingsTransfer,
    user: dict = Security(verify_jwt),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Move money between the authenticated user's account and savings.

    Args:
        request: The incoming request (required by the rate limiter).
        response: The outgoing response, used to set cache headers.
        body: The direction and amount to move.
        user: Decoded JWT claims for the authenticated user.
        supabase: The shared async Supabase client.

    Returns:
        The refreshed summary, so the client can redraw the cards at once.

    Raises:
        HTTPException: 409 if there are not enough funds to move; 500 if the
            transfer fails for any other reason.
    """
    response.headers["Cache-Control"] = "no-store"
    user_id = user["sub"]
    add_log_fields(user_id=user_id, transfer_direction=body.direction)
    try:
        return await dashboard_service.transfer_savings(
            supabase, user_id, body.direction, body.amount
        )
    except Exception as e:
        if isinstance(e, APIError) and e.message == "insufficient_funds":
            add_log_fields(error="insufficient_funds")
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Insufficient funds"
            ) from e
        add_log_fields(error=type(e).__name__)
        logger.exception("Savings transfer failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to transfer funds",
        ) from e
