"""Unit tests for the ChopBellyFull Python backend (`python3 -m unittest discover backend`)."""

import json
import os
from pathlib import Path
import tempfile
import unittest


# Point config at a temporary directory BEFORE importing backend modules
_TMP_DIR = tempfile.TemporaryDirectory()
os.environ["CHOPBELLY_DB_PATH"] = str(Path(_TMP_DIR.name) / "test.db")
os.environ["CHOPBELLY_UPLOADS_DIR"] = str(Path(_TMP_DIR.name) / "uploads")

from backend.db import init_db  # noqa: E402
from backend import routes  # noqa: E402
from backend.errors import BadRequestError, ForbiddenError, extract_crash_location  # noqa: E402
from backend.security import hash_password, verify_password  # noqa: E402


class BackendTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        init_db()

    def test_password_hash_and_verify(self) -> None:
        pw_hash = hash_password("secret1234")
        self.assertTrue(verify_password("secret1234", pw_hash))
        self.assertFalse(verify_password("wrongpass", pw_hash))

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

        # 5. Buyer initializes checkout -> sandbox payment -> completes payment
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

        redirect_url = routes.handle_sandbox_complete(
            f"reference={checkout['reference']}&order_id={checkout['order_id']}".encode("utf-8")
        )
        self.assertIn(checkout["order_id"], redirect_url)

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

    def test_error_location_helper(self) -> None:
        try:
            json.loads("{bad json")
        except Exception as exc:
            where = extract_crash_location(exc)
            self.assertIn("backend/test_backend.py", where)


if __name__ == "__main__":
    unittest.main()
