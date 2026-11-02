# KAHRELUM NFL 2026 Trade Deadline | Brian Thomas Jr. buyer reports and Downs fallback
Status: RESEARCH APPEND-ONLY, NOT production trade-board publication.
Evidence review date: 2026-11-02. NFL trade deadline: 2026-11-10 16:00 America/New_York (21:00Z).
This file's **GitHub commit time** is the first authenticated publication timestamp of the forecast revision below. The older data `asOf` is not a prior authenticated forecast lock.

## FACT | original transaction control
- The official NFL November 2026 trades register displayed "No Transactions Available" at review: https://www.nfl.com/transactions/league/trades/2026/11
- League regular-season trade tracker still lists the seven completed deals through Jeffery Simmons (2026-10-29), with **no Brian Thomas Jr. or Josh Downs transaction**: https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season
- This independent web retrieval is not a repair of the known automated `NFL_TRANSACTIONS` parser error.

## ORIGINAL REPORT | Mike Florio, NBC Sports/Pro Football Talk
- **Original publication**: November 1, 2026, 11:02 p.m. Eastern (2026-11-02 04:02Z).
- Original link: https://www.nbcsports.com/nfl/profootballtalk/rumor-mill/news/chiefs-steelers-commanders-have-interest-in-brian-thomas-jr
- Florio identifies **Kansas City Chiefs, Pittsburgh Steelers and Washington Commanders** as teams currently interested in acquiring **Jacksonville Jaguars WR Brian Thomas Jr.**
- Florio separately reports (attributed to "we're told") that Pittsburgh's stronger preference is **Indianapolis Colts WR Josh Downs**, with Downs **Kansas City's fallback/Plan B** if it cannot acquire Thomas.
- This is **ORIGINAL_REPORT** (sourced journalist reporting of buyer interest/relative preferences), **not a confirmed offer, specific inquiry, trade negotiation, official club statement, agreed compensation, accepted deal or completed trade**. No destination has been established.
- **Secondary attribution**, not independent corroboration: Nate Bouda, NFLTradeRumors, publication dated 2026-11-01: https://nfltraderumors.co/report-chiefs-commanders-steelers-interested-in-trade-for-jaguars-wr-brian-thomas-jr/ . The later syndicated Yahoo version is the same Florio report, not an independent source: https://sports.yahoo.com/articles/chiefs-steelers-commanders-interest-brian-040235814.html (2026-11-02 04:02Z).
- Florio explicitly warns that Jacksonville has little incentive to move the player absent a large offer, and that trading him to an AFC contender may be a particular obstacle. **Formal asking price unknown**; do not treat an analyst's Day-2 estimate as the Jaguars' demanded price.
- Historical **Josh Downs requested trade** and Colts coach Shane Steichen's contemporaneous statements are official first-party corroboration of market status (not new to this file): https://www.nfl.com/news/colts-wide-receiver-josh-downs-will-play-vs-jaguars-despite-trade-request (2026-10-30).
- Older source attribution: Adam Schefter's 2026-10-29 podcast reported Colts seeking **third-round value for Downs**, no team yet meeting the ask, per 2026-10-29 Steelers Depot rendering: https://steelersdepot.com/2026/10/schefter-reveals-colts-steep-asking-price-for-wr-josh-downs/ . This is historical attributed reporting, **not** a new lowered asking price or an authenticated current bid.

## Contract/cap boundaries
- Brian Thomas Jr., Jacksonville, WR, 2024 first-round pick, active rookie contract and 2028 fifth-year option. Over The Cap lists **2026 Jaguars cap charge $3,998,176**, **2026 base salary $1,075,000**, **2026 roster bonus $1,052,726**, **2027 base salary $2,794,086**, and total contract **$14,659,978**: https://overthecap.com/player/brian-thomas-jr./11631 . The $3,998,176 is a **Jaguars salary-cap figure**, NOT the acquiring club's projected 2026 charge. Precise remaining 2026 cash/cap liability after an in-season trade is **UNVERIFIED**. Do not turn the yearly amount into the acquiring team's balance.
- No specific bid amount, compensation package, or 2027 acquiring-team cap calculation verified. NFLTradeRumors' cited older $14,383,048 rookie total differs from current Over The Cap $14,659,978; prefer current OTC calculation and preserve variance rather than silently mixing figures.

## FORECAST | prospective, explicitly uncalibrated
Event definition: "**Will Brian Thomas Jr. be officially traded from Jacksonville to another NFL club by Tuesday 2026-11-10 16:00 EST?**"
- Former public 2026-10-30 provisional board research estimate: **34%**, `nfl/trade-board.json`, candidate K26-011; `CONVERSATION_RECOVERED_PROVISIONAL`. First independently inspectable public baseline begins at GitHub publication (e.g., the existing trade-board provenance commit), *not* historical `asOf` time.
- Revised KAHRELUM **40%**, **+6 percentage points** relative to that provisional research estimate. Rationale: Florio specifically names three interested buyers and distinguishes priority ordering, increasing plausibility of a trade. Offset: Jacksonville's present success, receiver depth/contingency risk, reportedly high price, division/conference-rival hesitancy, and **no verified actual offer**.
- Designation **ORIGINAL_REPORT**, outcome **UNRESOLVED**, confidence **LOW/MODEL-SENSITIVE**; no claimed quantitative calibration, sportsbook odds, or assured arrival.
- Potential buyers (status **REPORTED_INTEREST**, not VERIFIED_INQUIRY or DEAL): Kansas City (most plausible by need; not an authenticated preferred bidder), Pittsburgh (relative preference for Downs), Washington (longer-horizon potential). Exact destination **UNPRICED** because the report does not justify a reliable destination-specific share.
- **Josh Downs** separate event remains **52%** most recently documented prospective research estimate. No new 5+ percentage-point revision; Pittsburgh preference and Chiefs fallback are retained as material **destination-interest context**, not proof of new bid or a third-round price reduction.
- **Effect if trade occurs**, not a present fantasy action: Thomas could gain target opportunities and a new offensive role, while Jacksonville might redistribute receiver targets to Jakobi Meyers/Parker Washington. Downs to Chiefs/Steelers would change receiving target allocation. None of this occurs without a confirmed transaction.

## Custody, contradiction and score
- Distinguish original PFT report versus secondary rewrites. Date original and attribution separately.
- No item is a confirmed trade. The official NFL ledger is the resolution source.
- Preserve 34% older research estimate; do not overwrite original board, fabricate an old forecast lock, or present the public snapshot as Firebase production. This new 40% version becomes independently timestamp-verifiable **only after this file's GitHub commit**.
- One binary event, one pre-resolution forecast version per evaluation cutoff; do not double-count old and revised p as independent samples. **Certified Brier: N/A** pending deadline and authentic scoring cohort. The recalled Harrison/Nelson/Buckner rates and 0.2449 provisional Brier remain excluded.

## SourceGrid limitations
At 2026-11-02 08:11:22Z connected NFL SourceGrid recorded 37 feeds attempted, 36 successes, 1 failed NFL official transaction parser, 21 observations new and 359 review items queued. Its `materialAlerts` entry concerns a **historical October 31 Jonathan Taylor report**, not a freshly reviewed 2026-11-02 deal. These counts do not mean 32 clubs, every insider, local show and agent were read firsthand.
Original PFT report, official NFL monthly transaction webpage, selected ESPN/NFL and contract sources checked manually; **no comprehensive 32-club scan, agent confirmation or podcast audio review established in this run**. Maintain parser-degraded status. Next primary checks: Jaguars GM/HC or verified team-specific response about availability/compensation; Kansas City and Pittsburgh direct original-report follow-ups; an authenticated team offer; NFL transactions page.

## Original Sports Desk brief | UNPUBLISHED DRAFT
**Buyer interest grows around Brian Thomas Jr., but the Jaguars' price still controls the market.** FACT: Jacksonville's wide receiver has not appeared in the NFL's November trade register. REPORT: Mike Florio of PFT on November 1 at 11:02 p.m. ET identified the Chiefs, Steelers and Commanders as interested teams, with Pittsburgh reportedly favoring Josh Downs and Kansas City viewing Downs as a fallback (original report above). INFERENCE: Multiple potential buyers expand the plausible trade path, yet no accepted offer, official Jaguars asking price or confirmed transaction has been reported. FORECAST: KAHRELUM raises Thomas's uncalibrated trade-anywhere estimate from a conversation-recovered 34% to a prospective 40%. No fantasy or team personnel changes are attributed until an official transaction occurs. **Do not distribute without separate permission.**
