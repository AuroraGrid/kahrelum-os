# Trade Forecast and Reporter Accountability Protocol · v0.1

**Established October 30, 2026.** Public evidence-to-decision standards, not independently validated statistical superiority.

## Two separately testable systems

**Reporter claim integrity** judges the *actual published proposition* and evidence, not whether a trade subsequently occurs:

1. **Confirmed transaction:** NFL/team official transaction/press release.
2. **Official player/team remark:** directly attributable video, audio, quote and date; separately note when originally inaccessible and only cited by a reporter.
3. **Original sourced report:** identified reporter specifically reports inquiry, ask, contract constraint, or team stance. Claim can be accurate without any eventual transaction.
4. **Corroboration/secondary:** one report repeats another; never two independent sources unless independent access is established.
5. **Analyst scenario / radio opinion:** a potential fit or prediction; not evidence of a call.
6. **Unverified / contradicted:** original inaccessible or sources diverge. Preserve both and state uncertainty.

Journalists are not scored as forecasting misses merely because an accurately reported exploratory inquiry did not become a completed trade. Reporter performance needs defined scoring rules, source timestamp, verification standard, and adequate sample size. No ungrounded "Schefter is 96% accurate" ranking.

**KAHRELUM binary forecasts** judge:

> "Will [player identity] be officially traded to another NFL club between [prospective public lock timestamp] and Tuesday November 10, 2026, 4:00 p.m. EST?"

Only trade completion under the league's announced deadline counts as YES. Completed trades before a forecast is published are ineligible. A release, signing, extension, a report of interest, a requested trade, or an invalidated proposal is not a YES. Source cutoff and market timeline remain separate.

## Authenticity and frozen locks

For each eligible forecast, record (a) identity and precise question, (b) \`p\` as decimal 0..1, (c) first public commit timestamp + immutable commit SHA/URL + exact data bytes, (d) information cutoff in ISO 8601 with timezone, (e) evidence chain and known counterevidence, (f) prospective outcome and (g) final official source. GitHub commits establish publication history **from that commit forward**; they cannot verify earlier private chat dates. External independent time anchoring is an optional improvement, not currently implemented.

After a new report, open a *new version* for a revised estimate: original p and cutoff remain unchanged. Changes of ≥5 percentage points are normally alert material; smaller changes can be logged for source custody without a notification. New candidate scores must be labeled new, never misleading deltas.

## Historical custody exclusions

The following pre-deadline trade estimates were recovered from conversation summaries but **original creation timestamps are NOT independently confirmed**:

| Player | Recalled p | Reported trade date | Custody |
|---|---:|---|---|
| Marvin Harrison Jr. | 49% | 2026-10-12 | EXCLUDED pending proof |
| Quenton Nelson | 39% | 2026-10-27 | EXCLUDED pending proof |
| DeForest Buckner | 68% | 2026-10-27 | EXCLUDED: same-day event ordering unverified |
| Jeffery Simmons | N/A | 2026-10-29 | EXCLUDED: no authentic forecast located |

There is **no certified KAHRELUM NFL Brier score**, no authenticated record of "winning" three of these events, and no proven superiority over national reporters, ESPN, sportsbooks or prediction markets. The older 0.2449 figure is provisional and not a replacement for certified scoring.

The 20 October 30 \`kahrelumProbability\` values in [trade-board.json](../../nfl/trade-board.json) were recovered as *provisional*, and published for transparent tracking, not as proof of earlier private timestamps. On public release, that GitHub commit itself can serve as the earliest verified public timestamp for *still unresolved* events, if the dataset is independently confirmed free from earlier completions; public launch time takes precedence over a historical "asOf" research label.

## Calibration

For each independent eligible binary event i, outcome y ∈ {0,1} and pre-event p:

\`Brier = mean((p_i - y_i)^2)\`

Report score for all preregistered eligible subjects, NOT just completed trades. Distinguish one forecast per event at a chosen fixed cutoff from rolling forecast versions; never count updates as independent wins. Provide baseline comparisons (e.g., naive all-NO, flat historical market rate) and only compare ESPN model estimates if their definitions and timestamps match. Market prices (Polymarket/Kalshi) are not ESPN probabilities or KAHRELUM forecasts and may require fees, liquidity and settlement-rule alignment.

Holdouts, coverage, selection bias and publication survivorship must be disclosed. Without an independently verifiable eligible cohort, display **Brier: N/A**.

## Information controls

- Contracts/salaries/cap obligations require current contract figures and correct treatment of guarantees, restructures, bonuses and roster timing. Unknown cap terms must show UNKNOWN.
- Avoid personal rumor sources or unverified agent anecdotes. Never disclose private contact details or confidential records.
- Retain correction receipts and links; do not silently modify prior event predictions.
- Do not authorize NFL/fantasy roster activity from this research desk.
