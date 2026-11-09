# KAHRELUM | NFL 2026 Trade-Volume Model | Adversarial Calibration Audit v0.3

**Classification:** SANDBOX_HYPOTHETICAL_NON_SCORING. **Official count forecast: NULL. Official scorecard: unchanged. No prediction lock, no production update.**

**Historical audit:** NFL 2021–2025; chronological out-of-year tests: 2023–2025, training only on *earlier* seasons. This is a retrospectively configured walk-forward (weights were not pre-registered), **not** proof of actual previously issued forecasts.

## 1. Historical model did not beat a naive count baseline

Lower values are better. The naive comparator is a Poisson distribution with the unweighted mean of preceding seasons' final-two-day transaction counts.

| Convention | Model MAE | Naive MAE | Model RPS | Naive RPS | Model NLL | Naive NLL |
|---|---:|---:|---:|---:|---:|---:|
| NFL editorial tracker/report date | 0.930 | **0.917** | 1.039 | **0.876** | 2.357 | **2.103** |
| NFL monthly transaction registry | 1.263 | **1.250** | 1.173 | **1.070** | 2.416 | **2.199** |

All three held-out outcomes appeared in model and naive central 80% intervals under the tracker convention. With just 3 historical holdouts, this does **not** validate 80% coverage.

**Verdict: NO_DEMONSTRATED_CALIBRATION_ADVANTAGE.** No matched historical numerical insider count data is presently available to backtest the speculative insider source-weight adjustment.

## 2. The same games produce different event-date buckets

| Year | Editorial tracker: eve/deadline | NFL transaction registry: eve/deadline |
|---|---|---|
| 2021 | 1/4 | 0/5 |
| 2022 | 0/11 | 0/11 |
| 2023 | 2/6 | 0/8 |
| 2024 | 1/8 | 1/8 |
| 2025 | 2/8 | 1/10 |

Tracker convention: **43 historical two-day deals**. Registry convention: **44**. Differences are traceable to reporting versus registry dates: 2021 Von Miller, 2023 Leonard Williams/Kentavius Street, 2025 Jaelan Phillips/Dre'Mont Jones, and a 2025 Jaire Alexander transaction placed Nov. 3 in the registry but originally team-announced Nov. 1.

Primary sources: [2021 registry](https://www.nfl.com/transactions/league/trades/2021/11), [Rams Nov 1 announcement](https://www.therams.com/news/rams-agree-terms-trade-denver-broncos-outside-linebacker-von-miller), [2022 registry](https://www.nfl.com/transactions/league/trades/2022/11), [2023 registry](https://www.nfl.com/transactions/league/trades/2023/10), [2023 tracker](https://www.nfl.com/news/nfl-trade-deadline-tracking-every-move-since-start-of-the-2023-regular-season), [2024 registry](https://www.nfl.com/transactions/league/trades/2024/11), [2025 registry](https://www.nfl.com/transactions/league/trades/2025/11), [2025 tracker](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2025-regular-season), [Jaire 2025 Nov 1 announcement](https://fantasy-www.nfl.com/news/ravens-trade-cb-jaire-alexander-to-eagles-for-2026-sixth-round-pick).

Count **one deal** per exchange, not each player involved. E.g. the NFL 2022 November registry has fourteen player rows but **eleven** unique Nov 1 deals. The 2025 November 4 registry has twelve player rows covering ten unique deals.

NFL Research independently reports **22** season-wide in-season trades for 2025 ([Rapoport's post-deadline report](https://www.nfl.com/news/2025-nfl-trade-deadline-fallout)). An alternative 21-trade outside dataset is not directly commensurable without reviewing its inclusion rules.

## 3. Frozen 2026 snapshot reclassification: Jessie Bates

The original research snapshot is **Monday Nov 9 2026 at 12:16:16 EST**. Jacksonville's [11:30 AM official club announcement](https://www.jaguars.com/news/roster-moves-jaguars-trade-for-s-jessie-bates-iii) says Bates was acquired **pending physical**. Therefore original v0.2's 'reported only' label was **already stale** at the snapshot. Correct source class: **CLUB_ANNOUNCED_PENDING_PHYSICAL**, separate from the eight trades listed on the frozen NFL tracker, until independent completed-status evidence.

## 4. Potential double counting of Bates

The model's Gamma–Poisson future count already represents *all additional trades*. Adding a Bernoulli Bates-completion assumption with arbitrary q=0.75 shifts mean future trade count by exactly **+0.75**, without conditioning the generic trade arrival rate to exclude the named deal. That can double-count the pending transaction. **Remove this component from the research core baseline**, retaining q=0.75 as a labeled hypothetical sensitivity only.

## 5. Fragility of the original illustrative mean

Not a 2026 forecast. Full-season means condition on the original **eight** completed deals, no additive Bates component, with 50% of Monday modeled as remaining:

| Date convention and historical weighting | Full-season sandbox mean |
|---|---:|
| Editorial tracker / original weights | 16.447 |
| Registry / original weights | 17.136 |
| Editorial / equal season weights | 16.150 |
| Editorial / week-9 years only (2024–25) | 17.125 |
| Registry / week-9 years only | 17.875 |

With source/date conventions, old-vs-new weights and Monday exposure 0–100%, calculated full-season means range **15.50–18.50**. This is a **scenario envelope, NOT** an 80% prediction interval or a calibrated forecast. Using the original insider weights on the q=0 editorial tracker sample moves mean additional trades from **8.447 to 8.671**, unvalidated as skill.

## 6. Remaining weaknesses

Only five season clusters; no intraday rate data; heuristically chosen era weights; correlated syndicated insider reports; Pelissero's exact original audio not retrieved; event-date conflicts. 14/14 independent adversarial tests passed locally against the preserved v0.2 fixture. **A test passing does not establish forecast skill.**

The full local audit packet also includes a self-contained Python implementation, 14 tests, source fixture, machine-readable stress report and SHA256 checksums. This GitHub record is an append-only findings report, not a modification of the earlier v0.2 script or any official forecast ledger.

**Operational decision:** NOT READY TO CLAIM OUTPERFORMANCE. Before authorized publication, specify the transaction-date convention, remove pending-trade additive from the core model, predeclare score/cutoff, and compare against the naive baseline. No new KAHRELUM trade-count prediction was made.