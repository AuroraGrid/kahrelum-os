# KAHRELUM | C2 supplemental observation: near-final turnout and untriggered count gate

**Case:** KAH-IL26-PROSPECTIVE-001  
**Stage:** POST-C2 SUPPLEMENT, NOT C3/C4/C5, NOT C6B, NOT C7  
**Capture UTC:** 2026-10-27T22:55:57Z  
**Capture Israel:** 2026-10-28 00:55:57 IST (UTC+02)  
**Capture US Eastern:** 2026-10-27 18:55:57 EDT (UTC-04)  
**Capture Pakistan:** 2026-10-28 03:55:57 PKT (UTC+05)  
**Publication status:** Supplemental observation captured after the prior C2 checkpoint; C2/C6 original records remain immutable.
**Method:** AI-assisted manual source audit, NOT execution of an immutable KAHRELUM election-forecast runtime.

## FACT / credible CEC-attributed reporting

The Times of Israel published at **2026-10-27 23:14 IST (21:14 UTC / 17:14 EDT / 2026-10-28 02:14 PKT)** the CEC-attributed **near-final 22:00 IST turnout: 77.7%, 5,695,682 persons**, versus **70.6% at the same hour in 2022**. This is the highest turnout for that closing hour since 1999. Crucially, it was **near-final**: some voters queued by normal close were still eligible to finish.

Source: https://www.timesofisrael.com/liveblog_entry/near-final-election-turnout-at-77-7-highest-since-1999/  
Independent reporting corroborating 77.7% as turnout, not ballots counted: https://www.reuters.com/world/middle-east/netanyahus-political-survival-line-israel-votes-2026-10-27/ ; https://apnews.com/article/3b5a0fd078208155337ee9a0b9fbfde2

**Turnout numerator:** 5,695,682 participating voters reported (CEC-attributed secondary source). **Turnout denominator:** 7,331,981 eligible registered voters (CEC published electoral roll); source https://www.gov.il/en/pages/time--table-26 and original baseline. Note that this is NOT the valid-ballot-count denominator. CEC original turnout bulletin was not retrieved as a signed first-party document.

The original earlier 20:00 IST CEC-attributed turnout was **74.3%**, so this is an incremental closing-hour source observation, **not a fresh CEC-certified final turnout**. The near-final observation was published shortly before the prior 23:15 IST review and not incorporated there; this is a transparently **LATE_CAPTUR​E** (not a new event at this file's capture time).

## C3 / C4 / C5 strict trigger test: BLOCKED

**Threshold:** first trusted >=25%, >=50%, >=75% of **valid ballots actually counted**, each with a credible counted-valid-vote numerator **and** a defensible total-valid-vote denominator.  
**Counted valid ballots (numerator):** UNAVAILABLE / NOT VERIFIED.  
**Valid-ballot denominator:** UNAVAILABLE / NOT VERIFIED.  
**Valid votes counted percentage:** UNAVAILABLE.  
**Vote shares by list:** UNAVAILABLE.  
**Official seats by list:** UNAVAILABLE.  
**C3, C4, C5:** PENDING; NOT TRIGGERED.  
**C6B:** No separate named-outlet formal projection-complete publication verified; PENDING.  
**C7:** Await CEC official certification, expected publication on or before Nov 4; PENDING.

Do **not** confuse 77.7% voter TURNOUT with a count threshold. Some websites show a CEC `cdn-votes26.bechirot.gov.il` page indexed with **'סביבת בדיקות' [test environment] and 'results as of 06/10/2026'**. This is chronologically prior to election day and is **NOT live October 27/28 vote-count evidence**; a fresh first-party results feed was not retrievable. Source: https://cdn-votes26.bechirot.gov.il/ . No C3–C5 file is created on these invalid grounds.

## Election result vs broadcaster estimates

The previously recorded C6 was **Channel 12's exit-poll projected largest list (Likud 24, Yashar 22)**, not counted votes, certified seats or a premiership result. Reuters subsequently reports updated broadcaster estimates of main blocs around **52 / 50 / 18**, while Channel 14 diverges; these remain explicitly third-party EXIT POLLS. Source: https://www.reuters.com/world/middle-east/netanyahus-political-survival-line-israel-votes-2026-10-27/ . No new official count or parliamentarian winner certified.

## Administrative and electoral-integrity controls

CEC-attributed reporting confirmed nationwide closure without an approved nationwide extension, allowing lawful queue completions. Previously archived requests, interim electronic turnout-reporting order, and complaint-triage figures remain separate from verified criminal wrongdoing. No new election-delay decision verified in this review.

A **party-list roster discrepancy** remains source-gated: earlier KAHRELUM append-only correction reports 36 contesting lists after Blue and White and Achi withdrawals, while https://mapthegeneral.com/il/en/results/ states 37 active while ALSO noting both withdrawals. The latter is a third-party portal, not direct CEC confirmation. Do not silently replace the archived correction; reconcile using dated official CEC roster later.

## Integrity

Frozen C0 baseline Git blob SHA confirmed unchanged: `b9adfe504c15def6e1804a78a8828e54ae5e93a5`. Frozen scoring protocol Git blob SHA confirmed unchanged: `ab0692085b63c90570065f602c005c409c3b72d5`. Original C2 and C6 file blobs were read; this file is ADDITIVE only. Model v0.5 measures historical polling SOURCE ERROR RISK, not 2026 election outcomes; its Brier 0.305392 is worse than 0.25 no-information reference.

**Disposition:** C2 SUPPLEMENT ARCHIVED / C3–C5 BLOCKED ON DENOMINATOR / C6 ALREADY ARCHIVED / C6B PENDING / C7 PENDING / NO OUTCOME SCORE.
