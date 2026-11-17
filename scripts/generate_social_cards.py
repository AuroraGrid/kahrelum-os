#!/usr/bin/env python3
"""Generate route-specific 1200x630 social cards and canonical metadata.

The bitmap background is a project-owned KAHRELUM design asset. Titles,
descriptions, route labels and output filenames are derived deterministically
from each repository HTML page that declares a kahrelum.com canonical URL.
"""

from __future__ import annotations

import hashlib
import html
import json
import re
import textwrap
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
BACKGROUND = ROOT / "assets" / "kahrelum-social-background-v1.png"
OUTPUT_DIR = ROOT / "assets" / "social"
MANIFEST = ROOT / "assets" / "social-manifest.json"
WIDTH, HEIGHT = 1200, 630

FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
FONT_SERIF_BOLD = Path(r"C:\Windows\Fonts\georgiab.ttf")
FONT_MONO = Path(r"C:\Windows\Fonts\consola.ttf")

CANONICAL_RE = re.compile(r'<link\s+rel="canonical"\s+href="(https://kahrelum\.com/[^"#?]*)"[^>]*>', re.I)
TITLE_RE = re.compile(r"<title>(.*?)</title>", re.I | re.S)
DESCRIPTION_RE = re.compile(r'<meta\s+name="description"\s+content="([^"]*)"[^>]*>', re.I)
SOCIAL_META_RE = re.compile(
    r'<meta\s+(?:property|name)="(?:og:(?:type|url|title|description|image(?::(?:secure_url|type|width|height|alt))?)|twitter:(?:card|title|description|image|image:alt))"[^>]*>\s*',
    re.I,
)

SKIP_PARTS = {".git", ".firebase-deploy", "hosting", "node_modules"}


def clean_text(value: str) -> str:
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", html.unescape(value)).strip()


def page_category(route: str) -> str:
    if route.startswith("/nfl/") or route.startswith("/sports"):
        return "SPORTS INTELLIGENCE"
    if route.startswith("/election"):
        return "ELECTION INTELLIGENCE"
    if route.startswith("/insights/"):
        return "KAHRELUM INSIGHTS"
    return {
        "/": "EVIDENCE-TO-DECISION INTELLIGENCE",
        "/assurance": "AI & AGENT ASSURANCE",
        "/investigations": "INVESTIGATIONS & OSINT",
        "/forecasting": "FORECASTING & INTELLIGENCE",
        "/digital-id": "DIGITAL IDENTITY WATCH",
        "/one": "KAHRELUM ONE",
        "/os": "OPERATING SYSTEM & METHOD",
        "/insights": "KAHRELUM INSIGHTS",
    }.get(route, "KAHRELUM INTELLIGENCE")


def route_slug(route: str) -> str:
    return "home" if route == "/" else route.strip("/").replace("/", "-")


def display_title(title: str) -> str:
    if title.startswith("KAHRELUM | "):
        return title.split(" | ", 1)[1].strip()
    return re.sub(r"\s+\|\s+KAHRELUM.*$", "", title).strip()


def fit_title(draw: ImageDraw.ImageDraw, title: str, max_width: int = 690) -> tuple[ImageFont.FreeTypeFont, list[str]]:
    for size in range(54, 35, -2):
        font = ImageFont.truetype(str(FONT_SERIF_BOLD), size)
        words = title.split()
        lines: list[str] = []
        current = ""
        for word in words:
            candidate = f"{current} {word}".strip()
            if draw.textbbox((0, 0), candidate, font=font)[2] <= max_width:
                current = candidate
            else:
                if current:
                    lines.append(current)
                current = word
        if current:
            lines.append(current)
        if len(lines) <= 3:
            return font, lines
    return ImageFont.truetype(str(FONT_SERIF_BOLD), 34), textwrap.wrap(title, width=30)[:3]


def draw_tracking(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, font: ImageFont.FreeTypeFont, fill: str, tracking: int) -> None:
    x, y = xy
    for char in value:
        draw.text((x, y), char, font=font, fill=fill)
        x += draw.textlength(char, font=font) + tracking


def make_card(route: str, title: str, description: str, output: Path) -> None:
    source = Image.open(BACKGROUND).convert("RGB")
    ratio = max(WIDTH / source.width, HEIGHT / source.height)
    scaled = source.resize((round(source.width * ratio), round(source.height * ratio)), Image.Resampling.LANCZOS)
    left = max(0, (scaled.width - WIDTH) // 2)
    top = max(0, (scaled.height - HEIGHT) // 2)
    card = scaled.crop((left, top, left + WIDTH, top + HEIGHT)).convert("RGBA")
    overlay = Image.new("RGBA", card.size, (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.rectangle((0, 0, 790, HEIGHT), fill=(246, 241, 232, 244))
    od.rectangle((0, 0, WIDTH, 11), fill=(18, 66, 55, 255))

    digest = hashlib.sha256(route.encode("utf-8")).digest()
    accents = [(166, 119, 37), (35, 104, 89), (69, 112, 107), (113, 83, 51)]
    accent = accents[digest[0] % len(accents)]
    marker_y = 78 + digest[1] % 230
    od.rounded_rectangle((1012, marker_y, 1145, marker_y + 133), radius=66, fill=(*accent, 220), outline=(246, 241, 232, 230), width=3)
    od.line((1038, marker_y + 66, 1119, marker_y + 66), fill=(246, 241, 232, 220), width=2)
    for index in range(5):
        x = 846 + index * 43
        height = 28 + digest[index + 2] % 96
        od.rectangle((x, 541 - height, x + 7, 541), fill=(*accent, 205))
    card = Image.alpha_composite(card, overlay)
    draw = ImageDraw.Draw(card)

    brand_font = ImageFont.truetype(str(FONT_BOLD), 25)
    label_font = ImageFont.truetype(str(FONT_BOLD), 18)
    description_font = ImageFont.truetype(str(FONT_REGULAR), 21)
    mono_font = ImageFont.truetype(str(FONT_MONO), 16)
    marker_font = ImageFont.truetype(str(FONT_BOLD), 30)

    draw_tracking(draw, (62, 43), "KAHRELUM", brand_font, "#173f36", 7)
    draw.text((62, 104), page_category(route), font=label_font, fill="#6e5938")
    draw.line((62, 137, 742, 137), fill="#b9ad98", width=2)

    card_title = display_title(title)
    title_font, lines = fit_title(draw, card_title)
    y = 164
    for line in lines:
        draw.text((62, y), line, font=title_font, fill="#1f2421")
        y += title_font.size + 9

    description = description.strip()
    if description:
        max_chars = 78
        excerpt = description if len(description) <= max_chars else description[: max_chars - 1].rstrip() + "…"
        wrapped = textwrap.wrap(excerpt, width=55)[:2]
        y = max(y + 14, 385)
        for line in wrapped:
            draw.text((62, y), line, font=description_font, fill="#4f554f")
            y += 29

    draw.line((62, 528, 742, 528), fill="#b9ad98", width=2)
    draw.text((62, 548), f"kahrelum.com{route if route != '/' else ''}", font=mono_font, fill="#173f36")
    draw.text((62, 579), "EVIDENCE  •  PROBABILITY  •  ACCOUNTABILITY", font=mono_font, fill="#6e5938")

    initials = "".join(word[0] for word in page_category(route).split()[:2])
    marker_box = draw.textbbox((0, 0), initials, font=marker_font)
    marker_x = 1078 - (marker_box[2] - marker_box[0]) / 2
    draw.text((marker_x, marker_y + 46), initials, font=marker_font, fill="#f6f1e8")

    output.parent.mkdir(parents=True, exist_ok=True)
    card.convert("RGB").save(output, "PNG", optimize=True)


def social_tags(route: str, filename: str, title: str, description: str) -> str:
    canonical = f"https://kahrelum.com{route if route != '/' else '/'}"
    url = f"https://kahrelum.com/assets/social/{filename}"
    alt = html.escape(f"{display_title(title)} — KAHRELUM social preview", quote=True)
    x_title = html.escape(title, quote=True)
    x_description = html.escape(description, quote=True)
    og_type = "article" if route.startswith("/insights/") or route in {"/nfl/analysis", "/nfl/weekly-brief"} else "website"
    return (
        f'<meta property="og:type" content="{og_type}">'
        f'<meta property="og:url" content="{canonical}">'
        f'<meta property="og:title" content="{x_title}">'
        f'<meta property="og:description" content="{x_description}">'
        f'<meta property="og:image" content="{url}">'
        f'<meta property="og:image:secure_url" content="{url}">'
        '<meta property="og:image:type" content="image/png">'
        '<meta property="og:image:width" content="1200">'
        '<meta property="og:image:height" content="630">'
        f'<meta property="og:image:alt" content="{alt}">'
        '<meta name="twitter:card" content="summary_large_image">'
        f'<meta name="twitter:title" content="{x_title}">'
        f'<meta name="twitter:description" content="{x_description}">'
        f'<meta name="twitter:image" content="{url}">'
        f'<meta name="twitter:image:alt" content="{alt}">'
    )


def discover_pages() -> list[tuple[Path, str, str, str]]:
    pages: list[tuple[Path, str, str, str]] = []
    for path in sorted(ROOT.rglob("*.html")):
        if any(part in SKIP_PARTS for part in path.relative_to(ROOT).parts):
            continue
        text = path.read_text(encoding="utf-8")
        canonical = CANONICAL_RE.search(text)
        title = TITLE_RE.search(text)
        description = DESCRIPTION_RE.search(text)
        if not canonical or not title or not description:
            continue
        route = canonical.group(1).removeprefix("https://kahrelum.com") or "/"
        pages.append((path, route, clean_text(title.group(1)), clean_text(description.group(1))))
    return pages


def main() -> int:
    if not BACKGROUND.is_file():
        raise SystemExit(f"Missing background asset: {BACKGROUND}")
    records = []
    for path, route, title, description in discover_pages():
        filename = f"og-{route_slug(route)}.png"
        output = OUTPUT_DIR / filename
        make_card(route, title, description, output)

        text = path.read_text(encoding="utf-8")
        text = SOCIAL_META_RE.sub("", text)
        canonical = CANONICAL_RE.search(text)
        if not canonical:
            raise RuntimeError(f"Canonical disappeared from {path}")
        insert_at = canonical.end()
        text = text[:insert_at] + social_tags(route, filename, title, description) + text[insert_at:]
        path.write_text(text, encoding="utf-8", newline="")
        records.append({
            "route": route,
            "sourceHtml": path.relative_to(ROOT).as_posix(),
            "image": f"assets/social/{filename}",
            "title": title,
            "description": description,
            "sha256": hashlib.sha256(output.read_bytes()).hexdigest(),
            "width": WIDTH,
            "height": HEIGHT,
        })

    if len({record["image"] for record in records}) != len(records):
        raise RuntimeError("Every canonical route must have a distinct image filename")
    MANIFEST.write_text(json.dumps({"schema": "KAHRELUM_SOCIAL_CARDS_v1.0", "cards": records}, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"generated": len(records), "manifest": str(MANIFEST)}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
