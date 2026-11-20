"""Password hashing, session tokens, and Paystack webhook signature checks.

Built purely from Python's built-in `hashlib`, `hmac`, and `secrets` modules
so there are no opaque third-party auth libraries hiding how security works.
"""

import hashlib
import hmac
import secrets


PBKDF2_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    """Hash a plain password using a random 16-byte salt + PBKDF2-HMAC-SHA256."""
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PBKDF2_ITERATIONS,
    )
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt.hex()}${derived.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    """Check a candidate password against the stored PBKDF2 hash safely."""
    try:
        algorithm, iter_str, salt_hex, hash_hex = stored_hash.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        iterations = int(iter_str)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)
    except (ValueError, TypeError):
        return False

    candidate = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        iterations,
    )
    return hmac.compare_digest(candidate, expected)


def generate_session_token() -> tuple[str, str]:
    """Return (raw_token_for_client, sha256_hash_for_database)."""
    raw_token = secrets.token_urlsafe(32)
    return raw_token, hash_session_token(raw_token)


def hash_session_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def verify_paystack_signature(secret_key: str, raw_body: bytes, signature: str) -> bool:
    """Verify Paystack's `x-paystack-signature` HMAC-SHA512 header."""
    if not secret_key or not signature:
        return False
    expected = hmac.new(
        secret_key.encode("utf-8"),
        raw_body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature.strip().lower())
