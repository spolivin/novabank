from unittest.mock import MagicMock, patch

import pytest

from services.ai import get_reply


def _make_response(*texts):
    blocks = [MagicMock(type="text", text=t) for t in texts]
    response = MagicMock()
    response.content = blocks
    return response


async def test_get_reply_returns_first_text_block():
    mock_response = _make_response("Hello from Nova")
    with patch("services.ai._client") as mock_client:
        mock_client.messages.create = MagicMock(return_value=mock_response)
        result = await get_reply([{"role": "user", "content": "hi"}])
    assert result == "Hello from Nova"


async def test_get_reply_returns_empty_string_when_no_text_block():
    response = MagicMock()
    response.content = [MagicMock(type="tool_use")]
    with patch("services.ai._client") as mock_client:
        mock_client.messages.create = MagicMock(return_value=response)
        result = await get_reply([{"role": "user", "content": "hi"}])
    assert result == ""


async def test_get_reply_returns_first_of_multiple_text_blocks():
    mock_response = _make_response("first", "second")
    with patch("services.ai._client") as mock_client:
        mock_client.messages.create = MagicMock(return_value=mock_response)
        result = await get_reply([{"role": "user", "content": "hi"}])
    assert result == "first"


async def test_get_reply_reraises_on_api_error():
    with patch("services.ai._client") as mock_client:
        mock_client.messages.create = MagicMock(side_effect=RuntimeError("API down"))
        with pytest.raises(RuntimeError, match="API down"):
            await get_reply([{"role": "user", "content": "hi"}])
