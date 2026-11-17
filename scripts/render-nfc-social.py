#!/usr/bin/env python3
"""Deterministic social preview from KAHRELUM source SVG. Writes PNG bytes to stdout only."""
from pathlib import Path
import sys
import cairosvg

root = Path(__file__).resolve().parents[1]
allowed = {'assets/social/og-nfc-east-title-2026.svg', 'assets/social/og-nfc-east-title-2026-11-15.svg'}
candidate = sys.argv[1] if len(sys.argv)>1 else 'assets/social/og-nfc-east-title-2026.svg'
if candidate not in allowed:
    raise SystemExit('unapproved NFC East social artwork path')
svg = (root / candidate).read_bytes()
sys.stdout.buffer.write(cairosvg.svg2png(bytestring=svg, output_width=1200, output_height=630))
