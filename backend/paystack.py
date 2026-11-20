"""Paystack payment & bank verification client written with `urllib.request`.

Supports two modes automatically:
1. Live/Test Paystack API when `PAYSTACK_SECRET_KEY` is configured in env.
2. Local Developer Sandbox when `PAYSTACK_SECRET_KEY` is not set, so you can
   test bank verification, seller subaccounts, checkout, and payment webhook
   updates end-to-end without needing live keys yet.
"""

import json
from typing import Any
from urllib import error as url_error
from urllib import request as url_request

from .config import settings
from .errors import BadRequestError, ExternalServiceError


PAYSTACK_BASE_URL = "https://api.paystack.co"


def is_sandbox_mode() -> bool:
    return not bool(settings.paystack_secret_key)


def _paystack_request(
    path: str,
    *,
    method: str = "GET",
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    url = f"{PAYSTACK_BASE_URL}{path}"
    body_bytes = json.dumps(payload).encode("utf-8") if payload is not None else None

    req = url_request.Request(
        url,
        data=body_bytes,
        method=method,
        headers={
            "Authorization": f"Bearer {settings.paystack_secret_key}",
            "Content-Type": "application/json",
            "User-Agent": "ChopBellyFull-Python/1.0",
        },
    )

    try:
        with url_request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8")
            parsed = json.loads(raw) if raw else {}
    except url_error.HTTPError as exc:
        err_body = exc.read().decode("utf-8", errors="replace")
        try:
            parsed_err = json.loads(err_body)
            msg = parsed_err.get("message") or f"Paystack returned HTTP {exc.code}"
        except json.JSONDecodeError:
            msg = f"Paystack returned HTTP {exc.code}"
        if 400 <= exc.code < 500:
            raise BadRequestError(msg) from exc
        raise ExternalServiceError(msg) from exc
    except url_error.URLError as exc:
        raise ExternalServiceError(f"Could not reach Paystack API: {exc.reason}") from exc

    if not parsed.get("status"):
        raise BadRequestError(parsed.get("message") or "Paystack request failed.")

    return parsed


def resolve_bank_account(account_number: str, bank_code: str) -> str:
    """Verify a 10-digit NUBAN account number and return the account holder's name."""
    if is_sandbox_mode():
        # Deterministic test name so you can test the 2-step bank flow locally
        return f"CHOPBELLY VERIFIED SELLER ({account_number[-4:]})"

    data = _paystack_request(
        f"/bank/resolve?account_number={account_number}&bank_code={bank_code}"
    )
    account_name = (data.get("data") or {}).get("account_name")
    if not account_name:
        raise BadRequestError("Could not resolve account holder name.")
    return str(account_name)


def create_subaccount(
    *,
    business_name: str,
    bank_code: str,
    account_number: str,
    commission_percent: float,
) -> str:
    if is_sandbox_mode():
        return f"SUB_sandbox_{bank_code}_{account_number[-4:]}"

    data = _paystack_request(
        "/subaccount",
        method="POST",
        payload={
            "business_name": business_name,
            "settlement_bank": bank_code,
            "account_number": account_number,
            "percentage_charge": commission_percent,
        },
    )
    code = (data.get("data") or {}).get("subaccount_code")
    if not code:
        raise ExternalServiceError("Paystack did not return a subaccount code.")
    return str(code)


def update_subaccount(
    *,
    subaccount_code: str,
    business_name: str,
    bank_code: str,
    account_number: str,
) -> None:
    if is_sandbox_mode():
        return

    _paystack_request(
        f"/subaccount/{subaccount_code}",
        method="PUT",
        payload={
            "business_name": business_name,
            "settlement_bank": bank_code,
            "account_number": account_number,
        },
    )


def initialize_transaction(
    *,
    email: str,
    amount_kobo: int,
    reference: str,
    callback_url: str,
    order_id: str,
    subaccount_code: str | None = None,
    commission_kobo: int = 0,
) -> str:
    """Initialize Paystack checkout and return the hosted `authorization_url`."""
    if is_sandbox_mode():
        return f"/api/payments/sandbox-checkout?reference={reference}&order={order_id}"

    payload: dict[str, Any] = {
        "email": email,
        "amount": amount_kobo,
        "currency": "NGN",
        "reference": reference,
        "callback_url": callback_url,
        "metadata": {
            "order_id": order_id,
            "commission_kobo": commission_kobo,
        },
    }
    if subaccount_code and not subaccount_code.startswith("SUB_seed_") and not subaccount_code.startswith("SUB_sandbox_"):
        payload["subaccount"] = subaccount_code
        payload["transaction_charge"] = commission_kobo

    data = _paystack_request("/transaction/initialize", method="POST", payload=payload)
    auth_url = (data.get("data") or {}).get("authorization_url")
    if not auth_url:
        raise ExternalServiceError("Paystack did not return an authorization URL.")
    return str(auth_url)
