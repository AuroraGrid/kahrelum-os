# KAHRELUM | C2 post-close source-vector reconciliation (append-only)

**Case:** KAH-IL26-PROSPECTIVE-001  
**Relationship:** Supplemental correction/evidence addition to immutable `C2_POLLCLOSE_2026-10-27.md` and `C6_PROJECTED_LIST_2026-10-27.md`; NO original record overwritten.  
**Source capture:** 2026-10-27T20:53:39Z = 22:53:39 Israel IST = 16:53:39 Eastern EDT = 2026-10-28 01:53:39 Pakistan PKT.  
**Newly found source:** Reuters 2026 election live graphic, **last updated 20:49 UTC**; data snapshot expressly **as of 20:48 UTC, October 27, 2026**: https://www.reuters.com/graphics/ISRAEL-ELECTION/RESULTS/akvelybkapr/ .  
**Data type:** Reuters-presented **EXTERNAL broadcaster exit-poll estimates**, NOT actual vote tallies, official results, or KAHRELUM predictions. Reuters directly attributes each column to Kan11, Channel 13, N12. The graphic was published Oct 26 but content updated Oct 27; use latest update timestamp, not initial page creation date.

| Electoral list | Kan 11 as reproduced Reuters 20:48Z | Channel 13 as reproduced Reuters 20:48Z | N12 as reproduced Reuters 20:48Z |
| --- | ---: | ---: | ---: |
| Likud | 25 | 25 | 24 |
| Yashar | 21 | 23 | 22 |
| Together / B'Yachad | 14 | 13 | 12 |
| Democrats | 10 | 9 | 10 |
| Yisrael Beytenu / Israel Our Home (IOH) | 8 | 7 | 8 |
| Joint List | 10 | 11 | 11 |
| Ra'am | 7 | 7 | 7 |
| Religious Zionism–Zehut (RZ) | 6 | 6 | 6 |
| Otzma Yehudit / Jewish Power | 7 | 6 | 6 |
| United Torah Judaism (UTJ) | 6 | 7 | 6 |
| Shas | 6 | 6 | 8 |
| **Column arithmetic sum** | **120** | **120** | **120** |
| **Opposition / change bloc (as tagged by Reuters)** | **53** | **52** | **52** |
| **Arab / Reuters unaligned bloc** | **17** | **18** | **18** |
| **Netanyahu bloc** | **50** | **50** | **50** |

**Arithmetic check (derived by summing Reuters listed counts):** Kan opposition 10+14+21+8=53, Arab 7+10=17, pro 25+6+7+6+6=50; Channel13 opposition 9+13+23+7=52, Arab 7+11=18, pro 25+6+6+7+6=50; N12 opposition 10+12+22+8=52, Arab 7+11=18, pro 24+6+6+6+8=50. Each 120. **Bloc tags are Reuters editorial groupings, not proven coalition agreements.**

## Conflict with earlier captured relays and how handled

The initial C2 cited a **22:06 IST** Times of Israel Channel 13 relay and a Ynet report giving Channel 13 **53 change / 50 pro / 17 Arab**, Bennett **14**, Joint List **10**. Reuters later published an internally consistent Channel 13 **52 / 50 / 18**, Bennett **13**, Joint List **11** as of **20:48 UTC / 22:48 IST**. These two snapshots **CONFLICT**. An original Channel 13 versioned history and exact origin time for each estimate were not independently retrieved. We cannot determine whether this is **an updated exit poll** or **transcription mismatch**. Preserve both; never silently replace original C2 early snapshot or infer a trend.

The N12 official liveblog, updated 22:43 IST, explicitly changes Democrats **9→10** and Yisrael Beytenu **9→8** while bloc totals remain stable: https://www.mako.co.il/news-israel-elections/2026/liveblog-c84cc98a6ce71a1027.htm . Reuters N12 20:48Z 120-seat vector is consistent with this revised pairing.

The Times of Israel Kan 22:09 IST relay named Likud 25 / Yashar 21, 53/50/17 blocs, consistent with Reuters Kan representation; first-party Kan publisher https://www.kan.org.il/content/kan-news/politic/1113403/ confirms Likud25 and Yashar21 in search-indexed headline, though page body not text extractable here.

**Counted-vote check:** actual valid-ballot numerator **NULL**; independently credible total valid-ballot denominator **NULL**; counted share **NOT EVALUABLE**; official list vote shares **NULL**; official seats **PENDING**. These columns are hypothetical seat estimates from surveys, not an actual counted fraction and cannot trigger C3/C4/C5. Formal broadcaster 'projection-complete' declaration not found (C6B pending). Largest **projected list** Likud across all three but no established majority or prime minister.

**Process:** correction is forward-dated to actual capture; original frozen C0 baseline and scoring protocol were read unchanged earlier in this run, and are not edited by this write. Reconciliation is additional evidence, NOT hindsight-derived winner Brier or proprietary calibration.
