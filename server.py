#!/usr/bin/env python3
"""Server cục bộ: phục vụ thư mục site/ và chuyển tiếp /api/chat tới Anthropic.

API key đọc từ file .env (hoặc biến môi trường ANTHROPIC_API_KEY), chỉ nằm ở
phía server, trình duyệt không bao giờ nhìn thấy key. Chỉ lắng nghe 127.0.0.1.
Chạy: python3 server.py   (mở http://localhost:8000)
"""
import json
import os
import ssl
import sys
import urllib.error
import urllib.request
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(ROOT, "site")
API_URL = "https://api.anthropic.com/v1/messages"
MAX_BODY = 1_000_000          # giới hạn kích thước request
MAX_TOKENS_CAP = 2048         # không cho client xin quá mức này
ALLOWED_FIELDS = {"model", "max_tokens", "system", "messages"}


def load_key():
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if key:
        return key
    try:
        with open(os.path.join(ROOT, ".env"), encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("ANTHROPIC_API_KEY="):
                    return line.split("=", 1)[1].strip().strip("'\"")
    except OSError:
        pass
    return ""


API_KEY = load_key()


def make_ssl_context():
    # Python cài từ python.org trên macOS thường thiếu CA; thử certifi rồi CA của hệ thống.
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        pass
    for p in ("/etc/ssl/cert.pem", "/opt/homebrew/etc/openssl@3/cert.pem"):
        if os.path.exists(p):
            return ssl.create_default_context(cafile=p)
    return ssl.create_default_context()


SSL_CTX = make_ssl_context()


class Handler(SimpleHTTPRequestHandler):
    def _json(self, status, obj):
        data = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/status":
            # Chỉ báo có proxy + có key hay chưa, không trả key.
            return self._json(200, {"proxy": True, "hasKey": bool(API_KEY)})
        return super().do_GET()

    def do_POST(self):
        if self.path != "/api/chat":
            return self._json(404, {"error": {"message": "Not found"}})
        if not API_KEY:
            return self._json(500, {"error": {"message": "Server chưa có ANTHROPIC_API_KEY (.env)."}})
        # Chặn trang web khác gọi vào proxy của máy này.
        origin = self.headers.get("Origin")
        if origin and origin.split("://", 1)[-1] not in (
            self.headers.get("Host", ""), "localhost:%d" % self.server.server_port,
            "127.0.0.1:%d" % self.server.server_port,
        ):
            return self._json(403, {"error": {"message": "Origin không hợp lệ."}})
        try:
            n = int(self.headers.get("Content-Length", "0"))
            if n <= 0 or n > MAX_BODY:
                raise ValueError("kích thước không hợp lệ")
            body = json.loads(self.rfile.read(n))
            payload = {k: v for k, v in body.items() if k in ALLOWED_FIELDS}
            payload["max_tokens"] = min(int(payload.get("max_tokens", 1024)), MAX_TOKENS_CAP)
            payload.pop("stream", None)
        except (ValueError, TypeError, json.JSONDecodeError) as e:
            return self._json(400, {"error": {"message": "Request lỗi: %s" % e}})

        req = urllib.request.Request(
            API_URL,
            data=json.dumps(payload).encode("utf-8"),
            method="POST",
            headers={
                "x-api-key": API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120, context=SSL_CTX) as r:
                status, data = r.status, r.read()
        except urllib.error.HTTPError as e:
            status, data = e.code, e.read()
        except (urllib.error.URLError, TimeoutError) as e:
            return self._json(502, {"error": {"message": "Không kết nối được Anthropic: %s" % e}})
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    handler = partial(Handler, directory=SITE)
    srv = ThreadingHTTPServer(("127.0.0.1", port), handler)
    print("Đồng Nai Quê Em: http://localhost:%d  (API key: %s)" % (port, "đã nạp từ .env" if API_KEY else "CHƯA CÓ"))
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
