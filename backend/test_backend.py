"""Unit tests for the ChopBellyFull Python backend (`python3 -m unittest discover backend`)."""

import hashlib
import hmac
import json
import os
from pathlib import Path
import tempfile
import unittest
from unittest import mock


# Point config at a temporary directory BEFORE importing backend modules
# Keep PAYSTACK_SECRET_KEY blank so tests run in offline sandbox mode
_TMP_DIR = tempfile.TemporaryDirectory()
os.environ["CHOPBELLY_DB_PATH"] = str(Path(_TMP_DIR.name) / "test.db")
os.environ["CHOPBELLY_UPLOADS_DIR"] = str(Path(_TMP_DIR.name) / "uploads")
os.environ["PAYSTACK_SECRET_KEY"] = ""
os.environ["PAYSTACK_WEBHOOK_SECRET"] = "whsec_chopbelly_test_secret"
os.environ["COMMISSION_PERCENT"] = "10"
os.environ["PAYSTACK_TRANSFER_FEE_KOBO"] = "5000"

from backend.commission import calculateSplit, calculate_split  # noqa: E402
from backend.db import get_db, init_db  # noqa: E402
from backend import routes  # noqa: E402
from backend.errors import (  # noqa: E402
    BadRequestError,
    ExternalServiceError,
    ForbiddenError,
    extract_crash_location,
)
from backend.security import hash_password, verify_password  # noqa: E402


def _sign_webhook(payload: dict, secret: str = "whsec_chopbelly_test_secret") -> tuple[bytes, dict[str, str]]:
    raw = json.dumps(payload).encode("utf-8")
    sig = hmac.new(secret.encode("utf-8"), raw, hashlib.sha512).hexdigest()
    return raw, {"X-Paystack-Signature": sig}


class BackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        init_db()

    def test_password_hash_and_verify(self) -> None:
        pw_hash = hash_password("secret1234")
        self.assertTrue(verify_password("secret1234", pw_hash))
        self.assertFalse(verify_password("wrongpass", pw_hash))

    def test_calculate_split_kobo_precision_and_validation(self) -> None:
        # ₦3,500 = 350,000 kobo -> 10% commission = 35,000 kobo, fee = 5,000 kobo, seller = 310,000 kobo
        split = calculateSplit(350_000, 10, 5_000)
        self.assertEqual(split.app_commission_kobo, 35_000)
        self.assertEqual(split.transfer_fee_kobo, 5_000)
        self.assertEqual(split.seller_payout_kobo, 310_000)
        self.assertIsInstance(split.seller_payout_kobo, int)

        # Odd kobo precision uses half-up Decimal rounding cleanly
        odd = calculate_split(33_335, 10, 5_000)
        self.assertEqual(odd.app_commission_kobo, 3_334)
        self.assertEqual(odd.seller_payout_kobo, 25_001)

        # Reject if seller payout would be <= 0 after commission and transfer fee
        with self.assertRaises(BadRequestError):
            calculate_split(5_000, 10, 5_000)

    def test_signup_kitchen_dish_and_order_flow(self) -> None:
        # 1. Seller signs up with a kitchen
        status, seller_res = routes.handle_signup(
            {
                "email": "seller@test.ng",
                "password": "password123",
                "full_name": "Chef Ada",
                "phone": "08030001111",
                "buyer_area": "Eti-Osa, Lagos",
                "kitchen": {
                    "business_name": "Ada Test Kitchen",
                    "area": "Eti-Osa, Lagos",
                    "address": "10 Admiralty Way",
                    "category": "jollof",
                },
            }
        )
        self.assertEqual(status, 201)
        seller_headers = {"Authorization": f"Bearer {seller_res['token']}"}

        # Seller registers bank payout details
        status, bank_res = routes.handle_save_bank(
            seller_headers,
            {
                "business_name": "Ada Test Kitchen",
                "bank_code": "058",
                "account_number": "0123456789",
            },
        )
        self.assertEqual(status, 200)
        self.assertTrue(bank_res["transfer_recipient_code"].startswith("RCP_sandbox_"))

        # 2. Seller publishes a dish
        status, dish_res = routes.handle_publish_dish(
            seller_headers,
            {
                "name": "Special Party Jollof",
                "description": "Smoky firewood jollof rice with chicken and dodo.",
                "price_naira": 4500,
                "category": "Combos",
                "photo": "/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg",
                "set_as_cover": True,
                "is_first_dish": True,
            },
        )
        self.assertEqual(status, 201)
        food_id = dish_res["dish"]["id"]

        # 3. Buyer signs up
        status, buyer_res = routes.handle_signup(
            {
                "email": "buyer@test.ng",
                "password": "password123",
                "full_name": "Tunde Buyer",
                "phone": "08050002222",
                "buyer_area": "Eti-Osa, Lagos",
                "buyer_landmark": "Plot 5 Chevron Drive",
            }
        )
        self.assertEqual(status, 201)
        buyer_headers = {"Authorization": f"Bearer {buyer_res['token']}"}

        # 4. Seller cannot order own dish
        with self.assertRaises(BadRequestError):
            routes.handle_initialize_payment(
                seller_headers,
                {
                    "items": [{"food_id": food_id, "quantity": 1}],
                    "buyer_name": "Chef Ada",
                    "buyer_phone": "08030001111",
                    "delivery_address": "10 Admiralty Way",
                },
            )

        # 5. Buyer initializes checkout -> sandbox payment -> completes payment + ledger payout
        status, checkout = routes.handle_initialize_payment(
            buyer_headers,
            {
                "items": [{"food_id": food_id, "quantity": 2}],
                "buyer_name": "Tunde Buyer",
                "buyer_phone": "08050002222",
                "delivery_address": "Plot 5 Chevron Drive, Lekki",
            },
        )
        self.assertEqual(status, 201)
        self.assertEqual(checkout["total_kobo"], 900000)
        self.assertEqual(checkout["commission_kobo"], 90000)
        self.assertEqual(checkout["seller_payout_kobo"], 805000)

        redirect_url = routes.handle_sandbox_complete(
            f"reference={checkout['reference']}&order_id={checkout['order_id']}".encode("utf-8")
        )
        self.assertIn(checkout["order_id"], redirect_url)

        # Seller ledger shows settled payout row
        status, ledger_res = routes.handle_seller_ledger(seller_headers)
        self.assertEqual(status, 200)
        self.assertEqual(len(ledger_res["ledger"]), 1)
        self.assertEqual(ledger_res["ledger"][0]["payout_status"], "success")
        self.assertEqual(ledger_res["ledger"][0]["app_commission_kobo"], 90000)
        self.assertEqual(ledger_res["ledger"][0]["seller_payout_kobo"], 805000)

        # 6. Buyer sees order as `paid`, cannot advance to `preparing`, seller can
        _, buyer_orders = routes.handle_list_orders(buyer_headers)
        self.assertEqual(buyer_orders["orders"][0]["status"], "paid")

        with self.assertRaises(ForbiddenError):
            routes.handle_update_order_status(
                buyer_headers,
                checkout["order_id"],
                {"status": "preparing"},
            )

        status, updated = routes.handle_update_order_status(
            seller_headers,
            checkout["order_id"],
            {"status": "accepted"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(updated["status"], "accepted")

    def test_webhook_signature_idempotency_and_transfer_failure(self) -> None:
        # Sign up seller + bank + dish and buyer
        _, seller_res = routes.handle_signup(
            {
                "email": "whseller@test.ng",
                "password": "password123",
                "full_name": "Chef Bola",
                "phone": "08030003333",
                "buyer_area": "Ikeja, Lagos",
                "kitchen": {
                    "business_name": "Bola Webhook Kitchen",
                    "area": "Ikeja, Lagos",
                    "address": "22 Allen Avenue",
                    "category": "suya",
                },
            }
        )
        seller_headers = {"Authorization": f"Bearer {seller_res['token']}"}
        routes.handle_save_bank(
            seller_headers,
            {
                "business_name": "Bola Webhook Kitchen",
                "bank_code": "058",
                "account_number": "1234567890",
            },
        )
        _, dish_res = routes.handle_publish_dish(
            seller_headers,
            {
                "name": "Charcoal Suya Platter",
                "description": "Hot spiced beef suya with onions and cabbage.",
                "price_naira": 5000,
                "category": "Proteins",
                "photo": "/assets/aistudio/pexels-ndagi-idris-2159907004-36458103_fd393f46.jpg",
            },
        )
        food_id = dish_res["dish"]["id"]

        _, buyer_res = routes.handle_signup(
            {
                "email": "whbuyer@test.ng",
                "password": "password123",
                "full_name": "Kemi Buyer",
                "phone": "08050004444",
                "buyer_area": "Ikeja, Lagos",
            }
        )
        buyer_headers = {"Authorization": f"Bearer {buyer_res['token']}"}

        # Order 1: signed webhook -> single payout even on duplicate webhook replay
        _, checkout1 = routes.handle_initialize_payment(
            buyer_headers,
            {
                "items": [{"food_id": food_id, "quantity": 1}],
                "buyer_name": "Kemi Buyer",
                "buyer_phone": "08050004444",
                "delivery_address": "15 Oba Akran, Ikeja",
            },
        )
        payload1 = {
            "event": "charge.success",
            "data": {
                "reference": checkout1["reference"],
                "amount": 500000,
                "currency": "NGN",
            },
        }
        raw1, sig_headers1 = _sign_webhook(payload1)

        # Reject invalid signature
        bad_code, _ = routes.handle_paystack_webhook(
            {"X-Paystack-Signature": "deadbeef"}, raw1
        )
        self.assertEqual(bad_code, 401)

        # First valid webhook triggers settlement & disbursement
        with mock.patch(
            "backend.paystack.initiate_transfer",
            wraps=routes.paystack.initiate_transfer,
        ) as transfer_spy:
            ok_code, ok_body = routes.handle_paystack_webhook(sig_headers1, raw1)
            self.assertEqual(ok_code, 200)
            self.assertEqual(ok_body, "settled")
            self.assertEqual(transfer_spy.call_count, 1)

            # Duplicate webhook replay must NOT call initiate_transfer again
            dup_code, dup_body = routes.handle_paystack_webhook(sig_headers1, raw1)
            self.assertEqual(dup_code, 200)
            self.assertEqual(dup_body, "duplicate")
            self.assertEqual(transfer_spy.call_count, 1)

        # Order 2: insufficient gateway balance fails transfer gracefully while recording failed ledger row
        _, checkout2 = routes.handle_initialize_payment(
            buyer_headers,
            {
                "items": [{"food_id": food_id, "quantity": 1}],
                "buyer_name": "Kemi Buyer",
                "buyer_phone": "08050004444",
                "delivery_address": "15 Oba Akran, Ikeja",
            },
        )
        payload2 = {
            "event": "charge.success",
            "data": {
                "reference": checkout2["reference"],
                "amount": 500000,
                "currency": "NGN",
            },
        }
        raw2, sig_headers2 = _sign_webhook(payload2)

        with mock.patch(
            "backend.paystack.initiate_transfer",
            side_effect=ExternalServiceError("Your balance is not enough to fulfil this request"),
        ):
            fail_code, fail_body = routes.handle_paystack_webhook(sig_headers2, raw2)
            self.assertEqual(fail_code, 200)
            self.assertEqual(fail_body, "settled")

        with get_db() as conn:
            row = conn.execute(
                "SELECT payout_status, failure_reason FROM payout_ledger WHERE transaction_reference = ?",
                (checkout2["reference"],),
            ).fetchone()
        self.assertEqual(row["payout_status"], "failed")
        self.assertIn("balance is not enough", row["failure_reason"])

    def test_error_location_helper(self) -> None:
        try:
            json.loads("{bad json")
        except Exception as exc:
            where = extract_crash_location(exc)
            self.assertIn("backend/test_backend.py", where)


if __name__ == "__main__":
    unittest.main()
