# KAHRELUM | NFL Trade-Volume Expanded Sandbox v0.2

**Snapshot**: Monday, November 9, 2026 at 12:16:16 PM EST. **Deadline**: Tuesday, November 10, 4 PM EST (21:00 UTC).

**STRICT CLASSIFICATION**: `SANDBOX_HYPOTHETICAL_NON_SCORING`. **No KAHRELUM forecast has been issued, locked, published, or added to official scorecards.** This research folder and PR must not be treated as a live website release.

## Why this expands v0.1

The first model used three complete final-two-calendar-day counts. This version includes **43 individual trades from five historical seasons** (2021–2025) and splits deadline eve from deadline day, counts each two-team transaction only once, and conditions on a frozen 2026 source snapshot. It separates the eight trades listed on the NFL tracker from the Jessie Bates reported agreement on November 9. **Reported agreement does not count as an officially completed trade in the as-of baseline.**

The source input JSON preserves individual trade identifiers, dates, headline players, original NFL source URLs, unresolved event-date ambiguities, and insider sources. The 2026 source check was not a continually updating feed.

## Historical event counts (per original tracker/report-date convention)

| Season | Eve | Deadline day | Two-day total |
|:--|--:|--:|--:|
| 2021 | 1 | 4 | 5 |
| 2022 | 0 | 11 | 11 |
| 2023 | 2 | 6 | 8 |
| 2024 | 1 | 8 | 9 |
| 2025 | 2 | 8 | 10 |

Sources: [2021 monthly registry](https://www.nfl.com/transactions/league/trades/2021/11), [2022 NFL tracker](https://www.nfl.com/news/2022-nfl-trade-deadline-tracker-full-details-on-every-move), [2023 tracker](https://www.nfl.com/news/nfl-trade-deadline-tracking-every-move-since-start-of-the-2023-regular-season), [2024 tracker](https://www.nfl.com/news/nfl-trade-deadline-tracking-every-move-since-start-of-2024-regular-season), [2025 tracker](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2025-regular-season).

**Do not hide timing conflicts.** Von Miller was reported November 1, 2021 but the November trade register shows November 2. The 2021 player registry has six rows for five unique November trades because a Chiefs–Jets swap moves two players in one deal. The 2022 tracker labels eleven deals on November 1, while a separate nflverse analysis lists ten. In 2023, the Leonard Williams October 30 report differs from the October 31 transaction register. In 2025, Jaelan Phillips and Dre'Mont Jones are listed as November 3 in the tracker and November 4 by the monthly transactions register, while one external dataset counts 21 season trades against 22 NFL tracker entries. Date-level evidence must **not** be used to infer intraday hours.

## Illustrative model, not claimed calibration

Two independent Gamma-Poisson rate components: deadline eve and deadline day. Historical sample weights are **heuristic** (2021–22: 0.35 each; 2023: 0.60; 2024–25: 1 each), and the prior has shape 0.5. The model assumes 50% of normal deadline-eve trading activity remains after the snapshot. With no actual historical intraday timestamps, this is a scenario assumption; 25% and 75% are tested.

Pending Bates completion is a separate Bernoulli indicator with arbitrary illustrative q=0.75, varied between 0% and 100%. **This is not a fitted or verified trade probability and does not move Bates into the official completed ledger.**

The baseline distribution combines eve remainder + deadline-day count + optional Bates completion. A separate insider-soft scenario uses weak exponential penalties for violations of interpretable numeric windows: Schefter (10+ after Oct. 26, four already completed, six needed); Wolfe's reported executive expectations (10+ after Nov. 3, Brissett already completed, nine needed); Pelissero (8–10 over final 36 hours, attributed to an [Underdog NFL post via Yahoo](https://sports.yahoo.com/articles/nfl-trade-deadline-rumors-suggest-155938385.html)). Their combined weights total 0.40 below a 0.45 cap to limit correlated information. Original Pelissero audio wasn't authenticated; the exact 36-hour attribution is therefore secondary evidence. **Weights are not measured historical reporter skill.**

Schultz 12–20 has an unresolved counting horizon, and La Canfora 3–4 concerns the Colts only; neither is forced into the leaguewide model. Fowler/Bowen candidate-level trade probabilities likewise cannot be summed as independent transactions.

## Sample result from the frozen snapshot

| Scenario | Mean additional trades | Mean full-season trades | Central 10th–90th percentile total |
|--|--:|--:|--:|
| Historical-only sample | 9.197 | 17.197 | 13–22 |
| Insider-soft sensitivity | 9.297 | 17.297 | 14–21 |
| Bates never completes sensitivity | 8.447 | 16.447 | 12–21 |
| Bates definitely completes sensitivity | 9.447 | 17.447 | 13–22 |
| Less eve activity remaining (25%) | 8.814 | 16.814 | 13–21 |
| More eve activity remaining (75%) | 9.580 | 17.580 | 13–22 |
| 2024–25 week-nine regime only | 9.875 | 17.875 | 13–23 |

These are **scenario-conditioned test outputs** only, not probabilities proven to be calibrated. No outside publication or production deployment is authorized.

## How to rerun the Node research implementation

From repository root:

```sh
node --test research/nfl-2026-trade-deadline/expanded-model-v02/test_expanded_sandbox.cjs
node research/nfl-2026-trade-deadline/expanded-model-v02/expanded_sandbox.cjs
```

Local offline validation also includes an independent Python implementation and tests, preserved in the downloadable sandbox bundle. The Node implementation and tests passed locally before connector upload; the GitHub branch still needs a fresh execution check after commit. The model is read-only; it never changes `nfl/forecast-ledger.json`, `nfl/current-forecasts.json`, Firebase, or public pages.

A real forecast would require explicit authorization and a separately timestamped irreversible version, fixed cutoff, full integer probability distribution, independent scorer and source audit. **There is no such new version in this PR.**
