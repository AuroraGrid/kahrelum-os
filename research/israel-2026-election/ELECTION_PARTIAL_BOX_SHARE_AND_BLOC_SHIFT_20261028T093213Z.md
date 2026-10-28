# KAHRELUM | 26th Knesset | Count-mode correction and provisional bloc movement | 2026-10-28

**Case:** KAH-IL26-PROSPECTIVE-001
**Type:** Append-only prospective source observation, not a C3/C4/C5 capture, not a certified result.
**Captured UTC:** 2026-10-28T09:32:13Z
**Captured Israel:** 2026-10-28 11:32:13 IST (UTC+02)
**Captured US Eastern:** 2026-10-28 05:32:13 EDT (UTC-04)
**Captured Pakistan:** 2026-10-28 14:32:13 PKT (UTC+05)
**Original immutable controls:** C0 commit 05d441adad2f82a043fe8fbec1be7e35e2edf12a, blob b9adfe504c15def6e1804a78a8828e54ae5e93a5; scoring protocol blob ab0692085b63c90570065f602c005c409c3b72d5.

## FACT / attributed observed source progression

Source: Times of Israel election liveblog, 2026-10-28, https://www.timesofisrael.com/liveblog-october-28-2026

| CEC-attributed data as-of Israel time | Outlet post Israel time | Exact measured object | Netanyahu-aligned seats | Eisenkot-led non-Arab seats | Joint List + Ra'am seats | Quality |
| --- | --- | --- | ---: | ---: | ---: | --- |
| 09:20 IST (07:20 UTC) | 09:28 IST | 66.2% of ballot BOXES processed | 56 | 48 | 16 | Credible named media relay, not direct current official read |
| 10:03 IST (08:03 UTC) | 10:09 IST | 72.4% of ballot BOXES processed | 54 | 48 | 18 | Credible named media relay, not direct current official read |
| 10:58 IST (08:58 UTC) | 11:04 IST (09:04 UTC) | 76.8% of ballot BOXES processed | 54 | 47 | 19 | Credible named media relay, not direct current official read |

Dedicated newest publisher entry: https://www.timesofisrael.com/liveblog_entry/with-over-76-of-ballots-counted-pro-netanyahu-bloc-at-54-seats-eisenkot-led-bloc-at-47-arab-parties-increase-to-19/

**Headline inconsistency:** Publisher headline calls 76% "ballots," but body specifies 76.8% of **ballot boxes**. Use the defined body unit. This number is *not* nationally counted valid ballots / total national valid ballots.

**Latest current count checkpoint data schema:**
- Trigger requested: C3 >=25%, C4 >=50%, C5 >=75% of *valid ballots actually counted*, each out of a credible total valid-ballot denominator.
- Valid-vote numerator at the 10:58 source cutoff: **UNAVAILABLE**.
- Credible national total-valid-ballot denominator at the same cutoff: **UNAVAILABLE**.
- Valid-vote count fraction: **UNKNOWN, NOT 76.8%**.
- Observed reporting-unit share: **76.8% ballot boxes counted**, distinct metric.
- Full per-list valid vote shares: **NOT PUBLISHED in this specific 10:58 snapshot**; do not import older rates as contemporaneous.
- Projected aggregate seats: **54 / 47 / 19** (120 total) as reported, provisional; no certified seats.
- First formal projection-completion claim: **NOT VERIFIED**; C6B not triggered.
- Official 120-seat result: **NOT YET PUBLISHED**; C7 pending.
- Classification: **C3/C4/C5 MILESTONE_UNVERIFIED**; no milestone files manufactured.

## Timing and external-source conflicts

The latest separately inspectable static CEC-attributed valid-vote snapshot in this workflow is **2,937,354 valid out of 2,950,493 received ballots** at approx 07:58 IST: https://elections.handled.team/results/ (site rendering indicates latest feed 09:17 but vote counts correspond to previous snapshot). It is *not* interchangeable with the newer 10:58 box figure, and total eligible voters or turnout cannot be used as a substitute for the total-valid-vote denominator.

The official CEC public results URL https://cdn-votes26.bechirot.gov.il/ was accessible by indexed search only as a **dated 2026-10-06 TEST environment**: not admissible as a 2026-10-28 counted-vote observation.

The current poll count includes nonrepresentative location order. Media attributes approximately 600,000 expected double-envelope absentee votes; this is a reported estimate, not a verified final count. These ballots may change list shares, particularly for near-threshold parties.

## INFERENCE / clear limits

- The Arab-listed parties rose from a 16-seat early provisional allocation to 19 seats in the current media relay, while the pro-Netanyahu bloc fell from 56 to 54 and the non-Arab opposition from 48 to 47.
- Combining 47+19 into 66 does **not** establish a committed majority coalition, prime minister, confidence agreement, or any formal CEC certification.
- No sourced legally effective election postponement, nationwide suspension or court-ordered delay was discovered in this specific scan.
- Later count-order adjustments may reverse the allocation. This is *not* an election outcome forecast from KAHRELUM's locked original C0.

## Preregistered integrity / stage declaration

C0 and original SCORING_PROTOCOL_2026-10-26.md were retrieved and confirmed unchanged before this observation. C1, C2 and C6 exist. C3, C4, C5, C6B and C7 stage files did not exist as of this source check. No backdating, inferred denominator, fabricated counts, or amendments to C0/protocol. This file is an explicitly labeled **NON-CHECKPOINT** supplement preserving the actual observation time.

**Status:** ELECTION LIVE / UNRESOLVED / NOT SCORED. Next trigger remains first valid-vote fraction with a credible numerator and denominator.