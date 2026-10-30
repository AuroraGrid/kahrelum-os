# KAHRELUM NFL SourceGrid — primary-source readback and candidate normalization (October 30, 2026)

**Custody:** Research-only append-only file. The GitHub commit time is the independent publication marker of this note. The original `nfl/trade-board.json` `asOf` is **not** updated. No new prospective forecast was locked. No public Firebase publication is asserted.

## FACT — completed deals
- Checked official NFL 2026 in-season trade tracker and October trade transaction register: the tracker still shows **seven** trades, most recent Jeffery Simmons TEN to CHI on Oct 29. NFL transactions lists Buckner with Oct 28 processing date, while the trade tracker reports Oct 27 trade date; **retain both source-specific date meanings**, do not silently overwrite either.
- https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season
- https://www.nfl.com/transactions/

## REPORT — directly readable Oct 30 Albert Breer original
- **Original:** Albert Breer, *Sports Illustrated*, published Oct 30, 2026: https://www.si.com/nfl/albert-breer-how-two-former-roommates-put-jeffery-simmons-trade-together . This original page's text **was directly retrieved in this check**, improving upon an earlier same-day note that had only accessible secondary attributions.
- First-hand attributable report (without named player inquiry/offer): Chiefs and Steelers have asked about receivers; Giants and Jaguars are looking at defensive tackles; Jaguars considering defensive-front pieces generally; Vikings have asked around on interior OL/DL and RB; Bills looking for defense; Browns checking for designated pass rusher and blocking TE. **Team-level buying interest, not proof of an offer to acquire a particular player.**
- Named seller possibilities in the article: **Washington Dorance Armstrong Jr.** (Breer prints *Dorrance Armstrong*) and K'Lavon Chaisson, plus Daron Payne; New England Christian Barmore; Jets Will McDonald IV has interest but Jets resistance, Garrett Wilson is explicitly not available per reporting; Miami Zach Sieler and Aaron Brewer rebuffed, Austin Jackson possible; Tennessee has seen interest in Tony Pollard, values Pollard and Calvin Ridley. **Most of these already appear in the public board.**
- Historical availability cues are not new post-check trades. The directly readable original does not establish buyer identity, named pick offer or agreed terms for Armstrong or Chaisson.

## ANALYST RADAR — Rob Maaddi AP Oct 30 (not insider calls)
- **Original AP syndicated Oct 30, 06:00 ET:** https://www.foxsports.com/articles/nfl/as-nfl-trade-deadline-nears-several-teams-are-clear-sellers-and-others-have-2-weeks-to-decide
- AP lists Tennessee edge **Jermaine Johnson II** as a *possible* movable player (the AP article spells *Jermain Johnson*). Correct name/team confirmed via February 26 Reuters report about Jets–Titans trade: https://www.reuters.com/sports/reports-titans-acquiring-pro-bowl-de-jermaine-johnson-jets--flm-2026-02-26/ . This was a 2026 **offseason** transfer, not a new in-season trade.
- AP also considers Tony Pollard and Amani Hooker possible sellers. **No specific current Jermaine Johnson offer or inquiry was provided in that AP article.** Do not upgrade to ORIGINAL_REPORT.
- AP's conditional interest in Justin Herbert includes reported no-trade clause and large dead-cap figures, but AP itself characterizes a move as highly unlikely. No proposal or probability is warranted.

## CANDIDATE GAP CHECK AGAINST LIVE GITHUB SOURCE
- Retrieved GitHub `main/nfl/trade-board.json`: 124 candidates, 20 provisional estimates, `asOf=2026-10-30T15:12:12-04:00`, `liveFeed=false`.
- **Not yet present in research board as exact player records:** Washington DE **Dorance Armstrong Jr.**; Tennessee EDGE **Jermaine Johnson II**. Both should enter a **future REVIEW-GATED intake**, initially UNPRICED, with their original Oct 30 URLs, not as confirmed offers or as new trading probabilities.
- Existing listed: K'Lavon Chaisson, Austin Jackson, Will McDonald IV, Garrett Wilson, Calvin Ridley, Zach Sieler, Aaron Brewer, Christian Barmore, Tony Pollard, Amani Hooker. Preserve current `TEAM_RESISTING` distinctions when applicable.

## INFERENCE / FORECAST / DISPOSITION
- No new official trade, individually established player inquiry, verified asking price change, completed offer, or supported >=5 percentage-point KAHRELUM revision since prior Oct 30 coverage.
- Keep all existing `CONVERSATION_RECOVERED_PROVISIONAL` estimates unchanged. New Armstrong and Johnson leads remain **UNPRICED**. No valid new prospective lock/outcome pair; **no Brier update**.
- Older reporter posts, repeated commentary and speculative market fits are not newly timed events.
- No public JSON, Hosting site, forecast lock, social media post, sports roster or payment change.
- **Coverage limitation:** Cross-divisional source-discovery searches, the official NFL tracker and transactions, accessible original Breer article, and syndicated AP were checked; **not every club statement, reporter's social feed or 32-market broadcast was individually authenticated**.
- Next check: monitor NFL club/league transactions, primary original insider offer/inquiry claims and any direct new player-specific testimony. Confirm names and independent primary evidence before promoting a candidate to REPORT.
