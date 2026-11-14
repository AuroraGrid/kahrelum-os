# KAHRELUM × OpticOdds | Seven-day trial readiness

**Prepared:** November 12, 2026. **Status:** PREPARED, NOT ACTIVATED. No credentials are stored in this repository. This runbook does not establish a live vendor partnership, paid subscription, completed test, actual provider failure, or live Firebase deployment.

## Evidence and entitlements

On November 12, Chirag Manjunath of OpticOdds replied to KAHRELUM's November 9 trial request. He said that Pakistan-based businesses are eligible, that the seven-day clock begins on the day of usage, and that the trial includes pre-match and in-play SSE, historical odds, settlement, Kalshi and Polymarket. He will share a trial key when we are ready. He asked whether pricing could be closer to USD 6,000/month, and **did not** accept or reject KAHRELUM's separate proposal to provide OpticOdds a paid USD 750 independent Fit Check.

A November 12 follow-up requested a secure key, written no-auto-billing/no-auto-conversion confirmation, historical lookback clarification, a limited research tier with suitable display rights, and referral to a product/partnerships decision-maker who could evaluate the USD 750 service. Sending that request is not contractual consent.

The canonical public synthetic prototype is opticodds-market-integrity.html, merged through PRs #57 and #58. Its three scenarios (injury/prop lock, SSE reconnect, final-grade reconciliation) contain fabricated data. **Do not attach live data, credentials, or commercial claims to the public demonstration without explicit written rights and separate release approval.**

## Vendor gates before first use

- Confirm in writing that issuing the key does not start the trial and that only first authenticated usage starts the seven-day period.
- Confirm automatic expiry, no charge or paid conversion without affirmative approval, and the precise end-time calculation.
- Confirm scope and usage restrictions for injury data, odds history, SSE, settlement, Kalshi and Polymarket, and whether public derived analytics, screen captures, or redistribution are allowed.
- Confirm historical depth. The public historical endpoint documents only a **rolling two-month retention window**. Older odds may require separate permission or may be unavailable.
- Secure the trial key in a private OS vault/session variable. Never add it to GitHub, tickets, logs, HTML, URL query params, chat, or screenshots. Sync system clock and protect local test artifacts.

## API preflight and limits

The API base URL is https://api.opticodds.com/api/v3. Use the X-Api-Key request header rather than embedding the key in a URL.

Public documented limits per 15 seconds: 10 historical requests, 250 new streaming connections, and 2,500 other requests. This pilot should stay far below those ceilings. For response 429, honor Retry-After when available and back off conservatively.

Our safety-first smoke test intentionally does not connect by default:

    node scripts/opticodds-trial-smoke.cjs

After all vendor gates close, supply OPTICODDS_API_KEY **privately** in the process environment, then explicitly choose to begin trial usage:

    node scripts/opticodds-trial-smoke.cjs --live --confirm-trial-start

The script makes only one GET /sports request and stores a local metadata-only first-attempt receipt under .opticodds-trial/first-request.json (gitignored). Receipt includes UTC first-attempt time, HTTP status and non-sensitive outcome. It does not retain raw odds, the API key, or vendor-confirmed expiry. A preexisting receipt blocks a second accidental first-request run; do not delete it to erase history. Even a failed request may need vendor clarification as to whether the clock started.

Offline unit tests:

    node --test tests/opticodds-trial-smoke.test.cjs

## Seven-day evidence plan

| When | Work | Must be proven |
| --- | --- | --- |
| Day 0 (before first usage) | Verify rights/limits, key handling, secure workspace, clock, control cases | Vendor gate confirmations and no usage |
| Day 1 | Authenticate; identify sports, leagues, fixtures and market IDs; inspect response schemas | Timestamped sanitized metadata, actual entitlements |
| Day 2 | Case A: independently verify injury/status-to-player-prop timeline | Exact event/selection IDs; distinguish correlation from causation and upstream from downstream |
| Day 3 | Case B: SSE disconnect, reconnect and continuity | Last entry ID, requested checkpoint, replay proof, consumer acknowledgement; gaps remain UNKNOWN |
| Day 4 | Case C: settlement versus official final stats and consuming-system grade | Same fixture/player/market/selection and rules, including corrections |
| Day 5 | Prediction-market exchange mappings and snapshots, if allowed | Kalshi/Polymarket IDs with mapping evidence, not title-only matches |
| Day 6 | Independent replay, falsification and contrary evidence | Reproducibility, controlled thresholds, incident attribution boundaries |
| Day 7 | FIT/NO FIT report, expiry review, restricted cleanup | Separate subscription decision from whether OpticOdds wants to buy KAHRELUM's Fit Check |

Use the dedicated prediction-market reference for non-sport order books. That SSE feed reports whole order-book snapshots, not necessarily incremental sports-odds updates. Its canonical_id can be empty, so join to reference mapping on market_id instead of inventing equivalence.

## Evidence custody rules

Every evidence row should preserve observation_id, case_id, received_utc, event_utc, API route, data owner, fixture_id, sportsbook/exchange, market_id, selection, state/price, original source citation/hash as licensed, independent corroboration, parser version, consumer-observed state, adverse evidence, uncertainty and reviewer verdict.

Source classes: PROVIDER_OBSERVATION, INDEPENDENT_PRIMARY, DOWNSTREAM_OBSERVATION, SYNTHETIC_TEST. Verdicts: PASS, GAP, UNKNOWN, NOT_ENTITLED. Preserve originals and append corrections with timestamps. A missing log is not evidence of a provider outage. A market move after an injury does not establish causation. A completed data check does not prove commercial rights or forecasting accuracy.

## Commercial separation

**Buying a feed:** USD 6,000/month is the quoted starting price and is not approved. Seek a limited research-only tier and clarify display/derived-data rights before any public integration.

**Selling KAHRELUM:** Propose a separate USD 750 three-case retrospective Fit Check with permitted, de-identified closed cases, one workflow, an evidence-to-decision readout, and no production integration. It targets delivery after written scope, approved inputs, permissions and payment. This has **not** been purchased or accepted by OpticOdds. Any USD 2,500 Founding Pilot is separately proposed.

## Current status ledger (as of Nov 12, 2026)

| Item | State |
| --- | --- |
| Synthetic three-case demo source | Present in main; current hosting readback not established here |
| Reply to Chirag | Sent |
| Trial API key | Pending vendor |
| First authenticated API request | NOT RUN |
| No-auto-charge and commercial rights confirmation | Pending vendor |
| Historical >2-month entitlement | Pending vendor |
| Real-data findings or verified accuracy | NONE |
| Paid Fit Check order or internal referral | NOT CONFIRMED |
| Firebase publication or changes | NONE from this preparation |

Official docs: https://developer.opticodds.com/docs/api-faq ; https://developer.opticodds.com/docs/odds-api-getting-started-guide ; https://developer.opticodds.com/reference/get_fixtures-odds-historical ; https://developer.opticodds.com/reference/get_stream-prediction-markets .
