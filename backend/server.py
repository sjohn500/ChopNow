"""Threaded HTTP server for the ChopBellyFull Python backend.

Designed for clarity and fast debugging:
- Every request receives a unique `request_id` (logged alongside method, path, status, and duration).
- Expected errors (`AppError`) return clean JSON `{ error, code, request_id }`.
- Unexpected crashes log a full Python traceback to stdout AND return exact
  file + line number info (`where`) in JSON so you immediately see where a bug happened.
"""

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import sys
import time
from typing import Any
from urllib.parse import urlparse
import uuid

from .config import settings
from .db import init_db
from .errors import AppError, BadRequestError, NotFoundError, record_error
from . import routes
from .storage import read_uploaded_file


class ChopBellyRequestHandler(BaseHTTPRequestHandler):
    # Keep logs clean via our structured logger instead of BaseHTTPRequestHandler's default stderr format.
    def log_message(self, format: str, *args: Any) -> None:
        return

    def _headers_dict(self) -> dict[str, str]:
        return {k: v for k, v in self.headers.items()}

    def _read_raw_body(self) -> bytes:
        length_header = self.headers.get("Content-Length", "0").strip()
        try:
            length = int(length_header)
        except ValueError as exc:
            raise BadRequestError("Invalid Content-Length header.") from exc
        if length <= 0:
            return b""
        if length > 10 * 1024 * 1024:
            raise BadRequestError("Request body too large (max 10 MB).")
        return self.rfile.read(length)

    def _read_json_body(self) -> dict[str, Any]:
        raw = self._read_raw_body()
        if not raw:
            return {}
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            raise BadRequestError("Invalid JSON request body.") from exc
        if not isinstance(parsed, dict):
            raise BadRequestError("JSON body must be an object.")
        return parsed

    def _send_json(self, status_code: int, payload: Any) -> None:
        data = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Headers",
            "Authorization, Content-Type",
        )
        self.send_header(
            "Access-Control-Allow-Methods",
            "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        )
        self.end_headers()
        self.wfile.write(data)

    def _send_bytes(
        self,
        status_code: int,
        data: bytes,
        content_type: str,
        cache_control: str | None = None,
    ) -> None:
        self.send_response(status_code)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Access-Control-Allow-Origin", "*")
        if cache_control:
            self.send_header("Cache-Control", cache_control)
        self.end_headers()
        self.wfile.write(data)

    def _send_redirect(self, location: str) -> None:
        self.send_response(303)
        self.send_header("Location", location)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_OPTIONS(self) -> None:
        self._send_bytes(204, b"", "text/plain")

    def do_GET(self) -> None:
        self._handle("GET")

    def do_POST(self) -> None:
        self._handle("POST")

    def do_PUT(self) -> None:
        self._handle("PUT")

    def do_PATCH(self) -> None:
        self._handle("PATCH")

    def do_DELETE(self) -> None:
        self._handle("DELETE")

    def _handle(self, method: str) -> None:
        request_id = f"req_{uuid.uuid4().hex[:8]}"
        started = time.perf_counter()
        parsed_url = urlparse(self.path)
        path = parsed_url.path.rstrip("/") or "/"
        headers = self._headers_dict()
        status_out = 500

        try:
            # Uploaded image static routes: /uploads/<user_id>/<filename>
            if method == "GET" and path.startswith("/uploads/"):
                rel = path[len("/uploads/"):]
                data, content_type = read_uploaded_file(rel)
                status_out = 200
                self._send_bytes(
                    200,
                    data,
                    content_type,
                    cache_control="public, max-age=31536000, immutable",
                )
                return

            # Health & diagnostics
            if method == "GET" and path == "/api/health":
                status_out, payload = routes.handle_health()
                self._send_json(status_out, payload)
                return

            if method == "GET" and path == "/api/debug/errors":
                status_out, payload = routes.handle_debug_errors()
                self._send_json(status_out, payload)
                return

            # Authentication & Profile
            if method == "POST" and path == "/api/auth/signup":
                status_out, payload = routes.handle_signup(self._read_json_body())
                self._send_json(status_out, payload)
                return

            if method == "POST" and path == "/api/auth/signin":
                status_out, payload = routes.handle_signin(self._read_json_body())
                self._send_json(status_out, payload)
                return

            if method == "POST" and path == "/api/auth/signout":
                status_out, payload = routes.handle_signout(headers)
                self._send_json(status_out, payload)
                return

            if method == "GET" and path == "/api/auth/session":
                status_out, payload = routes.handle_get_session(headers)
                self._send_json(status_out, payload)
                return

            if method == "PATCH" and path == "/api/profile":
                status_out, payload = routes.handle_update_profile(
                    headers, self._read_json_body()
                )
                self._send_json(status_out, payload)
                return

            # Public Marketplace
            if method == "GET" and path == "/api/restaurants":
                status_out, payload = routes.handle_list_restaurants()
                self._send_json(status_out, payload)
                return

            # Seller Kitchen & Foods
            if method == "GET" and path == "/api/seller/kitchen":
                status_out, payload = routes.handle_get_my_kitchen(headers)
                self._send_json(status_out, payload)
                return

            if method == "PUT" and path == "/api/seller/kitchen":
                status_out, payload = routes.handle_upsert_kitchen(
                    headers, self._read_json_body()
                )
                self._send_json(status_out, payload)
                return

            if method == "PATCH" and path == "/api/seller/kitchen/delivery-fee":
                status_out, payload = routes.handle_update_delivery_fee(
                    headers, self._read_json_body()
                )
                self._send_json(status_out, payload)
                return

            if method == "GET" and path == "/api/seller/dashboard":
                status_out, payload = routes.handle_seller_dashboard(headers)
                self._send_json(status_out, payload)
                return

            if method == "POST" and path == "/api/seller/foods":
                status_out, payload = routes.handle_publish_dish(
                    headers, self._read_json_body()
                )
                self._send_json(status_out, payload)
                return

            if path.startswith("/api/seller/foods/"):
                food_id = path[len("/api/seller/foods/"):]
                if "/" not in food_id and food_id:
                    if method == "PATCH":
                        status_out, payload = routes.handle_toggle_dish(
                            headers, food_id, self._read_json_body()
                        )
                        self._send_json(status_out, payload)
                        return
                    if method == "DELETE":
                        status_out, payload = routes.handle_delete_dish(headers, food_id)
                        self._send_json(status_out, payload)
                        return

            if method == "POST" and path == "/api/storage/upload":
                status_out, payload = routes.handle_upload_photo(
                    headers, self._read_json_body()
                )
                self._send_json(status_out, payload)
                return

            # Payments & Payouts
            if method == "GET" and path == "/api/seller/payout":
                status_out, payload = routes.handle_get_my_payout(headers)
                self._send_json(status_out, payload)
                return

            if method == "GET" and path == "/api/seller/ledger":
                status_out, payload = routes.handle_seller_ledger(headers)
                self._send_json(status_out, payload)
                return

            if method == "POST" and path == "/api/payments/verify-bank":
                status_out, payload = routes.handle_verify_bank(
                    headers, self._read_json_body()
                )
                self._send_json(status_out, payload)
                return

            if method == "POST" and path == "/api/payments/save-bank":
                status_out, payload = routes.handle_save_bank(
                    headers, self._read_json_body()
                )
                self._send_json(status_out, payload)
                return

            if method == "POST" and path == "/api/payments/initialize":
                status_out, payload = routes.handle_initialize_payment(
                    headers, self._read_json_body()
                )
                self._send_json(status_out, payload)
                return

            if method == "GET" and path == "/api/payments/sandbox-checkout":
                status_out, html = routes.handle_sandbox_checkout_page(parsed_url.query)
                self._send_bytes(status_out, html.encode("utf-8"), "text/html; charset=utf-8")
                return

            if method == "POST" and path == "/api/payments/sandbox-complete":
                redirect_to = routes.handle_sandbox_complete(self._read_raw_body())
                status_out = 303
                self._send_redirect(redirect_to)
                return

            if method == "POST" and path == "/api/payments/webhook":
                status_out, text = routes.handle_paystack_webhook(
                    headers, self._read_raw_body()
                )
                self._send_bytes(status_out, text.encode("utf-8"), "text/plain; charset=utf-8")
                return

            # Orders
            if method == "GET" and path == "/api/orders":
                status_out, payload = routes.handle_list_orders(headers)
                self._send_json(status_out, payload)
                return

            if method == "PATCH" and path.startswith("/api/orders/") and path.endswith("/status"):
                order_id = path[len("/api/orders/") : -len("/status")]
                if order_id and "/" not in order_id:
                    status_out, payload = routes.handle_update_order_status(
                        headers, order_id, self._read_json_body()
                    )
                    self._send_json(status_out, payload)
                    return

            raise NotFoundError(f"No route matched {method} {path}")

        except AppError as exc:
            status_out = exc.status_code
            entry = record_error(
                request_id=request_id,
                method=method,
                path=path,
                status_code=exc.status_code,
                exc=exc,
                include_traceback=False,
            )
            self._send_json(
                exc.status_code,
                {
                    "error": exc.message,
                    "code": exc.code,
                    "request_id": request_id,
                    **({"where": entry.where} if settings.debug_errors else {}),
                },
            )
        except Exception as exc:
            status_out = 500
            entry = record_error(
                request_id=request_id,
                method=method,
                path=path,
                status_code=500,
                exc=exc,
                include_traceback=True,
            )
            print(
                f"\n[PYTHON CRASH {request_id}] {method} {path} -> {entry.error_type}: {entry.message}\n"
                f"Location: {entry.where}\n{entry.traceback_text}",
                file=sys.stderr,
                flush=True,
            )
            self._send_json(
                500,
                {
                    "error": f"Server bug ({entry.error_type}): {entry.message}",
                    "error_type": entry.error_type,
                    "request_id": request_id,
                    **({"where": entry.where} if settings.debug_errors else {}),
                },
            )
        finally:
            elapsed_ms = (time.perf_counter() - started) * 1000
            print(
                f"[PY-API {request_id}] {method} {path} -> {status_out} ({elapsed_ms:.1f}ms)",
                flush=True,
            )


def run_server() -> None:
    init_db()
    server = ThreadingHTTPServer((settings.host, settings.port), ChopBellyRequestHandler)
    mode = "sandbox" if not settings.paystack_secret_key else "live"
    print(
        f"[ChopBellyFull Python Backend] Listening on http://{settings.host}:{settings.port} "
        f"(SQLite: {settings.db_path}, Paystack: {mode})",
        flush=True,
    )
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[ChopBellyFull Python Backend] Shutting down cleanly.", flush=True)
    finally:
        server.server_close()
