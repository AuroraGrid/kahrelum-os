# KAHRELUM Release 3 · November 12, 2026 · Factual, commercial and discovery repairs

**Scope:** Read-only pre-release audit of 52 live pages followed by a minimal, authorized production repair. No pictures, new artwork, candidate portraits, forecast rewrites, analytics beacons, user message sends or broad hosting overwrite.

## P0: NFL deadline state and scoring integrity

- Prior public `nfl/official-trade-snapshot-2026.json` remained on **November 5** with `DEADLINE_STILL_OPEN`; `nfl/refresh-status.json` was a **November 10 15:48 UTC** operational sweep still labelled `FRESH` and `DEADLINE_WINDOW_OPEN`; `nfl/deadline-audit.json` still said `PENDING_SCHEDULED_AUDIT`. These were not post-deadline evidence.
- Exact pre-correction public file contents have been copied to `research/nfl-2026-trade-deadline/archive-public-2026-11-12/` as separate permanent receipts. Git commit history retains originals too.
- Replacement public metadata uses `HISTORICAL_PRE_DEADLINE_SNAPSHOT`, `DEADLINE_CLOSED_ARCHIVE`/`HISTORICAL_ARCHIVE`, and `FIXED_COHORT_SCORED_FC1_UNRESOLVED`. **Do not change actual 2026-11-10 operational-check timestamps or claim the 37 sources were rerun.**
- New `nfl/deadline-reconciled-2026.json`: 17 completed in-season trades, separately 5 November 10 club-chronology transactions and 7 register-dated completed transactions. Denver's November 11 withdrawal of a proposed Daiyan Henley trade and cancellation of Ebiketie are accounted for. The source row references come from the pre-existing November 12 full research audit.
- The October 31 fixed 123-player cohort: 8 YES, 115 NO, Brier 0.077813821138; all-NO 0.065040650407, **KAHRELUM worse**. Descriptive 50% threshold: 1 TP, 3 FP, 7 FN, 112 TN.
- The **separate six-trade FC1 volume forecast stays unscored** because the original contract's effective-date convention and November 9 club announcements / November 10 registry dates conflict. Original FC1 Poisson parameters, file, lock and timestamps remain byte-for-byte unchanged.
- UI is updated together with JSON and JavaScript. The October 31 weekly brief is explicitly dated as an archive rather than rewritten. The former NFL SourceGrid feed is **not now a real-time post-deadline live source**.
- Source: [November 12 post-deadline outcome audit](../nfl-2026-trade-deadline/2026-11-12_POST_DEADLINE_OUTCOME_AUDIT.md) and [FC1 adjudication memo](../nfl-2026-trade-deadline/2026-11-12_FC1_OUTCOME_ADJUDICATION.md).

## P0/P1: Commercial buyer journey

The existing `/pilot` page already disclosed that its form generated a user-reviewed email and **did not actually send**. Instead of secretly integrating a third-party data broker or pretending there is a secure backend, the release adds optional contact name/email fields, an accessible local inquiry preview, browser-native email-field validation, copy fallback and explicit **NOT SENT** confirmation. The buyer still chooses to send the email manually. Pricing ($750 Fit Check, $2,500 Founding Pilot), permission checks, scope, 14-day credit and no-confidential-data warnings remain unchanged. A future authenticated, consent-based server-side submission lane would require a separate approved architecture/security review.

## P1: SEO, search and source-true metadata

- Article dates, titles and descriptions corrected for November 12 Hegseth and Nvidia/CHIP-01 developments. Three article templates receive accurate, modest `Article` JSON-LD referencing existing canonical URLs and images. **No invented LocalBusiness address, review stars, government recognition or guarantees.**
- `/election-data/` description rewritten for clear crawler extraction, while existing structured data and evidence boundaries remain.
- Existing Firebase sitemap is verified from the live baseline and gets <lastmod> updates **only for 13 routes with a grounded date**. Other entries are left without dates rather than backdated to fake freshness. No mass reindex claims; Search Console outcomes require their own verified follow-up.
- The original homepage source already contains the completed November 5 Israel C7 record. The guarded publisher replaces a specifically known stale `Official results and final accuracy remain pending` sentence **only if it still exists** in live Firebase, while otherwise leaving the homepage unchanged.

## P1/P2: Mobile accessibility and integrity

Static CSS adds narrow-screen constraints at 320–480px: single-column site drawer, 44px touch controls, full-width form fields, accessible focus, table horizontal scrolling. This is a **code-level safeguard, not claimed browser-verified performance**. Interactive browser testing was unavailable due connected browser credits; Lighthouse/Core Web Vitals and Search Console account indexing need independent instrumentation before final measured pass/fail.

## Release boundaries

The guarded `release3-verified` Firebase profile only changes the documented NFL JSON/HTML/JS, pilot body/inline script, three article metadata headers, election-data description, shared CSS, optional obsolete homepage sentence, and sitemap XML; all other live file hashes and Firebase Hosting configuration remain intact. Tests must RED→GREEN, full CI pass, live version Plan→Preview→Promote, production readback and exact changedPaths inspection. No files removed or pictorial files modified.

**No unsupported forecast win, new private investigation disclosure, invisible client-server contact submission, assumed mobile-browser score, or company leadership rumor is authorized.**
