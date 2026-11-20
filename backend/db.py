"""SQLite database layer, schema setup, and starter marketplace seed.

Uses Python's built-in `sqlite3` module with:
- Foreign keys enforced (`PRAGMA foreign_keys = ON`)
- WAL journal mode so concurrent reads/writes don't lock easily
- Row factory (`sqlite3.Row`) so columns can be accessed by name like dicts
- Clean `with get_db() as conn:` transaction context manager
"""

from contextlib import contextmanager
from datetime import datetime, timezone
import sqlite3
from typing import Iterator
import uuid

from .config import settings
from .security import hash_password


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def open_connection() -> sqlite3.Connection:
    settings.db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(settings.db_path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    return conn


@contextmanager
def get_db() -> Iterator[sqlite3.Connection]:
    """Open a database transaction; commit on success or rollback on any error."""
    conn = open_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL DEFAULT '',
    buyer_area TEXT NOT NULL DEFAULT 'Eti-Osa, Lagos',
    buyer_landmark TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_profiles (
    id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    area TEXT NOT NULL,
    address TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'jollof',
    cover_image_url TEXT,
    delivery_fee_kobo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS seller_payout (
    seller_id TEXT PRIMARY KEY REFERENCES seller_profiles(id) ON DELETE CASCADE,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    paystack_subaccount_code TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS foods (
    id TEXT PRIMARY KEY,
    seller_id TEXT NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_kobo INTEGER NOT NULL CHECK (price_kobo >= 0),
    image_url TEXT NOT NULL,
    is_available INTEGER NOT NULL DEFAULT 1,
    category TEXT NOT NULL DEFAULT 'Combos',
    prep_minutes INTEGER NOT NULL DEFAULT 25,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    seller_id TEXT NOT NULL REFERENCES seller_profiles(id) ON DELETE CASCADE,
    total_kobo INTEGER NOT NULL,
    commission_kobo INTEGER NOT NULL DEFAULT 0,
    delivery_fee_kobo INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending_payment',
    delivery_address TEXT,
    buyer_name TEXT,
    buyer_phone TEXT,
    payment_reference TEXT UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    food_id TEXT REFERENCES foods(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    unit_price_kobo INTEGER NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS payments (
    reference TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount_kobo INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    status TEXT NOT NULL DEFAULT 'initialized',
    raw_json TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_foods_seller_id ON foods(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
"""


def init_db() -> None:
    """Create all tables and populate initial neighborhood kitchens if empty."""
    with get_db() as conn:
        conn.executescript(SCHEMA_SQL)
        existing = conn.execute("SELECT COUNT(*) AS count FROM seller_profiles").fetchone()
        if existing and existing["count"] == 0:
            _seed_starter_kitchens(conn)


def _seed_starter_kitchens(conn: sqlite3.Connection) -> None:
    """Insert initial real UUID-backed kitchens & plates so new users can browse/order immediately."""
    now = utc_now_iso()
    demo_pw = hash_password("chopbelly123")

    starter_sellers = [
        {
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "kitchen.mamaput.chopbellyfull")),
            "email": "mamaput@chopbellyfull.ng",
            "full_name": "Mama Put Express",
            "phone": "08031112201",
            "buyer_area": "Eti-Osa, Lagos",
            "buyer_landmark": "14 Admiralty Way, Lekki Phase 1",
            "business_name": "Mama Put Express",
            "category": "jollof",
            "delivery_fee_kobo": 0,
            "cover_image_url": "/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg",
            "foods": [
                (
                    "Smoky Party Jollof & Sweet Dodo",
                    "Firewood party jollof rice topped with peppered meat sauce and golden caramelized plantain cubes.",
                    350000,
                    "Combos",
                    "/assets/aistudio/pexels-saizstudio-17952748_67761b9b.jpg",
                ),
                (
                    "Spiced Rice & Charred Grilled Chicken",
                    "Seasoned Nigerian rice served with flame-charred chicken quarter and sautéed green peppers.",
                    420000,
                    "Combos",
                    "/assets/aistudio/pexels-discountedchef-40262791_428c23ce.jpg",
                ),
                (
                    "Owambe Party Feast Spread",
                    "Party jollof, stir-fry noodles, grilled chicken, curried meat rice, and hot pepper sauces.",
                    650000,
                    "Combos",
                    "/assets/aistudio/pexels-picswithjer-30246915_e571c980.jpg",
                ),
            ],
        },
        {
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "kitchen.bukahut.chopbellyfull")),
            "email": "bukahut@chopbellyfull.ng",
            "full_name": "Buka Hut & Swallows",
            "phone": "08031112202",
            "buyer_area": "Surulere, Lagos",
            "buyer_landmark": "42 Bode Thomas Street, Surulere",
            "business_name": "Buka Hut & Swallows",
            "category": "swallows",
            "delivery_fee_kobo": 50000,
            "cover_image_url": "/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37648018_3ef90570.jpg",
            "foods": [
                (
                    "Efo Riro, Peppered Ponmo & Beef",
                    "Rich Lagos spinach stew cooked with smoked stockfish, tender ponmo, and assorted beef.",
                    380000,
                    "Swallows",
                    "/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37648018_3ef90570.jpg",
                ),
                (
                    "Amala, Ewedu & Gbegiri Special",
                    "Fluffy dark yam flour amala paired with smooth ewedu, gbegiri, and spicy stew.",
                    340000,
                    "Swallows",
                    "/assets/aistudio/pexels-tochukwu-ekeh-2149052634-37624176_9042db43.jpg",
                ),
            ],
        },
        {
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "kitchen.suya.chopbellyfull")),
            "email": "suyaspot@chopbellyfull.ng",
            "full_name": "Abuja Suya & Grills",
            "phone": "08031112203",
            "buyer_area": "Abuja Municipal, FCT",
            "buyer_landmark": "18 Aminu Kano Crescent, Wuse 2",
            "business_name": "Abuja Suya & Grills",
            "category": "suya",
            "delivery_fee_kobo": 60000,
            "cover_image_url": "/assets/aistudio/pexels-ndagi-idris-2159907004-36458103_fd393f46.jpg",
            "foods": [
                (
                    "Charcoal Beef Suya & Yaji Box",
                    "Thinly sliced spiced sirloin grilled over open charcoal with onions, tomatoes, and dry yaji.",
                    400000,
                    "Proteins",
                    "/assets/aistudio/pexels-ndagi-idris-2159907004-36458103_fd393f46.jpg",
                ),
                (
                    "Peppered Grilled Tilapia & Yam Chips",
                    "Whole grilled tilapia marinated in Ata Rodo pepper sauce with crispy fried yam.",
                    550000,
                    "Combos",
                    "/assets/aistudio/pexels-jessicairoh-20419328_715fe24a.jpg",
                ),
            ],
        },
        {
            "id": str(uuid.uuid5(uuid.NAMESPACE_DNS, "kitchen.akara.chopbellyfull")),
            "email": "sunrise@chopbellyfull.ng",
            "full_name": "Sunrise Akara & Chops",
            "phone": "08031112204",
            "buyer_area": "Ikeja, Lagos",
            "buyer_landmark": "7 Allen Avenue, Ikeja",
            "business_name": "Sunrise Akara & Chops",
            "category": "small_chops",
            "delivery_fee_kobo": 40000,
            "cover_image_url": "/assets/aistudio/pexels-prosper-buka-1289782307-28736731_1eb2145c.jpg",
            "foods": [
                (
                    "Crispy Akara & Creamy Ogi Combo",
                    "Freshly whipped golden bean cakes served hot with silky brown pap and milk.",
                    220000,
                    "Sides",
                    "/assets/aistudio/pexels-prosper-buka-1289782307-28736731_1eb2145c.jpg",
                ),
                (
                    "Chilled Hibiscus Zobo & Pineapple",
                    "Freshly brewed spiced zobo infused with pineapple, ginger, and cloves.",
                    120000,
                    "Sides",
                    "/assets/aistudio/pexels-jagaba-37126238_22267ce8.jpg",
                ),
            ],
        },
    ]

    for seller in starter_sellers:
        conn.execute(
            """
            INSERT INTO users (id, email, password_hash, full_name, phone, buyer_area, buyer_landmark, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                seller["id"],
                seller["email"],
                demo_pw,
                seller["full_name"],
                seller["phone"],
                seller["buyer_area"],
                seller["buyer_landmark"],
                now,
            ),
        )
        conn.execute(
            """
            INSERT INTO seller_profiles (id, business_name, area, address, category, cover_image_url, delivery_fee_kobo, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                seller["id"],
                seller["business_name"],
                seller["buyer_area"],
                seller["buyer_landmark"],
                seller["category"],
                seller["cover_image_url"],
                seller["delivery_fee_kobo"],
                now,
            ),
        )
        conn.execute(
            """
            INSERT INTO seller_payout (seller_id, bank_code, account_number, account_name, paystack_subaccount_code, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                seller["id"],
                "058",
                "0123456789",
                f"{seller['business_name'].upper()} LTD",
                f"SUB_seed_{seller['id'][:8]}",
                now,
            ),
        )
        for food_name, desc, price_kobo, category, img in seller["foods"]:
            food_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{seller['id']}:{food_name}"))
            conn.execute(
                """
                INSERT INTO foods (id, seller_id, name, description, price_kobo, image_url, is_available, category, prep_minutes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, ?, 25, ?)
                """,
                (food_id, seller["id"], food_name, desc, price_kobo, img, category, now),
            )
