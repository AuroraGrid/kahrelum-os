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
