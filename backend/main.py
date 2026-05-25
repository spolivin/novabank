from dotenv import load_dotenv

load_dotenv()

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from dependencies.limiter import limiter
from routers import ai, user

logging.basicConfig(
    level=getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    datefmt="%d-%m-%Y %H:%M:%S",
)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

_origins = [
    o.strip()
    for o in os.environ.get("ALLOWED_ORIGINS", "http://127.0.0.1:5173").split(",")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(ai.router)
app.include_router(user.router)


@app.get("/health")
def health():
    return {"status": "ok"}
