# KAHRELUM vs Five Forecasters — 2026 U.S. Midterms

**Status:** REGISTERED CHALLENGE / DATA COLLECTION. **KAHRELUM independent numerical forecasts have NOT been generated or pre-election locked.** This record does not claim that KAHRELUM outperforms any competitor.

**Created:** 2026-10-28  
**Election:** 2026-11-03  
**Research parent:** KAHRELUM OS v2.3.4 FINAL / prospective validation protocol (this benchmark is a separate study, not a change to frozen runtime).  
**Universe:** 435 House districts, 35 Senate contests (including Florida and Ohio specials), 36 gubernatorial contests; 506 contests **subject to ballot/ID audit**.

## Competitor registry (five against KAHRELUM)

| ID | Forecaster | Kind | Evidence for October 2026 | Comparable scoring |
|---|---|---|---|---|
| SAM | Sam Brown (@sb4liberty) | Public maps and seat-count calls | User-provided screenshots, original post Oct. 27, 2026 at 10:09 PM (time zone in screenshot not independently verified); subsequent Georgia governor correction preserved as an amendment, not an overwrite | Explicit picks, counts, subset where readable. No invented probabilities |
| DDHQ | Decision Desk HQ | Probabilistic simulation and race ratings | [House](https://votes.decisiondeskhq.com/forecast/2026/house), [Senate](https://votes.decisiondeskhq.com/forecast/2026/senate), [Governors](https://votes.decisiondeskhq.com/forecast/2026/governor), updated Oct. 28 | Numeric probabilities where party/candidate orientation and race identity are confirmed, ratings, seat-count error |
| COOK | Cook Political Report | Expert categorical ratings | [Official ratings](https://www.cookpolitical.com/ratings), House page dated Oct. 16, Senate/Governors dated Oct. 22 at registration | Decisive picks and coverage only; toss-ups remain uncalled; **no manufactured Brier probabilities** |
| SABATO | Sabato's Crystal Ball (UVA) | Expert categorical ratings | [Oct. 27 update](https://sabatoscrystalball.substack.com/p/democrats-appear-to-hold-narrow-senate); [House](https://centerforpolitics.org/crystalball/2026-house/), [Senate](https://centerforpolitics.org/crystalball/2026-senate/), [Governors](https://centerforpolitics.org/crystalball/2026-governor/) | Decisive picks and coverage only; toss-ups remain uncalled |
| POLLINGFORECAST | Polling Forecast | Probabilistic model | [Model](https://www.pollingforecast.com/us), [open forecast exports](https://www.pollingforecast.com/us/data); October 28 live pages, downloadable rows explicitly dated Oct. 27 | Candidate/party outcome probabilities, ratings and seat counts; attribution and row licensing retained |

## Preserve source identity and original order of events

1. **T0 registration (Oct. 28):** identify every source; distinguish the observed date/time on its page from the collection date; record any pre-existing corrections. Do not retroactively treat Oct. 27 downloadable data as Oct. 28 model output.
2. **T1 final common freeze:** 2026-11-03 **12:00 PM EST**, i.e. **17:00 UTC** and **22:00 Pakistan Standard Time**, before first U.S. polls close. Include only forecasts publicly released at or before the cutoff. Record *each forecaster's actual publication time*.
3. **No silent rewrites:** archive exact snapshots, append later updates separately, and never replace a time-locked forecast with a corrected after-the-fact version. User screenshots are **user-provided primary evidence of what was displayed**, not independently verified X timestamps.
4. **KAHRELUM isolation:** KAHRELUM probabilities may not be constructed by copying, averaging, or fitting to the competitor forecasts when used in a claim of independent outperformance. A properly sourced, preregistered KAHRELUM model output is required before numerical comparison.
5. **Authoritative resolution:** resolve each contest using state election authorities and final certified returns, recording any runoff, delayed certification or uncalled race. A race without a valid resolution remains excluded from win/loss scoring with coverage noted.
6. **Do not cherry-pick:** archive all available races, predeclare exclusions and missing-data handling, and publish negative as well as positive results.

## Scoring rules (prospectively declared)

**A. Proper probabilistic score** (only models that publish valid numerical probabilities). For a binary outcome defined consistently by candidate/party and race, Brier = mean((p - y)^2). Lower is better. When classes are more than two, use an explicitly documented multiclass score or a one-vs-rest probability with the exact named target. Never treat `>99%` as exactly 100%, and never infer the favored candidate's party from an ambiguous display. Ambiguous rows are flagged.

**B. Categorical calls** (all five competitors, where a definite call exists). Report correct / incorrect / unresolved, **coverage denominator and call rate** for each source. Toss-up means **no pick**, not an incorrect prediction. Compare only on documented common cases; do not convert Lean/Likely/Safe labels into pseudo-probabilities.

**C. Seat-count error** (sources that explicitly publish an election-level count). Report absolute Democratic House seat error, Senate caucus-seat error with independents and caucusing rules disclosed, and governor totals with incumbents not on the 2026 ballot included. Ratings are not a projected seat count.

**D. Fair pairwise testing**: score KAHRELUM vs each competitor on the **intersection of identically resolved, eligible cases**, plus an all-universe coverage table. For uncertainty, report paired differences with state-cluster bootstrap CIs, and do not claim statistical superiority from a nominal point-estimate lead. Also inspect competitive races using a **pre-result fixed subset** derived from archived evidence, not outcomes.

**E. Validation gates**: code/fixture tests, no lookahead, candidate ID alignment, abstention accountability, cutoff authentication, provenance, signed SHA-256 file manifests, and result-certification verification.

## Existing baseline status (Oct. 28)

- **DDHQ:** 435 House + 35 Senate + 36 Governor public forecast entries located. Some public table percentages have no identifiable party in plain-text extraction for Toss Up rows; these require manual or individual-page verification before probability scoring.
- **Polling Forecast:** its JSON/CSV downloads identify the full same election universe, have an Oct. 27 data `asOf` and identify forecast output as CC BY 4.0; attribution required.
- **Sam Brown:** his Oct. 27 screenshots show chamber and governorship totals, but **do not establish 506 readable per-race predictions**. His separate Georgia amendment must not rewrite the original.
- **Cook / Sabato:** qualitative ratings; no public numerical per-race probabilities established by this review.
- **KAHRELUM:** **UNLOCKED / NOT SCORED.** Existing Israeli election lab artifacts are a different study and are not US midterm forecasts.

## Reproducibility and non-endorsement

This is a neutral model-evaluation experiment, not a voting recommendation or forecast of the election result. Source forecasts remain attributed to their original publishers. External model data are **not** KAHRELUM predictions. Publication of this challenge is **not** publication of a completed forecast, live autonomous engine, or proof of performance.

Companion registration: `competitors_2026-10-28.json`. Subsequent dated forecast locks and final scoring outputs should be new immutable files under this directory.
