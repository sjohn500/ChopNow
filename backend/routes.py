"""HTTP route handlers for ChopBellyFull Python backend.

Every endpoint follows the same clean pattern:
1. Read & validate input (raising `BadRequestError` if invalid)
2. Check authentication & permissions (`require_auth_user`)
3. Run database queries/updates inside `with get_db() as conn:`
4. Return a plain Python `dict` serialized as JSON (status code + body)
"""

from datetime import datetime, timedelta, timezone
from html import escape
import json
import re
import sys
from typing import Any
from urllib.parse import parse_qs
import uuid

from .commission import calculate_split
from . import config
from .config import settings
from .db import get_db, utc_now_iso
from .errors import (
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
    get_recent_errors,
)
from . import paystack
from .security import (
    generate_session_token,
    hash_password,
    hash_session_token,
    verify_password,
    verify_paystack_signature,
)
from .storage import save_photo_input


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
BANK_CODE_RE = re.compile(r"^\d{3,6}$")
ACCOUNT_NUMBER_RE = re.compile(r"^\d{10}$")
VALID_ORDER_STATUSES = {
    "pending_payment",
    "paid",
    "accepted",
    "preparing",
    "delivered",
    "completed",
    "cancelled",
    "refunded",
}


def _require_auth_user(headers: dict[str, str]) -> dict[str, Any]:
    """Extract Bearer token from Authorization header and look up active session user."""
    auth_header = ""
    for key, value in headers.items():
        if key.lower() == "authorization":
            auth_header = value
            break

    if not auth_header.startswith("Bearer "):
        raise UnauthorizedError("Please sign in first.")

    raw_token = auth_header[7:].strip()
    if not raw_token:
        raise UnauthorizedError("Please sign in first.")

    token_hash = hash_session_token(raw_token)
    now = utc_now_iso()

    with get_db() as conn:
        row = conn.execute(
            """
            SELECT u.*, s.expires_at
            FROM sessions s
            JOIN users u ON u.id = s.user_id
            WHERE s.token_hash = ?
            """,
            (token_hash,),
        ).fetchone()

        if not row:
            raise UnauthorizedError("Your session has expired. Please sign in again.")

        if row["expires_at"] <= now:
            conn.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))
            raise UnauthorizedError("Your session has expired. Please sign in again.")

        return dict(row)


def _create_session_for_user(conn, user_id: str) -> str:
    raw_token, token_hash = generate_session_token()
    now = datetime.now(timezone.utc)
    expires_at = (now + timedelta(seconds=settings.token_ttl_seconds)).isoformat()
    conn.execute(
        """
        INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
        VALUES (?, ?, ?, ?)
        """,
        (token_hash, user_id, expires_at, now.isoformat()),
    )
    return raw_token


def _serialize_session_user(conn, user_row: dict[str, Any]) -> dict[str, Any]:
    kitchen = conn.execute(
        """
        SELECT id, business_name, area, address, category, cover_image_url, delivery_fee_kobo
        FROM seller_profiles
        WHERE id = ?
        """,
        (user_row["id"],),
    ).fetchone()

    return {
        "id": user_row["id"],
        "email": user_row["email"],
        "full_name": user_row["full_name"],
        "phone": user_row["phone"],
        "buyer_area": user_row["buyer_area"],
        "buyer_landmark": user_row["buyer_landmark"],
        "avatar_url": user_row["avatar_url"],
        "role": "seller" if kitchen else "buyer",
        "kitchen": dict(kitchen) if kitchen else None,
    }


def handle_health() -> tuple[int, dict[str, Any]]:
    with get_db() as conn:
        counts = {
            "users": conn.execute("SELECT COUNT(*) FROM users").fetchone()[0],
            "kitchens": conn.execute("SELECT COUNT(*) FROM seller_profiles").fetchone()[0],
            "foods": conn.execute("SELECT COUNT(*) FROM foods").fetchone()[0],
            "orders": conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0],
        }
    return 200, {
        "ok": True,
        "engine": f"Python {sys.version.split()[0]} (stdlib HTTP + SQLite)",
        "paystack_mode": "sandbox" if paystack.is_sandbox_mode() else "live",
        "counts": counts,
    }


def handle_debug_errors() -> tuple[int, dict[str, Any]]:
    return 200, {"errors": get_recent_errors()}


def handle_signup(body: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    email = str(body.get("email") or "").strip().lower()
    password = str(body.get("password") or "")
    full_name = str(body.get("full_name") or "").strip()
    phone = str(body.get("phone") or "").strip()
    buyer_area = str(body.get("buyer_area") or "Eti-Osa, Lagos").strip() or "Eti-Osa, Lagos"
    buyer_landmark = str(body.get("buyer_landmark") or "").strip()

    if not EMAIL_RE.match(email):
        raise BadRequestError("Enter a valid email address.")
    if len(password) < 8:
        raise BadRequestError("Your password must be at least 8 characters.")
    if len(full_name) < 2:
        raise BadRequestError("Please enter your full name (at least 2 characters).")

    user_id = str(uuid.uuid4())
    now = utc_now_iso()
    password_hash = hash_password(password)

    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise ConflictError("An account with this email already exists. Please sign in.")

        conn.execute(
            """
            INSERT INTO users (id, email, password_hash, full_name, phone, buyer_area, buyer_landmark, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, email, password_hash, full_name, phone, buyer_area, buyer_landmark, now),
        )

        # Optionally create seller kitchen in the same atomic transaction
        kitchen_payload = body.get("kitchen")
        if isinstance(kitchen_payload, dict) and kitchen_payload.get("business_name"):
            bname = str(kitchen_payload.get("business_name") or "").strip()
            karea = str(kitchen_payload.get("area") or buyer_area).strip()
            kaddr = str(kitchen_payload.get("address") or "").strip()
            kcat = str(kitchen_payload.get("category") or "jollof").strip()
            if len(bname) < 3:
                raise BadRequestError("Kitchen name must be at least 3 characters.")
            if len(kaddr) < 4:
                raise BadRequestError("Kitchen street address must be at least 4 characters.")
            conn.execute(
                """
                INSERT INTO seller_profiles (id, business_name, area, address, category, delivery_fee_kobo, created_at)
                VALUES (?, ?, ?, ?, ?, 0, ?)
                """,
                (user_id, bname, karea, kaddr, kcat, now),
            )

        token = _create_session_for_user(conn, user_id)
        user_row = dict(conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())
        session_user = _serialize_session_user(conn, user_row)

    return 201, {
        "needs_email_confirmation": False,
        "token": token,
        "user": session_user,
    }


def handle_signin(body: dict[str, Any]) -> tuple[int, dict[str, Any]]:
    email = str(body.get("email") or "").strip().lower()
    password = str(body.get("password") or "")

    if not email or not password:
        raise BadRequestError("Email and password are required.")

    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if not row or not verify_password(password, row["password_hash"]):
            raise UnauthorizedError(
                "Invalid email or password. If you haven't registered on the Python backend yet, click 'Create an account'."
            )

        token = _create_session_for_user(conn, row["id"])
        session_user = _serialize_session_user(conn, dict(row))

    return 200, {"token": token, "user": session_user}


def handle_signout(headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    auth_header = ""
    for key, value in headers.items():
        if key.lower() == "authorization":
            auth_header = value
            break

    if auth_header.startswith("Bearer "):
        raw_token = auth_header[7:].strip()
        if raw_token:
            with get_db() as conn:
                conn.execute(
                    "DELETE FROM sessions WHERE token_hash = ?",
                    (hash_session_token(raw_token),),
                )
    return 200, {"ok": True}


def handle_get_session(headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    auth_header = ""
    for key, value in headers.items():
        if key.lower() == "authorization":
            auth_header = value
            break

    if not auth_header.startswith("Bearer "):
        return 200, {"user": None}

    try:
        user_row = _require_auth_user(headers)
    except UnauthorizedError:
        return 200, {"user": None}

    with get_db() as conn:
        return 200, {"user": _serialize_session_user(conn, user_row)}


def handle_update_profile(
    headers: dict[str, str],
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    full_name = str(body.get("full_name") if "full_name" in body else user["full_name"]).strip()
    phone = str(body.get("phone") if "phone" in body else user["phone"]).strip()
    buyer_area = str(body.get("buyer_area") if "buyer_area" in body else user["buyer_area"]).strip()
    buyer_landmark = str(
        body.get("buyer_landmark") if "buyer_landmark" in body else user["buyer_landmark"]
    ).strip()

    if len(full_name) < 2:
        raise BadRequestError("Full name must be at least 2 characters.")

    avatar_url = user["avatar_url"]
    if "avatar_url" in body:
        raw_avatar = body.get("avatar_url")
        if raw_avatar:
            avatar_url = save_photo_input(user["id"], str(raw_avatar))
        else:
            avatar_url = None

    with get_db() as conn:
        conn.execute(
            """
            UPDATE users
            SET full_name = ?, phone = ?, buyer_area = ?, buyer_landmark = ?, avatar_url = ?
            WHERE id = ?
            """,
            (full_name, phone, buyer_area, buyer_landmark, avatar_url, user["id"]),
        )
        updated = dict(conn.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone())
        return 200, {"user": _serialize_session_user(conn, updated)}


def handle_list_restaurants() -> tuple[int, dict[str, Any]]:
    with get_db() as conn:
        kitchens = conn.execute(
            """
            SELECT id, business_name, area, address, category, cover_image_url, delivery_fee_kobo
            FROM seller_profiles
            ORDER BY created_at DESC
            """
        ).fetchall()
        foods = conn.execute(
            """
            SELECT id, seller_id, name, description, price_kobo, image_url, is_available, category
            FROM foods
            ORDER BY created_at DESC
            """
        ).fetchall()

    return 200, {
        "kitchens": [dict(row) for row in kitchens],
        "foods": [
            {**dict(row), "is_available": bool(row["is_available"])}
            for row in foods
        ],
    }


def handle_get_my_kitchen(headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT id, business_name, area, address, category, cover_image_url, delivery_fee_kobo
            FROM seller_profiles
            WHERE id = ?
            """,
            (user["id"],),
        ).fetchone()
    return 200, {"kitchen": dict(row) if row else None}


def handle_upsert_kitchen(
    headers: dict[str, str],
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    business_name = str(body.get("business_name") or "").strip()
    area = str(body.get("area") or user["buyer_area"] or "Eti-Osa, Lagos").strip()
    address = str(body.get("address") or "").strip()
    category = str(body.get("category") or "jollof").strip()
    delivery_fee_kobo = max(0, int(body.get("delivery_fee_kobo") or 0))

    if len(business_name) < 3 or len(business_name) > 80:
        raise BadRequestError("Business name must be between 3 and 80 characters.")
    if len(address) < 4:
        raise BadRequestError("Kitchen street address must be at least 4 characters.")

    with get_db() as conn:
        existing = conn.execute(
            "SELECT cover_image_url FROM seller_profiles WHERE id = ?",
            (user["id"],),
        ).fetchone()
        now = utc_now_iso()
        if existing:
            conn.execute(
                """
                UPDATE seller_profiles
                SET business_name = ?, area = ?, address = ?, category = ?, delivery_fee_kobo = ?
                WHERE id = ?
                """,
                (business_name, area, address, category, delivery_fee_kobo, user["id"]),
            )
        else:
            conn.execute(
                """
                INSERT INTO seller_profiles (id, business_name, area, address, category, delivery_fee_kobo, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (user["id"], business_name, area, address, category, delivery_fee_kobo, now),
            )
        kitchen = conn.execute(
            """
            SELECT id, business_name, area, address, category, cover_image_url, delivery_fee_kobo
            FROM seller_profiles WHERE id = ?
            """,
            (user["id"],),
        ).fetchone()

    return 200, {"kitchen": dict(kitchen)}


def handle_update_delivery_fee(
    headers: dict[str, str],
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    fee_naira = float(body.get("fee_naira") or 0)
    if fee_naira < 0:
        raise BadRequestError("Delivery fee cannot be negative.")
    fee_kobo = max(0, round(fee_naira * 100))

    with get_db() as conn:
        cur = conn.execute(
            "UPDATE seller_profiles SET delivery_fee_kobo = ? WHERE id = ?",
            (fee_kobo, user["id"]),
        )
        if cur.rowcount == 0:
            raise NotFoundError("Register your kitchen first before setting a delivery fee.")

    return 200, {"ok": True, "delivery_fee_kobo": fee_kobo}


def handle_seller_dashboard(headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    uid = user["id"]

    with get_db() as conn:
        kitchen = conn.execute(
            """
            SELECT id, business_name, area, address, category, cover_image_url, delivery_fee_kobo
            FROM seller_profiles WHERE id = ?
            """,
            (uid,),
        ).fetchone()

        dishes = conn.execute(
            """
            SELECT id, seller_id, name, description, price_kobo, image_url, is_available, category
            FROM foods WHERE seller_id = ?
            ORDER BY created_at DESC
            """,
            (uid,),
        ).fetchall()

        orders = conn.execute(
            """
            SELECT id, status, total_kobo, delivery_fee_kobo, commission_kobo, buyer_name, buyer_phone, delivery_address
            FROM orders WHERE seller_id = ?
            ORDER BY created_at DESC
            """,
            (uid,),
        ).fetchall()

        dish_stats: dict[str, dict[str, int]] = {}
        active_order_ids = [
            row["id"]
            for row in orders
            if row["status"] not in ("pending_payment", "cancelled")
        ]
        if active_order_ids:
            placeholders = ",".join("?" for _ in active_order_ids)
            item_rows = conn.execute(
                f"""
                SELECT order_id, food_id, quantity
                FROM order_items
                WHERE order_id IN ({placeholders})
                """,
                active_order_ids,
            ).fetchall()
            seen_orders: dict[str, set[str]] = {}
            for row in item_rows:
                fid = row["food_id"]
                if not fid:
                    continue
                if fid not in dish_stats:
                    dish_stats[fid] = {"orderCount": 0, "platesSold": 0}
                    seen_orders[fid] = set()
                seen_orders[fid].add(row["order_id"])
                dish_stats[fid]["orderCount"] = len(seen_orders[fid])
                dish_stats[fid]["platesSold"] += int(row["quantity"])

    return 200, {
        "kitchen": dict(kitchen) if kitchen else None,
        "dishes": [
            {**dict(row), "is_available": bool(row["is_available"])}
            for row in dishes
        ],
        "orders": [dict(row) for row in orders],
        "dishStats": dish_stats,
    }


def handle_publish_dish(
    headers: dict[str, str],
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    uid = user["id"]

    name = str(body.get("name") or "").strip()
    description = str(body.get("description") or "").strip()
    price_naira = float(body.get("price_naira") or 0)
    category = str(body.get("category") or "Combos").strip()
    photo = str(body.get("photo") or "").strip()
    set_as_cover = bool(body.get("set_as_cover"))
    is_first_dish = bool(body.get("is_first_dish"))

    if len(name) < 3:
        raise BadRequestError("Dish name must be at least 3 characters.")
    if price_naira < 300:
        raise BadRequestError("Minimum dish price is ₦300.")
    if len(description) < 8:
        raise BadRequestError("Describe what comes in the plate (at least 8 characters).")

    image_url = save_photo_input(uid, photo)
    price_kobo = round(price_naira * 100)
    food_id = str(uuid.uuid4())
    now = utc_now_iso()

    with get_db() as conn:
        kitchen = conn.execute(
            "SELECT id FROM seller_profiles WHERE id = ?",
            (uid,),
        ).fetchone()
        if not kitchen:
            raise BadRequestError("Open your kitchen first before posting dishes.")

        conn.execute(
            """
            INSERT INTO foods (id, seller_id, name, description, price_kobo, image_url, is_available, category, prep_minutes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 1, ?, 25, ?)
            """,
            (food_id, uid, name, description, price_kobo, image_url, category, now),
        )

        if set_as_cover or is_first_dish:
            conn.execute(
                "UPDATE seller_profiles SET cover_image_url = ? WHERE id = ?",
                (image_url, uid),
            )

        dish = conn.execute(
            """
            SELECT id, seller_id, name, description, price_kobo, image_url, is_available, category
            FROM foods WHERE id = ?
            """,
            (food_id,),
        ).fetchone()

    return 201, {"dish": {**dict(dish), "is_available": bool(dish["is_available"])}}


def handle_toggle_dish(
    headers: dict[str, str],
    food_id: str,
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    is_available = 1 if bool(body.get("is_available")) else 0

    with get_db() as conn:
        cur = conn.execute(
            "UPDATE foods SET is_available = ? WHERE id = ? AND seller_id = ?",
            (is_available, food_id, user["id"]),
        )
        if cur.rowcount == 0:
            raise NotFoundError("Dish not found in your kitchen.")

    return 200, {"ok": True, "is_available": bool(is_available)}


def handle_delete_dish(headers: dict[str, str], food_id: str) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    with get_db() as conn:
        cur = conn.execute(
            "DELETE FROM foods WHERE id = ? AND seller_id = ?",
            (food_id, user["id"]),
        )
        if cur.rowcount == 0:
            raise NotFoundError("Dish not found in your kitchen.")
    return 200, {"ok": True}


def handle_upload_photo(
    headers: dict[str, str],
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    url = save_photo_input(user["id"], str(body.get("photo") or ""))
    return 201, {"url": url}


def handle_get_my_payout(headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT account_name, bank_code, account_number
            FROM seller_payout WHERE seller_id = ?
            """,
            (user["id"],),
        ).fetchone()
    return 200, {"payout": dict(row) if row else None}


def handle_verify_bank(
    headers: dict[str, str],
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    _require_auth_user(headers)
    bank_code = str(body.get("bank_code") or "").strip()
    account_number = str(body.get("account_number") or "").strip()

    if not BANK_CODE_RE.match(bank_code):
        raise BadRequestError("Select a valid Nigerian bank.")
    if not ACCOUNT_NUMBER_RE.match(account_number):
        raise BadRequestError("Account number must be 10 digits.")

    account_name = paystack.resolve_bank_account(account_number, bank_code)
    return 200, {"ok": True, "account_name": account_name}


def handle_save_bank(
    headers: dict[str, str],
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    uid = user["id"]
    business_name = str(body.get("business_name") or "").strip()
    bank_code = str(body.get("bank_code") or "").strip()
    account_number = str(body.get("account_number") or "").strip()

    if len(business_name) < 2 or len(business_name) > 80:
        raise BadRequestError("Business name must be 2–80 characters.")
    if not BANK_CODE_RE.match(bank_code):
        raise BadRequestError("Select a valid Nigerian bank.")
    if not ACCOUNT_NUMBER_RE.match(account_number):
        raise BadRequestError("Account number must be 10 digits.")

    account_name = paystack.resolve_bank_account(account_number, bank_code)
    recipient_code = paystack.create_transfer_recipient(
        name=account_name,
        account_number=account_number,
        bank_code=bank_code,
    )

    with get_db() as conn:
        existing_kitchen = conn.execute(
            "SELECT id FROM seller_profiles WHERE id = ?",
            (uid,),
        ).fetchone()
        now = utc_now_iso()
        if existing_kitchen:
            conn.execute(
                "UPDATE seller_profiles SET business_name = ? WHERE id = ?",
                (business_name, uid),
            )
        else:
            conn.execute(
                """
                INSERT INTO seller_profiles (id, business_name, area, address, category, delivery_fee_kobo, created_at)
                VALUES (?, ?, ?, ?, 'jollof', 0, ?)
                """,
                (uid, business_name, user["buyer_area"], user["buyer_landmark"] or "Local Kitchen", now),
            )

        existing_payout = conn.execute(
            "SELECT paystack_subaccount_code FROM seller_payout WHERE seller_id = ?",
            (uid,),
        ).fetchone()

        if existing_payout and existing_payout["paystack_subaccount_code"]:
            subaccount_code = existing_payout["paystack_subaccount_code"]
            paystack.update_subaccount(
                subaccount_code=subaccount_code,
                business_name=business_name,
                bank_code=bank_code,
                account_number=account_number,
            )
        else:
            subaccount_code = paystack.create_subaccount(
                business_name=business_name,
                bank_code=bank_code,
                account_number=account_number,
                commission_percent=config.settings.commission_percent,
            )

        conn.execute(
            """
            INSERT INTO seller_payout (
                seller_id, bank_code, account_number, account_name,
                paystack_subaccount_code, transfer_recipient_code, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(seller_id) DO UPDATE SET
                bank_code = excluded.bank_code,
                account_number = excluded.account_number,
                account_name = excluded.account_name,
                paystack_subaccount_code = excluded.paystack_subaccount_code,
                transfer_recipient_code = excluded.transfer_recipient_code,
                updated_at = excluded.updated_at
            """,
            (uid, bank_code, account_number, account_name, subaccount_code, recipient_code, now),
        )

    return 200, {
        "ok": True,
        "account_name": account_name,
        "business_name": business_name,
        "subaccount_code": subaccount_code,
        "transfer_recipient_code": recipient_code,
    }


def handle_initialize_payment(
    headers: dict[str, str],
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    items_input = body.get("items")
    buyer_name = str(body.get("buyer_name") or user["full_name"]).strip()
    buyer_phone = str(body.get("buyer_phone") or user["phone"]).strip()
    delivery_address = str(body.get("delivery_address") or "").strip()

    if not isinstance(items_input, list) or len(items_input) == 0:
        raise BadRequestError("Your tray is empty. Add at least one dish first.")
    if len(buyer_name) < 2:
        raise BadRequestError("Enter your name before checkout.")
    if len(delivery_address) < 5:
        raise BadRequestError("Enter a full delivery address or landmark.")

    food_quantities: list[tuple[str, int]] = []
    for entry in items_input:
        if not isinstance(entry, dict):
            raise BadRequestError("Invalid cart item.")
        fid = str(entry.get("food_id") or "").strip()
        qty = int(entry.get("quantity") or 0)
        if not fid or qty < 1 or qty > 50:
            raise BadRequestError("Invalid dish quantity in tray.")
        food_quantities.append((fid, qty))

    food_ids = [fid for fid, _ in food_quantities]
    placeholders = ",".join("?" for _ in food_ids)

    with get_db() as conn:
        rows = conn.execute(
            f"""
            SELECT id, seller_id, name, price_kobo, is_available
            FROM foods
            WHERE id IN ({placeholders})
            """,
            food_ids,
        ).fetchall()
        food_map = {row["id"]: dict(row) for row in rows}

        if len(food_map) != len(set(food_ids)):
            raise NotFoundError("One or more selected dishes no longer exist.")

        seller_ids = {food["seller_id"] for food in food_map.values()}
        if len(seller_ids) != 1:
            raise BadRequestError("All dishes in one order must come from the same kitchen.")

        seller_id = next(iter(seller_ids))
        if seller_id == user["id"]:
            raise BadRequestError("You cannot order from your own kitchen.")

        kitchen = conn.execute(
            "SELECT id, business_name, delivery_fee_kobo FROM seller_profiles WHERE id = ?",
            (seller_id,),
        ).fetchone()
        if not kitchen:
            raise NotFoundError("Kitchen not found.")

        subtotal_kobo = 0
        line_items: list[dict[str, Any]] = []
        for fid, qty in food_quantities:
            food = food_map[fid]
            if not food["is_available"]:
                raise BadRequestError(f"'{food['name']}' is currently out of stock.")
            unit_price = int(food["price_kobo"])
            subtotal_kobo += unit_price * qty
            line_items.append(
                {
                    "id": str(uuid.uuid4()),
                    "food_id": fid,
                    "name": food["name"],
                    "unit_price_kobo": unit_price,
                    "quantity": qty,
                }
            )

        delivery_fee_kobo = int(kitchen["delivery_fee_kobo"] or 0)
        total_kobo = subtotal_kobo + delivery_fee_kobo
        split = calculate_split(
            total_amount=total_kobo,
            app_percentage=config.settings.commission_percent,
            transfer_fee=config.settings.paystack_transfer_fee_kobo,
        )
        commission_kobo = split.app_commission_kobo

        order_id = str(uuid.uuid4())
        reference = f"CHOP_{uuid.uuid4().hex[:14].upper()}"
        now = utc_now_iso()

        conn.execute(
            """
            INSERT INTO orders (
                id, buyer_id, seller_id, total_kobo, commission_kobo,
                delivery_fee_kobo, status, delivery_address, buyer_name,
                buyer_phone, payment_reference, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?, ?, ?, ?)
            """,
            (
                order_id,
                user["id"],
                seller_id,
                total_kobo,
                commission_kobo,
                delivery_fee_kobo,
                delivery_address,
                buyer_name,
                buyer_phone,
                reference,
                now,
                now,
            ),
        )

        for li in line_items:
            conn.execute(
                """
                INSERT INTO order_items (id, order_id, food_id, name, unit_price_kobo, quantity)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (li["id"], order_id, li["food_id"], li["name"], li["unit_price_kobo"], li["quantity"]),
            )

        conn.execute(
            """
            INSERT INTO payments (reference, order_id, amount_kobo, currency, status, created_at, updated_at)
            VALUES (?, ?, ?, 'NGN', 'initialized', ?, ?)
            """,
            (reference, order_id, total_kobo, now, now),
        )

    callback_origin = config.settings.app_url
    for key, val in headers.items():
        if key.lower() == "origin" and val:
            callback_origin = val.rstrip("/")
            break

    auth_url = paystack.initialize_transaction(
        email=user["email"],
        amount_kobo=total_kobo,
        reference=reference,
        callback_url=f"{callback_origin}/?order={order_id}",
        order_id=order_id,
        commission_kobo=commission_kobo,
    )

    return 201, {
        "authorization_url": auth_url,
        "reference": reference,
        "order_id": order_id,
        "total_kobo": total_kobo,
        "commission_kobo": commission_kobo,
        "transfer_fee_kobo": split.transfer_fee_kobo,
        "seller_payout_kobo": split.seller_payout_kobo,
    }


def handle_sandbox_checkout_page(query_string: str) -> tuple[int, str]:
    """Render a clean Python-served Paystack sandbox checkout confirmation page."""
    params = parse_qs(query_string)
    reference = (params.get("reference") or [""])[0]
    order_id = (params.get("order") or [""])[0]

    with get_db() as conn:
        order = conn.execute(
            """
            SELECT o.id, o.total_kobo, o.buyer_name, o.delivery_address, s.business_name
            FROM orders o
            JOIN seller_profiles s ON s.id = o.seller_id
            WHERE o.id = ? AND o.payment_reference = ?
            """,
            (order_id, reference),
        ).fetchone()

    if not order:
        raise NotFoundError("Checkout session not found.")

    amount_naira = f"₦{int(order['total_kobo']) // 100:,}"
    html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ChopBellyFull Sandbox Checkout</title>
  <style>
    body {{
      margin: 0; font-family: system-ui, -apple-system, sans-serif;
      background: #FFFDF7; color: #2C221E;
      display: grid; place-items: center; min-height: 100vh; padding: 16px;
    }}
    .card {{
      width: 100%; max-width: 420px; background: #F3EAD8;
      border: 1px solid #E6D9C2; border-radius: 20px; padding: 28px;
      box-shadow: 0 12px 32px rgba(44,34,30,0.1);
    }}
    .badge {{
      display: inline-block; background: #FFFDF7; color: #5E4B42;
      border: 1px solid #E6D9C2; border-radius: 999px;
      padding: 4px 12px; font-size: 12px; font-weight: 700;
    }}
    h1 {{ margin: 14px 0 6px; font-size: 22px; }}
    .amount {{ font-size: 32px; font-weight: 800; margin: 12px 0; }}
    .meta {{ font-size: 13px; color: #5E4B42; line-height: 1.5; margin-bottom: 20px; }}
    button {{
      width: 100%; border: 0; border-radius: 999px; cursor: pointer;
      background: #F4B400; color: #2C221E; font-weight: 700;
      font-size: 15px; padding: 14px 18px;
    }}
    button:hover {{ background: #D99E00; }}
    .cancel {{
      display: block; text-align: center; margin-top: 12px;
      font-size: 13px; color: #5E4B42; text-decoration: none;
    }}
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Python Backend · Test Paystack Checkout</span>
    <h1>Pay {escape(order['business_name'])}</h1>
    <div class="amount">{escape(amount_naira)}</div>
    <div class="meta">
      <div><strong>Reference:</strong> {escape(reference)}</div>
      <div><strong>Buyer:</strong> {escape(order['buyer_name'] or '')}</div>
      <div><strong>Deliver to:</strong> {escape(order['delivery_address'] or '')}</div>
    </div>
    <form method="POST" action="/api/payments/sandbox-complete">
      <input type="hidden" name="reference" value="{escape(reference)}" />
      <input type="hidden" name="order_id" value="{escape(order_id)}" />
      <button type="submit">Confirm Test Payment</button>
    </form>
    <a class="cancel" href="/?order={escape(order_id)}">Cancel &amp; return to ChopBellyFull</a>
  </div>
</body>
</html>"""
    return 200, html


def _settle_payment_and_disburse(
    *,
    reference: str,
    paid_amount_kobo: int,
    currency: str = "NGN",
    raw_event: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Verify payment, apply idempotency guard, calculate split, log ledger, and disburse payout.

    Runs in three isolated phases so no SQLite write lock is held while calling
    Paystack's external Transfers API over HTTPS:
    1. Phase A (DB transaction): Verify reference & amount, lock idempotency via
       unique `payout_ledger.transaction_reference`, mark payment/order paid, and
       insert a `'pending'` ledger row.
    2. Phase B (External API): Create/reuse Paystack transfer recipient for the
       seller's bank account and initiate automated bank disbursement with a
       deterministic `payout_reference`.
    3. Phase C (DB transaction): Finalize ledger status (`'success'` or `'failed'`)
       and save gateway transfer code or error details for auditing.
    """
    now = utc_now_iso()
    raw_event_json = json.dumps(raw_event) if raw_event is not None else None
    payout_reference = f"payout_{reference.lower()}"

    # --- Phase A: Idempotency check + atomic claim inside SQLite transaction ---
    with get_db() as conn:
        payment = conn.execute(
            "SELECT reference, order_id, amount_kobo, status FROM payments WHERE reference = ?",
            (reference,),
        ).fetchone()
        if not payment:
            return {"status": "ignored", "reason": "unknown reference"}

        # Idempotency guard: if we already logged this transaction in payout_ledger,
        # never trigger a duplicate commission calculation or bank payout.
        existing_ledger = conn.execute(
            """
            SELECT id, payout_reference, payout_status, seller_payout_kobo, app_commission_kobo
            FROM payout_ledger
            WHERE transaction_reference = ?
            """,
            (reference,),
        ).fetchone()
        if existing_ledger:
            return {
                "status": "duplicate",
                "idempotent": True,
                "ledger": dict(existing_ledger),
            }

        order = conn.execute(
            """
            SELECT id, seller_id, total_kobo, status
            FROM orders
            WHERE id = ?
            """,
            (payment["order_id"],),
        ).fetchone()
        if not order:
            return {"status": "ignored", "reason": "unknown order"}

        expected_total_kobo = int(order["total_kobo"])
        if paid_amount_kobo != expected_total_kobo or currency.upper() != "NGN":
            conn.execute(
                """
                UPDATE payments
                SET status = 'amount_mismatch', raw_json = COALESCE(?, raw_json), updated_at = ?
                WHERE reference = ?
                """,
                (raw_event_json, now, reference),
            )
            return {"status": "mismatch", "reason": "amount or currency mismatch"}

        # Calculate platform commission & net seller payout in integer kobo
        try:
            split = calculate_split(
                total_amount=expected_total_kobo,
                app_percentage=config.settings.commission_percent,
                transfer_fee=config.settings.paystack_transfer_fee_kobo,
            )
        except BadRequestError as exc:
            conn.execute(
                """
                UPDATE payments
                SET status = 'split_invalid', raw_json = COALESCE(?, raw_json), updated_at = ?
                WHERE reference = ?
                """,
                (raw_event_json, now, reference),
            )
            return {"status": "invalid_split", "reason": exc.message}

        seller_bank = conn.execute(
            """
            SELECT bank_code, account_number, account_name, transfer_recipient_code
            FROM seller_payout
            WHERE seller_id = ?
            """,
            (order["seller_id"],),
        ).fetchone()

        conn.execute(
            """
            UPDATE payments
            SET status = 'success', raw_json = COALESCE(?, raw_json), updated_at = ?
            WHERE reference = ?
            """,
            (raw_event_json, now, reference),
        )
        conn.execute(
            """
            UPDATE orders
            SET status = CASE WHEN status = 'pending_payment' THEN 'paid' ELSE status END,
                commission_kobo = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (split.app_commission_kobo, now, order["id"]),
        )

        ledger_id = str(uuid.uuid4())
        recipient_code = seller_bank["transfer_recipient_code"] if seller_bank else ""
        conn.execute(
            """
            INSERT INTO payout_ledger (
                id, order_id, seller_id, transaction_reference, payout_reference,
                gross_amount_kobo, app_commission_kobo, transfer_fee_kobo,
                seller_payout_kobo, recipient_code, payout_status, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
            """,
            (
                ledger_id,
                order["id"],
                order["seller_id"],
                reference,
                payout_reference,
                split.total_amount_kobo,
                split.app_commission_kobo,
                split.transfer_fee_kobo,
                split.seller_payout_kobo,
                recipient_code,
                now,
                now,
            ),
        )

    # --- Phase B: Call Paystack Transfers API outside SQLite write lock ---
    payout_status = "failed"
    gateway_transfer_code = ""
    failure_reason: str | None = None
    gateway_response: dict[str, Any] | None = None

    if not seller_bank:
        failure_reason = "Seller has not registered a payout bank account yet."
    else:
        try:
            # Ensure a real transfer recipient exists when switching from sandbox/seed to live keys
            needs_live_recipient = (
                not paystack.is_sandbox_mode()
                and (not recipient_code or recipient_code.startswith("RCP_sandbox_"))
            )
            if not recipient_code or needs_live_recipient:
                recipient_code = paystack.create_transfer_recipient(
                    name=seller_bank["account_name"],
                    account_number=seller_bank["account_number"],
                    bank_code=seller_bank["bank_code"],
                )
                with get_db() as conn:
                    conn.execute(
                        """
                        UPDATE seller_payout
                        SET transfer_recipient_code = ?, updated_at = ?
                        WHERE seller_id = ?
                        """,
                        (recipient_code, utc_now_iso(), order["seller_id"]),
                    )

            gateway_response = paystack.initiate_transfer(
                amount_kobo=split.seller_payout_kobo,
                recipient_code=recipient_code,
                reference=payout_reference,
                reason=f"ChopBellyFull seller payout for order {order['id'][:8]}",
            )
            transfer_data = gateway_response.get("data") or {}
            gateway_transfer_code = str(transfer_data.get("transfer_code") or "")
            gateway_state = str(transfer_data.get("status") or "").lower()
            payout_status = "pending" if gateway_state == "pending" else "success"
        except Exception as exc:
            payout_status = "failed"
            failure_reason = str(getattr(exc, "message", exc))

    # --- Phase C: Record final transfer outcome in payout_ledger ---
    finished_at = utc_now_iso()
    with get_db() as conn:
        conn.execute(
            """
            UPDATE payout_ledger
            SET recipient_code = ?,
                gateway_transfer_code = ?,
                payout_status = ?,
                failure_reason = ?,
                gateway_response_json = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (
                recipient_code,
                gateway_transfer_code,
                payout_status,
                failure_reason,
                json.dumps(gateway_response) if gateway_response is not None else None,
                finished_at,
                ledger_id,
            ),
        )

    return {
        "status": "settled",
        "idempotent": False,
        "ledger": {
            "id": ledger_id,
            "order_id": order["id"],
            "transaction_reference": reference,
            "payout_reference": payout_reference,
            "gross_amount_kobo": split.total_amount_kobo,
            "app_commission_kobo": split.app_commission_kobo,
            "transfer_fee_kobo": split.transfer_fee_kobo,
            "seller_payout_kobo": split.seller_payout_kobo,
            "recipient_code": recipient_code,
            "gateway_transfer_code": gateway_transfer_code,
            "payout_status": payout_status,
            "failure_reason": failure_reason,
        },
    }


def handle_sandbox_complete(raw_form_body: bytes) -> str:
    """Confirm sandbox payment, calculate split, disburse sandbox payout, and redirect."""
    form = parse_qs(raw_form_body.decode("utf-8"))
    reference = (form.get("reference") or [""])[0]
    order_id = (form.get("order_id") or [""])[0]

    if not reference or not order_id:
        raise BadRequestError("Missing payment reference or order id.")

    with get_db() as conn:
        payment = conn.execute(
            "SELECT order_id, amount_kobo FROM payments WHERE reference = ?",
            (reference,),
        ).fetchone()
        if not payment or payment["order_id"] != order_id:
            raise NotFoundError("Payment reference not found.")
        amount_kobo = int(payment["amount_kobo"])

    _settle_payment_and_disburse(
        reference=reference,
        paid_amount_kobo=amount_kobo,
        currency="NGN",
        raw_event={"event": "charge.success", "mode": "sandbox"},
    )
    return f"/?order={order_id}"


def handle_paystack_webhook(
    headers: dict[str, str],
    raw_body: bytes,
) -> tuple[int, str]:
    """Receive Paystack webhooks, verify HMAC-SHA512 signature, settle & disburse."""
    signature = ""
    for key, value in headers.items():
        if key.lower() == "x-paystack-signature":
            signature = value
            break

    webhook_secret = config.settings.paystack_webhook_secret or config.settings.paystack_secret_key
    if not verify_paystack_signature(webhook_secret, raw_body, signature):
        return 401, "Invalid signature"

    try:
        event = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return 400, "Invalid JSON"

    event_name = str(event.get("event") or "")
    data = event.get("data") or {}

    if event_name == "charge.success":
        reference = str(data.get("reference") or "")
        amount = int(data.get("amount") or 0)
        currency = str(data.get("currency") or "")
        result = _settle_payment_and_disburse(
            reference=reference,
            paid_amount_kobo=amount,
            currency=currency,
            raw_event=event,
        )
        return 200, result["status"]

    # Sync asynchronous Paystack transfer confirmation webhooks into our audit ledger
    if event_name in ("transfer.success", "transfer.failed", "transfer.reversed"):
        payout_reference = str(data.get("reference") or "")
        if not payout_reference:
            return 200, "ignored"

        next_status = "success" if event_name == "transfer.success" else "failed"
        reason = None if next_status == "success" else str(data.get("reason") or event_name)
        with get_db() as conn:
            conn.execute(
                """
                UPDATE payout_ledger
                SET payout_status = ?,
                    failure_reason = ?,
                    gateway_response_json = ?,
                    updated_at = ?
                WHERE payout_reference = ?
                """,
                (next_status, reason, json.dumps(event), utc_now_iso(), payout_reference),
            )
        return 200, "ok"

    return 200, "ignored"


def handle_seller_ledger(headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    """Return commission & automated payout ledger records for the signed-in seller."""
    user = _require_auth_user(headers)
    uid = user["id"]

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, order_id, seller_id, transaction_reference, payout_reference,
                   gross_amount_kobo, app_commission_kobo, transfer_fee_kobo,
                   seller_payout_kobo, recipient_code, gateway_transfer_code,
                   payout_status, failure_reason, created_at, updated_at
            FROM payout_ledger
            WHERE seller_id = ?
            ORDER BY created_at DESC
            """,
            (uid,),
        ).fetchall()

    entries = [dict(row) for row in rows]
    return 200, {
        "seller_id": uid,
        "totals": {
            "gross_kobo": sum(int(e["gross_amount_kobo"]) for e in entries),
            "app_commission_kobo": sum(int(e["app_commission_kobo"]) for e in entries),
            "transfer_fee_kobo": sum(int(e["transfer_fee_kobo"]) for e in entries),
            "seller_payout_kobo": sum(
                int(e["seller_payout_kobo"]) for e in entries if e["payout_status"] == "success"
            ),
        },
        "ledger": entries,
    }


def handle_list_orders(headers: dict[str, str]) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    uid = user["id"]

    with get_db() as conn:
        rows = conn.execute(
            """
            SELECT id, buyer_id, seller_id, total_kobo, commission_kobo,
                   delivery_fee_kobo, status, delivery_address, buyer_name,
                   buyer_phone, payment_reference, created_at
            FROM orders
            WHERE buyer_id = ? OR seller_id = ?
            ORDER BY created_at DESC
            """,
            (uid, uid),
        ).fetchall()

        order_ids = [row["id"] for row in rows]
        items_by_order: dict[str, list[dict[str, Any]]] = {}
        if order_ids:
            placeholders = ",".join("?" for _ in order_ids)
            item_rows = conn.execute(
                f"""
                SELECT order_id, food_id, name, quantity, unit_price_kobo
                FROM order_items
                WHERE order_id IN ({placeholders})
                """,
                order_ids,
            ).fetchall()
            for item in item_rows:
                items_by_order.setdefault(item["order_id"], []).append(dict(item))

    return 200, {
        "user_id": uid,
        "orders": [
            {**dict(row), "items": items_by_order.get(row["id"], [])}
            for row in rows
        ],
    }


def handle_update_order_status(
    headers: dict[str, str],
    order_id: str,
    body: dict[str, Any],
) -> tuple[int, dict[str, Any]]:
    user = _require_auth_user(headers)
    next_status = str(body.get("status") or "").strip()

    if next_status not in VALID_ORDER_STATUSES:
        raise BadRequestError(f"Unsupported order status '{next_status}'.")

    with get_db() as conn:
        order = conn.execute(
            "SELECT id, buyer_id, seller_id, status FROM orders WHERE id = ?",
            (order_id,),
        ).fetchone()
        if not order:
            raise NotFoundError("Order not found.")

        uid = user["id"]
        is_seller = order["seller_id"] == uid
        is_buyer = order["buyer_id"] == uid
        if not (is_seller or is_buyer):
            raise ForbiddenError("You are not part of this order.")

        if is_buyer and not is_seller and next_status not in ("completed", "cancelled"):
            raise ForbiddenError("Only the kitchen seller can advance cooking & delivery stages.")

        conn.execute(
            "UPDATE orders SET status = ?, updated_at = ? WHERE id = ?",
            (next_status, utc_now_iso(), order_id),
        )

    return 200, {"ok": True, "status": next_status}
