# KAHRELUM | Israel election first 1.6m reported votes: source-gate observation (NOT a C3 checkpoint)

**Case:** KAH-IL26-PROSPECTIVE-001  
**Evidence capture UTC:** 2026-10-28T03:15:40Z  
**Israel local capture:** Wednesday 2026-10-28 05:15:40 IST (UTC+02, Asia/Jerusalem)  
**US Eastern capture:** Tuesday 2026-10-27 23:15:40 EDT (UTC-04, America/New_York)  
**Pakistan local capture:** Wednesday 2026-10-28 08:15:40 PKT (UTC+05, Asia/Karachi)  
**Trigger category:** MATERIAL POST-CLOSE COUNT SOURCE CHANGE; *conditional C3 threshold NOT authenticated under preregistered valid-vote denominator rule*.  
**Stage:** APPEND-ONLY SOURCE SUPPLEMENT; NOT C3/C4/C5/C6B/C7; not a revised C0 prediction.  
**Evidence grade:** B for named contemporaneous Ynet attribution of CEC partial tally, U for original CEC numerator/denominator read; C for any projected seat extrapolation.  
**Publication timestamp:** Ynet topical story first published 2026-10-28 02:38 IST, with *later mutable updates at an unprovided exact clock time*. Ynet live-blog entry for the 1.6m figure supplies no individual timestamp; **do not claim the 1.6m value existed at 02:38**. First observed at this capture.

## FACT (named news source reporting partial counting, not certified results)

Ynet's live election updates and locality results article, as read at capture, report **approximately 1.6 million votes counted**, described as **about 28% of the votes cast**, with partial current listed vote shares: Likud **22.2%**, Yashar **15.4%**, Joint List **8.3%**, B'Yachad **8.2%**, United Torah Judaism **6.7%**, Yisrael Beytenu **6.4%**, Otzma Yehudit **6.0%**, Democrats **5.9%**, Shas **5.7%**, Religious Zionism–Zehut **5.7%**, and Ra'am **3.7%**. These are **partial tally vote shares reported by a newsroom**, *not* exit polls, final certified vote totals, or an official seat map. The report emphasizes the figures are incomplete and may change.

**Sources:** 
- Ynet live-blog original content and mutable update: https://www.ynet.co.il/news/blogs/article/hjvyjpc2fe (the '1.6 million votes counted so far' entry; entry timestamp not supplied).
- Ynet localities/tally article: https://www.ynet.co.il/news/elections2026/article/bj5pk302zg (first published 02:38 IST, later dynamically updated without precise timestamp of 1.6m figure).
- CEC first-party official results access attempted: https://votes26.bechirot.gov.il/ and https://votes26.bechirot.gov.il/nationalresults; both presented a JavaScript/bot check and did NOT provide a contemporaneous machine-readable official valid-ballot numerator/denominator in this review.
- Prior indexed third-party tracker: https://www.thepetek.com/results (its much earlier visible snapshot 02:40 IST at 320,650 valid votes / 7.57%, stale and cannot be mixed with current report).
- Ynet CEC-attributed 22:00 participation figure: https://www.ynet.co.il/news/elections2026/article/rkcoxqc2ml (5,695,682 *participating voters*, **not** confirmed valid-ballot denominator).
- CEC calendar: https://www.gov.il/en/pages/time--table-26 .

## Count gate: FIRST OBSERVED REPORT >25%, but C3 remains BLOCKED until eligible denominator

The reported **~28%** figure is Ynet's journalist/secondary count-progress fraction; it is *not a retrievable CEC pair of a precisely identified valid-ballot numerator and total expected/received valid-ballot denominator*. Its approximate 1.6 million numerator is not broken down into verified valid versus invalid ballots. The separately sourced 5,695,682 voter-participation figure is **turnout's numerator (total voters)**, NOT the verified number of total *valid* ballots and therefore **cannot silently be used as C3's valid-ballot denominator**.

- **Official verifiable valid votes counted numerator:** UNAVAILABLE (secondary approximate ~1.6m votes is not certified as exact valid votes).
- **Official verifiable expected/received total valid ballots denominator:** UNAVAILABLE.
- **True counted-valid-vote percentage for C3:** UNVERIFIED. Secondary reporting says ~28% of votes cast; not acceptable as the protocol's precise object.
- **Source publication time for this exact count:** UNKNOWN, visible at capture 05:15:40 IST.
- **Independent first-party read:** BLOCKED by bot/JavaScript verification.
- **C3 >=25%:** **MILESTONE_UNVERIFIED / DO NOT ARCHIVE C3** until valid-vote unit and denominator can be documented. **C4 >=50%, C5 >=75%** untriggered.
- **C6** already archived 2026-10-27; **C6B** separate formal projection-complete event not confirmed; **C7** awaits official publication.

Earlier Ynet update separately described **1,210,461** counted votes and **21.4%** of voters; figures represent earlier tally states and must NOT be substituted for current ~1.6m / 28%. Before that a 03:30 IST snapshot described <14% of **polling stations** (different unit). The 04:05 IST third-party 23.9% 'reporting' value is ambiguous and must not be treated as count percent. These sources cannot be blended to manufacture a threshold clock.

## INFERENCE / evidentiary boundaries

The broadcaster-reported partial tally now places Ra'am at **3.7%**, above the statutory **3.25%** threshold, whereas a prior partial Ynet update placed it at **3.2%**, below that threshold. **This is a material provisional sensitivity**, not a verified final threshold crossing, formal parliamentary projection, or conclusion about governing a coalition. Early geographic counting order and later double-envelope ballots may reverse apparent standings. Likud still leads the *reported partial vote shares* at 22.2%; no prime minister or national seat majority follows.

**Official CEC seats:** NOT AVAILABLE. **Third-party extrapolated seats:** NOT USED. **Coalition/PM call:** NONE. **KAHRELUM proprietary winner probability:** NOT ISSUED. **KAHRELUM proprietary Brier:** NOT EVALUABLE. C0 Oct 26 external 14-list vector and Oct 23 separate broadcaster polls remain original external comparators. No scoring against future gold has occurred.

## Integrity and process

Precommitted C0 remains at immutable creation commit `05d441adad2f82a043fe8fbec1be7e35e2edf12a`, Git blob `b9adfe504c15def6e1804a78a8828e54ae5e93a5`; original scoring protocol Git blob `ab0692085b63c90570065f602c005c409c3b72d5`. Both were fetched in this run and directory metadata matches previously logged identities. Original C0, scoring protocol, C1, C2, C6 and other evidence unchanged. This file records the blocked milestone without hindsight editing.

**Portfolio state:** LIVE / UNRESOLVED / NOT SCORED.
