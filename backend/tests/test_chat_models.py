import pytest
from pydantic import ValidationError

from models.chat import ChatMessage, ChatRequest, ChatResponse


def test_chat_message_valid_roles():
    ChatMessage(role="user", content="hello")
    ChatMessage(role="assistant", content="hi")


def test_chat_message_invalid_role():
    with pytest.raises(ValidationError):
        ChatMessage(role="system", content="hello")


def test_chat_message_empty_content():
    with pytest.raises(ValidationError):
        ChatMessage(role="user", content="")


def test_chat_message_content_too_long():
    with pytest.raises(ValidationError):
        ChatMessage(role="user", content="x" * 4001)


def test_chat_message_content_at_max():
    ChatMessage(role="user", content="x" * 4000)


def test_chat_request_empty_messages():
    with pytest.raises(ValidationError):
        ChatRequest(messages=[])


def test_chat_request_too_many_messages():
    msgs = [{"role": "user", "content": "hi"}] * 51
    with pytest.raises(ValidationError):
        ChatRequest(messages=msgs)


def test_chat_request_at_max_messages():
    msgs = [{"role": "user", "content": "hi"}] * 50
    req = ChatRequest(messages=msgs)
    assert len(req.messages) == 50


def test_chat_response():
    resp = ChatResponse(reply="hello")
    assert resp.reply == "hello"
