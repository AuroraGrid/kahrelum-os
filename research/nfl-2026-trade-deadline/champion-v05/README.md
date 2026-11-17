# KAHRELUM NFL Deadline Trade-Volume: Research Completion v0.5

**Research package complete.** **Official KAHRELUM 2026 trade-count prediction: NULL.** This is not a prospective forecast, locked probability distribution, insider-beating claim, performance scoreboard entry, or production deployment.

## Champion and challenger

Five chronological holdouts (2021–2025) were generated using only earlier years. The 2018–2025 registry-dated historical data contains 59 unique trades in the last two calendar days around each deadline. Report date and transaction-register date are intentionally not interchangeable.

The predeclared selection metric for this research comparison is mean ranked probability score (RPS), lower being better. The simple Poisson model using the mean of preceding seasons **won** both windows:

| Window | Poisson mean baseline RPS | Gamma-Poisson challenger RPS | Poisson MAE | Challenger MAE |
|---|---:|---:|---:|---:|
| Start of final two days | 2.1725 | 2.4048 | 2.8886 | 3.2513 |
| Start of deadline day | 2.6684 | 2.9458 | 3.6100 | 3.9526 |

That selects the **Poisson historical baseline as conservative research champion**; Gamma-Poisson remains a retained challenger. Model selection itself uses the historical holdouts and should not be reported as an unbiased new out-of-sample win. Five holdouts are insufficient to establish superiority to NFL insiders or calibrated future coverage.

Training historical **means**, not 2026 predictions: 7.375 distinct trades in the final two calendar days; 6.5 on deadline day.

## Three original repairs retained

1. **No additive Bates completion draw.** The base count distribution models *all* future trades. Adding a named player Bernoulli without removing them from generic hazard may double count. This mechanism was removed in v0.4.
2. **One predeclared source and trade identity rule.** Register-dated deals in the NFL monthly transaction register, one distinct two-team exchange per trade. This remains separate from a 2026 editorial tracker count.
3. **Eight seasons / five past-only backtests.** Both start-of-eve and start-of-deadline-day horizons preserve compatible cutoff and scoring denominators; no guessed intraday Monday clocks were used.

## 2026 new evidence (NOT projected)

The original 2026 v0.2 frozen snapshot at Nov 9 12:16:16 ET carried eight official editorial-tracker entries and an unresolved Bates agreement. As of the subsequent Nov 9 news sweep, the [official NFL trade tracker](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) displays nine including Jessie Bates. Separate Nov 9 reporting describes additional trades of Davon Godchaux (Saints to Jaguars) and Andre Cisco (Jets to Lions); while reported/announced, the sources examined have not yet demonstrated their appearance in the official **monthly transaction register**. They **must not** be silently added to the model's completed-registry baseline or backdated into the original eight-entry snapshot.

- [Official NFL tracker, Nov 9](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season)
- [NBC Sports: Godchaux agreement, Nov 9](https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/report-saints-agree-to-trade-dt-davon-godchaux-to-jaguars)
- [Reuters/Field Level Media: Andre Cisco report, Nov 9](https://www.reuters.com/sports/report-jets-trading-veteran-s-andre-cisco-lions--flm-2026-11-09/)
- [Jaguars Bates conditional official announcement](https://www.jaguars.com/news/roster-moves-jaguars-trade-for-s-jessie-bates-iii)

Official trade deadline: Tuesday Nov 10, 2026, **4 PM America/New_York / 21:00 UTC** per [NFL Football Operations](https://operations.nfl.com/calendar-events/nfl-important-dates).

## Reproduction and gating

Run from repository root:

```sh
node --test tests/nfl-trade-volume-calibration.test.cjs \
  research/nfl-2026-trade-deadline/expanded-model-v02/test_expanded_sandbox.cjs \
  research/nfl-2026-trade-deadline/registry-model-v04/calibration_v04.test.cjs \
  research/nfl-2026-trade-deadline/champion-v05/champion_v05.test.cjs

node research/nfl-2026-trade-deadline/champion-v05/champion_v05.cjs
```

The four suites ran together locally: **43 tests passed, zero failed**. GitHub Actions workflow **NFL Trade Volume Research Validation** provides an independently executed no-forecast gate on PR #66; its first run reported success. The existing Public Surface Integrity workflow also passed on the PR head.

The model is strictly **research-only**: output fields `officialKahrelumPrediction` and `officialPredictionLock` are null, internal tests do not count in performance records, and no live forecast JSON or website routes are changed.

## Remaining gate before a prospective public prediction

- Choose and record an actual forward-looking timestamp and matching observation source, with no event already completed counted as future. The historical model has calendar-day (not intraday) resolution; at 4 PM on Monday it cannot infer a precise remaining fraction of today's trade activity. A clean prospective cutoff is the **start of Tuesday Nov 10** with the previous day already ended, provided the full officially completed transaction count and method are reconciled.
- Preserve original primary-source insider count windows. Pelissero 8–10 in the last 36 hours is currently secondary-attributed; Schultz 12–20 still lacks a fully authenticated counting window. Historical insider skill is not validated.
- Explicit authorization to issue any initial KAHRELUM forecast is still required; no research artifact or internal test run is eligible as a prediction.

**Evaluation protocol:** Score each individual complete integer count distribution once using RPS and negative log likelihood, with a fixed informational cutoff and against a same-window naive comparator. Keep forecast issuance separate from subsequent outcome resolution and corrections. No prediction has been issued.
