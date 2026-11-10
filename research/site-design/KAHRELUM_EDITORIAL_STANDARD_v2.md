# KAHRELUM | Editorial Design Standard v2

**Reference quality:** The Nvidia–Megaspeed chip-custody investigation preview demonstrates strong KAHRELUM editorial treatment: specific subject matter, a meaningful investigative artifact, disciplined typography, consistent visual identity, and concise readable text. It is a reference for standard, not a photograph or composition to duplicate.

## Production criteria

1. **Content-specific design.** A forecast gets a source-locked model record; a Film Room gets a rights-safe diagram; a trade desk gets evidence classes; an accountability article gets review status. Do not recycle the same geometric abstraction across unrelated stories.
2. **Legibility.** Keep headlines and evidence cues fully visible at 1200×630. No automatically truncated descriptions, arbitrary "SI" badges, AI-generated pseudo-text, or synthetic transaction receipts represented as real league documents.
3. **Cohesive, not cloned.** Consistent dark editorial side panel, KAHRELUM wordmark, restrained orange category line, generous margins, strong type hierarchy and footer custody strip. Distinct topic art for each route.
4. **Transparent sources.** Artwork is a conceptual editorial illustration, never an authenticated transaction document, licensed game still, client testimonial, or official league endorsement.
5. **Responsive intelligence pages.** Use the existing site shell and the structured Sports/Film Room report layout: information hierarchy, desk navigation, source table, forecast lock and scoring boundary. Avoid rounded-card saturation, ornamental widgets and unsupported "LIVE" labels.
6. **Source integrity.** Preserve the original GitHub forecast lock, registration date convention, uncertainty and information cutoff; a social card redesign is not a forecast revision.
7. **Publication verification.** Unique 1200×630 Open Graph + X image for every page. Use versioned filenames to avoid stale crawler caches. Confirm HTTP 200, actual PNG dimensions, SHA-256, original article and card hash, and Firebase preview/promote/readback receipts.
8. **No blind manifest rollback.** The current live Investigations manifest uses AIR-01 artwork while an older repository-wide manifest is stale. This v2 release writes a dedicated eight-card manifest and does not overwrite the global manifest or unrelated case art.

## Applied now: 8 targeted cards

| Route | Specific art direction |
|---|---|
| /nfl/trade-volume-challenge-2026 | Forecast custody dossier with original 6-trade count, 6.5 mean and timestamp |
| /nfl/trades | Four-tier source/status board: verified, reported, pending, unknown |
| /nfl/film-room | Football play diagram with rights and review cues, not protected game film |
| /nfl/analysis | Evidence comparison: inquiry versus executed deal |
| /sports | An operations registry for NFL intelligence, film, forecasts and accountability |
| /nfl/deadline-watch-2026 | Official transaction register and distinct source dates |
| /nfl/weekly-brief | Reviewed intelligence digest and source ledger |
| /insights/nfl-brier-accountability | Three uncertified calculations and explicit exclusion control |

The original source illustrations are stored in `assets/social/editorial-source/`. `scripts/build-kahrelum-editorial-social.py` renders exact 1200×630 PNGs with pinned CairoSVG 2.8.2 and produces `assets/social/nfl-editorial-v2-manifest.json`. The immutable original forecast remains in GitHub. This release does not assert final trade-count results.

## Unchanged visual backlog

The broader KAHRELUM site has additional assets outside these eight. They should be reviewed independently against the same criteria, including case-specific photos, source custody and non-sports pages. **Do not claim full-site art remediation from an eight-card NFL release.** Prioritize any remaining duplicate templates or truncated copy, then test and publish each approved scope.

## Acceptance

A release is accepted only when the site page and versioned OG image return HTTP 200, the source/cutoff records remain unchanged, and both desktop and mobile layout checks pass. Automated tests prove data and structural integrity; screenshots still require human visual review.
