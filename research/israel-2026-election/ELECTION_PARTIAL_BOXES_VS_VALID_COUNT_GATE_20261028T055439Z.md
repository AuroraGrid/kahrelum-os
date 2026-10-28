# KAHRELUM | 28 Oct 2026 morning count: 53.7% ballot BOXES, not 53.7% valid votes

**Case:** KAH-IL26-PROSPECTIVE-001
**Type:** append-only election-night source-integrity supplement; NOT C3, C4, C5, C6B, or certified C7.
**Source-scan captured UTC:** 2026-10-28T05:54:39Z.
**Captured Israel:** Wednesday 2026-10-28 07:54:39 IST (UTC+02).
**Captured U.S. Eastern:** Wednesday 2026-10-28 01:54:39 EDT (UTC-04).
**Captured Pakistan:** Wednesday 2026-10-28 10:54:39 PKT (UTC+05).
**First-party control:** C0 immutable commit 05d441adad2f82a043fe8fbec1be7e35e2edf12a / blob b9adfe504c15def6e1804a78a8828e54ae5e93a5, preregistered scoring protocol blob ab0692085b63c90570065f602c005c409c3b72d5; both independently checked before writing. Existing C1, C2, C6 records checked and retained.

## FACT / supported reporting and event timing

1. **Latest named, timestamped source:** *The Times of Israel*, Wednesday **28 Oct 2026 at 07:34 IST**, reported the Central Elections Committee's **07:27 IST** provisional returns: **53.7% of BALLOT BOXES counted**, with an **outlet-derived provisional bloc seat distribution** Netanyahu-aligned **55**, anti-Netanyahu **50**, Arab parties **15** (120 total). Its HEADLINE calls this “over 50% of ballots counted”, but its TEXT clearly says “53.7% of ballot boxes counted”; the text is the controlling measurement object and the headline is inconsistent/ambiguous. The source does **not** publish a valid-votes-counted numerator plus national total-valid-vote denominator for 07:27. URL: https://www.timesofisrael.com/liveblog_entry/with-over-50-of-ballots-counted-pro-netanyahu-bloc-has-55-seats-opposition-has-50-arab-parties-hold-15/ . Source publication **2026-10-28 07:34 IST / 05:34 UTC / 01:34 EDT / 10:34 PKT**. Count data as-of **07:27 IST**.
2. **Earlier superseded source:** *The Times of Israel*, posted **04:58 IST**, attributed 04:51 IST results to CEC: **32.5% of ballot BOXES**, bloc seat extrapolation **59 pro-Netanyahu / 46 anti-Netanyahu**, remaining **15** (derived remainder only, not independently published in that excerpt). URL: https://www.timesofisrael.com/liveblog_entry/gap-between-blocs-starts-narrowing-as-more-ballots-counted/ . These are **not** certified seats.
3. **Last retained exact VALID-vote numerator:** separate secondary reproduction of **CEC-attributed 05:57 IST** data lists **2,122,846 valid votes**, **9,804 invalid**, **2,132,650 total returned ballots**, **5,037 ballot boxes**. URL: https://yoatzim.funder.co.il/article/212927 . Counted numerator is **NOT contemporaneous** with the new 07:27 station-box percentage. Prior immutable snapshot: https://github.com/AuroraGrid/kahrelum-os/blob/d12ba9ad632bac9e65aa5297072c21969b988cb6/research/israel-2026-election/ELECTION_COUNT_VALIDVOTES_AND_WITHDRAWN_LIST_ROWS_20261028T044624Z.md .
4. Party-level shares at that **earlier 05:57** count, **NOT 07:27**: Likud 21.70% (460,565), Yashar 15.72% (333,786), Joint List 9.22% (195,808), B'Yachad 8.38% (177,904), UTJ 6.42% (136,365), Yisrael Beytenu 6.27% (133,186), Democrats 5.89% (125,030), Otzma Yehudit 5.84% (124,001), Shas 5.67% (120,402), Religious Zionism-Zehut 5.50% (116,836), Ra'am 3.81% (80,894). The shares use 2,122,846 **counted valid ballots** as the denominator FOR PARTY SHARE, NOT a valid fraction of the final nationwide vote.
5. The *Times of Israel* says Reservists ~2.7%, People of Israel ~1.7%, and Charedi Public ~0.2% under 3.25% threshold at the 07:27 partial source. No independent party-level 07:27 full seat vector or official certified seat assignment was available. The 55/50/15 distribution is a **provisional mathematical extrapolation** from returned votes, not a legally certified seat map or a governing agreement.

## Preregistered count-milestone audit

- **C3 >=25% of valid votes:** MILESTONE_UNVERIFIED. **C4 >=50% valid votes:** MILESTONE_UNVERIFIED. **C5 >=75% valid votes:** MILESTONE_UNVERIFIED.
- Contemporaneous **07:27 valid-vote numerator: unavailable**; **verifiable national valid-vote denominator: unavailable**; **ratio: NOT CALCULABLE**. A percentage of boxes is not an equal-weighted percentage of votes. No defensible equality between count-box proportion and valid-vote proportion.
- The 5,695,682 voters quoted in election-night TURNOUT reports and an external model's 5,660,221 EXPECTED valid-ballot total are not verified final valid-ballot denominators. Do not substitute them.
- Exact commission live results page https://cdn-votes26.bechirot.gov.il/ returned stale **2026-10-06 test/sandbox figures** in indexed text, not an authenticated 07:27 CEC total. No CEC-original exact current numerator/denominator was retrieved in this scan.
- No separate C6B formal projection-complete declaration or C7 final certification; no proven nationwide election postponement, suspension, or legally effective extension in the reviewed evidence.
- This is an audit of public measurement ambiguity. It is **not evidence of election fraud** or a proprietary KAHRELUM 2026 outcome forecast.

## INFERENCE / uncertainty / failure modes

Earlier count ordering and subsequent double-envelope ballots can materially change threshold survival and bloc seat estimates. The shift of the *same outlet* from a 59–46 proportional snapshot to 55–50 with further station reporting is consistent with volatile partial geographic composition; causation has not been independently established. The headline/paragraph measurement-object discrepancy makes a false C4 particularly tempting, so this record preserves the **fail-closed** milestone rule rather than inventing an exact trigger.

**Update from previous:** New 07:27 station-box snapshot and provisional bloc seat map; NOT new validated whole-election vote-count percentage.
**Method:** AI-assisted operator-directed evidence read and source audit, not executing or changing frozen KAHRELUM runtime.
**Scope:** election research file only; no political persuasion, no numeric party-victory probability, and no modifications to C0, scoring protocol, historical stages, original registry, or model artifacts.
