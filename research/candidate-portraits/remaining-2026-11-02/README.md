# Review of the 511 remaining portraits — November 2, 2026

This batch adds **112 verified, licensed photographs** to the preserved 429-record admitted collection: **541 of 940 candidate records (57.6%)**. House coverage is 482; Senate coverage is 59. There are 133 locally stored images and 408 unchanged external images. The original 429 admitted records are byte-for-byte equivalent as JSON records; `baseline-preservation.json` records their canonical SHA-256. Forecasts and source candidate names have not been corrected or replaced.

The 112 additions include **31 of the 60** previously identified priority records (the existing KAHRELUM pDem 0.30–0.70 queue). This is a research priority, not a newly validated election forecast. `added-portraits.csv` lists every addition, FEC identifier, photographer, license, permanent source revision, local asset and digest.

## Identity and rights methodology

1. Capture the first ten columns of the FEC's 2026 candidate master and the committee ID/name/authorizing-candidate columns of its committee master. Retain URLs, retrieval timestamps, original download/member SHA-256 hashes and column semantics. Mailing addresses and treasurer information are excluded from the committed extracts. FEC registration identifies a person and filing; it does not certify nomination or ballot eligibility.
2. Bind the original source ID, name, state, party, chamber and district to exactly one 2026 FEC row. Use only recorded given names, explicit parenthesized aliases, optional recorded suffixes, or an exact principal-committee alias. Minnesota DFL is mapped to the roster's Democratic designation. There is no nickname dictionary, approximate spelling match or face matching.
3. Six additional aliases are documented by captured first-party campaign disclaimers identifying the FEC principal committee, or government biographies explicitly recording the names. These are Jay Feely, Sam Forstag, Fred Wellman, Matthew Dunlap, Tom Kean Jr. and Chris Rabb. The catalog records the exact binding, URL, evidence terms and capture hash. Raw HTML is retained where available; the Maine capture is explicitly labeled as extracted page text.
4. Wikipedia and Commons searches are discovery only. Every proposed photo was reviewed for its named subject and role/geographic context. Commons API snapshots retain the file revision, original SHA-1, thumbnail URL, creator, per-image license metadata and file-page wikitext. Full photo framing was visually reviewed; faces were not used to establish identity.
5. Reject namesakes, relatives, missing permissions, unknown copyright provenance, unsupported public-domain assertions and permission-pending files. For example, the Mike Bouchard image depicts the sheriff rather than his congressional-candidate son; the Anthony Constantino image depicts a model; a James Marter photograph incorrectly uses PD-text/PD-shape; Patrick Halpin's county-agency image incorrectly uses federal PD-USGov. Rachel Fetty Anderson's VRT permission remains pending. No new Iowa legislative portrait was added while its Commons free-use claim conflicts with current first-party restrictions; earlier records/evidence remain preserved.
6. Download unchanged source thumbnails, decode them with Pillow during acquisition, verify dimensions and record SHA-256. Native JPEG, PNG and WebP are retained. Some Commons API nominal heights differ by one pixel from decoded thumbnails; this is explicitly recorded. When Commons serves a smaller original instead of an upscaled thumbnail, its original SHA-1 must match. No images were generated, retouched or newly cropped.
7. Rebuild offline with `python scripts/build_candidate_portraits.py`; `--check` verifies reproducibility. The builder validates the full evidence chain, source/roster binding, rights, immutable image bytes and all 511 audit decisions. The browser adapter independently rejects malformed bindings, URLs, rights and local asset paths. Creator, license, photo-source and FEC identity links are visible on each new candidate card.

## Remaining records

| Reason | Count |
| --- | ---: |
| No reviewed licensed photograph found | 331 |
| First-party identity/name/contest still unresolved | 50 |
| Rights or original image provenance unresolved | 8 |
| Source entry represents a group, not a named person | 6 |
| Proposed photograph does not establish the candidate's identity | 4 |
| **Total unresolved** | **399** |

All 511 original unresolved entries have individual decisions in `candidate-review.json`; the remaining names are in `unresolved-candidates.csv`. A total of 455 have unique FEC identities under the reviewed rules, including the 112 additions. The other 343 FEC-matched entries still lack an admitted photograph. The six aggregate Louisiana entries cannot be assigned an individual portrait.

Discovery coverage: all 511 received an FEC identity pass and Wikipedia/Commons discovery. The 64 selected person pages were examined individually; the other 447 entries have individual Commons search responses. Forty-one additional priority/context searches completed. An optional grouped state search expansion encountered 88 transport-level 403 errors out of 91 requests; these are preserved as errors, **not** represented as empty searches or proof that no image exists. Search results are not exhaustive inventories of all possible image sources.

## Validation and release

The original portrait evidence and source records are preserved. The interface cache version is `20261102-portraits-2`, so returning visitors request the new adapter. The established `candidate-portraits` Firebase profile overlays only the election HTML, adapter, portrait ledger and admitted local image assets onto the current production file map. It retains unrelated files, hosting configuration and API body hashes and requires preview verification before promotion.

Local validation: 36 portrait Python tests and 15 portrait/binary-integrity Node tests pass; the full repository Python and Node integrity suites are also run. Negative cases include wrong people/races, duplicate or replacement records, fabricated aliases, missing/changed evidence, pending permissions, invalid license classes, image substitution and altered dimensions. Deployment receipts and live-browser observations will be recorded here after promotion.
