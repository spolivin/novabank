import json as _json
import logging
import time
import uuid
from contextlib import asynccontextmanager
from contextvars import ContextVar

from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import settings
from dependencies.anthropic_client import close_anthropic, create_anthropic
from dependencies.limiter import limiter
from dependencies.supabase import close_supabase, create_supabase
from log_context import add_log_fields, get_log_fields, reset_log_fields
from routers import ai, dashboard, health, transactions, user

_request_id: ContextVar[str] = ContextVar("request_id", default="-")


class _RequestIdFilter(logging.Filter):
    """Logging filter that stamps each record with the current request id."""

    def filter(self, record):
        record.request_id = _request_id.get()
        return True


# Standard LogRecord attributes — anything outside this set passed via
# `extra=` is treated as a structured field and emitted as its own JSON key.
_RESERVED = frozenset(logging.makeLogRecord({}).__dict__) | {
    "request_id",
    "message",
    "asctime",
}


class _JSONFormatter(logging.Formatter):
    """Formatter that renders each log record as a single JSON object.

    Any non-standard attribute passed via ``extra=`` is emitted as its own
    top-level key, so structured fields survive into the log line.
    """

    def format(self, record):
        payload = {
            "level": record.levelname,
            "logger": record.name,
            "request_id": getattr(record, "request_id", "-"),
            "msg": record.getMessage(),
        }
        for key, value in record.__dict__.items():
            if key not in _RESERVED:
                payload[key] = value
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

# Quiet noisy third-party loggers (per-request HTTP chatter from httpx and the
# transitive Supabase/Anthropic clients) while keeping their warnings/errors.
# Override with THIRD_PARTY_LOG_LEVEL=DEBUG to restore the full HTTP trail.
_NOISY_LOGGERS = ("httpx", "httpcore", "hpack", "anthropic", "urllib3", "postgrest")
_tp_level = getattr(logging, settings.third_party_log_level.upper(), logging.WARNING)
for _name in _NOISY_LOGGERS:
    logging.getLogger(_name).setLevel(_tp_level)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create the shared async clients on startup and close them on shutdown.

    Both clients own HTTP connection pools bound to the running event loop, so
    they are constructed here rather than at import time.

    Args:
        app: The application whose ``state`` holds the clients.
    """
    app.state.supabase = await create_supabase()
    app.state.anthropic = create_anthropic()
    logger.info("Async clients initialised")
    try:
        yield
    finally:
        await close_anthropic(app.state.anthropic)
        await close_supabase(app.state.supabase)
        app.state.anthropic = None
        app.state.supabase = None
        logger.info("Async clients closed")


app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)
app.state.limiter = limiter


def _rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Handle a rate-limit rejection, tagging the canonical log line.

    Args:
        request: The rejected request.
        exc: The raised rate-limit exception.

    Returns:
        The default SlowAPI 429 response.
    """
    add_log_fields(error="rate_limited")
    return _rate_limit_exceeded_handler(request, exc)


app.add_exception_handler(RateLimitExceeded, _rate_limit_handler)


_SECURITY_HEADERS = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'none'",
}

_MAX_BODY = 32 * 1024  # 32 KB


def _with_security_headers(response: Response) -> Response:
    """Add the standard security headers to a response in place.

    Args:
        response: The response to annotate.

    Returns:
        The same response, with security headers set.
    """
    response.headers.update(_SECURITY_HEADERS)
    return response


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    """Per-request middleware: request id, body cap, and access logging.

    Assigns a short request id, rejects oversized bodies, emits one canonical
    access-log line per request (severity following the status code), and
    applies security headers to every response.

    Args:
        request: The incoming request.
        call_next: Callable that runs the rest of the stack.

    Returns:
        The downstream response, or a 400/413 error response if the body cap
        is exceeded.
    """
    _request_id.set(str(uuid.uuid4())[:8])
    reset_log_fields()

    # Fast path: reject on a declared Content-Length before reading any body.
    # A malformed header is itself a bad request; never let int() raise.
    declared = request.headers.get("content-length")
    if declared is not None:
        try:
            if int(declared) > _MAX_BODY:
                return _with_security_headers(
                    Response(status_code=status.HTTP_413_CONTENT_TOO_LARGE)
                )
        except ValueError:
            return _with_security_headers(
                Response(status_code=status.HTTP_400_BAD_REQUEST)
            )

    # Backstop: a chunked request omits Content-Length, so the header check
    # above can't see it. Measure the actual body. Starlette caches it, so the
    # downstream handler still reads the same bytes.
    if len(await request.body()) > _MAX_BODY:
        return _with_security_headers(
            Response(status_code=status.HTTP_413_CONTENT_TOO_LARGE)
        )

    start = time.perf_counter()
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    if response.status_code < 400:
        level = logging.INFO
    elif response.status_code < 500:
        level = logging.WARNING
    else:
        level = logging.ERROR
    logger.log(
        level,
        "%s %s %d %.0fms",
        request.method,
        request.url.path,
        response.status_code,
        ms,
        extra={
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": round(ms, 1),
            **get_log_fields(),
        },
    )
    return _with_security_headers(response)


_origins = [o.strip() for o in settings.allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(ai.router)
app.include_router(user.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)
app.include_router(health.router)
