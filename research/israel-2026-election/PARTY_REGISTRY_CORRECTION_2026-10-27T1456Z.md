# KAHRELUM | Israel 26th-Knesset election: append-only ballot-list correction (Achi withdrawal)

**Case:** KAH-IL26-PROSPECTIVE-001  
**Correction class:** MISSED EARLIER SOURCE / TIME-STAMPED HISTORICAL REGISTRY ERROR  
**Captured UTC:** 2026-10-27T14:56:51.189Z  
**Israel local:** Tuesday, 27 October 2026 at 16:56:51 GMT+2  
**U.S. Eastern:** Tuesday, 27 October 2026 at 10:56:51 GMT-4  
**Pakistan local:** Tuesday, 27 October 2026 at 19:56:51 GMT+5  
**Event/trigger:** October 25 CEC-attributed announcement that Achi (Tnuat Achi) had formally withdrawn, missed by the October 27 01:40 IST KAHRELUM registry and discovered in this later review.  
**Stage:** SUPPLEMENT, not preregistered C2/C3/C4/C5/C6/C7. **Election outcome remains UNRESOLVED / NOT SCORED.**

## Correction without hindsight rewrite

The [original 37-contesting-list registry](./PARTIES_AND_LEADERS_2026-10-27T20261026T234042Z.md) was **already stale when captured** (Oct 26, 23:40:42 UTC / Oct 27, 01:40:42 IST). It relied on an October 22 candidate dataset that predates the second withdrawal. Treat its assertion of **37 currently contesting** as an auditable *MISSED SOURCE*, not a valid election-day status. **Do not edit or quietly replace that original registry.**

The defensible **election-day operational count is 36 contesting lists**, subject to an unresolved first-party retrieval limitation: **38** initially approved by the CEC Sept 27, **minus Blue and White** after all its candidates withdrew (CEC-attributed notice Oct 21), **minus Achi** after all its candidates withdrew (CEC-attributed notice Oct 25), yielding **38 − 1 − 1 = 36**. Multiple dated sources independently publish 36. This is an enrollment/status reconciliation, **not** a count of lists expected to win seats.

| Category | List | Hebrew letters | Candidate/organizational distinction | Status as of this observation | Evidence |
| --- | --- | --- | --- | --- | --- |
| Newly identified withdrawn list, originally #36 in registry | Achi Movement / תנועת אחי תנועתו של הרב יורם אברג'ל זצ"ל | **צבי** | First-ranked candidate in archived Oct 22 data: **Yuval Elimelech**. Spiritual leader identified separately in contemporary reporting as **Rabbi Haim Yosef David Abergel**; **do not substitute** spiritual leader for ballot's #1 candidate. | **WITHDRAWN**; all candidate resignations reported accepted by CEC Oct 25; CEC instructed removal of printed ballots and invalidation of votes cast for Achi. | [Specific CEC list page, direct fetch blocked](https://www.gov.il/he/pages/chozrim-leshorashim_list32); [The Times of Israel, Oct 25 17:53 IST](https://www.timesofisrael.com/liveblog_entry/election-committee-pulls-ballot-slips-of-fringe-haredi-party-achi-after-it-drops-out/); [Kore ballot roster, Oct 26 12:24 IST](https://www.kore.co.il/viewArticle/223994) |
| Previously documented withdrawn list | Blue and White / כחול לבן בראשות בני גנץ | **כן** | Benny Gantz, prior list head | **WITHDRAWN** Oct 20–21, already correctly excluded by prior registry. | [Specific CEC list page](https://www.gov.il/he/pages/kachol-lavan_list30); [The Times of Israel quoting CEC Oct 21](https://www.timesofisrael.com/liveblog_entry/blue-and-white-ballot-slips-to-be-removed-from-polling-stations-after-all-party-members-withdraw-from-election/) |
| Remains included among 36 | Brit Olam / Redemption of Israel | **זץ** | Top-listed candidate Ofer Pinhas Lifshitz from original CEC-linked registry; no new leader inferred. | No verified withdrawal in checked sources, **retained**. | [Specific CEC entry](https://www.gov.il/he/pages/brit-olam_list22); [original register](./PARTIES_AND_LEADERS_2026-10-27T20261026T234042Z.md) |

## Source chronology, access grades, and inference

- **Sept 27, 2026**: The CEC reportedly approved **38** candidate lists. [Walla, Sept 27](https://www.walla.co.il/news/politics/383955473). Grade **B**, reporting on official CEC.
- **Oct 21, 2026, 15:46 Israel**: The Times of Israel attributed ballot withdrawal/invalidation for **Blue and White** to the CEC. Grade **B** official attribution. Original KAHRELUM registry reported direct access to the specific CEC page (**A at that historical access**).
- **Oct 23 / Oct 25, 2026**: Achi announced withdrawal Friday Oct 23; The Times of Israel report published **Oct 25, 17:53 Israel time** describes formal CEC confirmation and election-station instructions, including votes already cast. Grade **B** named outlet citing CEC. [Original publication](https://www.timesofisrael.com/liveblog_entry/election-committee-pulls-ballot-slips-of-fringe-haredi-party-achi-after-it-drops-out/).
- **Oct 26, 2026, 12:24 Israel**: Contemporary Hebrew ballot guide explicitly states **36** after Blue and White and Achi departed. Grade **B** secondary newsroom. [Kore](https://www.kore.co.il/viewArticle/223994). [Yeshiva World guide, Oct 26](https://www.theyeshivaworld.com/news/israel-news/2615040/ballot-guide-all-36-parties-and-their-voting-letters-ahead-of-tuesdays-knesset-elections.html), additional independent outlet.
- **Oct 27, 2026**: Contemporary election-day coverage also states **36**. [Sada News, Oct 27 07:45](https://www.sadanews.ps/en/news/347243.html).
- **First-party access limitation:** The Achi-specific gov.il CEC record at https://www.gov.il/he/pages/chozrim-leshorashim_list32 returned HTTP **403** in this review. Therefore the original signed/official statement **was not independently retrieved**. The high-confidence **36** operational count is based on contemporary attributable CEC reporting plus named independent publications; **do not mislabel as directly verified official page**. Any contradictory CEC first-party list must supersede this *via an append-only later correction*, not a silent rewrite.
- **WHY MISSED:** Original Oct 22 archived candidate data did not contain Oct 25 Achi withdrawal. KAHRELUM's Oct 27 registry did not refresh **all** CEC statuses before stating 37 at 01:40 Israel time. Record process deficiency openly; C1 exact-cutoff delay is separately documented and not fixed by this addendum.
- **C0/protocol/source-risk caveats:** [C0](./BASELINE_LOCK_2026-10-26.md), [original scoring protocol](./SCORING_PROTOCOL_2026-10-26.md), [v0.5 historical poll-source risk](./SOURCE_RISK_MODEL_V05_2026-10-27.md) and existing checkpoint files remain untouched. v0.5 0.305392 Brier is a source-quality benchmark, not an Israeli outcome forecast.
- **Vote count and seat state:** No actual valid ballots counted numerator or denominator is attributable to this withdrawal; vote-share, seat projections, and official seat map are **NOT AVAILABLE / NOT APPLICABLE**. Published turnout figures and precinct-opening reports do not count toward C3–C5. No inference about Knesset plurality, PM or election delay.

## Audit gate

**Registry accuracy:** CORRECTED IN NEW APPEND-ONLY SUPPLEMENT; original claim preserves a **MISS** for contemporaneous source refresh. **First-party source body check:** BLOCKED (403). **Probabilistic assessment:** NO CHANGE. No political persuasion or electorate targeting. Preserve all 36 still-competing list rows from original table **except Achi #36**; major 12 stay first, Brit Olam remains included. Two withdrawn lists are historical only. No assertion that inclusion proves seat likelihood.
