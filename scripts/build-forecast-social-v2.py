#!/usr/bin/env python3
"""Deterministic 1200x630 editorial social preview from checked-in SVG source.
Safe build: only writes the dedicated v2 PNG; never touches forecast evidence.
"""
from __future__ import annotations
import argparse
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SVG = ROOT / "assets/social/og-100-forecast-challenge-v2.svg"
PNG = ROOT / "assets/social/og-100-forecast-challenge-v2.png"

def render() -> bytes:
    import cairosvg
    return cairosvg.svg2png(bytestring=SVG.read_bytes(), output_width=1200, output_height=630)

def check_image(data: bytes) -> None:
    assert data[:8] == bytes((137,80,78,71,13,10,26,10)), "Invalid PNG signature"
    assert struct.unpack(">II", data[16:24]) == (1200,630), "Invalid social preview dimensions"
    assert len(data) >= 10_000, "Suspiciously tiny raster output"

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="Verify existing PNG bytes against deterministic render")
    args = parser.parse_args()
    source = SVG.read_text(encoding="utf-8")
    for expected in ("KAHRELUM", "100", "FORECASTS", "FIVE DOMAINS", "AUDIT PENDING", "OUTCOMES OPEN"):
        assert expected in source, f"Expected English label missing: {expected}"
    expected = render()
    check_image(expected)
    if args.check:
        assert PNG.exists(), "The v2 raster was not committed"
        assert PNG.read_bytes() == expected, "Committed social raster differs from source"
        print("Verified deterministic 1200x630 English v2 social preview:", PNG)
    else:
        PNG.parent.mkdir(parents=True, exist_ok=True)
        PNG.write_bytes(expected)
        print("Created deterministic 1200x630 v2 social preview:", PNG)

if __name__ == "__main__":
    main()
