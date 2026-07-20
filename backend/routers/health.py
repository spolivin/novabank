import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request, Response, status

from config import settings
from dependencies.limiter import limiter
from dependencies.supabase import supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health")


@router.get("/api")
def health(response: Response):
    """Liveness probe for the API process.

    Args:
        response: The outgoing response, used to set cache headers.

    Returns:
        A static ``{"status": "ok"}`` payload.
    """
    response.headers["Cache-Control"] = "no-store"
    return {"status": "ok"}


@router.get("/db")
@limiter.limit("60/minute")
async def health_db(request: Request, response: Response):
    """Readiness probe that checks Supabase connectivity.

    Args:
        request: The incoming request (required by the rate limiter).
        response: The outgoing response, used to set cache headers.

    Returns:
        ``{"status": "ok"}`` when the database is reachable.

    Raises:
        HTTPException: 404 if a health-check token is configured and the request
            lacks the matching ``X-Health-Token`` header; 503 if the database
            query fails.
    """
    response.headers["Cache-Control"] = "no-store"
    if settings.health_check_token and (
        request.headers.get("X-Health-Token") != settings.health_check_token
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    try:
        await asyncio.to_thread(
            lambda: (
                supabase_admin.table("conversations").select("id").limit(1).execute()
            )
        )
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from e
