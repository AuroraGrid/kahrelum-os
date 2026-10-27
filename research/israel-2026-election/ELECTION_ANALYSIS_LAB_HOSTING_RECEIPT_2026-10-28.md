# KAHRELUM Election Analysis Lab | Hosted release verification

**Case:** KAH-IL26-PROSPECTIVE-001  
**Release commit:** [`265b6d5e9961b3ac5f519fb54a41d7106a32f83e`](https://github.com/AuroraGrid/kahrelum-os/commit/265b6d5e9961b3ac5f519fb54a41d7106a32f83e)  
**Pull request:** [#7](https://github.com/AuroraGrid/kahrelum-os/pull/7), merged into main  
**Git-hosted application:** [https://kahrelum-os.vercel.app/election-lab](https://kahrelum-os.vercel.app/election-lab)  
**Canonical requested Firebase route:** https://kahrelum.com/election-lab

## Adjudication

| Gate | Status |
|---|---|
| Feature implementation (A/B role scenarios, histograms, three-method comparison, timeline, 36-list directory, source drawer, export/print/share, sensitivity) | PASS |
| Node JavaScript syntax and full DOM id mapping | PASS |
| Model-sourced coalition arithmetic using genuine 12,000-draw archived samples | PASS, independent JS DOM integration |
| Netanyahu cabinet >=61 | 5.3%, matching archive preset |
| Eisenkot cabinet + Joint List / Ra'am outside support >=61 | 84.8%, matching archive preset |
| Eight presets, model-switch and full 36-row searchable ballot roster | PASS |
| GitHub main release + merged PR #7 | PASS |
| Vercel production deployment | PASS (READY, recorded deployment from source commit above) |
| Production Vercel page + Javascript asset + roster JSON + allowlisted read-only Firebase data proxy | PASS, direct public fetch |
| Firebase canonical URL `https://kahrelum.com/election-lab` | **BLOCKED / HTTP 404** during independent public fetch |
| Existing Firebase `/`, `/pilot`, `/api/v1/release`, `/election-live`, and `/election-data/coalitions.json` | PASS / public route readback |
| Firebase authenticated staging and live-channel release of the added static files | NOT PERFORMED; no Firebase Hosting release tool available in this Chat execution |
| Independent prospective model calibration, political formation forecast | NOT ESTABLISHED, unchanged |

## Technical hosting boundary

KAHRELUM's canonical `kahrelum.com` domain is served by **Firebase Hosting**. The Vercel `kahrelum-os` project is a **different public origin**; its working production release does not cause the Firebase `/election-lab` path to exist. Adding a Vercel domain or altering DNS is **not** an acceptable workaround because existing Firebase-hosted website paths and election source feeds must not be displaced.

Complete the Firebase gate with authenticated Firebase Hosting administrative access: obtain the current live version's file-hash map, rewrites, headers and existing route config; stage an additive site version preserving all published Firebase files and route identities; add only `/election-lab.html`, `/election-lab-app.js`, `/election-lab-roster.json` from release commit `265b6d5e`; finalize and activate the updated live channel; verify both `https://kahrelum.com/election-lab` and `https://kahrelum-public-hosting.web.app/election-lab` plus current API, original election dashboard and source feeds. A bare `firebase deploy` from this GitHub repo is unsafe because that repository lacks the complete existing Firebase hosting file map.

The existing v0.6 seat-space uncertainty framework is **experimental**. Simulation events show seat availability under selected fixed party roles and meeting-attendance assumptions, not the likelihood a government forms. No original pre-election proprietary model outcome probability has been manufactured, and original C0 and scoring protocol remain unchanged.

## Evidence source boundaries

This receipt records direct public HTTP retrieval and a sandbox JavaScript DOM integration test, **not a full browser automation suite** or audited official counting. The model's underlying raw-draw file is a published numerical research output, not the privately held original model implementation. Automatic collection remains dependent on the owner's existing computer unless separately migrated and verified. No claim that the collector has been hosted independently.

**Final status: VERCEL PRODUCTION PASS / CANONICAL FIREBASE DEPLOYMENT BLOCKED / SCIENTIFIC VALIDATION PARTIAL.**
