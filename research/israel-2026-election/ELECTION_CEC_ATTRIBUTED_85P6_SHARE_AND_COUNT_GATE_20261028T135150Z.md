# KAHRELUM Israel 2026 | CEC-attributed 85.6% total-ballots report and valid-vote denominator gate

**Case:** KAH-IL26-PROSPECTIVE-001  
**File type:** APPEND-ONLY SOURCE OBSERVATION, not a preregistered C3/C4/C5 stage  
**Captured UTC:** 2026-10-28T13:51:50Z  
**Captured Israel:** 2026-10-28 15:51:50 IST (UTC+02)  
**Captured U.S. Eastern:** 2026-10-28 09:51:50 EDT (UTC-04)  
**Captured Pakistan:** 2026-10-28 18:51:50 PKT (UTC+05)  
**Triggered review:** consequential CEC-attributed later seat shift; source denominator and seat-source disagreements.  
**Milestone status:** C3/C4/C5 MILESTONE_UNVERIFIED; no official certified result or new legally effective postponement.  
**Protocol preservation:** C0 original blob b9adfe504c15def6e1804a78a8828e54ae5e93a5; scoring-protocol blob ab0692085b63c90570065f602c005c409c3b72d5. Neither file is edited.

## Timestamped primary-to-secondary source chain

1. **The Times of Israel (published 28 October 2026, 15:07 IST / 13:07 UTC):** https://www.timesofisrael.com/liveblog-october-28-2026 . The outlet attributes an update to the **Central Elections Committee**: Netanyahu bloc **53**, Eisenkot-led bloc **48**, Arab-led parties **19**, total **120 provisional seats**. It says **93% of ordinary ballots** processed and **85.6% of the total** processed; another **~600,000 double-envelope votes** await counting. CEC said some 7% of ordinary ballots require further oversight. These are **not certified** and the article does not supply an authenticated exact nationwide valid-vote denominator. It says another immediate update is unlikely.
2. **Independent third-party derivative, observed page at capture; data timestamp 28 October 2026, 14:23 IST / 12:23 UTC:** https://www.israelielection.org/ . It reports committee-file-linked **4,854,102 list votes counted**, with list votes summing arithmetically to that total. It separately estimates **5,660,221 expected** and publishes a provisional **53 Netanyahu / 49 non-Arab opposition / 18 Arab-party** seat map, which differs by one seat in each of the latter two groupings from the 15:07 ToI/CEC-attributed report. **The 5,660,221 expected denominator is third-party/model-side and is NOT authenticated as final national valid votes.** Do not divide to fire C3–C5.
3. **First-party results endpoint attempted, current read failed:** https://cdn-votes26.bechirot.gov.il/ ; public search index still displayed an **October 6 test environment**, and direct web retrieval timed out during this review. No first-party exact final valid-vote denominator was extracted. No election-fraud finding follows from this access problem.

**Conditional count checkpoint gate:**
- Numerator **4,854,102** = third-party transcription/sum of listed partial count, timestamped 14:23 IST. The originating exact first-party byte record was **not retrieved**.
- Denominator = **UNAVAILABLE / NOT CREDIBLY VERIFIED** for total valid votes in the election. The derived 5,660,221 is **unverified expected valid count** and may change; 5,695,682 is **reported participation**, not nationwide valid votes; 93% is **ordinary ballots only**, and 85.6% is **total ballot-count progress**, not independently verifiable final-valid-vote ratio.
- Valid-vote counted percentage = **NOT CALCULATED**.
- **C3 >=25%, C4 >=50%, C5 >=75%:** cannot be authenticated on this evidence; **do not manufacture stage records**. If valid denominator becomes verifiable later, next first observed stages must reflect actual late capture and simultaneous qualification where applicable.

## List-level third-party partial-count transcription, NOT official gold

**At source's 14:23 IST dataset time; count/list totals and shares as displayed (not a self-generated seat forecast):**

| List | Votes counted | Share |
|---|---:|---:|
| Likud | 1,006,726 | 20.74% |
| Yashar | 786,109 | 16.19% |
| Joint List | 446,240 | 9.19% |
| B'Yachad | 436,588 | 8.99% |
| Democrats | 316,161 | 6.51% |
| Yisrael Beiteinu | 289,291 | 5.96% |
| Ra'am | 283,615 | 5.84% |
| United Torah Judaism | 276,498 | 5.70% |
| Otzma Yehudit | 269,385 | 5.55% |
| Shas | 257,898 | 5.31% |
| Religious Zionism–Zehut | 231,703 | 4.77% |
| Reservists–Economic | 127,844 | 2.63% (below threshold at capture) |
| People of Israel | 78,377 | 1.61% (below threshold) |
| Noam | 7,530 | 0.16% (below threshold) |
| Other lists | 40,137 | 0.83% |
| **Total listed** | **4,854,102** | **100% approximately (rounded)** |

**Source contradictions:** The Times of Israel's headline says "votes counted" in shorthand while its body distinguishes ordinary ballots and total progress; early updates used % ballot boxes. The independent model's provisional 53/49/18 distribution is **not** the same as the later ToI/CEC-attributed 53/48/19 distribution; do not blend them. No list-level certified 120-seat allocation exists at this capture.

## Election integrity & process

- Original Oct 27 vote occurred; no new verified legally effective postponement, suspension or date change was observed in this review. President Herzog's 15:08 IST comment about **avoiding another election** concerns future coalition formation and is not a request or legal order to delay the already held vote: https://www.timesofisrael.com/liveblog-october-28-2026 .
- Approximately 600,000 double-envelope ballots remain uncounted; provisional votes and seats can shift. The unknown final total of valid votes and source-access gate prevent a compliant C3/C4/C5 capture.
- C1 (late), C2 (late) and C6 remain archived. C6B separately not triggered by a verifiable new named 'formal projection complete' event. C7 awaits official publication; no certified gold or proprietary winner probability exists.
- Dated v0.5 source-risk Brier **0.305392** is historical poll-source-error diagnostic, **not** a 2026 election-outcome Brier.
- All information is nonpersuasive election-result auditing. This observation is append-only and does not edit C0, the scoring protocol, any previous snapshot or the immutable runtime release.
