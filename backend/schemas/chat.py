from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Body of a ``POST /ai/chat`` request.

    Attributes:
        message: The user's message; 1-500 characters.
    """

    message: Annotated[str, Field(min_length=1, max_length=500)]


class ChatResponse(BaseModel):
    """Body of a ``POST /ai/chat`` response.

    Attributes:
        reply: The assistant's generated reply.
    """

    reply: str


class HistoryMessage(BaseModel):
    """A single stored conversation turn returned by ``GET /ai/history``.

    Attributes:
        role: Who authored the turn, ``"user"`` or ``"assistant"``.
        content: The message text.
        created_at: When the turn was stored.
    """

    role: Literal["user", "assistant"]
    content: str
    created_at: datetime
