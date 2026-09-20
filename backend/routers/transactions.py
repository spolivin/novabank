import logging

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    Response,
    Security,
    status,
)
from supabase import AsyncClient

from dependencies.auth import verify_jwt
from dependencies.limiter import limiter
from dependencies.supabase import get_supabase
from log_context import add_log_fields
from schemas.transaction import Transaction
from services import transactions as transactions_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transactions")


@router.get("", response_model=list[Transaction])
@limiter.limit("30/minute")
async def list_transactions(
    request: Request,
    response: Response,
    limit: int = Query(default=transactions_service.TRANSACTIONS_LIMIT, ge=1, le=50),
    user: dict = Security(verify_jwt),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Return the authenticated user's most recent transactions.

    Args:
        request: The incoming request (required by the rate limiter).
        response: The outgoing response, used to set cache headers.
        limit: Maximum number of transactions to return (1-50).
        user: Decoded JWT claims for the authenticated user.
        supabase: The shared async Supabase client.

    Returns:
        The user's transactions, newest first.

    Raises:
        HTTPException: 500 if the transactions cannot be fetched.
    """
    response.headers["Cache-Control"] = "no-store"
    user_id = user["sub"]
    add_log_fields(user_id=user_id)
    try:
        rows = await transactions_service.get_transactions(
            supabase, user_id, limit=limit
        )
        add_log_fields(transactions=len(rows))
        return rows
    except Exception as e:
        add_log_fields(error=type(e).__name__)
        logger.exception("Transactions fetch failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch transactions",
        ) from e
