import datetime
from uuid import UUID

from pydantic import BaseModel


class Transaction(BaseModel):
    """A single transaction returned by ``GET /transactions``.

    Attributes:
        id: The transaction's unique identifier.
        date: The date the transaction was posted.
        description: Merchant or payment description.
        category: Spending category label.
        amount: Signed amount; negative values are debits.
    """

    id: UUID
    date: datetime.date
    description: str
    category: str
    amount: float
