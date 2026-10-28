# KAHRELUM U.S. Midterms — source-only modeling layer (research prototype)

**Branch:** `research/us-midterms-2026-five-forecaster-benchmark`  
**Status:** Historical facts + statistical calculation kernel + retrospective walk-forward PASS. **Not yet a valid 2026 forecast.**  
**Release boundary:** Additive research code. KAHRELUM v2.3.4 FINAL runtime/archive unchanged.  
**Election:** November 3, 2026. Final common pre-election cutoff: 2026-11-03T17:00:00Z.

## What this adds

- `history_import.py`: read CC0 MIT Election Data + Science Lab historical House returns, preserving fusion candidates and flagging ranked-choice, unopposed, missing-vote, and changed-geography cases.
- `house_history_2022_2024_cc0.csv`: 435 record historical data contract with 2026 geography gates. **These are historical returns, not 2026 forecasts.**
- `history_manifest_2026-10-28.json`: source URL, original raw-content SHA-256 and import exclusions.
- `historical_backtest.py` and `house_backtest_2026-10-28.json`: transparent historical only vote-margin persistence diagnostic with four out-of-time year folds.
- `model_kernel.py`: research calculation kernel accepting only time-verified, independent source receipts, verified boundaries and candidate/ballot identities, and a true validation receipt. Without these inputs it returns explicit `BLOCKED`, not invented probability.
- `test_research_model.py`: synthetic-fixture tests for source normalization and evidence gating. Tests do not themselves predict U.S. election results.

## Reproducing input import

Requires Python 3.9+ and `curl`, no third-party Python dependencies.

```bash
mkdir -p raw
curl -fsSL https://api.electiondata.dev/v1/house-results/table/2022.csv -o raw/house_2022.csv
curl -fsSL https://api.electiondata.dev/v1/house-results/table/2024.csv -o raw/house_2024.csv
python history_import.py --house-2022 raw/house_2022.csv --house-2024 raw/house_2024.csv --output house_facts.csv --manifest house_facts_manifest.json
```

The source CSV endpoints are a third-party mirror of MIT Election Data and Science Lab records, not first-party certified state election office downloads. Match hashes in the committed manifest or mark source drift and record a new run; do not silently overwrite the archived baseline. Public source [Election Data API documentation](https://electiondata.dev/docs/reference/), original source [MIT Election Lab](https://doi.org/10.7910/DVN/IG0UN2). Attribution: MIT Election Data and Science Lab, 2017, U.S. House 1976–2024, Harvard Dataverse V15; CC0-1.0.

## Reproducing historical walk-forward

```bash
for yr in 2004 2006 2008 2010 2012 2014 2016 2018 2022 2024; do
  curl -fsSL "https://api.electiondata.dev/v1/house-results/table/$yr.csv" -o "raw/house_$yr.csv"
done
python historical_backtest.py --input-dir raw --output historical_diagnostic.json
python -m unittest discover -s . -p 'test_*.py' -v
```

The five matched two-year history pairs are: 2004→06, 2008→10, 2012→14, 2016→18 and 2022→24. First pair supplies initial empirical variance. Later folds fit variance using **only earlier electoral cycles** and evaluate 2010, 2014, 2018 and 2024; holdout labels are from historical results.

**Observed diagnostic:** eligible pairs 321 / 355 / 323 / 322 / 360; held-out Brier across four post-initial folds **0.08439309**, state-year-cluster 95% interval **[0.0701969, 0.09863148]**. This is a naive vote-margin persistence baseline on selected historical contests. It is **not** a proof of reliability on 2026, a proper DDHQ comparison, or an independently audited boundary-stable backtest.

## Actual 2026 readiness

- Historical House universe: **435/435 records** from both source years.
- **224** historical records pass current input-hygiene flags, but none is a fully verified 2026 electoral forecast. **211** are blocked by at least one historical/source/geography flag.
- **173** district IDs lie in nine states where 2026 boundaries changed. **Never reuse a 2024 district margin unmodified in these states.**
- US Senate (35), Governor (36): **not ingested or calibrated by these House-only scripts.**
- Distinguish **historical fit** from **independent prospective validation**. No `OUT_OF_TIME_VALIDATED` calibration receipt has been issued for an operational 2026 model; the kernel must not be promoted by changing a status string without recorded evidence.

**Critical remaining inputs:** legally current district boundaries/crosswalks, authenticated ballot/candidate roster, independent primary poll data and national environment, state-level Senate and governor models, model parameter estimation and genuine walk-forward testing, final cutoff lock, and post-election certification.

## Comparator isolation

DDHQ, Cook, Sabato, Polling Forecast, and Sam Brown remain **evaluation-only** in the existing [five-forecaster challenge registry](./competitors_2026-10-28.json). None of their projected margins, election win probabilities, or picks was used to create the historical facts or train the persistence baseline. Any polling data or result table rehosted by a competitor must be verified against its **original** publisher and original timestamp before analytical use. The model kernel blocks registered competitor hosts as input sources.

## Scoring and claims

`score_forecasts.py` in the parent study folder performs retrospective Brier/accuracy scoring on source-identical and cutoff-authenticated predictions. It is separate from the forecast **generation** kernel. Historical diagnostic Brier is not scored against 2026 rivals or treated as proof of beating anyone. No election results or 2026 probabilities have been generated by this work.

**Independent scientific verification of the model is not complete.** All uncertainty, omissions, and negative findings remain on the record.
