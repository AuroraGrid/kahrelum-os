#!/usr/bin/env python3
"""Tiny standard-library preview server for the static public routes."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import mimetypes
import os
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ROUTES = {
    "/": "index.html",
    "/pilot": "pilot.html",
    "/demo": "demo.html",
    "/api/v1": "data/api/v1/index.json",
    "/api/v1/release": "data/api/v1/release.json",
    "/api/v1/example": "data/api/v1/example.json",
}


class PreviewHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        route = unquote(urlsplit(self.path).path)
        relative = ROUTES.get(route)
        if relative is None:
            self.send_error(404, "Route not found")
            return
        body = (ROOT / relative).read_bytes()
        content_type = mimetypes.guess_type(relative)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", content_type + ("; charset=utf-8" if content_type.startswith("text/") or content_type == "application/json" else ""))
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, _format, *_args):
        pass


def main():
    port = int(os.environ.get("PORT", "4173"))
    server = ThreadingHTTPServer(("127.0.0.1", port), PreviewHandler)
    print(f"KAHRELUM public preview: http://127.0.0.1:{server.server_port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
