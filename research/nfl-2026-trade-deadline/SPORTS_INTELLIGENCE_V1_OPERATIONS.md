# KAHRELUM Sports Intelligence v1.0 operations

Status date: 2026-10-30. This is an operational boundary document, not a claim that every named reporter or team site is continuously monitored.

## Pipeline and KAHRELUM architecture

`ROUTER -> SCOUT -> SOURCEGRID -> K-ALIGN -> IPR -> BLACKGLASS-I -> CRF -> COMMAND -> BLACKGLASS-II -> RECORD LOCK`

- **ROUTER / SCOUT:** the scheduled GitHub Actions workflow invokes `scripts/sports_intelligence.py ingest` and fetches only registered credential-free endpoints.
- **SOURCEGRID:** `nfl/sourcegrid.json` distinguishes tested integrations from watchlist-only reporters, broadcasts and all 32 official team sites. `nfl/source-observations.json` preserves original URLs, first/last observed UTC timestamps and normalized deduplication keys.
- **K-ALIGN / IPR:** candidate names, claim-language classes and opposite availability language are reconciled. An automated match is a review signal, not proof.
- **BLACKGLASS-I / CRF:** every network observation defaults to `UNVERIFIED`, `REVIEW_REQUIRED`, and `BLOCKED_PENDING_ORIGINAL_SOURCE_REVIEW`. A transaction-like headline cannot become `FACT` from a feed alone.
- **COMMAND:** `nfl/review-queue.json` is the decision queue. Priority public alerts are capped at three and can be created only from explicitly reviewed public updates.
- **BLACKGLASS-II / RECORD LOCK:** `nfl/forecast-ledger.json` is append-only. Original locks and revisions use chained SHA-256 record hashes and immutable 40-character Git commit references. Original values and timestamps are never rewritten.

## Scheduling and truthful freshness

`.github/workflows/sports-intelligence-sourcegrid.yml` runs at minute 17 each hour, avoiding the most congested top-of-hour period. It runs tests before network access, records success/degradation/failure in `nfl/refresh-status.json`, commits generated custody files, and fails visibly if every integration fails.

GitHub schedule limitations apply: schedules run from the latest default-branch commit, can be delayed, and public-repository schedules can be disabled after 60 days without repository activity. The dashboard therefore displays the actual last successful check and never infers success from the cron definition.

At or after `2026-11-10T21:00:00Z`, ingestion performs zero deadline-source fetches and writes `DEADLINE_WINDOW_CLOSED`. At or after `2026-11-12T14:00:00Z`, it runs the factual audit. The extra November 12 cron invokes the same guarded logic; it does not make annual future seasons share the 2026 ledger.

## Publication boundary

GitHub Actions has no Firebase deployment secret. Scheduled checks can update the repository's custody/status records, but production publication remains the authorized workflow:

1. `scripts/deploy-unified-firebase.ps1 -Plan`
2. `scripts/deploy-unified-firebase.ps1 -Preview`
3. Browser and data review of the exact preview
4. `scripts/deploy-unified-firebase.ps1 -Promote`

This is deliberate. A scheduled discovery item cannot bypass review or production-drift checks. Adding unattended Firebase promotion requires a separately authorized least-privilege deployment identity and a design that preserves the exact-preview promotion gate.

## Evidence classes

- `FACT`: official transaction or directly authenticated official statement.
- `REPORT`: reviewed, attributable original journalism stating a specific claim.
- `INFERENCE`: KAHRELUM analysis, never represented as sourced fact.
- `FORECAST`: explicitly locked probability, binary event and horizon.
- `UNVERIFIED`: discovery or evidence insufficient for a stronger class.

Hypothetical destinations, analysis, roster fits and radio discussion are not inquiries. An inquiry is not an offer; an offer is not an agreement; an agreement is not official until independently established under the documented outcome rule.

## Deadline audit and scoring

The November 12 audit uses only official NFL transaction evidence. Every eligible preregistered event, including non-trades, is included in the denominator. The latest valid pre-deadline revision is scored once per event. Brier score is `mean((p-y)^2)` and is compared with an all-NO baseline. Reporter-claim accuracy remains a separate system.

If no independently resolved eligible prospective forecasts exist, the audit status is `INSUFFICIENT_ELIGIBLE_SAMPLE` and Brier remains `null`. The 20 conversation-recovered probabilities remain `EXCLUDED_PROVISIONAL`; earlier completed trades cannot be awarded retrospective wins.

## Expansion boundary

`sports/module-registry.json` provides isolated, empty definitions for NFL free agency, NFL Draft, NBA trades and NCAA football. Each module requires its own event namespace, sources, deadline/lifecycle, outcome authority and forecast ledger. No NFL trade record is copied into another sport or market.

