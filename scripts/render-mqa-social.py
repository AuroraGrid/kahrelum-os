"""Render original vector art; no third-party imagery. Requires CairoSVG 2.8.2."""
from pathlib import Path
import cairosvg
root=Path(__file__).resolve().parents[1]
source=root/'assets/social/og-mqa001.svg'
art=source.read_text().split('>',1)[1].rsplit('</svg>',1)[0]
for name,w,h in [('og-mqa001',1200,630),('mqa001-linkedin',1200,627),('mqa001-substack',1456,1048),('mqa001-x-article',1500,600)]:
 scale=min(w/1200,h/630);x=(w-1200*scale)/2;y=(h-630*scale)/2
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" fill="#f4efe6"/><g transform="translate({x},{y}) scale({scale})">{art}</g></svg>'
 cairosvg.svg2png(bytestring=svg.encode(),write_to=str(root/'assets/social'/f'{name}.png'))
 print(name,w,h)
