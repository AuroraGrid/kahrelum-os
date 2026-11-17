# KAHRELUM Sports Intelligence | 2026 NFL trade-deadline outcome and custody audit

**Audit prepared:** 2026-11-12 after the deadline and November 11 club corrections. **Event deadline:** Tuesday 2026-11-10 16:00 America/New_York (21:00 UTC). **Status:** POST-DEADLINE FACTUAL RECONCILIATION / APPEND ONLY. **Not a Firebase production deployment or an update of archived board JSON.**

**Machine-readable audit, all 123 event rows:** [2026-11-12_POST_DEADLINE_SCORED_EVENTS.json](2026-11-12_POST_DEADLINE_SCORED_EVENTS.json). Historical snapshots, provisional forecasts, ledger locks, and source observations are preserved unchanged. Results can change only by append-only correction of genuine settlement/custody errors. This audit does not provide an independently calibrated claim of predictive superiority.

## 1. Method and authenticated first-public cutoff

Baseline: [original October 30 board](https://github.com/AuroraGrid/kahrelum-os/blob/89c7dd89a7e8116535d9d7e4009471202da31f96/nfl/trade-board.json) and [Scoring and Custody](https://github.com/AuroraGrid/kahrelum-os/blob/89c7dd89a7e8116535d9d7e4009471202da31f96/research/nfl-2026-trade-deadline/SCORING_AND_CUSTODY.md). The board's `asOf` is a research label; its 20 conversation-recovered probabilities are **not proof of earlier publication** and are **not scored in their historical form**.

On **October 31 at 04:46:37 UTC**, public GitHub commit [e225387f8ae04f6cb18fee1b3db7e23858974bb4](https://github.com/AuroraGrid/kahrelum-os/commit/e225387f8ae04f6cb18fee1b3db7e23858974bb4) published `nfl/current-forecasts.json`, containing 124 rows: **123 prospective trade probabilities plus one explicitly excluded roster-status value, Jack Jones**. Commit [22ebe1f9ffdc369f5fd7afa6176fbd01542c6a5f](https://github.com/AuroraGrid/kahrelum-os/commit/22ebe1f9ffdc369f5fd7afa6176fbd01542c6a5f) admitted the same 123 fixed event locks to `nfl/forecast-ledger.json` at **04:48:25 UTC**, after an official roster/transactions pre-lock comparison. Its internal declared `04:47:11Z` timestamp does not supersede either public GitHub commit time. GitHub commit clocks provide inspectable repository custody, not independently signed time authority.

**Fixed score definition:** Each distinct eligible player is scored once from the originally published October 31 probability `p`: `(p-y)^2`, with `y=1` only for a settled official trade after the lock through November 10 21:00 UTC; all other admitted players including no-trades have `y=0`. Transactions completed *before* publication cannot enter the eligible cohort. The 123 numbered, individually scored rows are in the companion JSON. Later amendments in separate research notes are *not* treated as extra independent forecast wins.

## 2. Deadline result

| Metric | Verified outcome |
|---|---:|
| Frozen prospective event denominator | 123 |
| YES: completed trades in frozen cohort | 8 |
| NO: no settled trade by deadline | 115 |
| Sum of squared forecast errors | 9.571100 |
| **Mean Brier score (lower is better)** | **0.077813821138** |
| Hypothetical all-NO Brier on same 123 subjects | **0.065040650407** |
| KAHRELUM minus all-NO loss (positive means worse) | **+0.012773170732** |
| Pre-lock in-season deals excluded from this cohort | 7 |
| Post-lock completed deals outside the selected cohort | 2 |
| Established completed in-season deals, Sep 28–Nov 10 | 17 |
| Previously described but unfinalized Henley proposal | 1, NOT an 18th settled deal |
| Historic original conversation probabilities excluded | 23 separate provisional records |

**Interpretation:** The October 31 fixed-cohort model **underperformed** a simplistic all-NO strategy on this selected pool. The 83 low-information probabilities tied to one subjective prior, selection bias, and uneven reporting quality limit calibration claims. This is not evidence of beating ESPN, NFL insiders, betting markets or the field.

### Fixed-cohort positive outcomes (8)

| Player | Oct 31 p | Official receiving club / date | Squared error |
|---|---:|---|---:|
| Josh Downs | 58% | Kansas City Chiefs, 2026-11-10 | 0.1764 |
| Amani Hooker | 11% | Buffalo Bills, 2026-11-10 | 0.7921 |
| Andre Cisco | 11% | Detroit Lions, 2026-11-09 | 0.7921 |
| Davon Godchaux | 11% | Jacksonville Jaguars, 2026-11-09 | 0.7921 |
| Jacoby Brissett | 11% | Baltimore Ravens, 2026-11-06 | 0.7921 |
| Jessie Bates III | 11% | Jacksonville Jaguars, 2026-11-09 | 0.7921 |
| Keenan Allen | 11% | San Francisco 49ers, 2026-11-10 | 0.7921 |
| Kirk Cousins | 14% | Minnesota Vikings, 2026-11-10 | 0.7396 |

**At a declared 50% YES threshold** this yields 1 true positive (Josh Downs), 3 false positives (Josh Uche 61%, A'Shawn Robinson 57%, Will McDonald IV 52%), 7 false negatives and 112 true negatives. This threshold analysis is descriptive; Brier is the primary probabilistic metric. **Missed coverage:** Jordan Davis and Ryan Neuzil are post-lock confirmed trades absent from the 123-player cohort, not additional denominator rows. Andrew Vorhees was reciprocal player consideration in the Neuzil agreement, not a separate transaction deal.

**Best correct NO cases:** Daron Payne 2% (0.0004 loss), Garrett Wilson 3% (0.0009), Moro Ojomo 4% and Adetomiwa Adebawore 4% (0.0016 each). Josh Downs 58% (0.1764) was the best correctly predicted positive. **Largest NO false alarms:** Josh Uche 61% (0.3721), A'Shawn Robinson 57% (0.3249), Will McDonald IV 52% (0.2704), Grover Stewart 49% (0.2401). **Biggest missed YES probabilities:** 11% for Hooker, Cisco, Godchaux, Brissett, Bates and Allen (0.7921 apiece), and 14% for Cousins (0.7396).

## 3. Complete NFL deadline-period settlement ledger

The [NFL in-season tracker](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) (last displayed update Nov 10) and [official November trade register](https://www.nfl.com/transactions/league/trades/2026/11) were reconciled against first-party team communications, including **post-deadline corrections**. These dates are NFL tracker/club announcement dates, which can differ from the league transaction register's posting date (Bates and Davis are November 9 club announcements, November 10 NFL registry lines). Dollar consideration is not asserted where unavailable.

| Date | Player | From → destination | Draft/player consideration and governing link |
|---|---|---|---|
| 2026-09-28 | J.J. McCarthy (pre-lock) | Minnesota Vikings → New York Giants | Minnesota receives 2027 fifth. [Source](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) |
| 2026-10-01 | Joey Porter Jr. (pre-lock) | Pittsburgh Steelers → Dallas Cowboys | Pittsburgh receives 2027 sixth and 2028 second. [Source](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) |
| 2026-10-07 | Cam Jurgens (pre-lock) | Philadelphia Eagles → Baltimore Ravens | Baltimore also receives 2027 seventh; Philadelphia receives 2027 fifth and 2028 second. [Source](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) |
| 2026-10-12 | Marvin Harrison Jr. (pre-lock) | Arizona Cardinals → Houston Texans | Houston also receives 2027 sixth; Arizona receives 2027 second and 2027 seventh. [Source](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) |
| 2026-10-27 | Quenton Nelson (pre-lock) | Indianapolis Colts → Seattle Seahawks | Indianapolis receives 2027 third and 2028 fifth. [Source](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) |
| 2026-10-27 | DeForest Buckner (pre-lock) | Indianapolis Colts → San Francisco 49ers | Indianapolis receives 2027 fourth. [Source](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) |
| 2026-10-29 | Jeffery Simmons (pre-lock) | Tennessee Titans → Chicago Bears | Chicago also receives 2028 fifth; Tennessee receives 2027 first, 2027 fourth and 2028 first. [Source](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) |
| 2026-11-06 | Jacoby Brissett | Arizona Cardinals → Baltimore Ravens | Baltimore also receives 2027 fifth; Arizona receives 2027 fourth and 2028 seventh. [Source](https://www.azcardinals.com/news/jacoby-brissett-trade-to-ravens-becomes-official) |
| 2026-11-09 | Jessie Bates III | Atlanta Falcons → Jacksonville Jaguars | Atlanta receives 2027 second and 2028 fifth. [Source](https://www.jaguars.com/news/roster-moves-jaguars-trade-for-s-jessie-bates-iii) |
| 2026-11-09 | Davon Godchaux | New Orleans Saints → Jacksonville Jaguars | New Orleans receives conditional 2028 sixth; reported converts to 2027 sixth if Jacksonville acquires one. [Source](https://www.jaguars.com/news/roster-moves-jaguars-trade-for-dt-davon-godchaux) |
| 2026-11-09 | Jordan Davis | Philadelphia Eagles → Jacksonville Jaguars | Philadelphia receives 2027 first and 2029 second. [Source](https://www.jaguars.com/news/roster-moves-jaguars-acquire-dt-jordan-davis) |
| 2026-11-09 | Andre Cisco | New York Jets → Detroit Lions | New York receives 2029 sixth (corrected by Jets Nov 11 from older 2028 sixth reporting). [Source](https://www.newyorkjets.com/news/garrett-wilson-omar-cooper-jr-limited-jets-practice-wednesday-bills-week-11-11-2026) |
| 2026-11-10 | Kirk Cousins | Las Vegas Raiders → Minnesota Vikings | Las Vegas receives 2027 third. [Source](https://www.vikings.com/news/kirk-cousins-reconnects-after-raiders-trade-2026) |
| 2026-11-10 | Keenan Allen | Indianapolis Colts → San Francisco 49ers | Indianapolis receives 2027 sixth. [Source](https://www.49ers.com/news/the-49ers-acquire-wr-keenan-allen) |
| 2026-11-10 | Amani Hooker | Tennessee Titans → Buffalo Bills | Buffalo also receives 2027 fifth; Tennessee receives 2027 second. [Source](https://www.buffalobills.com/news/bills-land-impact-safety-amani-hooker-in-trade-with-titans) |
| 2026-11-10 | Josh Downs | Indianapolis Colts → Kansas City Chiefs | Kansas City also receives 2027 seventh; Indianapolis receives 2027 fourth and 2027 fifth. [Source](https://www.chiefs.com/news/five-things-to-know-about-new-chiefs-wr-josh-downs) |
| 2026-11-10 | Ryan Neuzil | Atlanta Falcons → Baltimore Ravens | Atlanta receives Andrew Vorhees and reported 2028 sixth; conditionality mentioned by Ravens, exact condition undisclosed. [Source](https://www.baltimoreravens.com/news/ravens-trade-ryan-neuzil-andrew-vorhees-offensive-lineman-atlanta-falcons) |

**Corrections requiring special treatment:**

- **Daiyan Henley was NOT a settled trade.** The NFL November 10 tracker and transactions table still display LAC→DEN, yet Denver's definitive [Nov 11, 22:22 local first-party statement](https://www.denverbroncos.com/news/statement-from-the-broncos) says the proposal will not be finalized. Therefore `Daiyan Henley: y=0`, original forecast 11%, squared error 0.0121. The proposed 2027 fourth and 2028 fifth do not constitute completed draft compensation. The Broncos provided **no official reason**; do not claim a failed physical as a verified fact. Earlier roster record is superseded for **final settlement**, not silently erased.
- **Andre Cisco consideration corrected**: the Jets' [Nov 11 club report](https://www.newyorkjets.com/news/garrett-wilson-omar-cooper-jr-limited-jets-practice-wednesday-bills-week-11-11-2026) identifies the return as a **2029 sixth**, rather than the 2028 sixth still shown by older NFL/Detroit reporting. The transaction itself is completed; the draft-year field requires corrected source precedence.
- **Arnold Ebiketie to Cincinnati** was a reported proposal canceled on the deadline date, **not** a completed trade. See [NFL first-party accounting](https://www.nfl.com/news/bengals-call-off-trade-eagles-arnold-ebiketie-compensatory-pick). A purported conversation or tentative draft price is not a completed transaction.
- **Ryan Neuzil/Vorhees**: the [Ravens release](https://www.baltimoreravens.com/news/ravens-trade-ryan-neuzil-andrew-vorhees-offensive-lineman-atlanta-falcons) describes the additional 2028 sixth as reported conditional; details of any condition have not been authenticated. Do not multiply one exchange into two deals.
- **Davon Godchaux**: 2028 *conditional* sixth; ESPN-derived reporting indicates potential conversion to a 2027 sixth if Jacksonville acquires such a pick. The condition's eventual satisfaction is not established.
- **Contract/cap evidence**: Arizona's [official Brissett completion account](https://www.azcardinals.com/news/jacoby-brissett-trade-to-ravens-becomes-official) and prior attributed Field Yates reporting describe converting **$2.7M of $5.4M** remaining base into bonus before the anticipated trade; this does **not** certify Baltimore's final proration or Arizona's exact dead-cap bill. [Jacksonville's Jessie Bates announcement](https://www.jaguars.com/news/roster-moves-jaguars-trade-for-s-jessie-bates-iii) expressly says Atlanta restructured Bates' contract. Hooker's terms are discussed in the [Bills' team account](https://www.buffalobills.com/news/bills-land-impact-safety-amani-hooker-in-trade-with-titans); receiving-team cap impact is not fully certified. Other unpublished salaries/guarantees/cap effects remain **UNKNOWN**, not extrapolated.

## 4. Forecast version history (separate from fixed cohort)

**Jacoby Brissett** is a genuine tracked example of prospective **revisions**, not a pre-news discovery. The original Oct 31 fixed-cohort **11%** contributes one event loss `(0.11-1)^2=0.7921` to the 123-event score. A Nov 4 **96%** update was publicly committed at **20:45:50 UTC** ([commit 597f07f](https://github.com/AuroraGrid/kahrelum-os/commit/597f07fad1d0e810155f56732106299555989ead)), **after** Schefter/Rapoport finalizing reports cited by Baltimore's Nov 4 15:13 EST story but **before** the official Nov 6 completion. A Nov 5 **98%** revision ([commit effc5915](https://github.com/AuroraGrid/kahrelum-os/commit/effc59156994e1f9eec59406458e8bd794262f77)) was also pre-official-completion and post-further salary-conversion reporting. The Nov 9 [reconciliation commit cbeb30b](https://github.com/AuroraGrid/kahrelum-os/commit/cbeb30b4c74071b7a950d934d211172b93e980aa) corroborates this origin; it does not re-lock retroactively.

This illustrates different legitimate questions: **first public cohort skill** versus **skill updating after major national reporting**. 96% or 98% after an insider finalization report is not a discovery before the press. The updates must not be used to replace the initial p in the principal score or counted as extra completed trade events. Other research revisions (Downs, Taylor, Grover Stewart, Tyson Bagent) remain append-only and are not selectively cherry-picked into this fixed-cutoff score.

## 5. Comparable ESPN/Fowler-Bowen numerical estimates (restricted)

The [Oct 29, 2026 original ESPN/Fowler-Bowen top-25 syndication](https://abc7news.com/post/2026-nfl-trade-deadline-ranking-top-25-candidates-move-team-fits/19989132/) explicitly publishes likelihood percentages and notes its **ranking order** is by value to a buying team, not trade likelihood. The historical KAHRELUM board preserves 25 per-player ESPN percentages. On the **same 25 named subjects and final outcomes**, KAHRELUM Oct 31 fixed cohort yields indicative Brier **0.094488**, ESPN's Oct 29 published numbers **0.121200**, and all-NO **0.080000**. Both sets identify 2 eventual trades in those 25 (Josh Downs and Kirk Cousins). **This is NOT a like-for-like skill win**: snapshots are at different original publication times and KAHRELUM had two extra days of information; the 25-player subset is selected; KAHRELUM's 123-player overall score is not comparable with a 25-only ESPN denominator. Do not use journalist market inquiries as binary completed-trade forecasts or claim an insider 'accuracy ranking'.

## 6. Post-deadline classification and custody gates

**Resolved 123 fixed-cohort forecasts** in companion JSON, all 123 have positive/negative outcome, exact original p and squared error. **Unscorable older proposals**: 20 conversation-recovered values lacking pre-trade independently authenticated original times, plus historical Marvin Harrison Jr 49%, Quenton Nelson 39%, and DeForest Buckner 68% event estimates; Jeffery Simmons has no authentic numeric pre-trade forecast located. Never rehabilitate old retrospective numbers with the Oct 30 board's `asOf` label. Jack Jones was a documented pre-lock released-player eligibility exclusion, not a scored 0% forecast.

**Reporter integrity is separate**: an accurate report that teams called, asked a price, or explored a trade may remain correct even when the player did not move; no unsupported accuracy percentages for Fowler, Schefter, Rapoport or other reporters.

**Current publishing boundary**: these two new append-only research files are committed to GitHub with explicit URLs and can be cited. The existing `nfl/deadline-audit.json`, `nfl/forecast-ledger.json`, and `nfl/trade-board.json` were NOT rewritten. The old public site may still show `DEADLINE_WINDOW_OPEN` or a pre-deadline `FRESH` feed. **Do not claim the live Firebase site has been corrected or archived until an independent guarded-preview promotion and production readback occur after editorial review.** No roster, betting, email, subscription or payment action.

**Limitations:** league transaction listings can lag or retain withdrawn entries; later first-party club corrections govern status. This is full coverage of the league tracker and recovered first-party references at the audit cutoff, not a guarantee no later retroactive correction appears. Conditional compensation and real cap allocation need subsequent receipts. No independent external timestamp notarization for the GitHub locks. Scores are reproducible, but this particular self-selected cohort has no demonstrated external calibration history.
