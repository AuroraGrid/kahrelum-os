# KAHRELUM election-day candidate portraits: November 3 bulk release

**Source branch staged, Firebase publication not yet established.** This release adds 26 exact-source candidate photographs to the 432-record ledger and yields **458 of 940 portraits admitted (48.7%)** with **482 still unresolved**. The original 432 admitted records remain byte-for-byte identical JSON objects, including their source claims and review timestamps.

## What changed

- **24 House candidate portraits and two Senate candidate portraits** attached to their exact KAHRELUM discovery roster records.
- Individual candidate/office/state/party/district identities cross-checked against the FEC 2026 candidate master, with first-party FEC HTML captures for Thomas James "Jay" Feely (AZ-1) and Sarah Trone Garriott (IA-3).
- Exact-title Wikipedia candidate biography and Wikimedia Commons shared-file images cross-checked with the metadata returned by the English Wikipedia imageinfo API. The licensed image source is still Wikimedia Commons, not Wikipedia's article text.
- Creator credit and the exact per-image reuse license are rendered on each photo card. All 26 downloaded provider thumbnails were decoded, had their dimensions checked, SHA-256 hashed and stored **unchanged** at content-addressed local paths. Total 635,354 bytes of captured source thumbnails.
- A separate `FEC_ENWIKI_SHARED_COMMONS` record class verifies candidate bindings, FEC IDs, captured source metadata, original Commons SHA-1, per-image rights, source attribution, bytes/dimensions and duplicate protection.

The per-image Commons metadata came from English Wikipedia's shared-media API because the direct Commons API was intermittently unavailable. This is recorded accurately: source descriptions, original SHA-1, author and permissions are captured, but **not** the Commons description-page revision IDs. No generated faces, facial recognition, approximate name matching, speculative nickname binding or inferred image rights were used. The 2026 FEC candidate master is not state-certified ballot eligibility.

## Selected 26

Cait Conley (NY-17); Donavan McKinney (MI-13); Jay Feely (AZ-1); Janelle Stelson (PA-10); Houston Gaines (GA-10); Jasmine Clark (GA-13); Laurie Buckhout (NC-1); La Shawn Ford (IL-7); Sarah Trone Garriott (IA-3); Mike Beltran (FL-14); Richard Ojeda (NC-9); Jennifer Balkcom (NC-11); Mark Teixeira (TX-21); Jim Desmond (CA-48); Ralph Alvarado (KY-6); Richard Pan (CA-6); Beth Macy (VA-6); Melat Kiros (CO-1); Mai Vang (CA-7); Matt Little (MN-2); Oliver Gilbert (FL-24); Seth Bodnar (MT Senate); Mark Tedford (OK-1); Marquita Bradshaw (TN Senate); Nancy Lacore (SC-1); Robin Ficker (MD-6).

The exact FEC-ID/photo attribution and image license for each are individually recorded in `../shared-commons-sources-2026-11-03.json`. Sarah Trone Garriott has a separately labeled Iowa General Assembly copyrighted-free-use permission with the existing reviewed VRTS permission context, not a claimed federal public-domain image.

## Excluded candidates and limitations

The initial exact-title Wikipedia search surfaced some **wrong namesakes**, including an Ecuadorian chess player, a writer, a composer, a late professional baseball pitcher, a Filipino model, a gymnast and other unrelated public figures. They were **not** associated with ballot candidates. Additional group images and unconfirmed Commons rights claims remain unadmitted. In particular, the Alaska Daniel J. Sullivan / Dan S. Sullivan collision is blocked.

The FEC 2026 bulk master gave unique name/party/office/district matches for 417 of the 508 pre-batch unresolved records, four ambiguous results and 87 without a strict match. These are *candidate filing identities*, **not** verified headshots. Some skipped names have another valid official record using a legal alias; they remain on the research queue. Wikipedia search coverage was incomplete following an HTTP 429 throttle; this report does not claim an exhaustive global image search.

## Validation

Locally reproduced: `python scripts/build_candidate_portraits.py` and `--check` report **458 admitted / 482 unresolved**. All **35 Python portrait tests** and **12 Node card-rendering/identity tests** passed, including six additional negative tests for swapped FEC identities, altered hashes, duplicate IDs, missing rights and incorrect candidate/contest bindings. Existing 432 records remain exactly unchanged in the tests.

## Deployment gate

Use a fresh exact-current-`main` checkout after merge, the isolated `candidate-portraits` Firebase plan/preview, and inspect the 26 photos in rendered House/Senate cards in the preview browser. Preserve Hosting configuration, live unrelated files, API hashes and existing forecast probability locks. Promote only the exact preview after checking that Firebase production did not change; stop for quota blockers rather than deleting versions without a new approval. **No Firebase publication or live 458-photo claim is made by this report.**
