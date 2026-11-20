"""Central configuration loaded from environment variables.

Keeping all settings in one place makes it obvious where paths, ports,
and API keys come from when debugging.
"""

from dataclasses import dataclass
import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent


@dataclass(frozen=True)
class Settings:
    host: str
    port: int
    db_path: Path
    uploads_dir: Path
    paystack_secret_key: str
    commission_percent: float
    app_url: str
    token_ttl_seconds: int
    debug_errors: bool


def _load_dotenv(env_path: Path) -> None:
    """Read key=value pairs from .env if present (without overwriting real env vars)."""
    if not env_path.is_file():
        return
    for raw_line in env_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_settings() -> Settings:
    _load_dotenv(PROJECT_ROOT / ".env")

    data_dir = BASE_DIR / "data"
    uploads_dir = BASE_DIR / "uploads"
    data_dir.mkdir(parents=True, exist_ok=True)
    uploads_dir.mkdir(parents=True, exist_ok=True)

    raw_commission = os.environ.get("COMMISSION_PERCENT", "10").strip()
    try:
        commission_percent = float(raw_commission)
    except ValueError:
        commission_percent = 10.0

    raw_port = os.environ.get("PYTHON_BACKEND_PORT", "8765").strip()
    try:
        port = int(raw_port)
    except ValueError:
        port = 8765

    return Settings(
        host=os.environ.get("PYTHON_BACKEND_HOST", "127.0.0.1"),
        port=port,
        db_path=Path(os.environ.get("CHOPBELLY_DB_PATH", str(data_dir / "chopbellyfull.db"))),
        uploads_dir=Path(os.environ.get("CHOPBELLY_UPLOADS_DIR", str(uploads_dir))),
        paystack_secret_key=os.environ.get("PAYSTACK_SECRET_KEY", "").strip(),
        commission_percent=commission_percent,
        app_url=os.environ.get("APP_URL", "http://127.0.0.1:3000").rstrip("/"),
        token_ttl_seconds=60 * 60 * 24 * 14,  # 14 days
        debug_errors=os.environ.get("DEBUG_ERRORS", "true").lower() != "false",
    )


settings = load_settings()
