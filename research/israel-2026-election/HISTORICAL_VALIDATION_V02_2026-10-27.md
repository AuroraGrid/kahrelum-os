# KAHRELUM OS | Six-election historical-validation suite v0.2

**Case:** KAH-IL26-PROSPECTIVE-001  
**New supplementary record:** KAH-IL26-HIST-v0.2  
**Declared calculation cutoff:** October 27, 2026, 05:16 PKT (October 27, 00:16 UTC). Session clock observation, **NOT trusted timestamp attestation**.  
**Status:** SIX HISTORICAL SEAT-MECHANICS RECONSTRUCTIONS PASS; RETROSPECTIVE PUBLIC POLL ERRORS SCORED; PROPRIETARY 2026 ELECTION OUTCOME FORECAST **NOT ISSUED**.  
**Boundary:** Owner-controlled independently implemented Python, **not** verified execution of immutable KAHRELUM v2.3.4 runtime; **not** independent external-model adjudication. The existing October 26 C0, original scoring protocol, prior v0.1, and October 26 current-cutoff run remain intact and are not rewritten.

## 1. Plain-language summary

The expanded KAHRELUM technical model reconstructs Israel's proportional 120-seat Knesset allocation from **already-known vote totals** across six historic elections: 2015, both April and September 2019 elections, 2020, 2021 and 2022. All 61 represented party-list seat counts exactly match the historical gold data.

This is evidence that the seat-allocation mathematics works for these six inputs. **It is not evidence that KAHRELUM could forecast those historical votes before the elections.** Exact backwards reconstruction must never be promoted into a prospective predictive hit rate.

A second, separately labeled exercise compares 18 archived **third-party** pre-election survey seat maps with the respective final outcome (one dated selected poll at 14/7/2 calendar-day reference cutoffs for each election). These are retrospectively chosen and the surveys' original publisher-release timestamps were not independently authenticated. Hence the results are **descriptive archival comparators** and **not** strict cutoff-held, blinded prospective KAHRELUM backtests.

## 2. Mechanics: independently executed audit

| Historical election | Final seat-bearing lists reproduced | Pre-remainder seats | Remainder allocation | Seat mismatches |
|---|---:|---:|---:|---:|
| March 17, 2015 | 10 / 10 | 116 | 4 | 0 |
| April 9, 2019 | 11 / 11 | 113 | 7 | 0 |
| September 17, 2019 | 9 / 9 | 117 | 3 | 0 |
| March 2, 2020 | 8 / 8 | 117 | 3 | 0 |
| March 23, 2021 | 13 / 13 | 112 | 8 | 0 |
| November 1, 2022 | 10 / 10 | 113 | 7 | 0 |
| **Total** | **61 / 61** | **688** | **32** | **0** |

Per election the code starts from known national valid-ballot totals, excludes lists under 3.25%, and reconstructs proportional seats with Bader–Ofer surplus agreements (void where a member fails the threshold); no after-the-fact manipulation of earlier frozen C0 records. The precise year-specific vote totals, name crosswalk, applicable agreements and source URLs live in the owner's audit package. These six elections total **720 seats** across separate election events, not 720 individual predictive decisions.

Historical first-party/gold sources:
- [2015, Israel Democracy Institute](https://en.idi.org.il/israeli-elections-and-parties/elections/2015/)
- [April 2019, Central Elections Committee](https://votes21.bechirot.gov.il/)
- [September 2019, Central Elections Committee](https://votes22.bechirot.gov.il/)
- [2020, Central Elections Committee](https://votes23.bechirot.gov.il/)
- [2021, Central Elections Committee](https://votes24.bechirot.gov.il/)
- [2022, Central Elections Committee](https://votes25.bechirot.gov.il/)

### Integrity repair before release

The first run of archival polling error scoring **correctly blocked** because several nonwinning parties with positive poll seat counts had not been explicitly mapped to the official ballot result. Each relevant year now provides source-linked **documented zero-seat lists** (for example Zehut / Gesher in April 2019, Otzma Yehudit in September 2019 and 2020, Meretz / Balad / Jewish Home in 2022). Unknown lists are **not** silently assigned zero. This was an implementation-stage fix **within new v0.2**, not a change to original frozen v0.1.

## 3. Eighteen descriptive historical polling comparisons

These are **published pollster/outlet seat maps**, not proprietary KAHRELUM forecasts. All have 120 named seats after zero-vs-missing reconciliation. For a complete vector, `L1 = sum(abs(published_poll_seats_i - official_final_seats_i))`; **L1/2** is the number of seats that would need to move to other lists. Absolute L1 can be compared across the six election rounds despite different numbers of qualifying parties.

| Election | D−14 poll L1 | D−7 poll L1 | D−2 poll L1 |
|---|---:|---:|---:|
| 2015 | 24 | 22 | 22 |
| April 2019 | 40 | 46 | 40 |
| September 2019 | 14 | 16 | 14 |
| 2020 | 12 | 12 | 6 |
| 2021 | 24 | 20 | 20 |
| 2022 | 14 | 14 | 14 |
| **Six-case arithmetic mean** | **21.33** | **21.67** | **19.33** |

**Interpretation:** The curated archival sample is not a random or predeclared sampling frame. Although the D−2 sample mean has a smaller L1, April 2019's D−7 chosen poll had a **larger** error than its D−14 snapshot. The difference must not be presented as evidence that KAHRELUM improved predictively through time. Different broadcasters and houses are represented at each horizon, so this is not a controlled longitudinal same-model comparison.

### Archival polling provenance

- [2015 archived opinion-poll table](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2015_Israeli_legislative_election)
- [April 2019 archived opinion-poll table](https://en.wikipedia.org/wiki/Opinion_polling_for_the_April_2019_Israeli_legislative_election)
- [September 2019 archived opinion-poll table](https://en.wikipedia.org/wiki/Opinion_polling_for_the_September_2019_Israeli_legislative_election)
- [2020 archived opinion-poll table](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2020_Israeli_legislative_election)
- [2021 archived opinion-poll table](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2021_Israeli_legislative_election)
- [2022 archived opinion-poll table](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2022_Israeli_legislative_election)

The owner package retains the **specific archive table date, polling firm, publisher, as-of cutoff and full party seat map for every one of the 18 records**. The date printed in a living archive is not independent proof of actual original publication time; the fieldwork end date is likewise **unknown**, not imputed from table date. Thus each sample is labeled `RETROSPECTIVE_COMPARATOR_ONLY_PUBLICATION_TIME_UNVERIFIED`, `forward_test_eligible=false`. Original outlet pages and their archived contemporaneous bytes are **not sealed**. The hand-chosen rows may suffer selection and transcription biases. 2022's 3.25% threshold means Meretz and Balad's failure to enter parliament is particularly significant and recorded without guessing their vote probabilities.

## 4. KAHRELUM pipeline applied to this validation

- **ROUTER / MCRI:** all six historical events and all three dated poll horizons required; no replacing one missing election with another.
- **SCOUT:** collect published gold election totals, surplus agreements, and dated poll tables.
- **SOURCEGRID:** first-party CEC where available, IDI for the 2015 archive, Wikipedia historic poll-table transcriptions explicitly lower grade; correlated/reused poll sources not independent replication.
- **K-ALIGN:** distinguish national vote totals, eligible-vote quota, official represented lists, source-poll list identity, survey seat maps, winner probabilities and real election outcomes.
- **IPR:** threshold and party mergers matter; cannot infer party vote-share uncertainty from seat-only poll maps.
- **BLACKGLASS-I:** exact historical reconstruction is potentially misleading if labeled a historical forecast; also publication date and original-source versions are not independently proven.
- **CRF / execution:** mathematics engine reconstructed six gold sets exactly; 18 historical broadcaster-error comparisons are descriptive, no fitted or frozen first-party historical probability model.
- **COMMAND / BLACKGLASS-II:** archive as **technical process validation**, not proof of election-prediction skill or a model-versus-polls win; disclose bad poll cases, missing timestamps and fieldwork uncertainty.
- **RECORD LOCK / AAIK:** append-only new version; preserve every earlier C0 and scoring baseline, source gap, error and signed-clock limitation.

## 5. Package freeze / verifiable bytes

Owner-only distributable package: `KAHRELUM_Israel_Model_v0_2_FROZEN.zip` (source software not embedded in this public GitHub report).

- ZIP SHA-256: `78b804a0f0bc67101a9541a0c44f0c10f4490721150d0dc6b2678841c94e413d`
- ZIP size: **32,190 bytes**; **20 files**, including code, six historical gold records, 18 poll rows, outputs, tests and manifest.
- README SHA-256: `f51c63e59097bb6093c08e2dcc0f2f85f23140f511f321ee12428cca3a75c2c0`
- HISTORICAL_AUDIT_RESULTS.json SHA-256: `f8d241025559946e7d8bb9b26192a59ab5415a05da0f04abe992b476b474d208`
- MANIFEST.sha256 SHA-256: `8954953e810e6a62bfd4aa83c5771239897ceaf69f77477c3b6eda00c0f6a719`
- Test source (additional v0.2): SHA-256 `3dce17a726414b357d60d5d9a3f10034255c5975a93d7c88321356b2bc4cf0df`
- **33/33 automated unit tests pass;** ZIP CRC, manifest SHA-256 and all 20 archive members checked.

The package hash commits to **owner package bytes only**, not to independent custody of the originating CEC and poll webpage contents. This report describes new-version development and owner-driven verification. GitHub commits, if read back, are a public publication trail, **not a cryptographic trusted external time oracle**.

## 6. Prospective case boundaries and outstanding tasks

Original immutable [C0 baseline](./BASELINE_LOCK_2026-10-26.md) and original [scoring protocol](./SCORING_PROTOCOL_2026-10-26.md) remain untouched and controlling. The archived [2026 supplemental analysis](./RUN_2026-10-26T215415Z.md), [ballot-list roster](./PARTIES_AND_LEADERS_2026-10-27T20261026T234042Z.md) and [model v0.1](./MODEL_CORE_V01_2026-10-27.md) remain separate versioned artifacts.

**A proprietary pre-election party vote-share/seat distribution model, actual published forward outcome probabilities, KAHRELUM-versus-broadcaster forecasting accuracy, an externally held blind test and probabilistic calibration have NOT been established by this exercise.** No first-party result for 2026 exists in this release. No predictions are backdated to C0. C1–C7 prospective checkpoints are separate and pending as their original trigger rules specify.

**Independent validation claim:** NOT ESTABLISHED. **Programmatic mechanical reconstruction:** PASS FOR SIX SELECTED CASES. **Retrospective poll comparison:** COMPUTED / PROVISIONAL. **Forecast superiority or predictive accuracy:** NOT ESTABLISHED. **Full election lifecycle:** LIVE / UNRESOLVED / NOT SCORED.

Any correction to this supplemental report should be a new dated erratum; do not silently revise this record.
