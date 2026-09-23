from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class DashboardSummary(BaseModel):
    """Figures for the dashboard summary cards, returned by ``GET /dashboard/summary``.

    Attributes:
        balance: Opening balance plus the sum of all transactions.
        monthly_spending: Debits this calendar month, excluding savings transfers.
        savings_goal: The user's target; ``0`` when no goal is set.
        savings_saved: Net amount moved into savings.
    """

    balance: float
    monthly_spending: float
    savings_goal: float
    savings_saved: float


class SavingsGoalUpdate(BaseModel):
    """Body of a ``PUT /dashboard/savings-goal`` request.

    Attributes:
        savings_goal: The new target, in dollars; above 0 and at most 10,000,000.
    """

    savings_goal: Annotated[float, Field(gt=0, le=10_000_000)]


TransferDirection = Literal["to_savings", "from_savings"]


class SavingsTransfer(BaseModel):
    """Body of a ``POST /dashboard/savings-transfer`` request.

    Attributes:
        direction: ``to_savings`` moves money out of the account into savings;
            ``from_savings`` moves it back.
        amount: Dollars to move; above 0, at most 1,000,000, whole cents only.
    """

    direction: TransferDirection
    amount: Annotated[Decimal, Field(gt=0, le=1_000_000, decimal_places=2)]
