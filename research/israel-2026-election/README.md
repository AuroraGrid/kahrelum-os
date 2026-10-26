# Portfolio case | Israel's 2026 Knesset election: prospective evidence-and-forecast audit

**KAHRELUM OS case:** KAH-IL26-PROSPECTIVE-001  
**Status:** C0 original archived on 26 October 2026; election and score unresolved.  
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
| C1 | Pre-opening refresh, Oct 27 at 06:30 Israel / 09:30 PKT | AWAITING |
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
