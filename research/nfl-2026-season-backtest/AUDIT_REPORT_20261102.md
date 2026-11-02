# KAHRELUM NFL 2026 YTD REPLAY — LOCKED AUDIT
**Cutoff:** 2026-11-02 before CHI at SEA kickoff (20:15 America/New_York).  
**Method freeze:** [26f0234ae97a6d40b4d4b48d7c9bb1e9945736c3](https://github.com/AuroraGrid/kahrelum-os/commit/26f0234ae97a6d40b4d4b48d7c9bb1e9945736c3)  
**Computation capture:** 2026-11-02T22:08:45.857956+00:00.  
**Status:** RETROSPECTIVE RE-EXECUTION / RESEARCH ONLY / ZERO ACTUAL WAGERS.

## 2026 native v0.1 research replay, NOT historical issued picks

The original KAHRELUM numerical-engine v0.1 was trained on results through 2025 and fitted by October 4, 2026. It was NOT active or promoted, and the original coefficients were only packaged after the 2026 season had started. On November 2 we recovered the original research package and **applied its unchanged coefficients and historical out-of-sample residual bank** to all settled 2026 games through November 1, calculating each team's features only from 2025 plus completed prior 2026 games. The feature/pick file was SHA-frozen **before** final score/market columns were merged into its graded results. This does not turn those replayed probabilities into historical original forecast locks.

| 2026 week | Model wins | Model losses | Ties | Pick rate (decisive) | Model Brier | Market-favorite wins / priced decisive |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 6 | 10 | 0 | 37.50% | 0.264768 | 12/16 |
| 2 | 9 | 7 | 0 | 56.25% | 0.258822 | 11/16 |
| 3 | 10 | 6 | 0 | 62.50% | 0.232892 | 9/16 |
| 4 | 12 | 4 | 0 | 75.00% | 0.179747 | 9/16 |
| 5 | 9 | 5 | 1 | 64.29% | 0.220345 | 9/14 |
| 6 | 8 | 6 | 0 | 57.14% | 0.279419 | 7/14 |
| 7 | 9 | 5 | 0 | 64.29% | 0.244480 | 10/14 |
| 8 | 11 | 2 | 0 | 84.62% | 0.149375 | 11/13 |
| **TOTAL** | **74** | **45** | **1** | **62.18%** | **0.229756** | **78/119 (65.55%)** |

The matched no-vig probability comparator from the **current** nflverse games.csv archival market fields has Brier **0.225903** on 119 decisive games, better by 0.003853. These archived price fields are not established as independently witnessed, actionable pregame tickets. The comparator here is one current-source vintage; it differs from an earlier Covers retrospective favorite count and is **not** a verified closing-line comparison. Do not describe the 74–45–1 result as live KAHRELUM performance.

The complete 121-row *prediction* file (120 settled and one future Monday game) and 120-game *graded* file are adjacent. File hashes are in the manifest. Do not fabricate market or betting P/L from them.

## Separate ORIGINAL locally recovered forecasts (different engines/cohorts)

- **Week 4 local Oct 4 pregame shadow board:** 15 selected games, **10 correct / 5 wrong** when the previously pending Monday ATL at NO is graded as ATL 45, NO 24. The board predicted NO with 57.8963%; original partial archive on Oct 5 had 10–4 with this outcome pending. The Thursday PIT–CLE game was not included. `W04_RECOVERED_SHADOW_RECONCILIATION.csv` preserves the old rows and appends this official final. Earlier captured lines are not independently cryptographically timestamped by a third party.
- **Week 8 Nov 1 frozen 13-game board:** 12 Sunday games resolved, **10 correct / 2 wrong**; CHI at SEA pending. The Nov 1 board picked SEA at 61.42% and projected SEA 25–CHI 21.
- Those two original-pick cohorts sum descriptively to **20–7 (74.07%)**, but are not a uniform model, prospective betting card, or a valid 2026 full-season KAHRELUM win rate. Do **not** add them to the 74–45–1 replay; games overlap and the methodology differs.

## Upcoming CHI at SEA, Monday Nov 2

The **new research-only v0.1 replay** calculated Seattle **59.897%**, expected Seattle home margin **+3.403**, and expected combined total **44.767** using only completed games before MNF. This was separately saved before kickoff and must be graded **after** the official final. It is distinct from the original Week 8 SEA 61.42% freeze. Neither alone certifies a bet.

## Blackglass / risk controls

1. **No hindsight promotion:** v0.1 was previously rejected (2016–2025 backtest ATS Brier 0.266681 vs 0.25 constant probability, invalid discrete push/tie and point-in-time data vintage caveats). This 2026 research result does not reverse that decision.
2. **Upstream source-vintage leakage risk:** the 2026 PBP and schedule were downloaded November 2, after most games occurred. Game-level lagging is enforced in the code; historical as-of PBP model vintage is not established, so strict truly prospective score is **NOT CERTIFIED**.
3. **Bets:** no bets placed, no sportsbook authorization, no spreads selected from the native model. **$0 actual stakes.** No fabricated ROI/CLV/executable odds, no parlays.
4. **Auditability:** Original Oct 4 research ZIP SHA-256 `1f6f1c7ac3c7e1271a99d788a690287737bc6ee185d1c2f1b0a7dea682aff3ce`; 2026 schedule SHA-256 `b34511fa8aa98cab274cd41f86a33b82a3d7cbb555283befb6b41c8e1c421470`; 2026 PBP SHA-256 `8be07cb449d8996e69584339af9b8a504ba433921e189ed4c768a67d739423cb`. Market-blind prediction file SHA-256 `c40b2b3db5de07cf119e8b933b853dd8aa40c70aa50c8f3ec4802d3e63cee8a5`; graded file SHA-256 `fa6b7fe34e3695072bcb033f7eb4e7afbafc456cad007b5d455dfe018aeaba33`. If repository-side text normalizes final newlines, prefer the Git blob SHA as published content integrity proof; the manifest hashes identify the separately captured Windows originals.
5. **Testing:** five Python unit tests for prior-data shrinkage, null-handling, Brier and excluded future games passed. An independent readback confirmed 121 prediction rows, 120 graded rows, eight weekly results, original Week 4 board reconciled to 10–5.
6. **Non-interference:** all files are new on the isolated research branch. The canonical `main` branch, Firebase/Cloudflare sites, Dell setup, original v0.1 ZIP, Week4 original archive and Week8 original Library file remain unmodified.

## Source links
- Official NFL Week 4: https://www.nfl.com/schedules/2026/by-week/week-4
- Official NFL Week 8: https://www.nfl.com/schedules/2026/by-week/week-8
- nflverse PBP: https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.parquet
- nflverse schedule: https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv
- nflverse data timing: https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html
