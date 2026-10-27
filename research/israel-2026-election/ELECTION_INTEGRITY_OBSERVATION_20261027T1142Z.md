# KAHRELUM | Election-day turnout, rhetoric and alleged voter-data disclosure: attributed source supplement

**Case:** KAH-IL26-PROSPECTIVE-001
**Source-review capture (UTC runtime clock):** 2026-10-27T11:43:34.028Z
**Israel local (Asia/Jerusalem, IST UTC+02):** 27/10/2026, 13:43:34
**U.S. Eastern (America/New_York, EDT UTC-04):** 27/10/2026, 07:43:34
**Pakistan (Asia/Karachi, PKT UTC+05):** 27/10/2026, 16:43:34
**Classification:** Append-only election-integrity observation; not a counted-vote checkpoint, election-result prediction, determination of fraud or legal postponement.
**Evidence custody limit:** Tool-read public pages and this runtime clock provide a documented observation, not notarised web-content preservation or cryptographically trusted first-seen timestamps.

## 1. New reports since prior 09:23 UTC supplement

1. **Reported political rhetoric, not established interference.** The *Jerusalem Post* election-day live log, entry headed **October 27, 13:05 Israel time**, attributes to Prime Minister Benjamin Netanyahu a warning headed “They're trying to steal election” in discussion of high Arab-voter turnout. The accessible live-log headline is a *secondary publication's characterisation*, not a directly authenticated full speech recording/transcript. Do not present this as evidence anyone actually manipulated ballots, nor infer that high Arab turnout constitutes fraud. Source: https://www.jpost.com/israel-election-2026/2026-10-27/live-updates-912992 (entry displayed 13:05 Israel). **Grade:** B / credible attributed reporting; verbatim context and direct first-party record unavailable.
2. **Alleged data leak / party complaint, procedural result unknown.** The *Jerusalem Post* live log at **12:59 Israel** says Likud filed a complaint about alleged leaks of voter information at **more than 100 polling stations**. No original filed complaint, election-commission docket receipt, independent verification of alleged leaks, investigation outcome, or legal electoral order was obtained. This is a *reported party complaint*, not verified compromised voter data or a finding by the CEC. Source: https://www.jpost.com/israel-election-2026/2026-10-27/live-updates-912992 (entry 12:59 Israel). **Grade:** B for reporting; D/unverified for substance and procedural docket.
3. **Outside-station digital voter mobilisation.** The *Jerusalem Post*, article posted **13:12 Israel**, reports Likud and United Torah Judaism personnel asking voters **outside** polling stations to voluntarily identify themselves and recording claimed turnout in party systems. The reported restriction concerned voter-management apps **inside** polling stations, and the article expressly recognises that willing outside-station identification can be within applicable law. This is *not* evidence of illegal surveillance or ballot secrecy compromise. Source: https://www.jpost.com/israel-election-2026/article-913021 . **Grade:** B report; legality of particular conduct unadjudicated.
4. **Turnout, not counted votes.** The *Jerusalem Post* log at **13:22 Israel** reported the Central Elections Committee's **12:00 Israel** national turnout rate at **31.5%** (approximately 2.3 million ballots cast). The log calls it a multi-decade midday high. A separate Al Jazeera summary says highest since 1977, whereas the JPost headline says since 1973; retain that historical-comparison inconsistency unless the underlying official series can be verified. Source: https://www.jpost.com/israel-election-2026/2026-10-27/live-updates-912992 and https://www.aljazeera.com/news/liveblog/2026/10/27/israel-election-2026-live-netanyahu-faces-tough-test-in-high-stakes-polls . **Grade:** B / credible secondary report of CEC update. Turnout is not a valid-vote counting numerator or denominator.

## 2. First-party verification and limits

Central Elections Committee election-day portal https://www.bechirot.gov.il/home shows election day October 27; official timetable https://www.gov.il/en/pages/time--table-26 specifies results publication expected November 4. The publicly indexed https://cdn-votes26.bechirot.gov.il/ contains a **SAVIVAT BDIKOT / test-environment** banner and pre-election displayed timestamp; **never** use those values as election-night counted votes.

A direct first-party CEC statement corroborating the party complaint or a judicial order granting relief was not recovered. No legally effective **nationwide** suspension, postponement, or rescheduling was established in the sources examined. Reports of individual-party allegations are not a verified systematic fraud finding. Active-ballot-list count remains **UNRESOLVED**: dated Oct 22 37-running registry vs later secondary 35/36 claims. Do not silently edit registry or assign unknown leadership details.

## 3. Checkpoint and numerator/denominator fields

- `checkpoint_triggered: none`; already archived C1 is not recreated; C2 only after 2026-10-27T20:05:00Z and closure confirmation.
- `valid_votes_actually_counted_numerator: null`
- `verifiable_total_valid_votes_denominator: null`
- `percentage_valid_votes_counted: null`
- `turnout_reported: 31.5% as of 2026-10-27T10:00:00Z / 12:00 Israel` (**NOT COUNTED %**)
- `vote_shares_by_list: null`; `seat_map: null`; `largest_list_projection: null`; `official_120_seat_result: null`
- `external_outcome_model_observation: none new`; `KAHRELUM_proprietary_winner_probability: NOT ISSUED`
- `numeric_forecast_revisions: none`

## 4. FACT / INFERENCE / FORECAST classification

**FACT about reporting:** The cited publications carry the attributed headlines, an asserted party complaint, outside-station mobilisation reporting, and the CEC-attributed turnout measurement at the stated publication/update times. **UNVERIFIED:** whether any claimed leak happened, whether the Prime Minister's entire statement matches the headline, whether any station suffered illegal interference, and exact historic turnout comparator. **INFERENCE:** the convergence of disputed data practices, complaints and inflammatory rhetoric could elevate risk of post-count legitimacy disputes; this does not constitute a prediction of legal success or changed results. **FORECAST:** no new KAHRELUM election-winner odds or geopolitical numeric revisions. Existing judgement baselines preserved; v0.5 historical poll-source-risk Brier 0.305392 is worse than 0.25 reference and does not predict election outcomes.

**Triggers for a new material stage/update:** official CEC decision, independently verified widespread ballot obstruction or privacy harm, police/court finding, actual emergency legal extension/closure, credible named projection, reliable counted-valid-vote numerator and denominator, or official certified results.

## 5. Integrity and chronology

Previously archived [C0](./BASELINE_LOCK_2026-10-26.md) stays at blob SHA `b9adfe504c15def6e1804a78a8828e54ae5e93a5`; [scoring protocol](./SCORING_PROTOCOL_2026-10-26.md) stays at `ab0692085b63c90570065f602c005c409c3b72d5`. [C1](./C1_PREOPEN_2026-10-27.md) remains **13m23s late** and before ordinary opening. Prior [07:33Z](./ELECTION_INTEGRITY_OBSERVATION_20261027T0733Z.md) and [09:23Z](./ELECTION_INTEGRITY_OBSERVATION_20261027T0923Z.md) supplements remain unchanged. C2–C7 pending; no milestone falsely manufactured. This new file preserves later reporting as reported, not adjudicated.
