# KAHRELUM NFL 2026: retrospective replay METHOD LOCK v1.0
Freeze date: **2026-11-02 UTC** (GitHub commit timestamp is authoritative).
Status: **RESEARCH ONLY / NO BET CERTIFICATION / NO BACKDATED PRE-KICKOFF LOCKS**.

## Immutable evidence boundaries
- Preserve the existing 2026 Week 8 file `KAHRELUM_NFL_W8_WIN_FORECASTS_20261101.csv` and its 13 forecast rows unchanged. Grade 12 Sunday finals; Monday CHI@SEA remains PENDING at this capture.
- Recover the separate 2026 Week 4 captured pregame shadow board from the authorized Oct 4 Windows archive `Codex/2026-10-04/referenced-chatgpt-conversation-this-is-an/outputs`. The later Oct 5 grading includes 14 Sunday finals, 10-4, with ATL@NO pending. Official Oct 5 final ATL 45–NO 24 makes that board 10-5. Pittsburgh–Cleveland Thursday was not in that 15-pick board.
- Week 4 is a different research engine/cohort from the November 1 Week 8 ensemble; descriptive combined 20-7 is **not** a single-model season score.
- Preserve the historical `KAHRELUM_Numerical_Engine_v0.1_Research_Package.zip` from the Oct 4 Windows archive. The 2016–2025 fit is PROPOSED, BLACKGLASS FAIL PROMOTION, NOT ACTIVE. Its 2023–2025 816-game test had moneyline Brier 0.2257185 and ATS Brier 0.2666814; it is **not** a verified 2026 model record.

## Frozen 2026 replay design (run only if inputs available)
1. Treat this as a **new retrospective re-execution**, never as a forecast that was originally issued in September. Lock method first, before generating result tables. Do not refit/tune based on 2026 outcomes.
2. Reuse the original Oct 4 v0.1 `artifacts/fitted_model.json`, stored coefficients, standardization, feature order, and fixed OOS paired residual reference. This historical package was fitted on games through 2025, but created Oct 4 after 2026 Weeks 1–3: strictly prospective timestamp claim therefore **not available for those weeks**.
3. Fetch 2026 NFL regular season nflverse PBP and updated game schedule; save exact byte SHA-256, capture datetime, source URLs, and row counts. Public nflverse historical/current vintages can be revised: **point-in-time source vintage not certified**. If the PBP or 2025 package is unavailable, halt scoring rather than synthesize feature values.
4. For each 2026 game with a completed official score strictly **before the user's Nov 2, 2026, 8:15 p.m. ET Monday kickoff**, calculate feature vector from that team's 2025 stats and only its own *prior completed* 2026 games. Generate a probability before joining the game's final-score columns. Score after predictions are materialized and hashed. No market line or bookmaker quote enters the football model.
5. Fixed 2025 training models: two separately regularized ridge targets (home margin and total). Home win probability from empirical paired-residual distribution from OOS 2021–2025, centered. Continuous model does not handle tied games / discrete score pushes, so no ATS betting certification. Source feature recency, player roster, injuries, and weather are not verified point-in-time.
6. Record week, kickoff, game_id, away/home teams, predicted home and pick probabilities, projected margin/total, actual winner/score, Brier, cohort and provenance. Exclude ties from two-way directional hit rate and Brier, but retain rows. Exclude future/unplayed games. Count missing games honestly.
7. Separately compare to matched no-vig two-sided market probabilities only when both timestamps/quotes are identifiable; otherwise report market favorite benchmark only, not pointwise paired Brier.
8. Betting: **0 actual bets; no authorized tickets**. Do not impute historical -110 or claim bankable EV, CLV, stake, or ROI without the exact book/time/line. Straight bets only; per-price break-even >50% as appropriate; never mix win probability with ATS-cover probability.
9. Preserve original records untouched, append correction files rather than editing historical snapshots. Freeze output manifests with SHA-256. An analytical GitHub commit captures files NOW; it cannot retroactively timestamp past forecasts.
10. Do not change the main branch, Firebase production, Cloudflare production, six Grok bots, or ongoing workstation missions. Work on this isolated research branch, preserve the Dell/ThinkPad missions.

## Known evidence sources
- Public official Week 4 final: https://www.nfl.com/schedules/2026/by-week/week-4 (ATL 45, NO 24 on Oct 5).
- Official Week 8 slate: https://www.nfl.com/schedules/2026/by-week/week-8.
- 2026 PBP: https://github.com/nflverse/nflverse-data/releases/download/pbp/play_by_play_2026.parquet
- Game manifest: https://raw.githubusercontent.com/nflverse/nfldata/master/data/games.csv
- NFLverse data latency: https://nflreadr.nflverse.com/articles/nflverse_data_schedule.html
- Canonical KAHRELUM project: https://github.com/AuroraGrid/kahrelum-os

## Admission classes
- **ORIGINAL_PREGAME_LOCALLY_RECOVERED**: prior record with its original text/version and established pregame origin; independent trusted timestamp may still be absent.
- **RETROSPECTIVE_MODEL_REPLAY**: coefficients fixed on earlier years; features recomputed later with prior-game cutoff; NOT a previously issued forecast.
- **MARKET_BASELINE_ONLY**: not a KAHRELUM prediction.
- **OUTCOME_UNKNOWN**: scheduled, no result as of capture.
- **MISSING_SOURCE**: no fabricated row or success.

Nothing in this research package promotes v0.1, creates Snapshot 1, approves a bet, or overwrites historical Record Locks.
