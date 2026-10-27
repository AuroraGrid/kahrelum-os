# K-PREDICT v0.6.0 — execution completion and unresolved release gates

Case: **KAH-IL26-PROSPECTIVE-001**. Organization: **KAHRELUM OS**. Founder: **Hasan Raza Kazmi**.

Observed UTC: **2026-10-27T05:10:50.324Z**. Overall verdict: **PARTIAL**.

The statistical framework, historical evaluation, five separate AI-agent reviews and public technical research were executed. The evidence does not establish prospective predictive superiority. Final owner-archive creation and verified live deployment remain blocked by loss of the active execution environment. This record does not claim that every mission requirement passed.

## Required acceptance adjudications

| Requirement | Adjudication | Evidence and boundary |
|---|---|---|
| Historical dataset completeness | PARTIAL | 41 records across seven specified elections; incomplete raw vote vectors, ballot coverage and metadata. |
| Statistical uncertainty model | PARTIAL | Executable vote uncertainty and Bader–Ofer capability; historical evaluation uses a separate seat-space model. |
| Authentic pre-election information cutoffs | BLOCKED | Zero strictly authenticated historical cutoff-eligible polling records. |
| Chronological out-of-sample testing | PARTIAL | Earlier-election fitting across six held-out elections and 18 horizons; retrospective source custody and known outcomes. |
| Probability calibration | PARTIAL | Reliability diagnostics and sequential recalibration executed; calibration not established prospectively. |
| Comparisons against statistical baselines | PASS | Six candidates, latest-poll, historical-rate and 50% same-target comparisons retained. |
| Numerical reproducibility | PASS | Independent exact reproduction of 11 outputs and 120 arrays; 29,841 plus 5,118 numerical checks. |
| Engineering test suite | PASS | 51 new tests and 118 predecessor tests passed in the documented environment. |
| Independent QA | PASS | Five actual separate AI-agent reviews; 66 final adversarial checks. Not external human certification. |
| Frozen owner package | BLOCKED | Execution environment disconnected before ZIP freeze, CRC/manifest closure and durable file delivery. |
| GitHub portfolio publication | PASS | Research, methods, benchmarks, cutoffs, sources and all requested repository indexes/homepage source published and read back. |
| Live website deployment | BLOCKED | No verified release/readback; GITHUB PUBLISHED / LIVE DEPLOYMENT UNVERIFIED. |

## Historical evidence and numerical results

Exactly seven elections are included: 2013-01-22, 2015-03-17, 2019-04-09, 2019-09-17, 2020-03-02, 2021-03-23 and 2022-11-01. No 2009 or earlier election was added.

There are 41 normalized polling records, including 21 inherited snapshots and 20 primary-source records; 34 complete 120-seat vectors; 12 explicitly missing seat cells; three identified duplicate inherited rows; and nine genuine raw-share cells in one incomplete 2022 vector totaling 86.6%. No complete usable raw-vote vector was recovered and no seats were inverted into observed votes. Zero records meet the strict historical custody gate.

The 2013 D-14 context is explicitly BLOCKED. There are two executable 2013 warmups and 18 later held-out horizon contexts, giving 20 executable contexts in total. Main metrics cover **six election clusters, 18 horizons and 213 party-horizon events**, comprising 183 represented and 30 unrepresented events. Twenty-three distinct poll IDs enter at least one executable context. The selected roster excludes many never-polled minor ballot lists.

The main summaries first average parties within a horizon, then horizons within an election, then give equal weight to six elections. These are not 213 independent election outcomes. Full definitions and methods appear in the [technical report](./K_PREDICT_V06_2026-10-27.md) and [methodology](./K_PREDICT_V06_METHODS_2026-10-27.md).

| Method | Representation Brier | Normalized seat RPS | Multiclass Brier | Seat MAE | Total L1 | Mean-context RMSE | 90% coverage |
|---|---:|---:|---:|---:|---:|---:|---:|
| correlated_student | 0.057898685844 | 0.010800015753 | 0.805097871636 | 1.772272828714 | 21.497888888889 | 2.361485891801 | 0.961038961039 |
| fixed_gaussian | 0.059219325382 | 0.011018859979 | 0.816758056668 | 1.784572076380 | 21.642083333333 | 2.355668435317 | 0.961038961039 |
| house_average | 0.078765678766 | 0.014138690528 | 1.430571897239 | 1.696642863310 | 20.666666666667 | 2.342982397013 | 0.284714051381 |
| latest_poll | 0.074797424797 | 0.014323875713 | 1.429255929256 | 1.718865085532 | 20.888888888889 | 2.387664458349 | 0.285372035372 |
| recency_average | 0.078765678766 | 0.014001327890 | 1.425823559157 | 1.680159346826 | 20.444444444444 | 2.336829050716 | 0.287088220422 |
| shrinkage_gaussian | 0.058866084775 | 0.011038907973 | 0.816460985144 | 1.782426529129 | 21.613888888889 | 2.358219125545 | 0.961038961039 |

The correlated Student representation Brier is **0.057898685843952864**, compared with **0.0747974247974248** for the latest-poll indicator. The paired difference is **−0.016898738953471944**. A descriptive 20,000-resample election-cluster bootstrap gives **[−0.035683756036890064, +0.0036561845789241636]**. It includes zero; six related election clusters and retrospective selection provide limited power.

The Student method improves representation Brier in four of six elections and worsens it in 2020 and 2021. Its total L1 error **21.497888888889** is worse than the latest poll's **20.888888888889**, and the recency-average result **20.444444444444**. No candidate was promoted as an independently validated winner.

The prior-history representation-rate baseline scores **0.1505438050681616** and fixed 50% scores **0.25**. The latter is a weak reference for this selected, mostly represented population. Sequential earlier-election recalibration worsens Student Brier to **0.059674722924**; that failed improvement is retained.

For Student, election-balanced representation log loss is **0.19446055045199262**, exact-seat log loss **2.064187647005163**, and representation classification error **0.0747974247974248**. It has zero realized-event infinite-log-loss cases in this sample. Other candidates' actual zero PMF probabilities remain explicit infinite outcomes; separately labeled clipping diagnostics do not replace them. Point-poll baselines are imposed point masses, not pollsters' published confidence intervals. The 90% coverage figure is descriptive rather than proof of calibration.

The genuine vote-share engine accepts complete raw shares and transforms simulated votes using the unchanged Bader–Ofer allocator. Twelve synthetic turnout/threshold scenarios were executed. The empirical historical results above instead use the separate constrained seat-space model; its hurdle/Hamilton transform does not validate statutory vote-threshold probabilities.

## Independently checked engineering and adverse findings

- The unchanged v0.5 ZIP passes CRC and all 43 current-manifest checks. Seven known-vote reconstructions reproduce 73 represented-list allocations and 840 seats. These are mathematical reconstruction checks.
- All 118 predecessor tests and all 51 new tests passed in the documented Python 3.14.7 / NumPy 2.5.2 environment. They are not successful forecasts.
- Reviewer C independently reproduced all 11 deterministic final output files byte-for-byte and all 120 joint-draw arrays.
- Reviewer B independently checked 29,841 PMF/metric assertions and 5,118 recalibration assertions, with zero errors and without importing the model's scoring functions.
- Reviewer D completed 66 final adversarial checks. Leakage perturbations, input-shape/method rejection and evidence gates passed; prospective superiority remained unsupported.
- Reviewers A and E inspected data provenance and public claims. These were five actual separate AI-agent reviews within one owner-directed session, not blinded human or institutional certification.

The v0.5 score **0.3053923374905518** versus **0.25** concerns large polling-error events: total L1 error at least 20, over 18 observations from six later elections. It is not a party-election outcome score and cannot be directly compared with the new representation Brier.

Retained failures include missing historical source custody, late source updates, same-house dependence, incomplete vote-share data, inferred-zero corrections, an unavailable 2013 D-14 vector, unidentifiable empirical house-bias coefficients, initial log-loss aggregation and test-discovery failures, environmental test issues, wrong API input acceptance before correction, adverse seat-error results and failed recalibration. No difficult held-out election was deleted.

## Pipeline and chronology

The documented traversal is ROUTER → SCOUT → SOURCEGRID → K-ALIGN → IPR → BLACKGLASS-I → CRF → COMMAND → BLACKGLASS-II → RECORD LOCK. AAIK applies the published evidence/instability/exposure controls; the audit declares SPIKE for unresolved evidence and timing risks. MCRI is the published Mission Contract Release Interlock and prevents an overall PASS while central requirements remain unsupported.

A ledger maps 108 atomic requirements. Its pre-freeze review was 71 PASS, 25 PARTIAL and 12 BLOCKED; subsequent root checks closed the model-card and eight publication-related entries to the observed local state of 80 PASS, 25 PARTIAL and three BLOCKED. This final acceptance table remains the governing summary. The contract file was created at 04:36:38.781 UTC after some retrieval had begun; this sequencing deviation is disclosed rather than backdated.

Initial design and first successful output records are preserved. The first successful run occurred at **04:32:42.780671 UTC**, after C1's registered **04:30 UTC** cutoff and after some design-stage reviewer corrections. It is not represented as a pre-feedback scored lock or an untouched test design. Exact initial source code was not separately frozen; current-code inherited-only reruns are not promised to recreate the first-run bytes.

C1 was captured at **04:43:23.041 UTC**, 13 minutes 23.041 seconds late. Its exact target is marked MISSED. The [C1 record](./C1_PREOPEN_2026-10-27.md) was published in commit `f747d4f84c20cda78b45684e7181b1019f550f27`. Original C0 and scoring protocol remain unchanged. C2–C7 monitoring and final certified-result scoring remain governed by that protocol; future stages were not declared completed. No new KAHRELUM live 2026 election-outcome forecast was issued. Israel Votes remains a third-party forecast.

## Publication, integrity and delivery

The verified research publication commit is **`5a64beac2e6f97d0c03baf2baf7ad546530bcaa6`**. Nine changed/added files and both protected originals were read back at that exact commit with exact content matches and blob identities. All 35 pre-existing non-index file blobs remain unchanged. The commit is unsigned and provides no independent trusted-time attestation.

Public records:

- [Technical report](./K_PREDICT_V06_2026-10-27.md)
- [Methodology](./K_PREDICT_V06_METHODS_2026-10-27.md)
- [Exact benchmark CSV](./K_PREDICT_V06_BENCHMARKS_2026-10-27.csv)
- [Historical cutoff ledger](./K_PREDICT_V06_CUTOFFS_2026-10-27.csv)
- [Source manifest](./K_PREDICT_V06_SOURCES_2026-10-27.json)
- [Machine-readable integrity and acceptance record](./K_PREDICT_V06_INTEGRITY_2026-10-27.json)

The canonical case index, research index, main README and repository homepage source were updated and read back. **GITHUB PUBLISHED / LIVE DEPLOYMENT UNVERIFIED.** Direct external read attempts also failed; no live-site success is inferred from a source commit.

**No completed v0.6 frozen ZIP exists in this release record; its archive SHA-256 is unavailable.** The runtime disconnected before final manifest/CRC closure and owner delivery. A direct attempt to deliver an existing report failed with “no primary turn environment is available.” The local creation/audit evidence is retained in the session, but file availability is not claimed.

Known exact identities:

| Artifact | SHA-256 |
|---|---|
| Final historical output JSON | `5706bed1e996ac4db3fbad9b66e882522cecf9bef4fb1b696658dee8619010f6` |
| Preserved initial historical output JSON | `0e28e95f03494e7e69a35dc7412ec154234e5f1c56177f06e3f3dd110d6d482f` |
| Original v0.5 ZIP | `3ecc7a4a19d5d5f26856615a14922292f553ecc279516b8f14f6711861590d0e` |
| Original C0 | `cbb9c2fdaa6a3d2ad318345d2d7d4e638f0f7185ddd5d3f9df9dcaebdc59d30d` |
| Original scoring protocol | `6ac673b0f6e5b32f9ae7d049d798314e04626dbdc4b64c886eadd2a9d95ca513` |

The full owner files were created under the session's `release_v06/` directory before disconnection. Actual relative locations include `model/`, `vendor/`, `run_model.py`, `configs/`, `tests/`, `data/`, `outputs/`, `initial_outputs/`, `review_a_sources/`, `review_b_statistics/`, `review_c_engineering/`, `review_d_falsification/`, `review_e_publication/`, `MODEL_CARD.md`, `KNOWN_LIMITATIONS_AND_FAILURES.md`, `README_REPRODUCE.md`, `environment.json`, `audit/`, `protected/`, `predecessor/` and `publication/`. Proprietary implementation was not uploaded to this public repository.

The completed work supports reproducible statistical capability and limited retrospective evidence. It does not close the missing-data predicates, prove calibration or establish performance beyond the baseline on genuinely new elections.
