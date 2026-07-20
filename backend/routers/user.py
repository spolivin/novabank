import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request, Security, status
from supabase_auth.errors import AuthApiError

from dependencies.auth import verify_jwt
from dependencies.limiter import limiter
from dependencies.supabase import supabase_admin
from log_context import add_log_fields

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users")


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("3/hour")
async def delete_account(request: Request, user: dict = Security(verify_jwt)):
    """Permanently delete the authenticated user's account.

    Args:
        request: The incoming request (required by the rate limiter).
        user: Decoded JWT claims for the authenticated user.

    Raises:
        HTTPException: 404 if the user no longer exists, 500 on any other
            failure.
    """
    user_id = user["sub"]
    add_log_fields(user_id=user_id)
    try:
        await asyncio.to_thread(supabase_admin.auth.admin.delete_user, user_id)
        add_log_fields(action="account_deleted")
        logger.info("Account deleted: user %s", user_id)
    except Exception as e:
        if isinstance(e, AuthApiError) and "not found" in str(e).lower():
            add_log_fields(error="user_not_found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            ) from e
        add_log_fields(error=type(e).__name__)
        logger.exception("Failed to delete user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account",
        ) from e
