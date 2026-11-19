# Verification receipt — 2026-10-28

**Study:** KAH-US-MIDTERMS-2026-HEAD2HEAD-001  
**Branch:** `research/us-midterms-2026-five-forecaster-benchmark`  
**Scope:** 435 House, 35 Senate, 36 governor contests (506 total)  
**Verification status:** **PASS (software smoke test and reference dataset inventory)**; **NOT a validation of forecast accuracy**.

## Exact work verified

The following branch files were fetched again from public GitHub (rather than testing uncommitted draft text) and exercised in a clean, temporary Python environment:

- `score_forecasts.py`
- `test_score_forecasts.py`
- `pollingforecast_reference_2026-10-27_ccby4.csv`

Command: `python -m unittest discover -s . -p 'test_*.py' -v`. Result: **six tests passed** (cutoff and toss-ups, duplicate rejection, invalid probabilities, paired Brier/accuracy, state clusters, uncertified-result exclusion). Python execution exit code: **0**.

Command: `python score_forecasts.py --predictions snapshot.csv --output inventory.json`. Result: **506 registered unique races**, source **POLLINGFORECAST**, **506 data rows**, **0 cutoff-authenticated rows**. This is correct and intentional: downloaded source data were marked `SOURCE_DATE_ONLY`, not `VERIFIED`.

## Existing evidence source identity

- Forecasted race data source: [Polling Forecast data](https://www.pollingforecast.com/us/data), JSON `asOf=2026-10-27`, explicitly marked CC BY 4.0; required attribution: Polling Forecast (www.pollingforecast.com).
- GitHub blob identity of archived projection-only CSV: `c16c57a20db057698b18e8c82afbecfc6014ec4d`.
- The source CSV is an external forecaster's output, **not an independently created KAHRELUM prediction**.
- No certified outcomes were supplied or scored. The tests employ synthetic fixtures and make no real election predictions.

## Open gates

1. KAHRELUM needs **its own** independently produced and authenticated prospective 506-race output before publication of an accuracy challenge.
2. Full per-race DDHQ data and toss-up party/candidate orientation require verification; current public page summaries are documented, not falsely treated as a complete scoreable file.
3. Sam's district-level coverage is not established from supplied screenshots; do not infer unseen calls.
4. Cook and Sabato categorical calls require a documented per-race source registry; do not assign invented probabilities to their ratings.
5. All models' final submitted snapshots should be frozen at the predeclared Nov. 3 cutoff; scoring must wait for verified/certified results and common-case matching.

**Review boundary:** Passing tests establishes correct execution on the tested fixtures only, not absence of bugs, scientific validation, model superiority, or public deployment.
