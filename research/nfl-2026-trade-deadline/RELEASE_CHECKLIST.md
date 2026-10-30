# Public NFL Desk · Safe Firebase Release Checklist

**Current state:** public repository feature branch pending merge and Firebase release. The main production site is NOT automatically updated by a GitHub commit.

## Pre-release prerequisites

1. Review proposed source bytes under \`nfl/trades.html\` and \`nfl/trade-board.json\`; check JSON schema, exact record totals, source links and evidence status.
2. Confirm every deal against NFL.com's official list. Fix any disputed compensation before making a financial/contract claim.
3. Confirm \`/nfl/trades\` maps to a file at \`/nfl/trades.html\` under existing Hosting \`cleanUrls: true\`.
4. Add \`nfl/trades.html\` and \`nfl/trade-board.json\` to the bounded \`OVERLAY_FILES\` array and \`/nfl/trades\` to preview verification and sitemap extension in \`scripts/firebase-overlay-release.cjs\`.
5. Do **NOT** re-upload an old local Firebase directory. Preserve all existing live file hashes, Hosting config, election pages and API rewrites.
6. Run canonical GitHub CI and local syntax, JSON parse and filter tests.
7. On authenticated deployment workstation use \`.\scripts\deploy-unified-firebase.ps1 -Plan\`, \`-Preview\`, examine exact changed files and preview URL, then \`-Promote\` only if checks pass and the live base version has not moved.
8. Independently read back \`https://kahrelum.com/nfl/trades\` and \`https://kahrelum.com/nfl/trade-board.json\` and verify status, canonical URL, JSON, every internal link, and prior API bodies. If no authorized Firebase CLI exists, state production blocker and **do not claim the URL is live**.
9. Publish social article only *after* the production URL is independently verified. Do not insert checkout or paid membership calls before eligibility is confirmed.

## Incremental update rules

Commit changed data atomically with old values retained in history (new data timestamp and commit SHA), and append research/correction notes for any ≥5 percentage point change. Keep 2026-10-30 initial conversation-recovered forecast values separate from newly prospectively locked post-publication forecasts. Never remove no-trade candidates to improve scoring. Each update must pass schema validation and generate a visible \`asOf\` cutoff; don't show stale board as live.

## Sunset

After November 10, 2026, 4:00 p.m. EST, stop trade-probability alerts, keep the board archival, and release a full, source-linked deadline recap with actual scored eligible predictions only. NFL Injury + Fantasy Watch remains separately governed.
