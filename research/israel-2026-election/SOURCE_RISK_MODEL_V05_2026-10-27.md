# KAHRELUM OS | Source-risk probability module v0.5 (before C1)

**Case:** KAH-IL26-PROSPECTIVE-001  
**Identity:** KAH-IL26-SOURCE-RISK-V05-20261027  
**Observed development period:** 27 October 2026, approximately 07:39–07:44 Pakistan time (UTC+05); session clock observation only, not cryptographically attested.  
**Classification:** NEW TECHNICAL MODEL MODULE, source-quality and historical poll-error risk; NOT a proprietary 2026 party-seat/winner outcome forecast.  
**Lifecycle:** LIVE / UNRESOLVED / NOT SCORED. C1–C7 remain subject to the original registered schedule.  
**Operation:** Owner-run Python standard-library module, assisted by ChatGPT; **not** an execution of the immutable KAHRELUM OS v2.3.4 frozen runtime.

## Result in plain language

The owner-operated v0.5 package adds an original, versioned **probabilistic model of error risk in third-party polling**, plus chronological pseudo-backtesting, pollster-house dependence checks, preservation of missing source values, and tighter evidence gates. It does not derive Israeli political winners, party seat probabilities, final 120-seat outcome vectors, coalition probabilities, or first-party forecasts from seat-only poll summaries.

**118/118 automated tests pass locally**. Seven previous 2013–2022 vote-to-seat historical reconstructions still exactly match 73 represented parties' historical seat allocations, totaling 840 seats across seven completed elections. Those are counting-mechanics checks on KNOWN final votes, **not** successful pre-election predictions.

**The adverse outcome is preserved:** The new model's mean descriptive pseudo-forward Brier score for a large *published-poll* seat-allocation error is **0.305392**, worse than a fixed 50% uninformative-probability reference of **0.250000**. Lower is better; this model does **not** show an accuracy edge.

## What the K model actually assigns probabilities to

**Binary event:** a *third-party seat poll* eventually differs from the official result by an absolute aggregate seat error of at least 20, denoted `L1 >= 20`. This means at least ten seats must be reassigned between parliamentary lists for its 120-seat vector to match gold. **This is NOT a probability that a party wins seats.**

A deliberately simple fixed, reproducible source-risk estimator uses a uniform Beta(1,1) prior and empirical errors from **strictly earlier historical ELECTIONS** at the same archived D−14, D−7 or D−2 horizon:

`K error-risk p = (1 + number of earlier eligible election rounds whose selected published poll had L1 >= 20) / (2 + number of earlier election rounds).`

The error threshold and this initial method were chosen during exploratory development **after looking at historical outcomes**. This is **not** a preregistered test of forecast superiority. Historical published-poll selection was also retrospective, and the original outlet first-publication timestamps are unverified.

### Scored diagnostic: full disclosure

| Metric | Observation |
|---|---:|
| Election rounds in source history | 7 (2013, 2015, April and September 2019, 2020, 2021, 2022) |
| Retrospectively selected third-party polling snapshots | 21 |
| Pseudo-forward scoring rows (three per later election) | 18 |
| Truly distinct pseudo-held-out election rounds | **6** |
| v0.5 source-error model mean Brier | **0.305392** |
| Fixed uninformative 50% event-probability Brier | **0.250000** |
| Strict authenticated historical as-of first-publication custody | **NOT ESTABLISHED** |
| Proprietary party/winner electoral outcome forecast | **NOT ISSUED** |

The binary large-error event happens to be the **same in the D−14, D−7 and D−2 selected snapshots for every held-out election**. The 18 scores therefore are correlated repeats of just six independent election-year event outcomes, not 18 independent evidence of calibration. The model's result is unfavorable even before considering this weakness.

## Original 2026 source-disagreement diagnostics (no outcome predictions)

These are observations across **nine Oct 22–23 published seat maps**, separated into **seven named pollster-house families** by an explicit heuristic. Kantar covers both Kan and Israel Hayom; Filber/Direct Polls covers i24 and Channel 14. A shared firm is not independent replication and this heuristic is not empirically measured cross-house covariance.

- Likud's surveyed seat range is **17 to 30**, so the maximum published house-to-house disagreement spans **13 seats**. This is **not** a KAHRELUM seat estimate or credible interval.
- The Reservists–Economic list is assigned **0 seats by some surveys and 4 by others**. Such threshold disagreement demonstrates source instability; frequencies of poll maps are **not** probabilities of clearing the actual threshold.
- Amcha Yisrael appears as a number in **seven of nine** records; two other surveys do not report a number. An unreported result is **not zero** and the calculation preserves the missingness.
- Full party-level observation ranges, zero/unknown status, leadership identifiers, and source-provenance hashes are available in the owner's frozen result JSON. The dated [ballot registry](./PARTIES_AND_LEADERS_2026-10-27T20261026T234042Z.md) remains the earlier Oct 22-based roster.

### Newly identified unresolved registry issue

The Oct 22 archived roster represented **37 contesting lists and one withdrawn**. An October 25 secondary [party directory](https://www.thepetek.com/parties) separately reports **35 active**, after listing additional Oct 23 withdrawals, while an October 26 [election guide](https://www.israelnationalnews.com/news/435200) says **36 contesting lists**. The original Oct 22 dataset is therefore not safe as a proven current election-day count. A contemporaneous official Central Elections Committee list/status read is still required. Do not claim a final active count from incompatible secondary sources. This v0.5 report does not retrospectively revise the old registry or C0.

## Code custody and reproducibility

- Owner code ZIP: `KAHRELUM_Israel_Model_v0_5_FROZEN.zip` (distributed to the owner separately; this public document does not reveal the proprietary Python source).
- **ZIP SHA-256:** `3ecc7a4a19d5d5f26856615a14922292f553ecc279516b8f14f6711861590d0e`
- ZIP byte size: **86,346**; **44 files**; all CRC and declared v0.5 manifest SHA-256 checks passed.
- SHA-256 for code `k_quality_probability_v05.py`: `6001a2a206f866339f8056d0af23e9bc1db3fe0a96aeda03aac4b881bf115b98`
- SHA-256 for executable `K_SOURCE_RISK_V05_OUTPUT.json`: `ffdd3be6e51d5333b0378401b779e7b1ed23d4c5a364a04d67f6ceae6e3973b5`
- SHA-256 for new manifest: `de80d3c4e6014dd2412e672728086691f006cdda40917452e042b79f3545baf8`
- **All 35 v0.4 inherited archive members were independently compared to the exact previous ZIP and found byte-identical.**
- Complete `TESTS_V05.txt`, source list, risk pseudo-test rows and model card are in the private owner package.

**Execution commands:**

```sh
python k_quality_probability_v05.py
python -m unittest discover -p 'test*.py' -v
```

## KAHRELUM evidence-to-decision and release gates

- ROUTER/SCOUT: define the election-source quality objective and identify all relevant historical and Oct 22–23 polling records.
- SOURCEGRID: keep original publisher records, archived transcriptions, pollster-family overlap, currently contested electoral-list identities and unresolved sources separately labeled.
- K-ALIGN: distinguish seats, vote percentages, electorate turnout, counted valid votes, source-poll frequencies and probability of *source error*. Reject implicit translation of one metric into another.
- BLACKGLASS-I: test hindsight selection, missing original-publication timestamps, potential duplicate house data, post-outcome model tuning, and apparent 18-versus-6 sample-size inflation.
- CRF: implement a narrow source-risk probability estimator; complete its pseudo-chronological error scoring; **do not** substitute its probabilities for political-event outcome probabilities.
- COMMAND: append a technical model result with negative performance disclosed, subject to separate editorial checks.
- BLACKGLASS-II: reject a claim that v0.5 beats a naive baseline, predicts the 2026 election, or has full external calibration. Preserve the adverse Brier result and source-data caveats.
- RECORD LOCK / MCRI: protect the C0 Git blob `b9adfe504c15def6e1804a78a8828e54ae5e93a5` and preregistered scoring blob `ab0692085b63c90570065f602c005c409c3b72d5`. Original C0 and the original protocol must not be modified.

### Pending election checkpoints

**C1:** Oct 27, **09:30 PKT / 06:30 Israel** preopening source scan. **C2:** Oct 28 **01:05 PKT / Oct 27 22:05 Israel**, verified after ordinary poll closure. **C3–C5:** first verified 25%/50%/75% *valid votes actually counted*, with a credible denominator. **C6:** an attributed outside projection, not automatically a prime minister. **C7:** official gold and separate comparisons/scoring. This release does not claim those future observations occurred.

## Principal public evidence

- Official timetable: https://www.gov.il/he/departments/dynamiccollectors/election-timeline26
- Israel Democracy Institute voting guide (Oct 26): https://en.idi.org.il/articles/66721
- Original Channel 12 Oct 23 report: https://www.mako.co.il/news-israel-elections/2026/Article-8ea5e45ec2961a1027.htm
- Original Channel 13 Oct 23 report: https://13tv.co.il/item/news/politics/politics/survey-905415900/?pid=98577
- Secondary archive with nine input poll maps: https://www.israelielections.com/2026/polls/
- Historical 2013–2022 poll-table links and official results in [v0.4](./HISTORICAL_CLOSURE_V04_2013.md).

**OVERALL CONTROL VERDICT:** v0.5 engineering run completed, public release requires GitHub file/commit readback verification; prospective election forecast and full election score remain NOT ESTABLISHED. This is one AI-assisted owner run, without separate external source bytes, independently signed timestamps or external adjudicator.
