"""Commission calculation and marketplace split math.

All money math runs in integer kobo (1 NGN = 100 kobo) backed by `Decimal`
rounding so floating-point precision bugs (like 0.1 + 0.2 != 0.3) never leak
into seller payouts or platform ledger balances.
"""

from dataclasses import asdict, dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Any

from .errors import BadRequestError


@dataclass(frozen=True)
class SplitBreakdown:
    """Immutable result of splitting a marketplace payment."""

    total_amount_kobo: int
    app_percentage: float
    app_commission_kobo: int
    transfer_fee_kobo: int
    seller_payout_kobo: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def calculate_split(
    total_amount: int,
    app_percentage: float | int | Decimal,
    transfer_fee: int = 0,
) -> SplitBreakdown:
    """Calculate platform commission and net seller payout using exact kobo math.

    Args:
        total_amount: Gross payment collected from buyer, in kobo (must be > 0).
        app_percentage: Platform commission percentage, e.g. 10 for 10% (0 <= pct < 100).
        transfer_fee: Bank transfer/disbursement fee deducted in kobo (>= 0).

    Returns:
        SplitBreakdown containing kobo integers for commission and seller payout.

    Raises:
        BadRequestError: If inputs are invalid or `seller_payout_kobo <= 0`.
    """
    if isinstance(total_amount, bool) or not isinstance(total_amount, int):
        raise BadRequestError("total_amount must be an integer amount in kobo.")
    if isinstance(transfer_fee, bool) or not isinstance(transfer_fee, int):
        raise BadRequestError("transfer_fee must be an integer amount in kobo.")
    if total_amount <= 0:
        raise BadRequestError("total_amount must be greater than zero kobo.")
    if transfer_fee < 0:
        raise BadRequestError("transfer_fee cannot be negative.")

    try:
        pct_decimal = Decimal(str(app_percentage))
    except (InvalidOperation, ValueError) as exc:
        raise BadRequestError("app_percentage must be a valid number.") from exc

    if pct_decimal < Decimal("0") or pct_decimal >= Decimal("100"):
        raise BadRequestError("app_percentage must be between 0 and 100.")

    # Compute app commission in kobo using standard financial half-up rounding.
    raw_commission = (Decimal(total_amount) * pct_decimal) / Decimal("100")
    app_commission_kobo = int(raw_commission.quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    seller_payout_kobo = total_amount - app_commission_kobo - transfer_fee
    if seller_payout_kobo <= 0:
        raise BadRequestError(
            "Seller payout must be greater than zero after commission and transfer fee."
        )

    return SplitBreakdown(
        total_amount_kobo=total_amount,
        app_percentage=float(pct_decimal),
        app_commission_kobo=app_commission_kobo,
        transfer_fee_kobo=transfer_fee,
        seller_payout_kobo=seller_payout_kobo,
    )


# CamelCase alias matching standard fintech spec naming (`calculateSplit`)
calculateSplit = calculate_split
