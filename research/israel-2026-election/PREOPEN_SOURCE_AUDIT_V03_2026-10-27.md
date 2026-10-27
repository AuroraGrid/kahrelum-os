# KAHRELUM OS | Pre-opening reproducible source-audit software v0.3
**Case ID:** KAH-IL26-PROSPECTIVE-001  
**New version identity:** KAH-IL26-AUDIT-v0.3  
**Observed local clock:** 2026-10-27 05:41:37 PKT (2026-10-27 00:41:37 UTC), ordinary session clock; no independently signed time proof.  
**2026 poll-data cutoff:** October 23, 2026, published poll snapshots, before normal election-day polling.  
**Stage:** SUPPLEMENTAL technical source audit, **not** C1 (registered C1 09:30 PKT), **not** an election-outcome prediction.  
**Case:** LIVE / UNRESOLVED / NOT SCORED. This does not imply 2026 official results were known or frozen v2.3.4 runtime executed.

## Mission boundary and what was actually completed

A separately written Python v0.3 source-audit component was executed against nine previously recorded October 22–23 publisher/aggregator seat-map snapshots. It validates party-map completeness and 120 seats, identifies shared pollster origins, computes differences and descriptive ranges, preserves missing vs zero, and tests official-result / valid-vote milestone fail-closed gates. It is an **independent KAHRELUM analytical implementation**, but does **not** generate independent election-outcome probabilities or a proprietary party/winner prediction. No result of an external model is relabeled as proprietary.

The previous owner's historical package v0.2 was kept as-is and incorporated into new v0.3 owner's bundle. It had exact vote-to-seat reconstructions for 2015, April 2019, September 2019, 2020, 2021, 2022: **61 represented list allocations**, zero seat-reconstruction mismatch, each of six known actual 120-seat maps. The 18 prior archived poll-seat comparisons are **retrospective, selected third-party snapshots with unverified original publication timestamps**; this is neither an original pre-election forecast nor an independently established forecast backtest.

The combined executed v0.3 software has **53 / 53 Python unittest tests passing** (33 inherited, 20 new). New gates cover duplicate poll sources, incomplete list maps, boolean/null-as-count, source-group reuse, 120-seat invariants, missing candidate-list identity, premature gold-results capture, valid-vote denominators and the difference between a threshold first observed at 39% vs an invented exactly-25% observation.

## Observed published-seat range by reported list

**Do not read these as KAHRELUM forecasts or probabilities.** Numbers are ranges of actually published October 22–23 seat-map measurements, not statistical uncertainty intervals. The right-most column is the number of reports awarding four or more seats to the list divided by reports supplying a figure. Nine outlets are neither an independent random sample nor nine independent methodological draws. Each row is one list with its top-ranked candidate or documented leader; components such as Yesh Atid and Zehut are not extra competing ballot lists.

| Ballot | Published list | Leader / list head | Seats across published seat maps | % of 120-seat house | Reporting surveys allocating 4+ seats |
| --- | --- | --- | ---: | ---: | ---: |
| מחל | Likud | Benjamin Netanyahu | 17–30 | 14.17–25.00% | 9 of 9 |
| דרך | Yashar | Gadi Eisenkot | 20–23 | 16.67–19.17% | 9 of 9 |
| רק | Together (B'Yachad) | Naftali Bennett; Yair Lapid component | 11–15 | 9.17–12.50% | 9 of 9 |
| אמת | Democrats | Yair Golan | 8–10 | 6.67–8.33% | 9 of 9 |
| ודם | Joint List | Yousef Jabareen, list head | 8–9 | 6.67–7.50% | 9 of 9 |
| ב | Otzma Yehudit | Itamar Ben-Gvir | 7–9 | 5.83–7.50% | 9 of 9 |
| שס | Shas | Aryeh Deri | 7–9 | 5.83–7.50% | 9 of 9 |
| ג | United Torah Judaism | Yaakov Asher, list head | 7–8 | 5.83–6.67% | 9 of 9 |
| ל | Yisrael Beiteinu | Avigdor Lieberman | 5–9 | 4.17–7.50% | 9 of 9 |
| ט | Religious Zionism–Zehut | Bezalel Smotrich; Moshe Feiglin component | 6–8 | 5.00–6.67% | 9 of 9 |
| עם | Ra'am | Mansour Abbas | 5–7 | 4.17–5.83% | 9 of 9 |
| די | Reservists–Economic | Yoaz Hendel; Yaron Zelekha component | 0–4 | 0–3.33% | **5 of 9** |
| ך | Amcha Yisrael | Ofer Winter | 0–4 | 0–3.33% | **2 of 7 reported** |

**Meaning of 5/9, 2/7:** number of these surveys allocating parliamentary seats, not probability of winning seats. 0 published seats is NOT zero voter support; unreported/null values are not silently changed to zero. For the complete 37 active-list / one-withdrawn-list reference see the [dated ballot registry](./PARTIES_AND_LEADERS_2026-10-27T20261026T234042Z.md); other minor lists were not assigned fabricated numbers.

## Published survey bloc-map comparison, not a proprietary model output

Blocs are descriptive categories formed from the published seat maps: five outgoing government parties, four established change parties, two Arab parties, and two separately reported minor lists. These categories do **not** establish who can form a government.

| Survey | Outgoing five | Four change parties | Arab lists | Reservists / Amcha / others |
| --- | ---: | ---: | ---: | ---: |
| Kan 11, Oct 23 | 50 | 52 | 14 | 4 (partial Amcha field) |
| Channel 12, Oct 23 | 50 | 56 | 14 | 0 |
| Channel 13, Oct 23 | 50 | 54 | 16 | 0 |
| i24NEWS, Oct 22 | 55 | 47 | 14 | 4 |
| Channel 14, Oct 22 | 62 | 44 | 14 | 0 |
| Israel Hayom, Oct 22 | 50 | 52 | 14 | 4 (partial Amcha field) |
| Maariv, Oct 22 | 48 | 54 | 14 | 4 |
| Channel 16 / 103FM, Oct 22 | 48 | 50 | 14 | 8 |
| Zman Yisrael, Oct 22 | 51 | 51 | 14 | 4 |

The Channel 12 and Channel 13 vectors disagree by **five redistributed seats** (L1=10) while both sum to 120. Kan records an unreported Amcha value in the stored upstream poll archive, so v0.3 intentionally declines to claim an exact fully comparable Channel12–Kan / Channel13–Kan distance without an explicit source-supported zero crosswalk. This is a more cautious treatment than prior summaries that implicitly filled the missing data.

## SOURCEGRID / contradiction, model limitations and falsifiers

- **Channel 12 original:** https://www.mako.co.il/news-israel-elections/2026/Article-8ea5e45ec2961a1027.htm . October 23 published 21:18 and updated October 24 00:24 as printed; fieldwork Oct 22–23, n=1,018. First-party publisher page was directly read.
- **Channel 13 original:** https://13tv.co.il/item/news/politics/politics/survey-905415900/?pid=98577 . Published October 23 21:10 as printed, n=1,875 reported. First-party publisher page directly read.
- **Kan 11:** https://www.kan.org.il/content/kan-news/politic/1112122/ . Direct body not independently captured here; secondary corroboration in Times of Israel (https://www.timesofisrael.com/final-polls-before-election-show-both-blocs-short-of-majority-small-parties-out-of-knesset/). Reported sample metadata conflicts (1,006 vs 1,106); not resolved.
- **Other 2026 survey vectors:** https://israelielections.com/2026/polls/ . Original publisher pages not all directly read; no false claim of independent source authentication.
- **Overlap:** Kantar appears at Kan and Israel Hayom; Shlomo Filber/Direct Polls across Channel 14 and i24NEWS. Pollster dependence prevents treating each outlet as a statistically independent replication. Channel 14's divergent outgoing-bloc map is retained rather than suppressed.
- **Published external quantitative model:** https://www.israelielection.org/forecast . **EXTERNAL COMPARATOR ONLY**, method not independently rerun and output not adopted as KAHRELUM's.
- **Schedule:** Reuters October 27 official-election explainer: https://www.reuters.com/world/middle-east/israel-election-what-happens-after-polls-close-2026-10-27/ . Election 27 Oct, normal main poll open 07:00 Israel (10:00 Pakistan), close 22:00 Israel (01:00 Pakistan Oct 28), official publication targeted November 4. Full CEC direct read remained limited in prior evidence.
- **Publication blackout:** Since Saturday October 24, no new poll publications are allowed before exit polls at close, per Times of Israel. No newly created KAHRELUM 2026 party-seat outcome numbers have been inserted to fill this gap.

## Owner-only reproducibility and freeze

- Owner deliverable: `KAHRELUM_Israel_Audit_v0_3_FROZEN.zip` (**not** pushed as public executable source).
- ZIP bytes: **46,525**, SHA-256: `f1daa6baf0a3e5bbcc2c4eed0ed992b0a48c1231806df9303bb6f090cfe0436a`.
- 28 files, 27 per-file SHA-256 manifest entries; ZIP CRC and each SHA-256 member verified.
- Python script `poll_measurement_v03.py` SHA-256: `15746d99a77eeff7aa2ae024a7bf1abb7b3c0b0c4af2f33aa973d8ce02a0bafe`.
- Post-result fail-closed scorer `future_score_v03.py` SHA-256: `c1cb4adbe61dc738677c374f338b940c575a46bff7c9df91d00d10b54bc57fd6`.
- Full audit JSON SHA-256: `a5fd96e8f19934bc2c82237bcadaedd2df0939fa5d84d4d65fb1fad219419e26`.
- Public human-readable audit markdown SHA-256: `d85d07188e99be135da921dc3c934ebed23b02fbf23fe6c393d339cf36d5277e`.
- SHA-256 manifest SHA-256: `0c28563e467e5a516e77381c2cba6561ec376fc9879164add53b660137bd3bf1`.
- The first-party sources are cited with retrieval classification; this hash inventory does NOT seal raw website bytes or attest signed wall-clock time.

## MCRI / RECORD LOCK disposition

**COMPLETE:** own auditable calculation software, exact mechanical historical six-election reconstructions, descriptive nine-poll comparisons, 53 passing automated tests, input-source documentation, party leader registry reference, milestone denominator gates, future officially sourced scoring routines, owner ZIP freeze.

**NOT SATISFIED:** the user's requested **independent KAHRELUM 2026 party-seat/coalition outcome forecast and outcome probabilities**. No such predictions are present and none should be backfilled or misrepresented as previously frozen; old C0 remains solely an external-comparator lock. No valid Brier probability forecast exists in this package. Predictive superiority, calibration, independent source custody and externally held-out performance remain **NOT ESTABLISHED**.

**C1 onward:** Existing [registered protocol](./SCORING_PROTOCOL_2026-10-26.md) still requires C1 **09:30 PKT October 27**; subsequent named-outlet poll-close, verified 25/50/75% valid ballots counted, first projection and November 4-target official result are event-scoped records. This v0.3 run is **not** C1. The system may continue monitoring via previously authorized automation; completion of future triggers cannot be claimed now.

No original KAHRELUM C0, scoring rules, party registry, earlier supplemental run, v0.1 or v0.2 model records were edited. Changes are append-only with this new version identity. Its publication and readback must be separately verified.
