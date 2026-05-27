import logging

from fastapi import APIRouter, HTTPException, Request, Security, status

from dependencies.auth import verify_jwt
from dependencies.limiter import limiter
from models.chat import ChatRequest, ChatResponse, HistoryMessage
from services import ai as ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai")


@router.get("/history", response_model=list[HistoryMessage])
async def history(user: dict = Security(verify_jwt)):
    user_id = user["sub"]
    logger.info("History request from user %s", user_id)
    try:
        turns = await ai_service.get_history(user_id)
        return turns
    except Exception as e:
        logger.error("History fetch failed for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch history",
        )


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("2/minute")
async def chat(request: Request, body: ChatRequest, user: dict = Security(verify_jwt)):
    user_id = user["sub"]
    logger.info("Chat request from user %s", user_id)
    try:
        reply = await ai_service.get_reply(user_id, body.message)
        logger.info("Chat reply sent to user %s (%d chars)", user_id, len(reply))
        return ChatResponse(reply=reply)
    except Exception as e:
        logger.error("Chat failed for user %s: %s", user_id, e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get reply",
        )
