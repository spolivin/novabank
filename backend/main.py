import json as _json
import logging
import time
import uuid
from contextvars import ContextVar

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import settings
from dependencies.limiter import limiter
from routers import ai, health, user

_request_id: ContextVar[str] = ContextVar("request_id", default="-")


class _RequestIdFilter(logging.Filter):
    def filter(self, record):
        record.request_id = _request_id.get()
        return True


class _JSONFormatter(logging.Formatter):
    def format(self, record):
        payload = {
            "ts": self.formatTime(record, "%Y-%m-%dT%H:%M:%SZ"),
            "level": record.levelname,
            "logger": record.name,
            "request_id": getattr(record, "request_id", "-"),
            "msg": record.getMessage(),
        }
        if record.exc_info:
            payload["exc"] = self.formatException(record.exc_info)
        return _json.dumps(payload)


_log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

if settings.log_format == "json":
    _formatter: logging.Formatter = _JSONFormatter()
else:
    _formatter = logging.Formatter(
        fmt="%(asctime)s %(levelname)-8s [%(request_id)s] %(name)s: %(message)s",
        datefmt="%d-%m-%Y %H:%M:%S",
    )

_handler = logging.StreamHandler()
_handler.setFormatter(_formatter)
_handler.addFilter(_RequestIdFilter())

logging.basicConfig(level=_log_level, handlers=[_handler], force=True)

logger = logging.getLogger(__name__)

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'none'",
}

_MAX_BODY = 32 * 1024  # 32 KB


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    if (
        request.headers.get("content-length")
        and int(request.headers["content-length"]) > _MAX_BODY
    ):
        return Response(status_code=status.HTTP_413_CONTENT_TOO_LARGE)
    _request_id.set(str(uuid.uuid4())[:8])
    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %d %.0fms", request.method, request.url.path, response.status_code, ms
    )
    response.headers.update(_SECURITY_HEADERS)
    return response


_origins = [o.strip() for o in settings.allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(ai.router)
app.include_router(user.router)
app.include_router(health.router)
