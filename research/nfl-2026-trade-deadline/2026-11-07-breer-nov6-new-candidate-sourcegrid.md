# KAHRELUM NFL SOURCEGRID | 2026-11-07 | Recovery of original November 6 Breer candidate leads

**Purpose:** Add original-source research leads missing from the October 30 public 124-name `nfl/trade-board.json` snapshot, without turning sourced team stances into verified offers, changing historic probabilities, or republishing the stale public board. This document is a **November 7 discovery/custody addition** based on a **November 6 original report**, **not a November 7 breaking report** or evidence a team took new action since the preceding monitoring checkpoint.

## Source and time integrity

- **Original national report:** Albert Breer, Sports Illustrated, *2027 NFL Trade Deadline: What We're Hearing on Jonathan Taylor, Other Moves*, published **November 6, 2026** (publication hour not independently verified): https://www.si.com/nfl/nfl-trade-deadline-reports-jonathan-taylor-cost-first-round-pick
- **Original-date caveat:** The article headline refers to *2027*, whereas the body explicitly concerns the **November 10, 2026** deadline. Preserve headline error rather than silently changing source text. Direct article content was inspected; this is **not an independent NFL/team confirmation**.
- **Secondary original-source pointer:** NBC/Rotoworld, *Giants serious about JT, Vikings, Broncos less so*, November 6, 2026: https://www.nbcsports.com/fantasy/football/player-news/2026-11-06/giants-serious-about-jt-vikings-broncos-less-so (secondary attribution; not independent second source).
- **Official NFL trades baseline:** NFL 2026 in-season tracker as reviewed November 7: https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season . **Eight confirmed** completed trades as of review, latest Jacoby Brissett to Baltimore on November 6; NONE of the names newly added below is in this report as a completed trade.
- **Board discovery boundary:** Searched names against current default-branch `nfl/trade-board.json` (124 candidates; data `asOf=2026-10-30T15:12:12-04:00`). Absence means absent from this stale public snapshot, NOT never studied by KAHRELUM elsewhere.

## New or newly corroborated research leads (not trade announcements)

| Candidate / team / role | Direct report, November 6 | Evidence status | Acquiring team / destination | Ask / cap | New forecast |
|---|---|---|---|---|---|
| **Garrett Williams · ARI · CB/nickel** | Breer wrote that Arizona's young nickel **could be had** in discussion alongside Josh Sweat interest. No club proposal or accepted trade identified. | `ORIGINAL_REPORT` of perceived availability, **NOT verified inquiry** for Williams | **UNVERIFIED** | **UNKNOWN** / **UNKNOWN** | **UNPRICED** |
| **Robert Hunt · CAR · G** | Breer wrote Carolina has **looked at the idea of trading** Hunt or Derrick Brown. No claim of received offers for Hunt. | `ORIGINAL_REPORT` of internal consideration; **NOT verified actual offer** | **UNVERIFIED** | **UNKNOWN** / **UNKNOWN** | **UNPRICED** |
| **Carlton Davis III · NE · CB** | Breer wrote Patriots have **discussed moving** Davis or DT Christian Barmore, but he did not expect both to move. | `ORIGINAL_REPORT` of team discussion, **NOT verified incoming inquiry** | **UNVERIFIED** | Breer's **estimated** cost roughly **fourth-round pick** for either player, not authenticated firm asking price; cap **UNKNOWN** | **UNPRICED** |
| **Pete Werner · NO · LB** | Breer says Werner is another Saint whose name has **come up**, beyond Davon Godchaux/Nathan Shepherd. No named buyer or actual offer. | `ORIGINAL_REPORT` of market mention; no authenticated inquiry | **UNVERIFIED** | **UNKNOWN** / **UNKNOWN** | **UNPRICED** |
| **J.K. Dobbins · DEN · RB** | Breer says Dobbins's name **was raised in some trade talks**, but he is **less likely** to be moved following RJ Harvey's injury. No named counterparty or firm offer. | `ORIGINAL_REPORT` of trade-discussion mention plus reduced availability, **NOT confirmed trade** | **UNVERIFIED** | **UNKNOWN** / **UNKNOWN** | **UNPRICED** |

**Other candidate custody:** Christian Harris (ATL) also absent from stale board but **already recovered** in the November 6 evidence pass; do not recast as new. Mike Hughes (ATL) already in the board as `ANALYST_RADAR`; Breer's original report establishes a more direct availability source, not an accepted offer. The source also says teams rebuffed on Khalil Mack, Zach Sieler and Moro Ojomo, but these were previously examined; do not double-count. Taylor: Breer's original report says Giants serious, Vikings/Broncos less inclined; asks first-round pick or McCaffrey-like compensation and none met it as of November 6. **This is not a November 7 confirmed destination or bid**.

## Forecast, effects, custody constraints

- **No new KAHRELUM probability**: five candidates `UNPRICED` pending a prospective researched estimate. Previous published versions are not rewritten. No ≥5pp change established.
- Existing independently versioned manual probabilities remain as previously recorded: Aiyuk **5%** (Nov 6 prospective manual revision), Taylor **45%**, Stewart **61%**, Downs **52%**, Pollard **23%**, Mack **3%**, Henry **17%** (previous versions/custody remain authoritative, not inferred from stale board).
- **NFL/fantasy effect:** conditional only; any Dobbins/Hunt departure could change team depth, but **no transaction** and no start/sit instructions.
- **No authenticated new accepted offers**, no seventh-to-ninth or ninth completed trade, no validated cap dollars for these new candidates. No league-account or fantasy-roster action.
- **Coverage limits:** original Sports Illustrated article, supporting NBC attribution, official NFL tracker, GitHub custody and targeted new-report searches were checked. **Not** every named insider, every club, or every radio program was inspected first-hand. Recheck official transactions and fresh original post-deadline bids; revisit the Indianapolis Sunday-to-Monday timing and formal Aiyuk status.
- **Custody:** append-only research note; do not change `nfl/trade-board.json` or its research `asOf`, do not assert Firebase publication, and do not calculate a Brier score for unpriced or stale-post-event records.
