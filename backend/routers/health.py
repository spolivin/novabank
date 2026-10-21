import hmac
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from supabase import AsyncClient

from config import settings
from db import execute_with_retry
from dependencies.limiter import limiter
from dependencies.supabase import get_supabase

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
async def health_db(
    request: Request,
    response: Response,
    supabase: AsyncClient = Depends(get_supabase),
):
    """Readiness probe that checks Supabase connectivity.

    Args:
        request: The incoming request (required by the rate limiter).
        response: The outgoing response, used to set cache headers.
        supabase: The shared async Supabase client.

    Returns:
        ``{"status": "ok"}`` when the database is reachable.

    Raises:
        HTTPException: 404 if a health-check token is configured and the request
            lacks the matching ``X-Health-Token`` header; 503 if the database
            query fails.
    """
    response.headers["Cache-Control"] = "no-store"
    # Compare as bytes: compare_digest raises TypeError on non-ASCII str, which
    # a client could send in the header to turn a 404 into a 500.
    if settings.health_check_token and not hmac.compare_digest(
        request.headers.get("X-Health-Token", "").encode(),
        settings.health_check_token.encode(),
    ):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    try:
        await execute_with_retry(
            lambda: supabase.table("conversations").select("id").limit(1)
        )
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database unavailable",
        ) from e
