import pytest
from pydantic import ValidationError

from models.chat import ChatRequest, ChatResponse, HistoryMessage


def test_chat_request_valid():
    ChatRequest(message="hello")


def test_chat_request_empty_message():
    with pytest.raises(ValidationError):
        ChatRequest(message="")


def test_chat_request_message_too_long():
    with pytest.raises(ValidationError):
        ChatRequest(message="x" * 4001)


def test_chat_request_message_at_max():
    ChatRequest(message="x" * 4000)


def test_chat_response():
    resp = ChatResponse(reply="hello")
    assert resp.reply == "hello"


def test_history_message_valid_roles():
    HistoryMessage(role="user", content="hello")
    HistoryMessage(role="assistant", content="hi")


def test_history_message_invalid_role():
    with pytest.raises(ValidationError):
        HistoryMessage(role="system", content="hello")


def test_history_message_empty_content():
    HistoryMessage(role="user", content="")
