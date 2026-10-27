# KAHRELUM | 2026 Israel election: 16:00 turnout arithmetic and source-consistency check

**Case:** KAH-IL26-PROSPECTIVE-001  
**File class:** DATED SOURCE-CONSISTENCY OBSERVATION; not C2, C3, C4, C5, C6 or C7.  
**First captured UTC:** 2026-10-27T15:49:14Z  
**Israel (Asia/Jerusalem):** Tuesday 2026-10-27 17:49:14 IST (UTC+02)  
**U.S. Eastern (America/New_York):** Tuesday 2026-10-27 11:49:14 EDT (UTC−04)  
**Pakistan (Asia/Karachi):** Tuesday 2026-10-27 20:49:14 PKT (UTC+05)  
**Status:** LIVE / UNRESOLVED / NOT SCORED.

## Observed fact versus reported fact

1. **CEC-attributed participation percentage:** Israel's CEC is quoted as reporting **55.7% national voter turnout as of 16:00 IST October 27**, against **47.5% at 16:00 in 2022**. The 2026 figure is **8.2 percentage points higher** and reported as the highest 16:00 observation since at least 1973. News 12 election liveblog updated **17:00 IST October 27**; Zman Yisrael election liveblog update **17:01 IST October 27**. These outlets relay the same CEC-origin figure; they are **not two independent measurements**. Direct first-party contemporaneous CEC turnout table was not retrieved in this capture.
2. **Reported approximate raw voter total is inconsistent with the registered electorate.** News 12 prints **approximately 4.85 million voters** alongside 55.7% turnout. Zman Yisrael describes **nearly five million voters**. The CEC's published 2026 eligible-elector figure is **7,331,981**, reported in the Oct 26 election logistics coverage and visible on the official CEC results domain's **pre-election test environment**, which must NOT be used as an actual vote-count feed.
3. **Arithmetic only:** 7,331,981 × 0.557 = **4,083,913.417**; with one-decimal rounding of the percentage, the corresponding implied participation range is approximately **4,080,247–4,087,579**. By contrast, 4,850,000 / 7,331,981 ≈ **66.15%**, not 55.7%; **difference ≈766,087** between the News 12 approximate figure and percentage-implied number. The exact contemporary participant numerator is **NOT VERIFIED**; this is a demonstrable incompatibility of numbers as published, not an independently confirmed corrected actual count.

### Primary and named secondary source inventory

| Evidence | First-party / origin | URL | Timestamp and grade |
|---|---|---|---|
| CEC official 26th election portal | Official institutional portal, direct live content limited | https://www.bechirot.gov.il/home | Access attempt 2026-10-27; Grade C for this particular hourly turnout observation because direct 16:00 reading unavailable |
| CEC-associated electorate figure 7,331,981 | Official 26th election result *test environment*, not a valid live count | https://cdn-votes26.bechirot.gov.il/ | Page test fixture dated **2026-10-06 17:42**; eligible-elector total only as context, NEVER interpret its example vote totals as Oct 27 counted votes |
| News 12 / N12 liveblog | Named outlet attributing turnout to CEC | https://www.mako.co.il/news-israel-elections/2026/liveblog-788cb43830871a1026.htm | Page updated Oct 27 **17:00 IST**; body says **55.7% as of 16:00, about 4.85 million**; Grade B for quoted CEC percentage; reported raw count internally inconsistent |
| Zman Yisrael election log | Named outlet attributing turnout to CEC | https://www.zman.co.il/736805/ | Entry Oct 27 **17:01 IST**; **55.7% as of 16:00**, says nearly 5 million, **47.5%** comparable 2022; Grade B for relayed CEC percentage; raw description internally inconsistent |
| Other election logistics source | CEC-attributed eligible-voter figure | https://www.jfeed.com/latest-news/israel-votes-tomorrow-7-3-million-voters-12-018-polling-stations-100-000-staff-57006 | Published Oct 26 **20:15 IST**; corroborating source only |

**Correction protocol:** Preserve all published numbers as originally represented. Do not silently replace 4.85 million with an invented official turnout numerator. If the CEC subsequently publishes an independently retrievable valid turnout numerator and denominator, create a newer correction and state the new exact source and timestamp.

## Preregistered milestone check

- **C0/C1:** Baseline locked; C1 archived after target at 06:43:23 IST; no modification.
- **C2:** NOT DUE at capture. Eligibility begins 22:05 IST (Oct 28 01:05 PKT) after usual polling closure; ordinary first capture 22:30 IST.
- **C3/C4/C5:** **NOT TRIGGERED**. The available **55.7% is turnout**, not the ratio of valid votes actually counted to a verified count denominator. **valid-votes-counted numerator = unavailable; denominator = unavailable; vote-share/seat map = unavailable.**
- **C6/C6B:** No named post-close outlet projection captured; **not triggered**.
- **C7:** Official final results not published; **not triggered**.
- **Election delay/integrity:** No officially effective nationwide postponement independently verified. The contradictory press arithmetic does **not** demonstrate voter fraud, tampering, irregular ballot counting, or a corrupt CEC dataset; it warrants data-quality caution only.
- **C0/protocol/v0.5:** No edit to frozen files. Historical source-risk v0.5 Brier **0.305392** concerns poll-source quality and is worse than 0.25 reference, not 2026 party outcome probabilities. No KAHRELUM 2026 proprietary winner forecast or revised probabilities have been produced.

**Forecast/inference discipline:** Higher participation can affect outcome uncertainty, but without verified list-specific votes it is not evidence for which party will win. No election-outcome projection, PM inference or numeric forecast revision.

**Operator:** AI-assisted KAHRELUM evidence-quality audit; original publisher figures retained with provenance. This newly created supplement is not itself a preregistered count milestone.
