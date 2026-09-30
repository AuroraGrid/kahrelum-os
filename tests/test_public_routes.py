#!/usr/bin/env python3
"""Route, JSON contract, and local-link checks for the static public surface."""
import json
from pathlib import Path
import sys
import threading
from urllib.error import HTTPError
from urllib.request import urlopen
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from preview_server import PreviewHandler, ROUTES  # noqa: E402
from http.server import ThreadingHTTPServer  # noqa: E402


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.hrefs = []
        self.ids = set()
        self.text = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and attrs.get("href"):
            self.hrefs.append(attrs["href"])
        if attrs.get("id"):
            self.ids.add(attrs["id"])

    def handle_data(self, data):
        self.text.append(data)


def request(base, path):
    with urlopen(base + path, timeout=3) as response:
        return response.status, response.headers.get_content_type(), response.read()


def run():
    server = ThreadingHTTPServer(("127.0.0.1", 0), PreviewHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    base = f"http://127.0.0.1:{server.server_port}"
    try:
        config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        rewrites = {item["source"]: item["destination"] for item in config["rewrites"]}
        assert config["cleanUrls"] is True
        expected = {
            "/api/v1": "/data/api/v1/index.json",
            "/api/v1/release": "/data/api/v1/release.json",
            "/api/v1/example": "/data/api/v1/example.json",
        }
        assert rewrites == expected, f"Unexpected Vercel API route map: {rewrites}"

        for route in ("/", "/pilot", "/demo", *expected):
            status, _, _ = request(base, route)
            assert status == 200, f"{route} returned HTTP {status}"
        for route in ("/api/v1", "/api/v1/release", "/api/v1/example"):
            status, content_type, body = request(base, route)
            assert status == 200 and content_type == "application/json", f"{route} is not JSON"
            json.loads(body)

        capabilities = json.loads((ROOT / ROUTES["/api/v1"]).read_text(encoding="utf-8"))
        assert capabilities["access"] == "read-only"
        assert capabilities["capabilities"]["live_analysis"] is False
        assert capabilities["capabilities"]["runtime_execution"] is False
        assert all("analyze" not in endpoint["path"] for endpoint in capabilities["endpoints"])

        release = json.loads((ROOT / ROUTES["/api/v1/release"]).read_text(encoding="utf-8"))
        assert release["runtime_artifact"]["sha256"] == "c6caca3290abbee7121fb743fabb1210b59b7536aa46dd6d6874cd02962bc1e1"
        assert release["runtime_artifact"]["served_by_this_api"] is False
        assert release["runtime_connected"] is False

        example = json.loads((ROOT / ROUTES["/api/v1/example"]).read_text(encoding="utf-8"))
        assert example["synthetic"] is True and example["live_execution"] is False
        assert example["execution_status"].startswith("PRERECORDED")
        assert {"question", "evidence", "inference", "uncertainty", "counterargument", "decision_gate", "record"} <= example.keys()
        demo = (ROOT / "demo.html").read_text(encoding="utf-8")
        assert 'fetch("/api/v1/example"' in demo, "Demo must display the shared API example source"
        assert "Not a live run" in demo and "prerecorded" in demo

        pilot = (ROOT / "pilot.html").read_text(encoding="utf-8")
        assert 'href="mailto:hasan@kahrelum.com?' in pilot
        assert "opens an email draft" in pilot
        assert "public GitHub issue" in pilot
        assert "guaranteed" in pilot.lower()

        # Every local HTML link must resolve to a declared route or an actual file;
        # each local fragment must identify an element on the linked page.
        page_paths = {"/": ROOT / "index.html", "/pilot": ROOT / "pilot.html", "/demo": ROOT / "demo.html"}
        for route, path in page_paths.items():
            parser = LinkParser()
            parser.feed(path.read_text(encoding="utf-8"))
            for href in parser.hrefs:
                if href.startswith(("https://", "http://", "mailto:", "tel:", "javascript:")):
                    continue
                target, _, fragment = href.partition("#")
                target = target or route
                if target.startswith("/"):
                    assert target in ROUTES or target in ("/api/v1/release", "/api/v1/example"), f"Broken local route {href} in {path.name}"
                    target_page = page_paths.get(target)
                    if fragment and target_page:
                        target_parser = LinkParser()
                        target_parser.feed(target_page.read_text(encoding="utf-8"))
                        assert fragment in target_parser.ids, f"Broken fragment {href} in {path.name}"
                else:
                    assert (path.parent / target).exists(), f"Broken relative link {href} in {path.name}"

        try:
            urlopen(base + "/api/v1/missing", timeout=3)
            raise AssertionError("Unknown API route should return 404")
        except HTTPError as error:
            assert error.code == 404
        print("Public route, JSON contract, and broken-link checks passed.")
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)


if __name__ == "__main__":
    run()
