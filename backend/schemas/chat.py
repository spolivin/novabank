from typing import Annotated, Literal

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: Annotated[str, Field(min_length=1, max_length=4000)]


class ChatResponse(BaseModel):
    reply: str


class HistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
