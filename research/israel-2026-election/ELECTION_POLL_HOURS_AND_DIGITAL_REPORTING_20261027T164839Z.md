# KAHRELUM | October 27 election-day procedural requests: polling hours and voter-count reporting

**Case:** KAH-IL26-PROSPECTIVE-001  
**Type:** Append-only election-integrity / polling-schedule observation, **not** C2–C7  
**Source-capture UTC:** 2026-10-27T16:48:39Z (clock observation, not a Git commit timestamp)  
**Source-capture Israel local:** Tuesday 2026-10-27 18:48:39 IST (UTC+02)  
**Source-capture U.S. Eastern:** Tuesday 2026-10-27 12:48:39 EDT (UTC−04)  
**Source-capture Pakistan:** Tuesday 2026-10-27 21:48:39 PKT (UTC+05)  
**Source-capture UTC:** Tuesday 2026-10-27 16:48:39Z  
**Trigger:** Named parties publicly report requesting later polling-station closure; separately, a civil-society election monitor reportedly petitions to stop alleged digital reporting of voter totals by station. No verified decision, legal change or adjudicated violation.  
**Status:** LIVE / UNRESOLVED / NOT SCORED.

## Evidence and exact observation sequence

1. **17:44 IST / 15:44 UTC, contemporary Zman Yisrael live report:** Likud announced it **had submitted a request** to the Central Elections Committee to extend general polling hours beyond the existing **22:00 IST** statutory close. Reporting did not reproduce the complete application or a CEC case number. Shas joined and cited exceptional turnout/queues as motivation. This reported filing is not an extension order. Source: https://www.zman.co.il/736805/ (17:44 update).

2. **17:59 IST / 15:59 UTC, Zman Yisrael:** Otzma Yehudit announced support for that extension request. Source: https://www.zman.co.il/736805/ (17:59 update).

3. **18:19 IST / 16:19 UTC, Zman Yisrael:** The Civil Election Guard (משמר הבחירות האזרחי) reportedly submitted an urgent petition to CEC Chair Justice Noam Sohlberg, alleging that individuals associated with Likud inside precinct committees were digitally reporting numbers of voters who had voted via a WhatsApp group named *עובדי קלפי 2026*. The requested order would stop alleged electronic real-time tallying/reporting. Zman links what it describes as the petition; **this capture did not independently inspect/authenticate the underlying petition, case number or its appendices**. No CEC ruling or verified underlying data transfer is established. Reporting URL: https://www.zman.co.il/736805/ (18:19 update).

4. **18:26 IST / 16:26 UTC, Zman Yisrael:** Yashar announced opposition to extending closing time, saying that no extraordinary event justified the change. Likud again said it sought extended hours, supported by Shas and Otzma Yehudit. This establishes publicly reported competing positions, not a CEC decision. Source: https://www.zman.co.il/736805/ (18:26 update).

5. **Earlier procedural CEC clarification, 13:22 IST report:** Persons already queued at 22:00 may finish voting after that clock time. This is **an existing voting right/administrative rule**, **not** a newly ordered blanket extension or movement of the election date. Source: https://www.timesofisrael.com/liveblog_entry/amid-high-turnout-election-committee-says-polling-stations-will-stay-open-after-10-p-m-if-people-are-waiting-in-line/ . Normal main-station opening 07:00 and ordinary closing 22:00 unchanged at this capture.

6. **Prior latest CEC-attributed turnout:** 55.7% as of **16:00 IST**, against 47.5% at that hour in 2022, reported by Zman Yisrael and The Times of Israel: https://www.timesofisrael.com/turnout-hits-historic-high-as-israel-votes-in-national-election-parties-allege-foul-play/ . This is **eligible-voter participation, not actual valid votes counted**. An earlier publisher's discordant ~4.85m raw turnout figure is logged separately in `ELECTION_SOURCE_ARITHMETIC_AUDIT_20261027T1549Z.md`; the present capture does not silently correct the older artifact.

## Fact / claim / inference

**FACT (publication-level):** The specified named reports at these timestamps state that Likud requested extended voting hours; Shas and Otzma Yehudit supported it; Yashar opposed it; a civil-society group petitioned over alleged live reporting. The existing queue allowance was publicly restated.

**NOT FIRST-PARTY VERIFIED:** Complete CEC application and petition, case identifiers, acknowledgement, order, ruling, or alleged WhatsApp records. Reporting about filing **is not proof of CEC receipt or legal effectiveness**.

**INFERENCE:** An actually granted general hours extension could change the exit-poll publication and C2 post-close eligibility/verification conditions. If stations only serve persons already present at 22:00, that is the existing queue exception. Preserve C2 threshold **2026-10-27T20:05:00Z / 22:05 IST / 2026-10-28 01:05 PKT** unchanged; at or after that threshold, C2 must check actual legal closure and any exceptions instead of assuming all voting ended.

**FORECAST:** No prospective election-winner probability and no newly justified revision of geopolitical percentages. No speculation about electoral intent or legitimacy is entered as fact.

## Checkpoint and source-integrity ledger

- Verified frozen C0 at original ref `05d441adad2f82a043fe8fbec1be7e35e2edf12a`, blob `b9adfe504c15def6e1804a78a8828e54ae5e93a5`.
- Verified current scoring protocol blob `ab0692085b63c90570065f602c005c409c3b72d5`; original remains unchanged.
- Directory listing as of capture contained `C1_PREOPEN_2026-10-27.md`; no C2–C7 stage files found. C1 was documented 13m23s late. The 36-list correction `PARTY_REGISTRY_CORRECTION_2026-10-27T1456Z.md` remains separate from original stale 37-list record.
- **Counted valid votes numerator:** null; **counted valid votes denominator:** null; **percent counted:** unverified/not published; **vote shares:** null; **provisional seat maps:** null; **largest-list projection:** null; **certified seats:** null.
- **C2:** NOT YET ELIGIBLE at capture. **C3/C4/C5:** NOT TRIGGERED, because turnout is not counted-vote percentage. **C6:** NOT TRIGGERED. **C7:** PENDING.
- This is a voluntary publicly auditable, AI-assisted source snapshot; **not** a KAHRELUM proprietary party/prime-minister election outcome prediction or evidence of an externally authenticated live forecast.

## Follow-up evidence tests

Check whether the CEC acknowledges/decides the party hours request and citizen-monitor petition; source official docket/order directly, compare to existing lines-at-close rule. Confirm any legally operative change to main-station 22:00 hours, statutory election date or exit-poll embargo. At C2, report closure/continued queues/exit-poll time honestly with capture delay, never backdate the checkpoint.
