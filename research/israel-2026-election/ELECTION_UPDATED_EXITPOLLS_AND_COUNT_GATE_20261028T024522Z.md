# KAHRELUM | Post-close revised exit-poll source observation and count-gate audit

**Case:** KAH-IL26-PROSPECTIVE-001  
**Observation ID:** ELECTION_UPDATED_EXITPOLLS_AND_COUNT_GATE_20261028T024522Z  
**Captured:** 2026-10-28T02:45:22Z UTC = 2026-10-28 04:45:22 IST (Asia/Jerusalem, UTC+02) = 2026-10-27 22:45:22 EDT (America/New_York, UTC-04) = 2026-10-28 07:45:22 PKT (Asia/Karachi, UTC+05)  
**Classification:** Append-only post-C2 source supplement; **NOT C3/C4/C5/C6B/C7**, not an updated C0 forecast.  
**Prior artifacts:** C1/C2/C6 already archived. Original C0 and scoring protocol remain frozen. No original report is replaced.

## FACT: new, source-attributed revised broadcaster exit polls

The continuing **Ynet** election-night report, originally published **2026-10-27 22:08 IST**, displayed updated **Channel 12, Channel 13 and Kan 11 exit-poll projections** at capture time. The rendered article omits an exact timestamp for the revision; therefore its revised projections have **unknown exact publication time**, although they were visible by 2026-10-28 04:45:22 IST. They are **surveys of voters, not ballots counted**, and are external broadcaster outputs, not KAHRELUM electoral forecasts.

Source: https://www.ynetnews.com/article/skd97fc2gl (original publication at article foot; revisions summarized before first-generation estimates). Original broadcaster article timestamp for these precise revised vectors **NOT RETRIEVED**.

| Named broadcaster | Earlier election-night projection previously archived | Revised exit poll visible at capture | Change / uncertainty |
|---|---|---|---|
| **Channel 12** | Likud 24; Netanyahu bloc 50; Jewish/Zionist opposition bloc 52; Arab lists 18 | **Likud 27; Netanyahu bloc 52; Jewish/Zionist opposition bloc 49** | **Likud +3; Netanyahu bloc +2; opposition -3.** Remaining seats after blocs mathematically equal 19; this arithmetic residual is **not a publisher-authenticated party-by-party map**. Source attributes Yashar 21, Democrats 9, Shas 7, Yisrael Beytenu 7, Joint List 11. |
| **Channel 13** | Likud 25; Netanyahu bloc 50; opposition bloc initially 53, subsequently 52 in separate archived 22:57 revision; Arab-led lists 18 after that revision | **Likud 27; Netanyahu bloc 51; opposition bloc 51; Arab-led lists 18** | Likud +2; right bloc +1 relative to prior 50; opposition -1 relative to archived 52. Yashar 22, UTJ 6, according to Ynet. |
| **Kan 11** | Likud 25; Netanyahu bloc 50; opposition bloc 53 in earlier Reuters-captured snapshot | **Likud 27; Netanyahu bloc 51; opposition bloc 51** | Likud +2, main blocs equal. Residual 18 seats arithmetically, **not an authenticated complete party vector**. |

The before/after comparisons combine **sequential, differently timed broadcaster projections**. They cannot be used to conclude observed vote swings, a winner, a government-forming coalition or any CEC-approved result. **None of the revised main-bloc totals reaches 61 seats.** The historical Channel 13 intermediate 53/17 to 52/18 discrepancy remains documented, not silently corrected in prior files.

## FACT: partial official counting reported, but no eligible threshold denominator

Ynet's same continuing story states: **as of Wednesday 2026-10-28 03:45 IST, 2,419 polling stations out of more than 10,000 were counted**, attributed to the Central Elections Committee. This is **a polling-station count**, not a percentage of valid votes counted. Official 12,018 polling-station logistical count appears in the case's prior voting-day record; mixing these figures into a valid-ballot denominator would be invalid.

Additional mutable/public pages contained different count-progress indicators:
- Wikipedia election article displayed **23.9% "reporting" as of 04:05 IST**, without an auditable current valid-ballot numerator and denominator: https://en.wikipedia.org/wiki/2026_Israeli_legislative_election . **Third-party, mutable, unsuitable for C3**.
- A non-official election tracker showed alternative percentages and provisional seat allocations at earlier page snapshots: https://www.thepetek.com/he . **Mutable secondary compilation, count unit/denominator not independently authenticated**.
- The public indexed CEC dashboard https://cdn-votes26.bechirot.gov.il/ continued to expose **October 6, 2026 TEST-environment data**, not a verified Oct 28 live total. **Reject October 6 numbers as live evidence**.

**Verified valid votes counted numerator:** UNAVAILABLE.  
**Verified expected/received valid votes denominator:** UNAVAILABLE.  
**Percentage of valid votes counted:** NOT ESTABLISHED.  
**Vote shares by list at this precise timestamp:** NOT AUTHENTICATED.  
**Official seat map:** UNAVAILABLE.  
**C3 >=25% valid vote count:** BLOCKED / NOT TRIGGERED. **C4 and C5:** NOT TRIGGERED.  
**C6:** previously archived first named outlet projection; do not fire twice. **C6B:** no distinct formal projection-complete declaration verified. **C7:** not due; official certified 120-seat outcome not published.

## INFERENCE, source conflicts, and guardrails

The three revised exit-poll summaries shift the apparent between-bloc picture versus 22:00 exit-poll snapshots. The absence of a clear 61-seat majority persists. This is a **material change in an external survey snapshot**, not proof of a political outcome or of election fraud. The unidentified exact revision timestamp, incomplete party-by-party vectors, source-page mutability, and conflicting reported count percentages limit any quantitative conclusion.

In particular, polling-station reporting progress, turnout, and vote shares cannot substitute for **valid votes counted / verifiable valid-ballot denominator**. No invented count threshold, seat allocation or retrospective probability was recorded. No renewed C0 baseline was issued and no KAHRELUM proprietary winner forecast was generated.

## Source evidence and access grade

1. **Ynet, originally 2026-10-27 22:08 IST; revised section timestamp not supplied; captured 2026-10-28 04:45 IST**: https://www.ynetnews.com/article/skd97fc2gl . **Grade B: named credible local news reporting of original broadcasters; direct original revised broadcaster pages not retrieved.**
2. **Current indexed CEC site (TEST display dated October 6; live source unavailable)**: https://cdn-votes26.bechirot.gov.il/ . **Grade F for live October 28 numerator/denominator; government site identity alone does not validate stale data.**
3. **Wikipedia mutable count indicator as of 04:05 IST**: https://en.wikipedia.org/wiki/2026_Israeli_legislative_election . **Grade D: context only; not election-stage trigger evidence.**
4. **C0 frozen Oct 26, immutable**: https://github.com/AuroraGrid/kahrelum-os/blob/05d441adad2f82a043fe8fbec1be7e35e2edf12a/research/israel-2026-election/BASELINE_LOCK_2026-10-26.md
5. **Preregistered untouched scoring protocol**: https://github.com/AuroraGrid/kahrelum-os/blob/main/research/israel-2026-election/SCORING_PROTOCOL_2026-10-26.md

**Outcome:** SOURCE UPDATE ARCHIVED. **C3–C5/C6B/C7 NOT CREATED.** Election case remains LIVE / UNRESOLVED / NOT SCORED; original preregistration unchanged.
