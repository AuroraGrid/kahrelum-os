# KAHRELUM Israel Election 2026 | preregistered checkpoint protocol

**Case:** KAH-IL26-PROSPECTIVE-001  
**Preregistered UTC:** 2026-10-26T21:35:35.727Z  
**C0 frozen baseline commit:** `05d441adad2f82a043fe8fbec1be7e35e2edf12a`  
**Control state:** C0 locked; C1–C7 future, unresolved.  
**Protocol modification rule:** Any changes are new `AMENDMENT_*.md` files; preserve original. No retroactive scoring-rule or checkpoint-cutoff edits.

## Trigger plan (PKT and Israel standard time)
| Event ID | Trigger | Pakistan local clock | Israel local clock | Evidence to save |
| --- | --- | --- | --- | --- |
| C0 | Baseline before the opening | Mon Oct 26 already frozen | Mon Oct 26 | Frozen inputs and external comparator |
| C1 | Final pre-poll checkpoint | Tue Oct 27 **09:30 PKT** | Tue Oct 27 **06:30** | New poll publication only if genuinely available by cutoff, otherwise NO CHANGE |
| C2 | Official voting close (usual) | Wed Oct 28 **01:05 PKT** | Tue Oct 27 **22:05** | Closure / extensions, exact exit polls with outlet attribution. An exit poll is not a counted-vote percentage |
| C3 | First verifiable **>=25% counted** | Event-driven | Event-driven | Count percentage, denominator, parties, source timestamp |
| C4 | First verifiable **>=50% counted** | Event-driven | Event-driven | Same |
| C5 | First verifiable **>=75% counted** | Event-driven | Event-driven | Same |
| C6 | First credible **projected largest list / winner declaration** | Event-driven | Event-driven | Outlet, projection text, clock, vote count known at time, distinction from PM appointment |
| C7 | Official result published and cross-checked | Target from Wed Nov 4 onward | Target from Wed Nov 4 onward | Gold vote totals/seats, seat-vector errors, procedural postmortem |

**Additional conditional subevent:** first timestamped outlet **formal projection completion** or allocation table if distinguishable from C6. This is NOT conflated with reaching 75% counted.

The 25/50/75 stages are based on **valid ballots actually counted divided by verifiable expected or received valid-ballot denominator**, not reporting precinct percentage or turnout percentage. If only `% precincts reporting` exists, record a separate information update but do **not** label it C3/C4/C5. If denominator is changing or unidentifiable, flag `MILESTONE_UNVERIFIED`.

If an hourly monitor first observes 39%, count the >=25% stage at 39% and explicitly state **first observed**, never pretend to have captured exactly 25%. If two thresholds have passed when first observed, write separate stage reports with shared evidence and label `SIMULTANEOUS_LATE_CAPTURE`, not independent contemporaneous reads. Each stage fires **once**, never overwritten. Where no trustworthy 25/50/75% counted denominator is public before official publication, report a documented FAILED_CAPTURE and preserve the miss.

## Standard schema per stage
```yaml
case_id: KAH-IL26-PROSPECTIVE-001
event_id: C3
captured_utc: null
event_observed_utc: null
source_published_utc: null
trigger: 'first observed >=25% counted valid votes'
threshold_requested_pct: 25
actual_first_observed_pct: null
percentage_object: 'valid ballots counted / independently verifiable denominator'
numerator: null
denominator: null
source_url: null
source_type: 'official | established media | model | unverified'
source_title: null
count_stage: 'verified | unverified | missed | delayed'
vote_share_by_list: null
projected_seats_by_list: null
party_or_list_call: null
coalition_or_pm_call: null
source_contradictions: []
update_from_prior: null
candidate_statement_verbatim_short_excerpt: null
what_was_known_then: null
source_traceability: null
operator_method: 'AI-assisted manual KAHRELUM public process, not frozen runtime execution'
```

## Predeclared scoring after the official result

**Gold source:** Israel Central Elections Committee, 26th Knesset, when available and officially published. Do not treat an election-night ticker as the final gold set. Capture exact official URL, source timestamp, party identifiers, vote totals, valid vote shares and the 120 seat allocations. Note any subsequent corrections.

**Seat-vector evaluation (frozen Oct 26 external comparator):** use the 14 originally named lists in the exact baseline. Measure `MAE = sum(abs(external_forecast_seats_i - official_seats_i)) / 14`; also `L1 seat error = sum(abs(..))` and `RMSE = sqrt(sum((..)^2)/14)`. Party aliases may only be mapped with source-supported explicit crosswalk. Parties not on the final ballot, mergers and missing gold labels must be explained, not silently treated as hits. The original third-party seat vector sums to 120.

**Survey baselines:** Compare independent Oct 23 Channel 12, Channel 13 and Kan survey seat maps separately with official seats where explicitly published, with an explicit not-published status rather than imputed values. Document treatment of below-threshold lists. Do not label these as KAHRELUM probability predictions.

**Count-update evaluation:** For each observed C2–C6 projected seat vector from a named source, calculate MAE against gold *after* final official publication. Keep stage, timestamp, missingness and stage denominators. Chart progress of error only for comparable seat units and the same consistent list set. Track any projection corrections in separate lines.

**Probability calibration boundary:** A Brier score is possible only for preregistered binary events with **captured pre-resolution numeric probabilities** and official binary outcomes. Any externally published probabilities must be labeled `EXTERNAL_FORECAST`, not KAHRELUM. There was no frozen original KAHRELUM party/winner outcome probability; thus the `KAHRELUM winner Brier` and `KAHRELUM calibration curve` are **NOT ESTABLISHED / N/A**. Do not retroactively derive probabilities from seat polls or rankings. One election cannot establish long-run reliability or calibration even with an external 50,000-draw model.

**Verification-quality grade (process, not political actor):** pass/fail each of these ten transparent gates:
1. C0 Git commit predates first opening;
2. C1 independently timestamped;
3. C2 explicitly distinguishes exit poll from count;
4. C3 correct denominator or honest missed state;
5. C4 correct denominator or honest missed state;
6. C5 correct denominator or honest missed state;
7. C6 outlet-attributed call and PM distinction;
8. C7 independently links official gold;
9. no hindsight edits of C0 or thresholds;
10. report both errors and successful observations, plus deviation log.
A missing stage receives NOT CAPTURED, not PASS. A reliable block is not forecast accuracy.

**Postmortem must report:** baseline source quality, captured checkpoint timeline, counterevidence, every corrected forecast comparison, accepted/failed stage, final errors, calibration limits, hindsight integrity, and what external evaluation would be required next. Preserve errors even if embarrassing.

## Automation execution standards
Every scheduled or watch run:
- Read C0 and this protocol first, then identify existing checkpoint filenames to guarantee idempotency.
- Fetch primary CEC results first; use named reputable broadcaster/wire sites for provisional percentages and projections.
- Only create a stage file after independently verifying its trigger and timestamp. Do not manufacture count percentages or projection times.
- Use new files named `C1_*.md`, ..., `C7_*.md` with the actual captured-UTC timestamp in content.
- Keep the old C0 and scoring protocol intact; record conflict or unverified state explicitly.
- If a GitHub write fails or site is inaccessible, report failure and keep available sourced observations in the automation report without claiming archival success.
- Portfolio case index must reflect stage completions without hiding misses; before official gold it remains **LIVE / UNRESOLVED**.
- Do not auto-publish or send any election-related political persuasion. Analytical audit only.

## Limitations
One same-operator pre-registered public case. Git timestamps support version ordering but no third-party secure time attestation. Polls and model use overlapping sources. External source-page data may mutate; link alone does not prove byte identity. Election-night updates are measurement snapshots, not independent forecast recalibrations of a locked baseline. An official parliamentary seat allocation is not equivalent to a sworn-in government.
