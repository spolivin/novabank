import asyncio
import logging

from fastapi import APIRouter, HTTPException, Request, status

from dependencies.limiter import limiter
from dependencies.supabase import supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health")


@router.get("/api")
def health():
    return {"status": "ok"}


@router.get("/db")
@limiter.limit("60/minute")
async def health_db(request: Request):
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
