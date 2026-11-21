# KAHRELUM CAL-DRILL-005 — Prospective Re-lock v1.3 (audit branch only)

**Release state: HOLD. No production deployment and no Brier scores.**

## Provenance

* v1.0 Google Sheet, original preserved: https://docs.google.com/spreadsheets/d/1k3Dy4zAHybtZQp8jYDWAmlq099018wpE6ZeK2DTtu4k/edit
* v1.1-QC / v1.2+ Google audit ledger, original forecast data columns preserved: https://docs.google.com/spreadsheets/d/1ObDloHz7geMDhJ5Hbx4keRTQR_4NLQvzJlA3OkX4b9U/edit
* v1.3 canonical JSONL: `prospective_slate_v1.3.jsonl`, **100 prospective records**, 78 original propositions with unchanged probabilities and 22 explicitly revised propositions/probabilities.
* Independent commit recording the new 100-record prospective slate: **8436a8bd0367bf363e52cef87b646243ac391cdb**; GitHub reports **2026-11-12T20:24:05Z**.
* Git blob SHA-1 of the v1.3 JSONL: **17230c777485a2fdb7abe0bff01b8771780751c6** (content address, NOT SHA-256/TSA).
* Source v1.0 Google Sheet created **2026-11-12T19:37:12.182Z**, modified **19:37:14.387Z**. Do not claim these prove 100 original per-forecast locks at 19:35–19:39Z.
* The original 60 un-attested timestamp claims and 40 contradictory future script timestamps remain **UNVERIFIED**. Their v1.3 prospective validity begins ONLY at the GitHub commit above.
* Google Sheets XLSX export snapshot SHA-256 at audit time: **4c412bb5d38a19c6971b1a76b082fdc554a2259efb62967879b2787af69e2e12** (33,768 bytes). This is an XLSX **export** snapshot, not original v1.0 JSONL/CSV.
* Audit ledger XLSX export snapshot SHA-256: **68125434108509fb4df8ebf23583745495b9b948fbb4f75bedd5cd1d4abfdd0a** (69,107 bytes; export included v1.2 audit tabs).
* Gemini's claimed JSONL/CSV original hashes were partial (`c0d58619...a84ab2` and `d6980330...8d9c32`) and underlying original bytes were not recovered; **do not certify those hashes**.

## Reissue policy / forecast gates

* v1.3 includes 50 Short (7–30 elapsed days) and 50 Medium (31–90 elapsed days), 20 per domain.
* All 100 were validated as 7–90 day prospective from GitHub server timestamp; min ~8.025 days and max ~88.9 days.
* Reissued records have `change_kind=REISSUED_NEW_PROPOSITION`, carry original parent identifier and original question, original probability and original deadline for audit. They are NOT backdated original locks.
* The 78 unchanged propositions are explicitly `CARRIED_FORWARD_RELOCK` and therefore NOT proof that the original November 12 script times were valid.
* Five publisher-domain single-family cases and 12 repeat-domain cases were found, despite 2–3 URLs being present.
* Primary URL triage: 81 distinct URLs across 100 rows; 78 reachable, 3 fetch errors. A URL being fetchable does not certify that the content supports a forecast.
* Nine correlated forecast families/25 records were mapped. N_eff≈76 remains an unproven heuristic.
* 16 rejected candidates were claimed by Gemini but a reviewable rejection ledger has NOT been recovered.
* Every forecast remains RES-OPEN. No CAL-DRILL-005 performance score may be claimed until official resolutions are independently verified.
* All 100 forecasts remain SOURCEGRID/BLACKGLASS certification HOLD until per-proposition evidence, resolution completeness and probabilities are reviewed.

## Governance

No original v1.0 file or historical lock timestamps were changed. This audit branch is **not merged into main** and does not alter the production website. Public branch/commit metadata supports a new GitHub-hosted timestamp, but GitHub is **not** a dedicated independent cryptographic timestamp authority (TSA); do not call this a TSA seal.
