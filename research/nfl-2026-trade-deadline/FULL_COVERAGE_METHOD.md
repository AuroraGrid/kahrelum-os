# Complete NFL candidate forecasts and prospective custody

**Edition:** `KAHRELUM_FULL_COVERAGE_v1.0`, October 31, 2026.  
**Generator:** `scripts/sports_forecasts.py`.  
**Public data:** `nfl/current-forecasts.json`.  
**Outcome contract:** [Scoring and custody](SCORING_AND_CUSTODY.md).

## What the number means

All 124 current rows receive a numeric value: 123 prospective trade probabilities and one clearly labeled roster-status zero. The 123 forecasts ask about an official trade **after the new snapshot becomes publicly inspectable and by November 10, 2026, 21:00 UTC (4:00 p.m. EST)**. Each estimate is subjective, not a betting quote, an ESPN percentage, or an empirically calibrated probability. The candidate list is selected and is not a random sample of all NFL players.

Evidence depth differs. A forecast with a complete publication record can be scored prospectively even when its estimation method is weak; a strong narrative cannot authenticate an earlier private timestamp. Publication custody and prediction quality are separate properties.

| Basis | Initial count | Interpretation |
|---|---:|---|
| Source-reviewed structured judgment | 20 | Newly estimated with explicit features derived from original reporting read during this update. |
| Source-backed judgment revision | 1 | Daron Payne's committed 2% injury assessment is applied. |
| Carried-forward judgment | 19 | Existing individualized numbers retained, with unrecovered inputs and old research dates disclosed. |
| Low-information baseline | 83 | No admitted individual market evidence beyond analyst/watchlist membership; a shared governance prior remains appropriate. |
| Roster status, excluded from forecasts | 1 | Jack Jones was officially released before publication; 0% indicates no current San Francisco contract to trade, not a future signing/trade prediction. |

The [49ers' official October 28 announcement](https://www.49ers.com/news/the-49ers-acquire-dl-deforest-buckner) and [team transaction log](https://www.49ers.com/team/transactions/2026) confirm Jones's release. They were inspected at 04:22:49 UTC on October 31. He remains visible as FA, with `probabilityKind: CURRENT_CLUB_TRADE_ELIGIBILITY_STATUS`, `cohortEligible: false`, and explicit exclusion provenance. A later signing would require a new eligibility review and prospective cohort; his release is neither a scored NO nor a correctly predicted outcome in this cohort.

The original 20 values stay intact in `trade-board.json` and the excluded historical ledger. In particular, the old Payne 61% remains visible as historical provenance; the current 2% is a new forward-looking estimate. No historical result becomes newly eligible because a current estimate was published.

## Reproducible estimation policy

The engine is the existing `KAHRELUM_STRUCTURED_JUDGMENT_v1.1` function in `scripts/sports_intelligence.py`:

`p = round(sigmoid(logit(0.15) + sum(enabled feature weights)), 2)`

The 15% reference rate and feature weights are declared governance choices. They were not fitted to a league-wide historical sample. Features are binary judgments about the cited information, not model-discovered relationships. Reading an original report authenticates what the reporter said; it does not turn an anonymous sourcing claim into an official transaction or an accepted offer.

| Feature | Log-odds weight |
|---|---:|
| Confirmed trade request | +1.10 |
| Original availability report | +0.80 |
| Inquiry reported by an original source | +0.60 |
| Credible reporter market signal | +0.50 |
| Seller context | +0.40 |
| Expiring contract reported | +0.30 |
| Buyer fit or reduced role | +0.20 |
| Team has rejected inquiries or says unavailable | −1.10 |
| Retention or financial constraint | −0.50 |
| Original individual evidence not captured | −0.40 |
| Reported more likely to stay | −0.30 |

The initial source-reviewed feature sets are stored in the generator and repeated in each affected row. Original reporting was inspected at **04:15:24 UTC** and **04:17:38 UTC** on October 31. Sources are [Albert Breer's SI reporting](https://www.si.com/nfl/albert-breer-how-two-former-roommates-put-jeffery-simmons-trade-together) and [Fowler/Bowen's bylined ESPN article as syndicated by ABC7](https://abc7news.com/post/2026-nfl-trade-deadline-ranking-top-25-candidates-move-team-fits/19989132/). Only their reported circumstances and analysis enter the feature sets; their numerical trade predictions are never model inputs. Contract and salary comments remain attributed reporting, not a new independent cap audit.

The no-individual-evidence case enables only the existing `originalSourceNotCaptured` feature: the engine returns **11%**. Analyst membership alone cannot establish an offer, inquiry, availability, trade request, or seller intent. Equal low-information estimates communicate that absence of differentiation honestly.

For a newly indexed category whose underlying article has not been read, the generator also supports an explicitly discounted scenario:

`p = round(p_baseline + 0.5 × (p_conditional_category_scenario − p_baseline), 2)`

| Indexed category | Conditional feature(s) | Discounted estimate |
|---|---|---:|
| Analyst radar / watchlist / unknown | None | 11% |
| Reported market | Reporter market signal | 14% |
| Reported inquiry | Inquiry | 14% |
| Reported confirmed player request | Trade request | 18% |
| Team resisting | Inquiries rejected / unavailable | 7% |
| Reported off-market | Unavailable + retention constraint | 7% |

The half weight is another subjective policy choice, not a measured source reliability rate. These features are labeled **conditional scenario inputs**, with the claim still unverified. This route is available for future evidence changes; the initial cohort's previously unpriced market/resistance cases were upgraded by reading their original articles. A new category label cannot silently become a factual claim.

Payne's 2% uses the previously committed editorial assessment rather than forcing an injury onto an unrelated engine feature. Its [immutable research note](https://github.com/AuroraGrid/kahrelum-os/blob/813a2d1c536f6b2fbbce1e5e830d43a1a9c948e0/research/nfl-2026-trade-deadline/SOURCE_CHECK_2026-10-30_DARON_PAYNE_FOOT_INJURY.md) was committed at **01:37:00 UTC on October 31**. The foot injury constrains the forecast; likely injured reserve remains an attributed report, not official placement. This snapshot creates fresh prospective custody and does not retroactively certify the note or the old 61% estimate.

## Uncertainty and freshness

Every row includes a deliberately wide sensitivity range calculated by shifting its log odds by ±1.5. The shift roughly multiplies/divides its odds by 4.48. This is a transparent stress scenario, **not a 95% interval, a confidence level, or a fitted posterior**. Sources may be incomplete and the point estimate may be wrong. Legacy estimates have especially limited reconstructed reasoning.

`generatedAtUtc` is when the forecast edition was assembled. `informationCutoffUtc` is the dated evidence boundary. `lastSourceReviewAtUtc` is populated only for an actual review. `forecastUpdatedAtUtc` changes when the forecast or its admitted basis changes. An unchanged source poll preserves all these dates and produces identical snapshot bytes; connectivity does not manufacture new research.

Initial unpriced candidates show `NEW_COVERAGE`, without a fictional change from zero. Later changes include the old point estimate, percentage-point difference, rationale, cutoff, and sources. A change of at least five percentage points is material under the existing policy.

## Updating accepted evidence

An explicitly accepted source review can replace any current estimate. Pass a JSON list to `generate --decisions`. Each decision needs `candidateId`, probability between 0 and 1, `status: ACCEPTED_SOURCE_REVIEW`, an information cutoff, review time, HTTPS source URLs, rationale, and counterarguments. Optional `factors` describe the new method. Accepted decisions remain in the snapshot so a later automated poll cannot reset them to the old board. Unreviewed feed headlines and future-dated decisions are rejected.

```sh
python scripts/sports_forecasts.py generate --at ACTUAL_CURRENT_UTC
python scripts/sports_forecasts.py generate --decisions accepted-reviews.json --at ACTUAL_CURRENT_UTC
python scripts/sports_forecasts.py validate
python -m unittest discover -s tests -p 'test_sports_forecasts.py' -v
```

Supply a trusted current UTC timestamp when the execution environment's clock is unreliable. In an existing locked cohort, publication of updated current data must also be accompanied by an append-only ledger revision referencing the actual new public commit. Snapshot generation alone neither creates nor revises a scoring lock.

## Two-stage public admission

1. Publish the full immutable snapshot and method in a GitHub commit before any outcome. Capture the actual commit SHA and metadata.
2. Fetch `nfl/current-forecasts.json` at that exact SHA. Verify its exact UTF-8 bytes with SHA-256. Record when those bytes were publicly observed; this conservative observation time is the event start. Never substitute an old research `asOf` value.
3. Check the complete candidate denominator against official NFL transaction information. Record the check time, official source URLs, every candidate ID, and any candidate already traded before the lock. A proposed cohort containing a pre-lock completion fails admission; it must be reconsidered and republished without hindsight scoring.
4. Use `admit` with the receipt and an explicit output path. It checks the full 124-row denominator and its preregistered 123-eligible/one-excluded partition, content digest, commit identifier, chronology, official source domains, fresh check time, and absence of duplicate existing player locks. It appends all 123 eligible records together plus Jones's separately documented exclusion, preserving excluded history and all outcomes. Publish this resulting ledger in a second commit referencing the first snapshot commit.

```sh
python scripts/sports_forecasts.py admit --receipt publication-receipt.json --output admitted-ledger.json --at ACTUAL_CURRENT_UTC
```

The receipt contains `repositoryFullName`, `snapshotPath`, `gitCommit`, `commitTimestampUtc`, `publiclyObservedAtUtc`, `snapshotSha256`, `remoteBytesVerified`, and `officialPrelockCheck`. The latter includes `status: COMPLETE`, `checkedAtUtc`, sorted `candidateIds` (124), sorted `eligibleCandidateIds` (123), `excludedCandidateIds: ["K26-062"]`, `completedBeforeLockCandidateIds: []`, and official NFL `sourceUrls`. The caller must actually retrieve and inspect those sources. The offline helper validates the receipt and bytes; it cannot establish that a self-asserted receipt is true or that an official check was exhaustive. Retain the retrieval evidence for external inspection.

## Complete outcome scoring

The primary denominator is **all admitted players**, including non-trades. Forecast revisions are versions of the same event, never extra independent successes. The declared version selection is the latest publicly committed version strictly before the trade (if any) and the deadline. A revision after a known outcome is invalid.

Only an official completed trade inside the prospective event window is YES. Releases, signings, interest, requests, reports of agreements, and invalidated deals are not YES. A NO requires complete official outcome coverage through the deadline. Partial retrieval cannot turn an absent name into a negative result.

An official table providing only a calendar date does not prove intraday ordering. A transaction dated the lock day or the deadline day needs additional official timing evidence if that timing determines eligibility. Keep the affected event unresolved until ordering can be established; do not invent a midnight timestamp and silently score it. Report incomplete resolution explicitly and do not claim a certified full-cohort Brier score from the resolved subset.

When all eligible outcomes are established, compute the mean squared error across the fixed denominator, publish the all-NO baseline on that same denominator, and keep the old excluded arithmetic separate. No accuracy improvement, calibration, or competitive superiority is claimed merely by admitting this cohort.
