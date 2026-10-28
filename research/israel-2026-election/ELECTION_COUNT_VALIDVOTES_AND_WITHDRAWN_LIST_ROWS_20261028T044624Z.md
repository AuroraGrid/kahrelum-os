# KAHRELUM | 28 October 2026 05:57 CEC-attributed partial valid-ballot count: denominator and withdrawn-list audit

**Case:** KAH-IL26-PROSPECTIVE-001  
**Evidence captured UTC:** 2026-10-28T04:46:24Z  
**Israel:** Wednesday 2026-10-28 06:46:24 IST (Asia/Jerusalem, UTC+02)  
**US Eastern:** Wednesday 2026-10-28 00:46:24 EDT (America/New_York, UTC-04)  
**Pakistan:** Wednesday 2026-10-28 09:46:24 PKT (Asia/Karachi, UTC+05)  
**Source snapshot update:** October 28, 2026, 05:57 Israel time, per FUNDER's static third-party transcript of the CEC count, with source check dated 06:00 Israel time.  
**Trigger:** New exact CEC-attributed *partial valid-ballot numerator*, plus discrepancy between historical 38 submitted/approved lists appearing in the count table and election-day 36 active list registry. **NOT a registered C3/C4/C5 milestone.**  
**Provenance grade:** B (named timestamped secondary site transcribing CEC results); A direct contemporaneous official read BLOCKED by JavaScript/bot challenge. Historical C0/protocol are A verified GitHub originals.

## FACT / reported count at this particular source timestamp (not gold)

FUNDER's October 28 05:57 Israel-time static copy, attributing data to the CEC, reports **2,132,650 received ballots, 2,122,846 valid votes, 9,804 invalid votes, 5,037 polling stations received**, and 38 list rows in its tabulation. Arithmetic: 2,132,650 - 9,804 = **2,122,846**, internally consistent. **Valid votes counted numerator: 2,122,846, but only SECONDARY attributed, not directly read back from current official page.** [FUNDER source](https://www.funder.co.il/article/212927) (shown as 28 Oct at 05:57 IST; published Oct 28, static-source check 06:00).

Partial valid-vote shares from FUNDER (numerators in votes, denominator **only the already-received 2,122,846 valid votes**): Likud 460,565 (21.70%); Yashar 333,786 (15.72%); Joint List 195,808 (9.22%); B'Yachad 177,904 (8.38%); UTJ 136,365 (6.42%); Yisrael Beytenu 133,186 (6.27%); Democrats 125,030 (5.89%); Otzma Yehudit 124,001 (5.84%); Shas 120,402 (5.67%); Religious Zionism–Zehut 116,836 (5.50%); Ra'am 80,894 (3.81%); Reservists-Economic 57,666 (2.72%); People of Israel 37,472 (1.77%). These are **votes already counted**, not an official final-seat map or valid percent of TOTAL ballots.

Independent AP updating on Oct 28 reports approximately **40% of ballots counted**, Likud 21.70% and Yashar 15.72%. Its ~40% measure is approximate with no independently retrievable matching exact valid-ballot denominator; do not mix source timestamps. [AP reporting](https://apnews.com/article/israel-elections-netanyahu-eisenkot-gaza-iran-28102026-52c6f5a0a720a4ffc08633229e796415). Exit-poll seat allocations remain separate, and no broadcaster projected a verified governing coalition.

## Registered C3/C4/C5 gate: fail closed

- **True valid ballots already counted:** 2,122,846 (secondary, 05:57).
- **True nationwide expected / received TOTAL valid-ballot denominator (including uncounted): UNAVAILABLE.**
- **Ratio total valid votes counted / total valid ballots:** **NOT COMPUTABLE** from sourced inputs.
- Received **2,132,650** is already-counted total (includes invalid), not the expected all-national valid-vote denominator. Dividing the numerator by this would falsely indicate >99% counted.
- **5,037** is number of polling stations received, not a count of valid ballots, and dividing by total polling stations would be precinct reporting rather than a valid-vote share.
- **5,695,682** previously published participant turnout is not an authenticated total valid-ballot denominator: invalid ballots and late tabulations remain.
- **C3 (>=25%), C4 (>=50%), C5 (>=75%)** remain **MILESTONE_UNVERIFIED / NOT WRITTEN**, notwithstanding the credible secondary ~40% statement. No clock is retroactively attributed to the 25% crossover.
- **C6** remains previously captured and is not being republished. **C6B** separate formal projection-complete event not verified; **C7** awaits official gold source on/after Nov 4.

## Source contradiction: 38 rows versus 36 active candidate lists

FUNDER displays **38 list rows** in its partial results, including a row showing **Achi (צבי): 18** and a row showing **Blue and White (כן): 3**, despite the existing [append-only source-checked registry correction](./PARTY_REGISTRY_CORRECTION_2026-10-27T1456Z.md) reporting BOTH lists withdrew before election day, giving **36 contesting lists**. Counting 38 rows is therefore not proof that 38 lists remained eligible on election day. The status of the 18/3 entries in the aggregation is **UNRESOLVED**: possible withdrawn-list legacy fields, mapping or input handling, or other source error. **Do not label 21 entries as valid votes for ineligible lists or as fraud** without official CEC handling rules, signed records and a direct CEC source check. A prior first-party Achi page returned 403. [Source table](https://www.funder.co.il/article/212927); [Achi CEC-linked entry](https://www.gov.il/he/pages/chozrim-leshorashim_list32); [Blue and White CEC entry](https://www.gov.il/he/pages/kachol-lavan_list30). The originally late Oct 27 registry's 37-contesting claim remains an acknowledged MISS, corrected only in separate file.

## Source-access / integrity tests

- **Current CEC first-party URL:** https://votes26.bechirot.gov.il/nationalresults?lang=he and https://votes26.bechirot.gov.il/ . Public text fetch returned "JavaScript is disabled ... verify that you're not a robot". Read-only interactive browser attempt was blocked by provider insufficient credits. **Official live numerator, denominator and withdrawn-list treatment NOT independently read.**
- **Old CEC CDN test page:** https://cdn-votes26.bechirot.gov.il/ contains an Oct 6 testing-environment snapshot and is EXCLUDED.
- **C0 original:** creation commit 05d441adad2f82a043fe8fbec1be7e35e2edf12a; Git blob **b9adfe504c15def6e1804a78a8828e54ae5e93a5**, checked unchanged this run.
- **Scoring protocol:** blob **ab0692085b63c90570065f602c005c409c3b72d5**, checked unchanged. The case README and research portfolio were read prior to writing.
- Party vote-share arithmetic was validated only against received valid-ballot subtotal; no proprietary political-party outcome probability or in-house winner Brier can be assigned. v0.5 Brier 0.305392 concerns historical poll-source quality and is worse than the uninformative 0.25 baseline.
- **FACT:** what named sources published, including their timestamps. **INFERENCE:** possible administrative/mapping issue concerning withdrawn list rows. **FORECAST:** none issued or altered. No allegation of proven fraud, nationwide election delay, party victory, 120-seat official vector or incoming PM.
- **Preservation:** no rewriting C0, registered rules, original registry, archived stages or immutable KAHRELUM runtime; this is an append-only supplemental evidence observation.

**Portfolio state:** LIVE / UNRESOLVED / NOT SCORED. **C3–C5 fail closed pending a defendable total valid-vote denominator.**
