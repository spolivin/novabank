import asyncio
import logging

from fastapi import APIRouter, HTTPException, status

from dependencies.supabase import supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/health")


@router.get("/api")
def health():
    return {"status": "ok"}


@router.get("/db")
async def health_db():
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
