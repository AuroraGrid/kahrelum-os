# KAHRELUM | Israel 2026 election: near-final CEC count and disputed completion reporting
**Case:** KAH-IL26-PROSPECTIVE-001  
**Record type:** New append-only evidence / C3-C5 and C6B gate re-evaluation, **NOT a threshold checkpoint or C7 certified result**  
**Captured UTC:** 2026-10-29T17:48:53.663Z  
**Captured Israel:** Thursday, 29 October 2026 at 19:48:53 GMT+2  
**Captured Eastern:** Thursday, 29 October 2026 at 13:48:53 GMT-4  
**Captured Pakistan:** Thursday, 29 October 2026 at 22:48:53 GMT+5  
**Election:** Tuesday 27 Oct 2026. **Official final publication target:** Wednesday 4 Nov 2026.  
**Frozen C0:** commit `05d441adad2f82a043fe8fbec1be7e35e2edf12a`, blob `b9adfe504c15def6e1804a78a8828e54ae5e93a5` unchanged on this observation.  
**Frozen scoring protocol:** blob `ab0692085b63c90570065f602c005c409c3b72d5` unchanged.  

## Source tape and timestamps (reported claim vs verified observation)
1. **CEC-attributed, Ynet original reporting (29 Oct, exact publication clock not visible):** https://www.ynetnews.com/article/rjxswybaze . Ynet reports the CEC announced double-envelope ballot *counting* complete, and that 12,644 stations had been input, with 5,589,836 processed votes, including **5,564,764 valid and 25,072 invalid**. **Yet 24,713 ballots from the final double-envelope batch had been sent for data entry/verification and were NOT YET PUBLISHED at time of that report.** Ynet explicitly says counts remain provisional pending further validation and Nov 4 official publication. CEC first-party signed release not independently recovered.
2. **CEC-attributed, Anadolu report (29 Oct, precise publication clock not exposed):** https://aa.com.tr/en/middle-east/israel-completes-vote-count-netanyahu-bloc-retains-53-seats/4105279 . Repeats 5,564,764 valid / 25,072 invalid and says counting of special ballots complete, but final results later. This reports Ynet and is **not independent confirmation of the underlying CEC raw data**.
3. **Named outlet declaration, Jerusalem Post (published 29 Oct 19:25 IST = 17:25 UTC):** https://www.jpost.com/israel-election-2026/article-913237 . Headline/body describe **all votes counted** and CEC-attributed 53 Netanyahu / 48 Jewish-led opposition / 19 Arab-list seat projections; Likud 27, Yashar 21, B'Yachad 12, Joint List 11, Ra'am 8, Democrats 8, Yisrael Beytenu 7, Otzma Yehudit 7, UTJ 7, Religious Zionism-Zehut 6, Shas 6. **Neither the headline nor reported seat map is certification**. Article does not supply a latest complete party-by-party valid-vote vector, nor an audited final-valid-ballot denominator.
4. **CEC-feed-attributed independent mirror (timestamp 29 Oct 17:58 IST = 15:58 UTC):** https://israelielections.com/2026/results/ (mutable page; 17:58 historic search snapshot). At that time it displayed **5,641,300 valid votes counted**, greater than the 5,564,764 of Ynet/AA by **76,536**. Its **99.5%** was calculated using **5,695,682 election-night participants** (turnout), **NOT** the final valid-ballot denominator. Its 54/48/18 coalition projection excluded legally relevant surplus-vote agreements and differed from JPost/CEC-attributed 53/48/19. This web page is mutable; exact historical bytes not frozen by source; use timestamp and snapshot with caution.
5. **CEC-feed-attributed separate report (published 29 Oct, 11:08 EDT; underlying CEC snapshot 16:55 IST):** https://jbiznews.com/israels-partial-count-reaches-5-64-million-projected-seats-unchanged/ . Reports 12,752 stations, **5,613,156 valid and 25,373 invalid**, showing changing totals after the earlier reported 5,564,764. Its seat model *includes filed surplus-vote agreements* but remains publisher-calculated, not certified CEC seats.
6. **First-party portal, attempted this run:** https://votes26.bechirot.gov.il/ returned a JavaScript/robot verification challenge to automated access; https://cdn-votes26.bechirot.gov.il/ timed out, and indexed cached content was marked a **6 Oct test environment**, NOT 29 Oct live count. No first-party raw national file, official final seat order or signed CEC completion bulletin independently retrieved.
7. **Official CEC publication timeline:** https://www.gov.il/en/pages/time--table-26 ; specified final result publication **4 November 2026**, not 29 October. Independent CEC landing listing https://www.gov.il/he/departments/units/elections-26/govil-landing-page confirms the agency and chairman.

## Numerical object and contradiction / fail-closed gate
- Latest named wire/report snapshot valid votes: **5,564,764** (Ynet, double-envelope entry incomplete at its observation). Latest later mirror snapshot valid votes: **5,641,300** at 17:58 IST (publisher mirror, not authentic raw first-party receipt). **Different source times and processing states: do not join them into one synthetic count.**
- Reported 5,695,682 participants are *voter turnout at 22:00 on election night* and omit/overlap later special-envelope processing; **not a mathematically valid denominator for valid ballots ultimately received**.
- **C3 >=25%, C4 >=50%, C5 >=75%: MILESTONE_UNVERIFIED** at this capture. At least 24,713 ballots remained unpublished per Ynet report and later snapshots exceeded reported totals. No independently verified final valid-ballot denominator at the contemporaneous snapshot; first CEC statement of count completion is itself ambiguous. **Do not set numerator=denominator merely because a headline says "all counted".** If denominator becomes trustworthy later, do one-time simultaneous late capture with truthful observed time and scope, without backdating or treating this as an accuracy time series. If no qualifying denominator was recorded at earlier times, mark missed at final audit.
- **C6:** earlier named largest-party projection remains archived; it does not imply winner of the premiership.
- **C6B:** an *outlet* has described "all votes counted" (JPost 19:25), but Ynet explicitly describes unentered/under-verification double-envelope records and changing count totals contradict a confirmed formal CEC completion/seat allocation event. **Gate held pending; reported outlet completion claim preserved here, no C6B checkpoint asserted.**
- **C7:** officially certified 120-seat allocation not yet published. **NOT SCORED**. Do not score seat errors against these provisional figures and do not impute any proprietary KAHRELUM election-outcome probabilities.

## Provisional seat map (CEC-attributed media, 29 Oct 19:25 IST, not gold)
| List | Provisional seats |
|---|---:|
| Likud | 27 |
| Yashar | 21 |
| B'Yachad | 12 |
| Joint List | 11 |
| Ra'am | 8 |
| Democrats | 8 |
| Yisrael Beytenu | 7 |
| Otzma Yehudit | 7 |
| United Torah Judaism | 7 |
| Shas | 6 |
| Religious Zionism-Zehut | 6 |
| **Total** | **120** |

**CEC-attributed media bloc grouping:** Netanyahu 53 / Jewish-led opposition 48 / Arab-led lists 19, provisional.  
**Reported vote shares by list for that exact 19:25 snapshot:** NOT AVAILABLE from cited primary data; do not blend earlier mirror vote shares into it.  
**Known alternative mirror grouping:** Netanyahu 54 / opposition 48 / Arab lists 18, independent allocation without surplus agreements; difference is **method-dependent and unresolved**, not necessarily a raw-vote change.

## Related political mechanism, separate from vote-count evidence
Ynet reports a **senior UTJ official's conditional proposal** to support Eisenkot as prime minister if he advances a military-service exemption for ultra-Orthodox men. Source: https://www.ynetnews.com/article/rjxswybaze ; published 29 Oct (exact clock not visible). **It is a bargaining proposal, no accepted coalition agreement, and directly conflicts with Eisenkot's previous service requirement.** This is neither election fraud nor an election postponement.

## Integrity and correction policy
C1 and C2 previously archived; C3-C5 not invented; C6 archived; C6B withheld; C7 pending. A 37/36/35-list registry/source discrepancy persists; do not rewrite the earlier dated registry. Qatar/Turkey funding allegations and the Shin Bet inquiry remain unproven; no verified court suspension or election delay. Frozen C0, scoring protocol and earlier election records remain untouched. This supplement is **evidence-quality research only, not a claim of live execution by a frozen software forecasting model**.
