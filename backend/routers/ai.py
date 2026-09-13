import logging

from anthropic import AsyncAnthropic
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

from dependencies.anthropic_client import get_anthropic
from dependencies.auth import verify_jwt
from dependencies.limiter import limiter
from dependencies.supabase import get_supabase
from log_context import add_log_fields
from schemas.chat import ChatRequest, ChatResponse, HistoryMessage
from services import ai as ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai")


@router.get("/history", response_model=list[HistoryMessage])
@limiter.limit("10/minute")
async def history(
    request: Request,
    response: Response,
    limit: int = Query(
        default=ai_service.UI_HISTORY_LIMIT, ge=1, le=ai_service.UI_HISTORY_LIMIT
    ),
    user: dict = Security(verify_jwt),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Return the authenticated user's stored conversation history.

    Args:
        request: The incoming request (required by the rate limiter).
        response: The outgoing response, used to set cache headers.
        limit: Maximum number of most-recent turns to return (1-200).
        user: Decoded JWT claims for the authenticated user.
        supabase: The shared async Supabase client.

    Returns:
        The user's conversation turns, oldest first.

    Raises:
        HTTPException: 500 if the history cannot be fetched.
    """
    response.headers["Cache-Control"] = "no-store"
    user_id = user["sub"]
    add_log_fields(user_id=user_id)
    try:
        turns = await ai_service.get_history(supabase, user_id, limit=limit)
        add_log_fields(turns=len(turns))
        return turns
    except Exception as e:
        add_log_fields(error=type(e).__name__)
        logger.exception("History fetch failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch history",
        ) from e


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
async def clear_history(
    request: Request,
    user: dict = Security(verify_jwt),
    supabase: AsyncClient = Depends(get_supabase),
):
    """Delete all of the authenticated user's conversation history.

    Args:
        request: The incoming request (required by the rate limiter).
        user: Decoded JWT claims for the authenticated user.
        supabase: The shared async Supabase client.

    Raises:
        HTTPException: 500 if the history cannot be cleared.
    """
    user_id = user["sub"]
    add_log_fields(user_id=user_id)
    try:
        deleted = await ai_service.clear_history(supabase, user_id)
        add_log_fields(deleted=deleted)
    except Exception as e:
        add_log_fields(error=type(e).__name__)
        logger.exception("History clear failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to clear history",
        ) from e


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("8/minute")
@limiter.limit("60/day")
async def chat(
    request: Request,
    body: ChatRequest,
    user: dict = Security(verify_jwt),
    supabase: AsyncClient = Depends(get_supabase),
    claude: AsyncAnthropic = Depends(get_anthropic),
):
    """Generate an assistant reply for the user's message.

    The user message and the generated reply are both persisted as conversation
    turns.

    Args:
        request: The incoming request (required by the rate limiter).
        body: The chat request payload.
        user: Decoded JWT claims for the authenticated user.
        supabase: The shared async Supabase client.
        claude: The shared async Anthropic client.

    Returns:
        The assistant's reply.

    Raises:
        HTTPException: 500 if generating the reply fails.
    """
    user_id = user["sub"]
    add_log_fields(user_id=user_id)
    try:
        reply = await ai_service.get_reply(supabase, claude, user_id, body.message)
        add_log_fields(reply_chars=len(reply))
        return ChatResponse(reply=reply)
    except Exception as e:
        add_log_fields(error=type(e).__name__)
        logger.exception("Chat failed for user %s", user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get reply",
        ) from e
