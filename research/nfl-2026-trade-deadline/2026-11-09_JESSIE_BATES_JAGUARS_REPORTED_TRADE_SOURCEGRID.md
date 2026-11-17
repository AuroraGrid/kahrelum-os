# KAHRELUM SOURCEGRID | 2026-11-09 | Jessie Bates III reported ATL → JAX trade

**Purpose:** Append-only correction to the trade desk's missed material item. Evidence discovered November 9, 2026. Do not imply the transaction was public at the earlier November 9 morning sweep or backdate this note to the original reporting time. Only the resulting GitHub commit establishes this note's independently inspectable publication time.

## FACT — previously published board and custody
- The public `nfl/trade-board.json` snapshot (`asOf: 2026-10-30T15:12:12-04:00`) includes **Jessie Bates III**, ID `K26-074`, Atlanta Falcons S, `kahrelumProbability: null`, `kahrelumIntegrity: UNPRICED`, `evidenceType: ANALYST_RADAR`, ESPN indexed as source.
- NO verified *numerical* KAHRELUM prospective pre-trade probability for this specific event was found in that public candidate record. **NO retrospectively fabricated 100% or Brier score**; event should be excluded from forecast calibration pending genuinely pre-resolution numeric custody.
- Before this deal, the official league season tracker indexed eight in-season completed trades, latest Nov 6 Jacoby Brissett: https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season . At the time of this research check, the league tracker and ATL/JAX transaction pages had **not independently confirmed Bates as an official posted transaction**. Do not label his paperwork officially complete without an official readback.

## ORIGINAL_REPORT — reported agreement, Monday 2026-11-09
- **Adam Schefter (ESPN), first report approximately 7:50 a.m. America/New_York (attributed later by Heavy, exact post timestamp not independently certified):** Falcons are sending S Jessie Bates III to Jacksonville for Jacksonville's **2027 second-round** and **2028 fifth-round** draft picks. Original Schefter message is embedded in Chris Cwik's Yahoo Sports article published **2026-11-09 13:01 UTC (8:01 a.m. EST)**. https://uk.sports.yahoo.com/news/falcons-reportedly-trade-safety-jessie-bates-to-jaguars-for-two-draft-picks-130122485.html . This source reproduces the verified-reporter's claim; do not treat syndication as independent corroboration.
- **Jonathan Jones (The Athletic), separate original sourced November 9 report:** corroborates Atlanta → Jacksonville and the identical picks, with Jones's original post reproduced in the For The Win/Yahoo piece at **2026-11-09 13:16 UTC (8:16 a.m. EST)**. Direct original post was not opened. https://uk.sports.yahoo.com/news/jessie-bates-iii-trade-grades-131637367.html .
- **Ian Rapoport (NFL Network), attributed compensation detail:** Atlanta will reportedly pay most of about **$6.5 million in remaining salary** to facilitate the deal; original Rapoport post not independently inspected. This is a *report*, not independently authenticated contract paperwork. https://thescore-web-gcp.thescore.com/nfl/news/3649942/report-falcons-sending-jessie-bates-to-jaguars-for-2-draft-picks .
- Original terms reportedly include only Bates and the two draft picks stated above; no other players or conditions independently verified. No trade-call logs, alternatives, or bidding team should be invented.

## PRIOR REPORTS / WHY THIS IS A MISSED ALERT
- ESPN original preview published November 4 (syndicated by ABC), with Dan Graziano saying Falcons were **not trying to trade Bates** and a **very large offer** would be needed; an opinion about expected outcome, not a categorical denial of future talks: https://abc11.com/post/2026-nfl-trade-deadline-players-watch-buzz-goals-32-teams/20014788/ .
- Pro Football Rumors' November 7 reporting (syndicated via Yardbarker) attributed actual **inquiries about Bates** to Graziano, and salary-retention complications to Jonathan Jones. This merited promotion above ANALYST_RADAR before today's deal; the desk missed it. https://www.yardbarker.com/nfl/articles/teams_interested_in_falcons_jessie_bates_s_unlikely_to_be_traded/s1_14819_44530719?mb_edition=20261108&mb_loc=left_r .
- Jessie Bates being discussed as a **hypothetical Bills acquisition** was analyst speculation, not evidence Buffalo submitted an offer. Do not misclassify it.

## SALARY / CAP (source-graded)
- Over The Cap historical Falcons contract page lists Bates's **2026 $13.02m base salary** and **$24.77m Atlanta season cap number**, with 2027 a void season: https://overthecap.com/player/jessie-bates-iii/6939 .
- Rapoport's attributed salary-retention arrangement reportedly addresses the roughly **$6.5m remaining due**, but Jacksonville's exact payable remainder, prorated 2026 cap hit, Falcons dead-money booking, and any restructuring documentation are **UNVERIFIED**. Full Atlanta cap charge is NOT Jacksonville's assumed cost.
- Jacksonville's Eric Murray had been placed on IR Nov 3 according to club transactions, relevant to safety need: https://www.jaguars.com/team/transactions/2026 .

## CLASSIFICATION / FORECAST / IMPACT
- **Player:** Jessie Bates III; **prior club:** ATL; **reported destination:** JAX; **position:** S; **evidence class:** ORIGINAL_REPORT with independent named-source corroboration; **status:** REPORTED_AGREEMENT_PENDING_OFFICIAL_CONFIRMATION, not OFFICIAL_CONFIRMED_TRADE until a league or club transaction posts.
- **Trade-by-deadline probability:** `RESOLVED_OR_REPORTED_AGREEMENT`, **UNPRICED historically**. A new 100% numerical forecast *after the original reports* would be hindsight and is **not created**. Leave earlier null snapshot intact. Binary scoring `N/A`.
- **Football/IDP:** JAX gains a high-impact ball-hawking safety if consummated, and ATL must reallocate safety snaps, potentially involving Xavier Watts/Sydney Brown/DeMarcco Hellams; specific usage uncertain. No lineup recommendations or roster actions.
- **Alert priority:** 1, NEW material reported agreement as of Nov 9; do not bury it under routine no-change updates. No additional trades confirmed from this evidence alone.
- **Publication boundary:** Append-only evidence custody only. `nfl/trade-board.json`, `nfl/desk-live.json`, Firebase Hosting, sports articles, X and email are **not** changed by this research note. Do not claim a live production deploy.

## Next required verification
1. Official Jacksonville, Atlanta, and NFL transaction page readbacks; log exact dated confirmation if/when available.
2. Check whether the reported draft choices, cash retained, and effective cap treatment match official documents or direct on-record reporter follow-up.
3. Flag that a 32-team/source sweep which excluded Bates was **not comprehensive**, and distinguish operational RSS success from review of original reports.
