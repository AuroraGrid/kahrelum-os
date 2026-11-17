# KAHRELUM | NFL 2026 Trade-Volume Calibration | Research-only v0.1

**As-of source-check window:** November 9, 2026, 16:10:30 UTC (11:10:30 EST).
**Status:** Research-only. **NO KAHRELUM trade-volume forecast, probability distribution, or prospective prediction lock exists.**

## Official deadline and count definition

The [NFL's 2026 official dates](https://www.nfl.com/news/2026-27-national-football-league-important-dates) establish **Tuesday, November 10, 2026, 4:00 p.m. New York time = 21:00 UTC**.

Count **unique player-involving NFL trade transactions** completed from the start of the 2026 regular season on September 9 through the official deadline. One deal involving multiple players and draft picks is **one trade**. Exclude inquiries, offers, unsigned agreements, waivers, free-agent signings, extensions and offseason deals.

Preserve three distinct observations: first insider report, official completion/club announcement, and league transaction-posting date. A report is not the same as a completed trade. Never infer clock-time order from calendar dates alone.

As of this frozen check, the [NFL in-season tracker](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season) lists **eight** trades through [Brissett on Nov. 6](https://www.baltimoreravens.com/news/jacoby-brissett-ravens-trade-cardinals-finalize-2026). The November 9 [NFL Bates article](https://www.nfl.com/news/jessie-bates-jaguars-falcons-trade) and [AP account](https://www.foxsports.com/articles/nfl/falcons-agree-to-trade-veteran-safety-jessie-bates-iii-to-jaguars-for-2-draft-picks-ap-source-says) report an agreement; AP says the teams had not announced it at publication. Bates stays in a separate reported-only lane until new club/league completion evidence is inspected. A later official confirmation would be a new version, not a retroactive change to this source snapshot.

## Historical count baseline

| Season | Trades | Official-source note |
|---|---:|---|
| 2023 | 15 | [NFL season tracker](https://www.nfl.com/news/nfl-trade-deadline-tracking-every-move-since-start-of-the-2023-regular-season), Week 8 deadline |
| 2024 | 18 | [NFL explicit 18-trade, 19-player statement](https://www.nfl.com/news/2024-nfl-trade-deadline-who-are-the-biggest-winners-and-losers), Week 9 deadline |
| 2025 | 22 | [22 deal entries in NFL tracker](https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2025-regular-season), Week 9 deadline |

**Discrepancies:** The [NFL 2023 tracker](https://www.nfl.com/news/nfl-trade-deadline-tracking-every-move-since-start-of-the-2023-regular-season) calls two Oct. 30 deals reported while the [league October transaction ledger](https://www.nfl.com/transactions/league/trades/2023/10) records them Oct. 31. An [independent statistical reconstruction](https://nflanalytic.com/explainer-nfl-trade-deadline-2026.html) counts **21** deals for 2025, while the official NFL tracker has **22 entries**. These differences require deal-level reconciliation before any late-day hazard fitting. Never average conflicting methodologies to conceal a disagreement. Three historical seasons are underpowered for a trustworthy count-distribution tail.

## Insider statements and comparability

| Source | Reported count | Dated counting window / custody |
|---|---|---|
| **Schefter, Oct. 26** | 10+ further trades | [Pat McAfee Show interview as dated and quoted by Bleacher Report](https://bleacherreport.com/articles/25520820-adam-schefter-predicts-double-digit-trades-nfl-deadline-amid-buzz-jonathan-taylor-more): Oct. 26 to deadline, original exact minute still unverified |
| **Schultz, Oct. 26** | 12 to 20 | [The Pivot remarks, quoted Oct. 26](https://www.bleachernation.com/bears/2026/10/26/bears-trade-rumors/): whether he meant season total or future deals is unresolved, so do not normalize |
| **Wolfe, Nov. 3** | 10+ further trades | [ESPN article, accessible mirror](https://newsespn.pages.dev/nfl/story/_/id/50349677/trade-deadline-rise-quiet-chaotic-more-deals-2026): reporting executives' expectations for Nov. 3 through deadline, not necessarily Wolfe's independent model |
| **Pelissero** | User-reported 8 to 10 | Original dated quote/window not recovered; his [Nov. 7 newsletter](https://tompelissero.substack.com/p/six-biggest-questions-before-nfl-trade-deadline-jonathan-taylor-kirk-cousins) observes eight **already completed** trades, which is not a future-activity forecast |
| **La Canfora, Nov. 2** | 3 to 4 | [Colts-only subsequent deals](https://www.casino.org/news/nfl-insider-jason-la-canfora-colts-eye-3-4-more-trades-seek-second-round-pick-for-jonathan-taylor/), not a leaguewide trade-count estimate |

The Oct. 12 Schefter roughly-ten-more statement is kept as an unverified third-party transcript, not an authenticated hard numerical interval. Syndications of one show appearance are **not independent observations**. Rapoport, Breer, Glazer, Fowler, Graziano, Russini, Garafolo, Schrager, Jonathan Jones, Charles Robinson and Meirov add useful player-specific coverage, but without dated quantitative leaguewide calls they are **not scored as zero-trade forecasts**.

ESPN's [Fowler/Bowen 25-player trade percentages](https://www.espn.com/nfl/story/_/id/50278445/2026-nfl-trade-deadline-ranking-top-25-candidates-available) are player-event probabilities, not a probability distribution for distinct leaguewide transactions. Avoid counting mutually related moves twice or assuming unlisted player probabilities are zero.

## Deterministic audit engine, not a KAHRELUM forecast

- The dated JSON source ledger preserves all input numbers, source URLs, event states, provenance, caveats, and explicit null KAHRELUM forecast/lock fields.
- The Node script validates the deadline, source windows and uniqueness, then computes historical leave-one-year-out error as a **sanity check**, not a present-year forecast.
- An insider with a clear claim of at least N additional trades can have its original threshold adjusted by the number of NFL-listed trades strictly after the claim's calendar date. This is **only an arithmetic hurdle for that insider's own claim**.
- Claims lacking original window or source provenance are excluded. Same-day events with unknown exact timestamps block date-only alignment.
- Scoring against outcomes is refused until after official deadline close and reconciliation. Interval coverage is **not** a proper probability score; any future independently locked KAHRELUM integer distribution needs a predeclared proper score, such as ranked probability score, and a benchmark.

Run Node tests and the read-only research report from repository root:

    node --test tests/nfl-trade-volume-calibration.test.cjs
    node scripts/nfl-trade-volume-calibration.cjs

Neither command calls the network, publishes to Firebase, changes the website, edits existing player forecasts, or issues a new forecast.

## Gates before any independent trade-volume prediction

1. Recover Pelissero's original numerical quote, timestamp and target horizon.
2. Recheck Bates from an official announcement and reconcile the complete NFL tracker.
3. Resolve the 2025 21-vs-22 dispute and report-versus-transaction timing in 2023.
4. Backfill aligned historical event-level dates and establish fixed evaluation cutoffs.
5. Preserve original insider statements and prevent later information leaking into earlier benchmarks.
6. Seek explicit authorization to issue and timestamp-lock a new KAHRELUM 2026 volume forecast. Until then **forecast remains null**.

**Forecast custody boundary:** The original [Nov. 4 Brissett 96% commit](https://github.com/AuroraGrid/kahrelum-os/commit/597f07fad1d0e810155f56732106299555989ead) and the [Nov. 9 correction audit](https://github.com/AuroraGrid/kahrelum-os/commit/cbeb30b4c74071b7a950d934d211172b93e980aa) remain untouched. Player-specific success does not itself provide an aggregate trade-count forecast.
