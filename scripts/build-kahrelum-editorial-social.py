#!/usr/bin/env python3
"""Build strictly source-custodied 1200x630 KAHRELUM editorial social cards.

No remote images, unlicensed photos, downloaded typefaces or fabricated source media.
SVG sources are the editable originals; generated PNGs are the publication assets.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import struct
from pathlib import Path

try:
    import cairosvg
except ImportError as exc:
    raise SystemExit("Missing CairoSVG. Install pinned cairosvg==2.8.2") from exc

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "social" / "editorial-source"
DEST = ROOT / "assets" / "social"
MANIFEST = DEST / "nfl-editorial-v2-manifest.json"
DIMENSIONS = (1200, 630)
CARDS = (
    ("nfl/trade-volume-challenge-2026.html", "nfl-trade-volume-challenge-2026", "og-nfl-trade-volume-challenge-2026-v2.png"),
    ("nfl/trades.html", "nfl-trades", "og-nfl-trades-v2.png"),
    ("nfl/film-room.html", "nfl-film-room", "og-nfl-film-room-v2.png"),
    ("nfl/analysis.html", "nfl-analysis", "og-nfl-analysis-v2.png"),
    ("sports.html", "sports-desk", "og-sports-v2.png"),
    ("nfl/deadline-watch-2026.html", "nfl-deadline-watch-2026", "og-nfl-deadline-watch-2026-v2.png"),
    ("nfl/weekly-brief.html", "nfl-weekly-brief", "og-nfl-weekly-brief-v2.png"),
    ("insights/nfl-brier-accountability.html", "nfl-brier-accountability", "og-insights-nfl-brier-accountability-v2.png"),
)
def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def validate_png(data: bytes) -> None:
    if data[:8] != bytes([137, 80, 78, 71, 13, 10, 26, 10]):
        raise ValueError("PNG signature mismatch")
    if struct.unpack(">II", data[16:24]) != DIMENSIONS:
        raise ValueError("PNG not exactly 1200x630")
    if len(data) < 10_000:
        raise ValueError("Social preview appears empty or incomplete")

def run(check: bool) -> None:
    records = []
    digests = set()
    for page, stem, output_name in CARDS:
        source = SOURCE / (stem + ".svg")
        png = DEST / output_name
        art = source.read_bytes()
        if b"<svg" not in art or b"K A H R E L U M" not in art:
            raise ValueError("Invalid branded source: " + str(source))
        if b"source-cu" in art or b"..." in art:
            raise ValueError("Truncated template copy: " + str(source))
        rendered = cairosvg.svg2png(bytestring=art, output_width=1200, output_height=630)
        validate_png(rendered)
        digest = sha(rendered)
        if digest in digests:
            raise ValueError("Duplicate social image for distinct page: " + page)
        digests.add(digest)
        if check:
            if not png.exists() or png.read_bytes() != rendered:
                raise ValueError("Output absent or not reproducible: " + str(png))
        else:
            png.write_bytes(rendered)
        records.append({
            "route": "/" + page.removesuffix(".html"),
            "source": source.relative_to(ROOT).as_posix(),
            "output": png.relative_to(ROOT).as_posix(),
            "sourceSha256": sha(art),
            "sha256": digest,
            "width": 1200,
            "height": 630,
        })
    manifest = {
        "schema": "KAHRELUM_NFL_EDITORIAL_SOCIAL_v2",
        "purpose": "Content-specific, coherent KAHRELUM Sports Intelligence social previews",
        "renderer": "CairoSVG 2.8.2",
        "immutableSources": True,
        "assets": records,
    }
    serial = json.dumps(manifest, indent=2, ensure_ascii=True) + "\n"
    if check:
        if not MANIFEST.exists() or MANIFEST.read_text(encoding="utf-8") != serial:
            raise ValueError("Scoped output manifest is stale")
    else:
        MANIFEST.write_text(serial, encoding="utf-8")
    print(json.dumps({"validated": True, "mode": "check" if check else "build",
                     "assets": len(records), "unique": len(digests), "manifest": str(MANIFEST)}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    run(args.check)
