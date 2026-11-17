# KAHRELUM NFL 2026 Volume Calibration v0.4 | Corrected Research Model

**Status: SANDBOX_HYPOTHETICAL_NON_SCORING.** This v0.4 model supersedes the v0.2 engine for research comparisons. Earlier versions and original evidence are untouched. No official KAHRELUM trade-count forecast is issued, locked, counted in the official scorecard, or deployed to kahrelum.com.

**Official 2026 trading deadline**: Tuesday November 10, 2026, 4 p.m. Eastern / 21:00 UTC. [NFL dates](https://www.nfl.com/news/nfl-important-dates).

## Three fixes implemented together

**1. Removed the Bates double-counting mechanism.** The older Gamma-Poisson model already covered all possible future trades and then added an arbitrary 75% Bernoulli chance of Jessie Bates completing. Without first removing Bates from the generic arrival hazard, that could double-count the same deal. The corrected core model has **no additive named-deal probability**, no invented Bates q and no automatic insider tilt. Bates is a separate factual status observation only. Jacksonville's November 9 [club press release](https://www.jaguars.com/news/roster-moves-jaguars-trade-for-s-jessie-bates-iii) says acquired **pending physical**; the league's [editorial trade tracker](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) later lists nine trades, including Bates. This does not establish when the physical condition cleared. The previously frozen 12:16 p.m. ET snapshot with eight completed entries stays preserved.

**2. Standardized the historical metric to one original source convention.** Count distinct player-involving exchanges according to the date in the NFL **monthly transactions register**, on either deadline eve or deadline day. A transaction involving multiple players is counted once by unique trade ID; Kwon Alexander and Kiko Alonso are a single 2020 transaction, not two. Do not silently substitute an earlier editorial reporting date when a register date differs. The register may not precisely date legal completion, so this analysis estimates **register-dated** volume, not intraday execution time.

**3. Expanded and matched the backtest cutoff.** Now eight historical seasons 2018–2025, **59 distinct trades** during those two calendar days. Five strictly chronological holdouts (2021–2025) are evaluated under two separate horizons: the start of deadline eve and the start of deadline day. No future season information enters the training data for each holdout, and no intraday Monday time is invented.

| Season | Eve | Deadline day | Total | Official source |
|---|---:|---:|---:|---|
| 2018 | 0 | 5 | 5 | https://www.nfl.com/transactions/league/trades/2018/10 |
| 2019 | 2 | 2 | 4 | https://www.nfl.com/transactions/league/trades/2019/10 |
| 2020 | 3 | 3 | 6 | https://www.nfl.com/transactions/league/trades/2020/11 |
| 2021 | 0 | 5 | 5 | https://www.nfl.com/transactions/league/trades/2021/11 |
| 2022 | 0 | 11 | 11 | https://www.nfl.com/transactions/league/trades/2022/11 |
| 2023 | 0 | 8 | 8 | https://www.nfl.com/transactions/league/trades/2023/10 |
| 2024 | 1 | 8 | 9 | https://www.nfl.com/transactions/league/trades/2024/11 |
| 2025 | 1 | 10 | 11 | https://www.nfl.com/transactions/league/trades/2025/11 |

The first three years are in registry_2018_2020.json. The later five are composed from the original ../expanded-model-v02/inputs.json plus the append-only ../stress-audit-v03/reconciliation_v03.json. Removing either dependency fails rather than inventing a result.

## Strict chronological backtest (five holdouts)

Lower is better for MAE, ranked probability score (RPS) and negative log likelihood.

| Cutoff | Gamma-Poisson MAE | Naive Poisson MAE | Model RPS | Naive RPS | 80% coverage, both |
|---|---:|---:|---:|---:|---:|
| Two days | 3.25 | **2.89** | 2.40 | **2.17** | 3/5 |
| Deadline day only | 3.95 | **3.61** | 2.95 | **2.67** | 3/5 |

**No demonstrated superiority.** No comparison to insiders' *historical numerical skill* can be substantiated without matching dated original quotes and equivalent outcome windows. Five seasons of holdouts do not establish calibrated 80% coverage.

## Reproduction

From repository root:

    node --test research/nfl-2026-trade-deadline/registry-model-v04/calibration_v04.test.cjs
    node research/nfl-2026-trade-deadline/registry-model-v04/calibration_v04.cjs

The model reads source files and prints JSON but performs no network calls or writes. Its officialForecast and officialLock remain null. The 50% of Monday remaining research illustration is *not* independently validated intraday activity or a real-time forecast.

**Limitations**: 2020 COVID-era regime, Week 8 vs Week 9 deadlines, registration vs actual execution timestamps, five held-out seasons, no intraday observations, no historical insider skill weights. The first-party league registry dates are intentionally retained as the model's counting standard, even when editorial dates disagree. Do not merge or deploy without CI and review.
