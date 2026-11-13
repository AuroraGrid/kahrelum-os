#!/usr/bin/env python3
"""Deterministic social preview from KAHRELUM source SVG. Writes PNG bytes to stdout only."""
from pathlib import Path
import sys
import cairosvg

root = Path(__file__).resolve().parents[1]
svg = (root / "assets/social/og-nfc-east-title-2026.svg").read_bytes()
sys.stdout.buffer.write(cairosvg.svg2png(bytestring=svg, output_width=1200, output_height=630))
