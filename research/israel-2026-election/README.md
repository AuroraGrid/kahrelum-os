# Portfolio case | Israel's 2026 Knesset election: prospective evidence-and-forecast audit

**K-PREDICT v0.6.0 research:** [Methods, historical results and limitations](./K_PREDICT_V06_2026-10-27.md) · [methodology](./K_PREDICT_V06_METHODS_2026-10-27.md) · [benchmarks](./K_PREDICT_V06_BENCHMARKS_2026-10-27.csv) · [cutoffs](./K_PREDICT_V06_CUTOFFS_2026-10-27.csv) · [sources](./K_PREDICT_V06_SOURCES_2026-10-27.json). Overall **PARTIAL**: six retrospective held-out elections, no authenticated historical cutoff captures, and no supported claim of prospective model superiority. The genuine vote-share engine has synthetic verification only; the historical scores concern seat-space models. [Final execution report](./K_PREDICT_V06_COMPLETION_2026-10-27.md) and [integrity/readback evidence](./K_PREDICT_V06_INTEGRITY_2026-10-27.json) record every acceptance verdict. Owner ZIP delivery is BLOCKED by environment disconnection; GITHUB PUBLISHED / LIVE DEPLOYMENT UNVERIFIED.



> **Current checkpoint update:** [C1 delayed pre-opening source capture](./C1_PREOPEN_2026-10-27.md) was recorded at 2026-10-27T04:43:23.041Z, 13m23s after the registered target. Exact-cutoff capture was missed; C0 and the original scoring protocol are unchanged. C2–C7 remain pending. New v0.6 historical modeling was first executed successfully after the C1 cutoff.


**KAHRELUM OS case:** KAH-IL26-PROSPECTIVE-001  
**Status:** C0 original archived October 26; C1 archived with a documented 13m23s late pre-opening capture on October 27; election outcome and scoring remain unresolved.  
**Mode:** Public, AI-assisted, operator-directed case study applying the published KAHRELUM research/forecast-control method; **not a witnessed execution of the immutable v2.3.4 runtime**.  
**Purpose:** Test evidence provenance, timestamp discipline, proper distinction between exit polls / reported votes / final certified results, comparability of public quantitative forecast sources, and no-hindsight reconstruction.

## Start here
- [C0 original pre-poll record, LOCKED](./BASELINE_LOCK_2026-10-26.md) ([immutable creation commit](https://github.com/AuroraGrid/kahrelum-os/blob/05d441adad2f82a043fe8fbec1be7e35e2edf12a/research/israel-2026-election/BASELINE_LOCK_2026-10-26.md)).
- [Preregistered stage and error-scoring protocol](./SCORING_PROTOCOL_2026-10-26.md) ([original commitment](https://github.com/AuroraGrid/kahrelum-os/commit/2c8708cdca70adf0e6ef66d8fba29aebede02c90)).
- [Official CEC schedule](https://www.gov.il/en/pages/time--table-26) and [IDI voting rules](https://en.idi.org.il/articles/66721).
- [Raw polling records](https://israelielections.com/2026/polls/) and [external forecast model used as comparator](https://www.israelielection.org/forecast).

## Why this is a worthwhile proof case
The original C0 and scoring methodology were recorded in GitHub commits **before the normal first polling station opened**. The prospective evaluation will preserve an append-only evidence trail as subsequent observations arrive, including failed-to-capture checkpoints, opposing poll measures, source disagreements, and changes in accuracy through the count. We will publish errors and source limitations rather than edit the original baseline.

## Registered checkpoints
| Stage | Goal | Status |
| --- | --- | --- |
| C0 | Original source & comparator freeze, Oct 26 | **ARCHIVED** |
| C1 | Pre-opening refresh, Oct 27 at 06:30 Israel / 09:30 PKT | **ARCHIVED LATE**: [C1 source capture](./C1_PREOPEN_2026-10-27.md) at 06:43:23 Israel / 09:43:23 PKT, 13m23s late ([immutable commit](https://github.com/AuroraGrid/kahrelum-os/blob/f747d4f84c20cda78b45684e7181b1019f550f27/research/israel-2026-election/C1_PREOPEN_2026-10-27.md)); exact registered cutoff missed |
| C2 | Poll close / outlet exit polls, Oct 27 at 22:05 Israel / Oct 28 at 01:05 PKT | AWAITING |
| C3 | First observed >=25% valid votes counted, verified denominator | AWAITING / CONDITIONAL |
| C4 | First observed >=50% valid votes counted, verified denominator | AWAITING / CONDITIONAL |
| C5 | First observed >=75% valid votes counted, verified denominator | AWAITING / CONDITIONAL |
| C6 | First named-outlet projected largest parliamentary list / separate completed projection event | AWAITING / CONDITIONAL |
| C7 | Final official 120-seat gold result (from Nov 4) and full process/calibration audit | AWAITING |

**Key distinction:** The registered numerical election seat forecast is sourced from a **third-party site**, not independently predicted by KAHRELUM. KAHRELUM's measured performance here is provenance, stage capture, adversarial checks and audit discipline. External seat forecasts can be scored against official seats; **a proprietary KAHRELUM winner-prediction Brier score cannot honestly be claimed**.

## Operating contract
1. Reinspect source timestamps and object identities on each checkpoint.
2. Distinguish FACT / SUPPORTED REPORTING / INFERENCE / EXTERNAL FORECAST / UNRESOLVED.
3. Use **first verified 25/50/75% valid votes counted**, not turnout or precinct percentage.
4. Record any true news-outlet projection but do not call it an official winner or a formed government.
5. Preserve all original baselines, incorrect sources, contrary evidence and unavailability states.
6. Score pre-registered seat comparisons only once the Central Elections Committee publishes gold results.
7. Never turn this one operator-run case into unsupported claims of external validator independence or general forecasting superiority.

**KAHRELUM contact:** hasan@kahrelum.com  
**Canonical OS:** https://kahrelum.com  
**Case baseline is reviewable now; the final outcome is deliberately left blank until verified.**


## Supplemental run appended: 27 October 2026 (PKT)

[Evidence-to-decision supplement](./RUN_2026-10-26T215415Z.md) · [Source/access and polling record](./SOURCES_2026-10-26T215415Z.json) · [Integrity manifest](./INTEGRITY_2026-10-26T215415Z.json).

Evidence cutoff: **2026-10-26T21:54:15Z / October 27 02:54:15 PKT**. Direct final N12 and Channel 13 poll reads, separately labeled Kan corroboration, contrary polling, conditional scenario tests and source-access limitations. C0 and original protocol remain unchanged. This is an earlier supplemental audit, **not C1**. **Case remains LIVE / UNRESOLVED / NOT SCORED; C1–C7 pending.** Public-methodology analysis only; immutable runtime not executed. No first-party electoral outcome prediction.

## All ballot lists | dated neutral registry

[**37 contesting lists + withdrawn Blue and White: official ballot letters, top-ranked candidates, coalition components, individual CEC links, provenance/access grades**](./PARTIES_AND_LEADERS_2026-10-27T20261026T234042Z.md). Captured **2026-10-26T23:40:42Z** (October 27, **04:40 PKT / 01:40 Israel**). The Brit Olam / Redemption of Israel list (**זץ**) is explicitly verified; the Blue and White withdrawal is separately confirmed by its primary CEC page. The dataset supplying the other individual first-party links is dated October 22; only two individual CEC bodies were directly retrieved in this review, so do not read B-grade entries as fresh first-party revalidations. This is an **append-only supplement**; C0, its scoring protocol, runtime and forecast inputs stay immutable. The case remains **LIVE / UNRESOLVED / NOT SCORED**.


## New independently executed engineering supplement (October 27, pre-C1)

[**KAHRELUM model core v0.1: code-hash freeze, 2021/2022 vote-to-seat reconstruction, 15 passing tests and nine-survey source-disagreement analysis**](./MODEL_CORE_V01_2026-10-27.md). This is an **independently implemented analysis subsystem** (owner source package committed by SHA-256), not a run of the immutable KAHRELUM runtime. **No proprietary numerical 2026 election winner, seat outcome or probabilities were issued**; the forecast accuracy and C1–C7 stages remain unresolved. Preserve original C0 and scoring protocol unchanged.


## Historical seat-allocation verification v0.2: six elections (October 27, 2026)

[**Six historical elections, 61 represented lists, 720 seats correctly reconstructed; 18 separately labeled provisional archived-poll comparisons; 33 passing tests**](./HISTORICAL_VALIDATION_V02_2026-10-27.md). Owner-package ZIP SHA-256: `78b804a0f0bc67101a9541a0c44f0c10f4490721150d0dc6b2678841c94e413d`. Mechanical correctness **is not forecasting accuracy**; the D−14/D−7/D−2 archived poll maps are **external poll comparisons**, not a fitted KAHRELUM prediction; source publication times are not authenticated. No 2026 first-party election winner/seat probability is produced. C0, protocol, previous reports and C1–C7 remain separately governed and unchanged.


## Pre-opening audit v0.3, October 27, 05:41 PKT

[**New independent nine-poll source-diagnostic and process-audit report**](./PREOPEN_SOURCE_AUDIT_V03_2026-10-27.md). The separately frozen owner ZIP contains an independently written audit extension, all six previously reconstructed historical election gold sets, 18 retrospective external poll comparisons and **53 passing automated tests**. It records nine published pre-election survey maps, 37-list registry linkage, full party seat ranges, non-independent houses and missing-vs-zero evidence gates. **Not a proprietary KAHRELUM 2026 seat or winner prediction**, and no event probabilities were issued. C1–C7 continue as preregistered; original C0 and protocol remain unchanged.


## Historical verification closed at 2013: final v0.4 (October 27, 2026)

**[Seven-election historical suite, year-specific 2013 threshold and archived-poll evidence](./HISTORICAL_CLOSURE_V04_2013.md)**: 2013, 2015, both 2019 contests, 2020, 2021 and 2022. All **73/73 represented ballot-list allocations and 840 seats reconstructed**, no mechanical seat mismatch; **65/65 tests pass**. Three explicitly provisional third-party 2013 poll rows bring the historic source comparison total to **21**. This is **counting mechanics from known past votes, NOT KAHRELUM's future-election forecasting skill**. The earlier v0.1/v0.2/v0.3 reports are preserved as predecessor releases. Scope is CLOSED at January 2013, with no 2009 or earlier election. The 2026 case C0 and scoring protocol remain unchanged, and C1–C7 operate separately; election outcome still LIVE / UNRESOLVED / NOT SCORED.


## Source-quality probability diagnostic v0.5 | Oct 27, prior to C1

[**KAHRELUM v0.5 exploratory source-risk model and complete engineering audit**](./SOURCE_RISK_MODEL_V05_2026-10-27.md) is a new append-only technical release. **118/118 automated tests passed** and all 35 members of v0.4 stayed byte-identical; an owner-only source ZIP is SHA-256 sealed. Its numeric probabilities concern **whether an archived third-party poll has large seat-allocation error**, NOT any party's chance of winning or obtaining seats. A transparent historical pseudo-forward exercise scores **Brier 0.305392**, worse than the uninformative **0.250000** reference. The 18 scoring rows share just six distinct held-out elections and the historical original publisher dates lack secure custody. **No KAHRELUM 2026 party/winner outcome projection is issued.** An unresolved current registry discrepancy (original 37 active, conflicting later 35/36 reports) is retained. Original C0, scoring protocol and C1–C7 remain separate and unchanged.


## K-PREDICT v0.6 post-disconnection recovery | October 27, 2026

[**Recovery-kit verification, package SHA-256 and fail-closed blockers**](./K_PREDICT_V06_POST_DISCONNECT_RECOVERY_2026-10-27.md). The original v0.6 owner source directory is still inaccessible after Work disconnected, so the original v0.6 frozen source ZIP has **not** been produced and cannot be claimed. A **distinct** verified recovery kit containing the exact executable v0.5 predecessor, public benchmark references, freshly reexecuted 118 predecessor tests and original-source recovery script is archived in the owner's KAHRELUM file library (SHA-256 `411edb2c964539778606cee344afe22a373dc00d46ba45f173faccba82e9cd3f`). This does NOT replace the original v0.6 code or establish predictive superiority. Live-site deployment and authenticated historical input times remain unverified. Original C0/protocol unchanged.


## Election-day integrity source observation (27 October 2026)

[Election-day integrity observation (27 October 09:33 IST)](./ELECTION_INTEGRITY_OBSERVATION_20261027T0733Z.md) records newly published reports of possible future election-result challenges and localized voting-station interference, together with the CEC's reported rejection of a separate voter-tracking allegation. This is an append-only, timestamped **unresolved source-risk supplement**, not a certified violation, national postponement, counted-vote stage, or election-outcome prediction. C0, the original scoring protocol, and C1 are unchanged; C2–C7 remain conditional.
