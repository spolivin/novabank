"""Tools Nova can call to read the signed-in user's data.

Every tool runs with the ``user_id`` from the caller's JWT; the model never
supplies one, so it can only ever read the requesting user's own rows.
"""

import datetime
import json
from typing import Annotated, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, ValidationError, model_validator
from supabase import AsyncClient

from services import transactions as transactions_service
from services.transactions import SEARCH_LIMIT

SEARCH_TRANSACTIONS_TOOL: dict = {
    "name": "search_transactions",
    "description": (
        "Search the signed-in customer's own NovaBank transactions, newest first. "
        "Use it for any question about their spending, payments, deposits or "
        "transfers; never guess figures. All filters are optional and combine with "
        "AND. Amounts are in dollars and signed: negative is money out (debit), "
        "positive is money in (credit). Moves into savings are debits with category "
        "'Savings'. The result has `transactions`, `count`, `total` (the signed sum "
        "of the returned rows only) and `truncated`: when true, more rows matched "
        "than were returned, so narrow the filters or say the total is partial."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "start_date": {
                "type": "string",
                "format": "date",
                "description": "Earliest posting date to include, YYYY-MM-DD.",
            },
            "end_date": {
                "type": "string",
                "format": "date",
                "description": "Latest posting date to include, YYYY-MM-DD.",
            },
            "category": {
                "type": "string",
                "description": (
                    "Exact category, case-insensitive, e.g. Groceries, Dining, "
                    "Income, Savings."
                ),
            },
            "text": {
                "type": "string",
                "description": "Case-insensitive substring of the description.",
            },
            "direction": {
                "type": "string",
                "enum": ["debit", "credit"],
                "description": "debit = money out, credit = money in.",
            },
            "min_amount": {
                "type": "number",
                "minimum": 0,
                "description": "Smallest amount (magnitude); requires direction.",
            },
            "max_amount": {
                "type": "number",
                "minimum": 0,
                "description": "Largest amount (magnitude); requires direction.",
            },
            "limit": {
                "type": "integer",
                "minimum": 1,
                "maximum": SEARCH_LIMIT,
                "description": f"Maximum rows to return (default {SEARCH_LIMIT}).",
            },
        },
        "additionalProperties": False,
    },
}

TOOLS: list[dict] = [SEARCH_TRANSACTIONS_TOOL]


class ToolInputError(Exception):
    """The model called an unknown tool or passed invalid input."""


class TransactionSearchInput(BaseModel):
    """Validated input for ``search_transactions``.

    Attributes:
        start_date: Earliest posting date to include.
        end_date: Latest posting date to include.
        category: Category to match, case-insensitively.
        text: Substring to match in the description.
        direction: ``debit`` for money out, ``credit`` for money in.
        min_amount: Smallest magnitude to include; requires ``direction``.
        max_amount: Largest magnitude to include; requires ``direction``.
        limit: Maximum number of transactions to return.
    """

    model_config = ConfigDict(extra="forbid")

    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    category: Annotated[str, Field(min_length=1, max_length=50)] | None = None
    text: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    direction: Literal["debit", "credit"] | None = None
    min_amount: Annotated[float, Field(ge=0)] | None = None
    max_amount: Annotated[float, Field(ge=0)] | None = None
    limit: Annotated[int, Field(ge=1, le=SEARCH_LIMIT)] = SEARCH_LIMIT

    @model_validator(mode="after")
    def _check_ranges(self) -> Self:
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValueError("start_date must not be after end_date")
        has_bounds = self.min_amount is not None or self.max_amount is not None
        if has_bounds and self.direction is None:
            raise ValueError("min_amount/max_amount require direction")
        if (
            self.min_amount is not None
            and self.max_amount is not None
            and self.min_amount > self.max_amount
        ):
            raise ValueError("min_amount must not exceed max_amount")
        return self


async def run_tool(
    supabase: AsyncClient, user_id: str, name: str, tool_input: dict
) -> str:
    """Run one tool call for the given user.

    Args:
        supabase: The shared async Supabase client.
        user_id: The authenticated user; never taken from ``tool_input``.
        name: The tool the model called.
        tool_input: The model's arguments.

    Returns:
        The tool result as compact JSON.

    Raises:
        ToolInputError: If the tool is unknown or the input is invalid.
    """
    if name != SEARCH_TRANSACTIONS_TOOL["name"]:
        raise ToolInputError(f"Unknown tool: {name}")
    try:
        params = TransactionSearchInput.model_validate(tool_input)
    except ValidationError as e:
        raise ToolInputError(_describe(e)) from e

    result = await transactions_service.search_transactions(
        supabase, user_id, **params.model_dump()
    )
    # The model has no use for row ids; leave them out to save tokens.
    result["transactions"] = [
        {
            "date": row["date"],
            "description": row["description"],
            "category": row["category"],
            "amount": float(row["amount"]),
        }
        for row in result["transactions"]
    ]
    return json.dumps(result, separators=(",", ":"))


def _describe(error: ValidationError) -> str:
    """Summarise a validation error in a line the model can act on."""
    return "; ".join(
        f"{'.'.join(map(str, err['loc'])) or 'input'}: {err['msg']}"
        for err in error.errors()
    )
