import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request, Security, status
from supabase_auth.errors import AuthApiError

from dependencies.auth import verify_jwt
from dependencies.limiter import limiter
from dependencies.supabase import supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/users")


@router.delete("/me")
@limiter.limit("3/hour")
async def delete_account(request: Request, user: dict = Security(verify_jwt)):
    user_id = user["sub"]
    try:
        await asyncio.to_thread(supabase_admin.auth.admin.delete_user, user_id)
        logger.info("Account deleted: user %s", user_id)
        return {"message": "Account deleted successfully"}
    except Exception as e:
        if isinstance(e, AuthApiError) and "not found" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        logger.exception("Failed to delete user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete account",
        )
