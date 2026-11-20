"""Typed HTTP errors and structured crash diagnostics.

When learning Python, silent failures or generic "500 Internal Server Error"
messages make bugs hard to find. Every unexpected exception caught by the
server records its full traceback (file, line number, function) in memory
and prints it clearly to stdout so you can trace any crash immediately.
"""

from collections import deque
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
import traceback
from typing import Deque, Optional


class AppError(Exception):
    """Base class for expected application errors with an HTTP status code."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: str = "bad_request",
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.code = code


class BadRequestError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=400, code="bad_request")


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Please sign in first.") -> None:
        super().__init__(message, status_code=401, code="unauthorized")


class ForbiddenError(AppError):
    def __init__(self, message: str = "You do not have permission for this action.") -> None:
        super().__init__(message, status_code=403, code="forbidden")


class NotFoundError(AppError):
    def __init__(self, message: str = "Requested item was not found.") -> None:
        super().__init__(message, status_code=404, code="not_found")


class ConflictError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=409, code="conflict")


class ExternalServiceError(AppError):
    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=502, code="external_service_error")


@dataclass
class ErrorLogEntry:
    timestamp: str
    request_id: str
    method: str
    path: str
    status_code: int
    error_type: str
    message: str
    where: str
    traceback_text: Optional[str] = None


# Ring buffer of the last 50 errors for quick inspection via GET /api/debug/errors
RECENT_ERRORS: Deque[ErrorLogEntry] = deque(maxlen=50)


def extract_crash_location(exc: BaseException) -> str:
    """Return 'file.py:line in func_name' for the deepest frame inside backend/."""
    tb = traceback.extract_tb(exc.__traceback__)
    if not tb:
        return "unknown"

    # Prefer the last frame inside our backend/ folder so the user sees their own code first.
    backend_frames = [frame for frame in tb if "backend" in frame.filename]
    target = backend_frames[-1] if backend_frames else tb[-1]
    short_file = target.filename.replace("\\", "/")
    if "/backend/" in short_file:
        short_file = "backend/" + short_file.split("/backend/", 1)[1]
    return f"{short_file}:{target.lineno} in {target.name}"


def record_error(
    *,
    request_id: str,
    method: str,
    path: str,
    status_code: int,
    exc: BaseException,
    include_traceback: bool,
) -> ErrorLogEntry:
    where = extract_crash_location(exc)
    tb_text = traceback.format_exc() if include_traceback else None
    entry = ErrorLogEntry(
        timestamp=datetime.now(timezone.utc).isoformat(),
        request_id=request_id,
        method=method,
        path=path,
        status_code=status_code,
        error_type=type(exc).__name__,
        message=str(exc),
        where=where,
        traceback_text=tb_text,
    )
    RECENT_ERRORS.appendleft(entry)
    return entry


def get_recent_errors() -> list[dict]:
    return [asdict(entry) for entry in RECENT_ERRORS]
