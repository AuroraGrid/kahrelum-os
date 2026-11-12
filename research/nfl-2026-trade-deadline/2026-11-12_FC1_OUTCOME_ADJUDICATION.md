# NFL 2026 FC1 | November 12 deadline-day outcome adjudication

**Status:** DATE-BOUNDARY REVIEW OPEN, no final FC1 exact count or scored prediction. Original fixed file [2026-11-09_NFL_DEADLINE_DAY_TRADE_COUNT_FC1_LOCK.json](official-forecasts/2026-11-09_NFL_DEADLINE_DAY_TRADE_COUNT_FC1_LOCK.json) and commit https://github.com/AuroraGrid/kahrelum-os/commit/798a6f3d4b3b9ca6f93d84089f8fe33295cb4ae5 are unmodified.

## Source reconciliation
- Official NFL November 2026 monthly transaction register: https://www.nfl.com/transactions/league/trades/2026/11
- NFL editorial tracker: https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season
- Broncos correction November 11: https://www.denverbroncos.com/news/statement-from-the-broncos

**Five completed November 10 club-dated transactions:** Kirk Cousins (LV→MIN), Keenan Allen (IND→SF), Amani Hooker (TEN→BUF), Josh Downs (IND→KC), and the Ryan Neuzil/Andrew Vorhees two-team exchange (ATL/BAL). The Neuzil and Vorhees roster movements are **one** trade. Club primary records:
- https://www.vikings.com/news/kirk-cousins-reconnects-after-raiders-trade-2026
- https://www.49ers.com/news/the-49ers-acquire-wr-keenan-allen
- https://www.buffalobills.com/news/bills-land-impact-safety-amani-hooker-in-trade-with-titans
- https://www.chiefs.com/news/five-things-to-know-about-new-chiefs-wr-josh-downs
- https://www.baltimoreravens.com/news/ravens-trade-ryan-neuzil-andrew-vorhees-offensive-lineman-atlanta-falcons

**Seven distinct NFL register-dated November 10 deals:** The league transaction register shows nine player entries, including *Jessie Bates III*, *Jordan Davis*, *Daiyan Henley*, and both exchange-side players. Drop unfinalized Henley and coalesce the Neuzil/Vorhees exchange, giving seven. Bates III and Davis are shown as November 10 in the register but had November 9 club announcements/league editorial dates:
- Bates: https://www.jaguars.com/news/roster-moves-jaguars-trade-for-s-jessie-bates-iii
- Davis: https://www.jaguars.com/news/roster-moves-jaguars-acquire-dt-jordan-davis
- The Broncos specifically said the Daiyan Henley proposal **will not be finalized**; the NFL tracker/register may retain now-superseded lines. The Broncos did not give a verified reason. Do not presume a failed physical.
- Arnold Ebiketie to Cincinnati likewise was canceled before completion: https://www.nfl.com/news/bengals-call-off-trade-eagles-arnold-ebiketie-compensatory-pick

## Original-rule discrepancy and hold
FC1 defined its event as transactions in the **official November 10 effective-date register** executed by 4 p.m. Eastern, but also expressly excluded transactions on **November 9** even when announcement and posting dates differ. For Bates and Davis, applying register effective dates counts them and club completion chronology excludes them. Until those pre-event criteria are reconciled without hindsight, **five** is a chronology count and **seven** is a register count; neither is certified as the single original FC1 scoring result. The original six-trade Poisson point forecast, distribution, ranked probability score and negative-log-loss plan are preserved, and the original outcome null remains null. No claims of beating insiders or a revised post-event forecast are made.

## Separate model accountability
The fixed October 31 123-player binary cohort described at [2026-11-12_POST_DEADLINE_OUTCOME_AUDIT.md](2026-11-12_POST_DEADLINE_OUTCOME_AUDIT.md) scored Brier **0.077813821138**, versus **0.065040650407** for an all-NO comparator on the same selection, i.e. underperformed. That is not the FC1 volume model; it must not be used as a surrogate FC1 score. Version corrections remain append-only with original source dates.
