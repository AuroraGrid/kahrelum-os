# KAHRELUM election analysis lab | additive release and Firebase production gate

Case: **KAH-IL26-PROSPECTIVE-001**  
Release branch: `feat/election-analysis-lab-20261028`  
Target: **https://kahrelum.com/election-lab** on the existing Firebase Hosting site, **not** a replacement for `/election-live`.

## Additive frontend

- `/election-lab.html`: responsive independent research page, retained historical/research limits
- `/election-lab-app.js`: clients read the published joint-draw archive, insist on matching prediction identity and 14-list/120-seat/12,000-draw invariants, and compute *same-event* probabilities for two editable scenarios
- `/election-lab-roster.json`: 36 operationally contesting lists; original stale 37-list table and the Oct 25 Achi withdrawal correction are both cited, with CEC retrieval grades preserved
- `/api/election-feed.js`: read-only Vercel gateway used on non-Firebase preview, allowlisted to existing Firebase JSON documents; no writes or arbitrary URL forwarding

Features: two coalition role configurations; cabinet-61, cabinet+support-61, yes>no; coherent cabinet-seat distribution plots; optional deterministic absence/defection what-ifs; 3-method sensitivity table; party seat histogram; dated C0/C1/C2/C6/P1/P2/C7 chronology; ballot directory; sourced political red-line ledger; model/source/hash/age audit; CSV, JSON, print, and shareable role links.

All seat probabilities describe **arithmetical seat availability conditional on issued model joint draws**. They are NOT political-negotiation probabilities, independent proof of calibrated future outcomes, or a pre-election model lock. Probability totals across overlapping scenarios do NOT sum to 100%. Historical cutoff authenticity and the vote-share track remain incomplete. The 14-list model does not encompass the entire 36-list ballot.

## Read-only model gateway

On the canonical Firebase site, this frontend reads original `/election-data/latest.json`, `/election-data/coalitions.json`, and `/election-data/coalition-draws/<prediction-id>.json` directly.

The additional Vercel-origin API bridge is ONLY a fallback when the site is hosted on a separate Vercel hostname. It is not a new election source, does not authenticate CEC data, and does not replace the owner-machine source collector. A stale heartbeat is shown as stale, not magically refreshed.

## Tests and observed evidence

Independent testing of the branch source in a Vercel sandbox using Node v24 and jsdom v26:
- `node --check` on both JS files **PASS**
- 51 unique HTML element IDs, all referenced explicit IDs resolved **PASS**
- operational roster contains exactly 36 unique symbols, with both withdrawn lists excluded **PASS**
- live preview served HTML, roster, and allowlisted read-only source bridge **PASS**
- real coherent published Student simulation loaded from `/election-data/coalition-draws/34cf920388ad7815.json`, with 12,000 draws **PASS**
- original Netanyahu five-party preset cabinet >=61 reproduced **5.3%** (rounded)
- Eisenkot outside-support preset cabinet+support >=61 reproduced **84.8%** (rounded)
- model switch, modified preset, party histogram, 36-row search and 3-model sensitivity render **PASS**

These are frontend and coherence tests, not model calibration or voter-outcome validation.

## Firebase Hosting deploy gate: DO NOT WIPE EXISTING PATHS

Vercel project `kahrelum-os` is a **separate** origin. Even a successful Vercel production deployment does not make a new page available at `https://kahrelum.com/election-lab` because that domain currently uses Firebase Hosting.

To release safely to canonical Firebase:
1. Obtain authenticated **Firebase Hosting** deployment access to project/site `kahrelum-public-hosting` with the original owner authorization.
2. Read the **current live Firebase release version and complete live file hash map**, not a historical hardcoded snapshot. Read back `hostingConfig`, rewrites, headers, cleanUrls and redirects.
3. Stage a new Hosting version by *preserving every original path and every unchanged file hash*, then add only `/election-lab.html`, `/election-lab-app.js`, and `/election-lab-roster.json` (plus one navigation link only if separately reviewed).
4. **Never run `firebase deploy` from this GitHub repository root alone**: it does not contain all existing Firebase-hosted page/data files and would risk deleting working routes.
5. Assert all protected routes and configuration are unchanged: `/`, `/pilot`, `/demo`, `/connect`, `/api/v1`, `/api/v1/release`, `/api/v1/example`, `/election-live`, `/election-data/*`. Original C0 and scoring protocol source blobs remain immutable.
6. Verify uploaded file hashes, finalize the staged version, release it to the existing **live** Firebase channel, read back version+all file identities.
7. Fetch `https://kahrelum.com/election-lab` and `https://kahrelum-public-hosting.web.app/election-lab`, confirm both pages and the three new files produce 200, and live role changes reproduce 5.3% and 84.8% for the explicitly selected archived snapshot. Verify the original dashboard and API routing survive.
8. Publish a new exact release receipt with hashes, version and readback. Until this is done, retain **FIREBASE LIVE DEPLOYMENT NOT VERIFIED** rather than implying it from GitHub or Vercel.

Do not alter the original C0, protocol, model implementation or archived predictions. Do not claim hosted source collection is independent of the owner computer unless a genuine persisted and independently sourced collector has been implemented and verified.
