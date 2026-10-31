# KAHRELUM U.S. 2026 Forecast Modeling Layer — Verification Receipt

**Date:** 2026-10-28  
**Study:** `KAH-US-MIDTERMS-2026-HEAD2HEAD-001`  
**Branch:** `research/us-midterms-2026-five-forecaster-benchmark`  
**Parent:** existing KAHRELUM five-competitor study PR #8, not a replacement OS.  
**Scope:** Historical House input preparation; experimental probability kernel; historical walk-forward. **No prospective 2026 race predictions issued.**

## Clean verified execution

A clean temporary execution environment fetched the committed scripts and archived data from the exact GitHub commit `242611492412c7d8ff9ddd6c9505eef02e0b2d5c` and executed:

```bash
python -m unittest discover -s . -p 'test_*.py' -v
```

**Result: PASS, 20/20 tests.** Tests cover historical result parsing, NY fusion lines, RCV and multiple nominee flags, 2026 boundary gates, missing two-party candidates, non-voting delegate exclusion, old MEDSL blank-runoff encoding, source contamination, cutoff timestamps, fictional-case probability arithmetic, and minimum training rows.

Archived history data checks: **PASS**, 435 unique historical House race IDs; 211 blocked/review flagged; 224 historical unflagged; 173 district IDs in states with updated maps requiring 2026 geography reconstruction. Source normalization from live 2022 and 2024 MEDSL mirrors succeeded. Raw input SHA-256 checks are preserved in `history_manifest_2026-10-28.json`.

Archived compact CSV SHA-256: `e913f2e1eb165b9a32c8fbfc7f4dfd15424c9362a3af30b0ca74a8e93789f71f`.

## Historical diagnostic

MIT/MEDSL-derived House result pairs and eligible samples:

| Pair | Eligible pairs |
| --- | ---: |
| 2004 -> 2006 | 321 |
| 2008 -> 2010 | 355 |
| 2012 -> 2014 | 323 |
| 2016 -> 2018 | 322 |
| 2022 -> 2024 | 360 |

The first pair supplies initial historical variance. The latter four folds evaluate with parameters fitted only on earlier pairs: **1,360 held-out historical cases**; aggregate Brier `0.08439309` (state-year cluster bootstrap 95% CI `[0.0701969, 0.09863148]`). The exact arithmetic report and raw source hashes across ten election years are in `house_backtest_2026-10-28.json`.

### Detected and corrected regression

The initial test run excluded all 2008-2018 general-election source rows because it required an explicit `runoff=false`, whereas the historical source encoded the field as blank. The invalid first-pass historical score `0.04964642` came only from the 2024 fold and is **not the registered result**. This was corrected in source commit `700a51e841a8f412388004856373e22d01b728b4` with a new regression test. Correct rerun across four held-out cycles is `0.08439309`. The initial defect is preserved here as part of the audit trail, not silently removed.

## Scientific boundaries

- These are **historical** forecasts from a persistence model, not new forecasts about the 2026 election.
- Historical district geometry was **not individually independently audited** across all prior historical pairs; therefore diagnostic results are not certification of current model calibration.
- Neither historical source tables nor these basic numeric calculations justify model superiority against DDHQ, Sam Brown, Cook, Sabato or Polling Forecast.
- The kernel intentionally blocks all current production forecasts without independent, timestamped evidence, verified geography/ballot identity, and an out-of-time validation receipt; changing only the metadata status is not a substitute for validation.
- Senate and Governor models, original contemporary polls, national environment, and 2026 district-line reconstruction are outstanding.
- No release, hosting deployment, final forecast lock, certified outcome or published 2026 probability has been completed.

**Verdict: PASS for source import, code tests and historical diagnostic reproduction; PARTIAL for an independent operational 2026 election model; NOT STARTED for prospective accuracy.**
