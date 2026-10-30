# KAHRELUM Sports Intelligence Desk · NFL 2026

**Status:** public, read-only research snapshot build. **Deadline:** November 10, 2026, 4:00 p.m. America/New_York (EST). **Prepared:** October 30, 2026.

- Public dashboard source: [nfl/trades.html](../../nfl/trades.html); intended route once safely promoted: \`https://kahrelum.com/nfl/trades\`.
- Dated machine-readable candidate data: [nfl/trade-board.json](../../nfl/trade-board.json).
- [Evidence, integrity, accountability and Brier protocol](./SCORING_AND_CUSTODY.md).
- [Original editorial launch article](./ARTICLE_2026-10-30.md).
- [Business experiment and buyer research brief](./RESEARCH_SERVICES.md).
- [Release and risk checklist](./RELEASE_CHECKLIST.md).

## What the public data means

The snapshot has **124 candidate research records across 32 teams, 20 conversation-recovered provisional KAHRELUM single-point estimates, 21 indexed source entries and 7 league-reported completed trades**. This is not a claim that 124 negotiations have occurred, or that all 21 sources were freshly fully examined on the same day. The candidate radar includes analyst scenarios that should never be treated as active inquiries. Any missing probability is explicitly UNPRICED.

Source-linked evidence classes: TEAM/PLAYER CONFIRMED, ORIGINAL REPORT, REPORTED INQUIRY, REPORTED TEAM RESISTANCE, ESPN WATCHLIST, and ANALYST RADAR. Attributable journalist accounts of inquiries are distinct from accepted offers, and destination fits are distinct from verified bids.

Official league primary source: https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season

## The seven recorded trades

J.J. McCarthy MIN→NYG (September 28); Joey Porter Jr. PIT→DAL (October 1); Cam Jurgens PHI→BAL (October 7); Marvin Harrison Jr. ARI→HOU (October 12); Quenton Nelson IND→SEA and DeForest Buckner IND→SF (October 27); Jeffery Simmons TEN→CHI (October 29). Transaction-register posting dates can differ from agreement dates.

## Operating architecture

\`ROUTER → SCOUT → SOURCEGRID → K-ALIGN → IPR → BLACKGLASS-I → CRF → COMMAND → BLACKGLASS-II → RECORD LOCK\`.

Public reporting follows FACT / REPORT / INFERENCE / FORECAST. SourceGrid records reporter, claim, first attributable publication, original URL, confidence and competing accounts. Forecasts have exact proposition, horizon, version, timestamp, reasons, update gate, and eventual independent adjudication. A correction is appended; the original record is not silently replaced.

Separate SPORTS lanes: NFL trades, NFL injuries/fantasy, NBA, NCAA, roster/contract movements and other sports each have their own event IDs and outcome rules. KAHRELUM ONE remains a universal assistant and is not limited to sports.

## Publication cadence

During the deadline window, maintain a source-checked current page only when new authenticated trade evidence or an authorized forecast update exists. Any release must update the **visible "asOf"** timestamp to the actual cutoff, list changed records and preserve prior versions in Git. Do not market this static build as an autonomous live news service.

After the November 10 deadline, resolve *all* valid candidate forecasts (including non-trades) against official transactions, report Brier only for authentic prospective locks, and publish any excluded historical cases. Do not keep forecasting unresolved trade probabilities after the trade window closes.

## Commercial boundaries

- Free public source-checked desk and transparent outcomes.
- Proposed $9–15/month membership: **NOT FOR SALE; no checkout implemented**.
- Illustrative custom publisher/podcast source-brief pilot $150–500/month: **not a quoted contract or existing recurring revenue**.
- Existing separate enterprise $750 retrospective three-case Fit Check remains unchanged.
- Payments are not enabled. No NFL/team endorsement or licensed-investigator certification is claimed.

No NFL roster/account trades, game betting, bookmaking, subscription charge, automated personal data collection or unauthorized commercial outreach is part of this project.
