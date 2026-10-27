# KAHRELUM | C2 POLLCLOSE | 26th Knesset (27 October 2026)

**Case:** KAH-IL26-PROSPECTIVE-001  
**Stage:** C2 | FIRST POST-CLOSE OBSERVATION (NOT FINAL RESULTS)  
**Capture / source review (UTC):** 2026-10-27T20:50:14Z  
**Capture Israel:** 2026-10-27 22:50:14 IST (UTC+02)  
**Capture Eastern:** 2026-10-27 16:50:14 EDT (UTC-04)  
**Capture Pakistan:** 2026-10-28 01:50:14 PKT (UTC+05)  
**Trigger eligibility:** 2026-10-27 22:05 IST = 20:05 UTC = 2026-10-28 01:05 PKT.  
**Deviation:** Capture **45m14s after eligibility**, **20m14s after normal 22:30 IST hourly capture**. No claim to have captured exactly 22:05 or 22:30.  
**Prerequisite:** Original C0 Git commit 05d441adad2f82a043fe8fbec1be7e35e2edf12a; baseline blob b9adfe504c15def6e1804a78a8828e54ae5e93a5; scoring protocol blob ab0692085b63c90570065f602c005c409c3b72d5. Both read unchanged at this run.  
**Status:** OBSERVED; exit polls only; official counted vote/seat result NOT available.

## Closure and exceptions: sourced FACT / limits

Most polls were scheduled to close at **22:00 IST October 27**, and the CEC rejected a request to extend general polling hours (CEC-attributed rejection: https://www.timesofisrael.com/liveblog_entry/elections-committee-rejects-likuds-request-to-extend-voting-hours/). The election-day election coverage reports polls closed and broadcasters released exit-poll surveys at 22:00: https://www.i24news.tv/en/news/israel-election-s-2026/artc-israelis-head-to-the-polls-casting-their-votes-in-the-country-s-first-election-since-2022-live-blog ; https://www.reuters.com/world/middle-east/netanyahus-political-survival-line-israel-votes-2026-10-27/ .

**Exceptions:** Voters already in queues at 22:00 are entitled to complete voting: CEC director quoted https://www.timesofisrael.com/liveblog_entry/amid-high-turnout-election-committee-says-polling-stations-will-stay-open-after-10-p-m-if-people-are-waiting-in-line/ (reported 13:22 IST). Earlier reports described a local Hebron polling-place power disruption and localized adjustment, but this is not evidence of nationwide postponement. No independently retrieved signed CEC nationwide close certificate, precinct-by-precinct closure inventory, or quantified post-22:00 queue count available. **Conclusion:** general scheduled closing occurred, and no legally effective nationwide extension was established; individual queues could remain active.

## C2 EXTERNAL BROADCAST EXIT POLLS (NOT COUNTED VOTES)

Publication moment for broadcaster exit polls scheduled 22:00 IST = 20:00 UTC; individual third-party relay timestamps are not the original broadcaster production timestamps. First directly reviewed Channel 12 relay: The Times of Israel 22:03 IST, https://www.timesofisrael.com/liveblog_entry/channel-12-exit-poll-shows-no-clear-victor-netanyahus-likud-is-largest-party-but-his-opponents-have-bigger-bloc/ . Channel 13 relay: The Times of Israel 22:06 IST, https://www.timesofisrael.com/liveblog_entry/channel-13-exit-poll-eisenkot-led-bloc-in-lead-likud-as-largest-party-but-neither-camp-gets-majority-amid-record-arab-showing/ . Kan relay: The Times of Israel 22:09 IST, https://www.timesofisrael.com/liveblog_entry/kan-exit-poll-shows-no-clear-victor-as-netanyahus-likud-is-largest-party-but-opponents-have-larger-bloc/ .

**First-party Channel 12 / N12** live page https://www.mako.co.il/news-israel-elections/2026/liveblog-c84cc98a6ce71a1027.htm (page last marked updated **22:43 IST** when reviewed): initially Likud 24, Yashar 22, B'Yachad 12, Joint List 11, Democrats 9, Yisrael Beytenu 9, Ra'am 7, UTJ 7, Shas 6, Religious Zionism–Zehut 6; source reports change bloc **52**, Netanyahu bloc **50**, Arab lists **18**. **Data caveat:** this list of explicitly extracted party seats is **INCOMPLETE**; do not impute the missing parties from bloc totals. Channel 12's later page describes a **22:43-or-earlier update**, Democrats **10** and Yisrael Beytenu **8** (one seat transferred, unchanged blocs); update timestamp per page, exact subsection time unavailable. Preserve both versions instead of retroactively overwriting initial snapshot.

**Channel 13 (external exit poll)** relayed at 22:06 IST: Likud **25**, Yashar **23**, B'Yachad **14**, Joint List **10**, Democrats **9**, Yisrael Beytenu **7**, Ra'am **7**, UTJ **7**, Shas **6**, Religious Zionism–Zehut **6**; change bloc **53**, Netanyahu bloc **50**, Arab lists **17**. Figures sourced to reporting https://www.ynetnews.com/article/skd97fc2gl and ToI relay above. List-level transcription is **partial**, not a 120-seat-verified vector.

**Kan (first-party public broadcaster)** https://www.kan.org.il/content/kan-news/politic/1113403/ (search-indexed publisher report, full page body not text-extractable during capture) attributes poll to Dudi Hasid: Likud **25**, Yashar **21**, change bloc **53**, Netanyahu bloc **50**, Arab lists **17** (latter from 22:09 IST ToI relay). No full published party-level seat vector independently extracted.

All numbers are **EXTERNAL EXIT POLL SURVEY ESTIMATES** not official votes, certified seats, independently rerun KAHRELUM model outputs, or evidence any party has legally won the election. None of the reported main party/bloc totals provides a guaranteed government or prime minister. A future coalition depends on certified seats, consultations and agreements. Broadcaster surveys may share assumptions; three channels are not three independent outcome confirmations.

## Registered measurement schema

| Field | At C2 |
| --- | --- |
| Event ID | C2 |
| Poll closure status | General close 22:00 reported; queues permitted after deadline |
| First eligible observation | 22:05 IST |
| Actual source capture | 2026-10-27T20:50:14Z |
| Actual counted valid-vote numerator | **NULL / UNAVAILABLE** |
| Credible counted valid-vote denominator | **NULL / UNAVAILABLE** |
| Counted fraction | **NULL / NOT EVALUABLE** |
| Actual party vote shares | **NULL / UNAVAILABLE** |
| Certified party seats | **NULL / UNAVAILABLE** |
| Exit polls | External Channel 12/13/Kan estimates as above |
| First projected largest parliamentary list | **Likud** by Channel 12; separately archived C6 |
| Coalition / PM winner | **NOT ESTABLISHED** |
| Stage provenance | Reuters, i24 and named originating broadcasters with timestamps; original CEC signed close directive not retrieved |
| State | C2 CAPTURED; C3–C5 MILESTONE_UNVERIFIED, C7 PENDING |

**Contradictions and updates:** Pre-election October 23 Channel 12/Yashar 23 vs Likud 21 and external model central seats Yashar 22 vs Likud 21 diverge from exit-poll ordering. This comparison is observational only; final calibration awaits official C7. CEC-reported **74.3% participation at 20:00** is voter TURNOUT, not votes counted and must NEVER trigger 25/50/75% stages. First-party CEC dashboard not retrievable here as a denominator-verified valid vote count.

**No C6B projection-complete claim:** No separately identified formal outlet projection completion declaration verified. **No C3/C4/C5 write:** no credible numerator / denominator. Original C0 and scoring protocol preserved. AI-assisted, same-operator evidence extraction; not original frozen KAHRELUM runtime execution. No persuasion or campaign recommendation.
