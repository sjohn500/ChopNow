"""Local disk storage for uploaded food & profile images.

Accepts compressed base64 data URLs from the browser (or passes through
built-in `/assets/...` sample paths unchanged), validates MIME type and size,
and saves files under `backend/uploads/<user_id>/<uuid>.<ext>`.
"""

import base64
import mimetypes
from pathlib import Path
import re
import uuid

from .config import settings
from .errors import BadRequestError, NotFoundError


DATA_URL_RE = re.compile(r"^data:(image/[a-zA-Z0-9.+-]+);base64,(.+)$", re.DOTALL)
ALLOWED_MIME_TO_EXT = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # 5 MB


def save_photo_input(user_id: str, photo_value: str) -> str:
    """Persist a data-URL photo to disk and return its public `/uploads/...` URL."""
    cleaned = (photo_value or "").strip()
    if not cleaned:
        raise BadRequestError("Food photo is required.")

    # Already a local asset or previously uploaded image path
    if cleaned.startswith("/") or cleaned.startswith("http://") or cleaned.startswith("https://"):
        return cleaned

    match = DATA_URL_RE.match(cleaned)
    if not match:
        raise BadRequestError("Unsupported image format. Upload a JPG, PNG, or WebP photo.")

    mime_type = match.group(1).lower()
    ext = ALLOWED_MIME_TO_EXT.get(mime_type)
    if not ext:
        raise BadRequestError(f"Unsupported image type '{mime_type}'. Use JPG, PNG, or WebP.")

    try:
        raw_bytes = base64.b64decode(match.group(2), validate=True)
    except Exception as exc:
        raise BadRequestError("Uploaded image data is corrupted.") from exc

    if len(raw_bytes) > MAX_UPLOAD_BYTES:
        raise BadRequestError("Photo is too large (maximum 5 MB).")

    safe_user_dir = settings.uploads_dir / _sanitize_segment(user_id)
    safe_user_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4()}.{ext}"
    file_path = safe_user_dir / filename
    file_path.write_bytes(raw_bytes)

    return f"/uploads/{_sanitize_segment(user_id)}/{filename}"


def read_uploaded_file(relative_path: str) -> tuple[bytes, str]:
    """Read an uploaded image safely, blocking directory traversal (`..`)."""
    clean_rel = relative_path.lstrip("/")
    target = (settings.uploads_dir / clean_rel).resolve()
    uploads_root = settings.uploads_dir.resolve()

    if uploads_root not in target.parents or not target.is_file():
        raise NotFoundError("Uploaded image not found.")

    guessed_type, _ = mimetypes.guess_type(str(target))
    return target.read_bytes(), guessed_type or "application/octet-stream"


def _sanitize_segment(segment: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]", "", segment) or "anon"
