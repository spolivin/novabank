import pytest
from pydantic import ValidationError

from schemas.chat import ChatRequest, ChatResponse, HistoryMessage


def test_chat_request_valid():
    ChatRequest(message="hello")


def test_chat_request_empty_message():
    with pytest.raises(ValidationError):
        ChatRequest(message="")


def test_chat_request_message_too_long():
    with pytest.raises(ValidationError):
        ChatRequest(message="x" * 501)


def test_chat_request_message_at_max():
    ChatRequest(message="x" * 500)


def test_chat_response():
    resp = ChatResponse(reply="hello")
    assert resp.reply == "hello"


def test_history_message_valid_roles():
    HistoryMessage(role="user", content="hello", created_at="2026-06-06T10:00:00Z")
    HistoryMessage(role="assistant", content="hi", created_at="2026-06-06T10:00:01Z")


def test_history_message_invalid_role():
    with pytest.raises(ValidationError):
        HistoryMessage(
            role="system", content="hello", created_at="2026-06-06T10:00:00Z"
        )


def test_history_message_empty_content():
    HistoryMessage(role="user", content="", created_at="2026-06-06T10:00:00Z")
