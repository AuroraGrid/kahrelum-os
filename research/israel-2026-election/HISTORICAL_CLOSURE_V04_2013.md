# KAHRELUM OS | Seven-election historical-validation closure: 2013 to 2022

**Case:** KAH-IL26-PROSPECTIVE-001
**Separate historical record identity:** KAH-IL26-HIST-v0.4
**Declared preparation timestamp:** 2026-10-27 06:16:51 PKT = 2026-10-27 01:16:51 UTC, from local-time observation; **not a signed/trusted timestamp**.
**Scope:** OWNER ORDER: INCLUDE JANUARY 2013 AS THE EARLIEST HISTORICAL ELECTION AND STOP. No 2009 or earlier cycles.
**Evaluation state:** HISTORICAL SEAT MECHANICS PASSED; ARCHIVAL POLL ERRORS CALCULATED WITH LIMITATIONS; PROPRIETARY ELECTION-OUTCOME FORECAST NOT ISSUED. 2026 election case remains LIVE / UNRESOLVED / NOT SCORED.

## Executive summary

A new version of the owner-operated independent Python counting-mechanics suite adds the 19th Knesset election of January 22, 2013 to six previously reconstructed historical contests. All **7/7 election seat-allocation reconstructions** match: **73/73 represented list seat counts**, **840/840 seats across independent parliamentary elections**, and **0 seat discrepancies**. The expanded code passes **65 of 65** developer unit tests.

This **does not establish KAHRELUM's ability to predict voter choices**. Each mechanical reconstruction starts from **known final historical vote totals**. The 21 archived polling rows are third-party *retrospective comparative observations*, not proprietary pre-election model forecasts. No first-party electoral outcome probabilities or claimed predictive calibration were produced.

## Historical coverage frozen at 2013

| Election date | Represented ballot lists | Mathematical check | First-round seats | Remainder seats |
|---|---:|---|---:|---:|
| 22 January 2013 | 12 | All 120 seats correct | 113 | 7 |
| 17 March 2015 | 10 | All 120 seats correct | 116 | 4 |
| 9 April 2019 | 11 | All 120 seats correct | 113 | 7 |
| 17 September 2019 | 9 | All 120 seats correct | 117 | 3 |
| 2 March 2020 | 8 | All 120 seats correct | 117 | 3 |
| 23 March 2021 | 13 | All 120 seats correct | 112 | 8 |
| 1 November 2022 | 10 | All 120 seats correct | 113 | 7 |
| **Total** | **73** | **0 discrepancies** | **801** | **39** |

The 2015–2022 input files are byte-for-byte carried forward from the prior owner v0.3 package. Its original 18 historical third-party polling records are also retained in unchanged order and content as part of this newly versioned extension. Only 2013 is added. Earlier published public v0.1, v0.2, v0.3 records and ZIP identities remain historical; they are not silently rewritten.

## 2013 source control and important electoral rule change

**FACT:** The official final 19th-Knesset tally published by the Israel Central Elections Committee records **3,792,742 valid votes**, **32 numbered candidate lists**, **12 lists gaining seats**, and **120 seats**. The 2013 national electoral threshold was **2%**, not 3.25%. Its 32 list vote totals have been transcribed into the owner's versioned file and independently summed to 3,792,742. The new code explicitly uses `threshold_basis_points=200` for 2013, retaining **325** for 2015–2022.

- [CEC 2013 official final results](https://www.gov.il/apps/elections/elections-knesset-19/eng/list/Results_eng.html)
- [Israel Democracy Institute 2013 table](https://en.idi.org.il/israeli-elections-and-parties/elections/2013/)
- [Knesset institutional historical totals](https://main.knesset.gov.il/en/About/History/Pages/KnessetHistory.aspx?kns=19)

**FACT:** The CEC's preelection statement lists seven surplus-vote agreements. The 2013 reconstruction uses those documented pairs, including Labor–Yesh Atid, UTJ–Shas, Balad–Hadash, Jewish Home–Likud–Yisrael Beitenu, Hatnuah–Meretz, Kadima–Am Shalem and Dor Bonei Haaretz–Tzedek Hevrati. Agreements involving lists that fail to reach the threshold do not transfer their excluded votes to their qualifying partners. The code correctly retains Kadima's two seats when Am Shalem fails the threshold.

- [CEC original seven surplus agreements](https://www.gov.il/apps/elections/elections-knesset-19/eng/cec/Notice140113_eng.html)
- [Knesset Bader–Ofer allocation explanation](https://m.knesset.gov.il/en/about/lexicon/pages/seats.aspx)

**Source limitations and contrary evidence:** Direct retrieval of the 2013 CEC government pages returned HTTP 403, but their indexed source text supplies the 2013 total, list vote counts and seven named agreement pairs; the independently readable IDI and Knesset summaries corroborate the certified seat totals and 2% threshold. A historical IFES election page reports **3,793,469 valid votes**, differing by **727** from the CEC final figure. The IDI introduction describes 34 participating parties, while its final table and the CEC list enumerate 32; this discrepancy is preserved as a source-description conflict. The CEC final **3,792,742** is the reconstruction denominator; the figures from different apparent versions were **not merged**.
- [Alternative IFES figure](https://www.electionguide.org/elections/id/1649/)
- [IPU reporting 32 participating parties](https://data.ipu.org/election-summary/HTML/2155_13.htm)

## Retrospective third-party polling audit, expanded from 18 to 21 rows

The owner code additionally scores **three selected 2013 archived third-party survey seat maps** against the 2013 official outcome, under the established 14/7/2-calendar-day comparison cutoffs. All three are `RETROSPECTIVE_COMPARATOR_ONLY_PUBLICATION_TIME_UNVERIFIED`, not clean blind historical holdouts. Archive table dates do not independently authenticate actual initial publication dates or contemporaneous source bytes.

| Comparison reference | Selected survey row and its archive date | Total absolute seat error L1 | Seats reassigned (L1/2) |
|---|---|---:|---:|
| D−14: 8 Jan 2013 | Walla!/TNS, archived 8 Jan | 28 | 14 |
| D−7: 15 Jan 2013 | Maariv/Maagar, archived 11 Jan | 28 | 14 |
| D−2: 20 Jan 2013 | Maariv/Maagar, archived 17 Jan | 28 | 14 |

[2013 archived polling source](https://en.wikipedia.org/wiki/Opinion_polling_for_the_2013_Israeli_legislative_election)

**Zero versus missing:** The archived D−14 table leaves Kadima and Otzma LeYisrael seat cells blank. Its other 12 columns already sum to 120, so the scoring vector records two **explicitly documented algebraically derived zeros**, not publisher-asserted zeros. These blanks do not mean zero popular-vote share or zero probability of representation. The D−7 and D−2 selected rows have complete numeric columns in the archive; neither their original-publication timestamps nor absence of hindsight selection bias is independently established.

Across **all seven** elections, the descriptive mean historical poll L1 by stage is **22.286** (D−14), **22.571** (D−7), and **20.571** (D−2). These values depend on the post-hoc selected source rows and are **not KAHRELUM proprietary election forecast errors, an unbiased industry benchmark, or proof of forecast skill**.

## Technical QA and preserved evidence boundary

- 65/65 independently executed owner/developer unit tests pass, including new year-specific threshold, official-vote sum, seven CEC surplus agreements, proper inactive pairing, documented alternate-source conflicts, 21 polling rows, and 2013 earliest-year stopping tests.
- 2013: 32 list vote totals → twelve represented ballot list allocations → **113 initial + 7 remainder seats** → exact 120 official seats.
- Owner-only distributable source package: `KAHRELUM_Israel_Audit_v0_4_2013_FINAL_verified.zip`, **35 entries**, **62,751 bytes**.
- ZIP SHA-256: `1675add9bb7ba0d600d3c699c109cf7ffd3f809f4fbc73ae61016e72f6c23d11`.
- Internal `MANIFEST.sha256` SHA-256: `ee536dd11e0361c40099ff0dc3c7f98e0dfd115a85f9188ada73582c32319b71`.
- ZIP CRC and each manifested SHA-256 verified against contents; six original historic vote files and 18 older poll objects compared unchanged against v0.3.
- Package remains owned source code, **not** an upload to this GitHub public source repository. GitHub documents method, metrics, source URLs and the package hash. Software tests are developer-run, not a third-party independent audit; the immutable official KAHRELUM v2.3.4 runtime was **not** executed.

## Prospectively governed election records are not changed

The existing [C0 source lock](./BASELINE_LOCK_2026-10-26.md), [preregistered scoring protocol](./SCORING_PROTOCOL_2026-10-26.md) and other append-only releases are **unchanged**. This new 2013 historical item is not backdated into the C0 2026 preelection forecast. It supplies no proprietary 2026 election winner/party-seat vector or probability. Election-night C1–C7 conditional stages remain under their existing rules, and the live 2026 election case is still **UNRESOLVED / NOT SCORED**.

**Historical research scope is now closed at 2013. No additional earlier elections authorized or planned.** Corrections to this report, if needed, must appear in separately dated errata, not silent rewriting.
