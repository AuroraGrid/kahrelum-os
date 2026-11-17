# KAHRELUM candidate portraits: documented aliases, November 3, 2026

**Status: local validation passed; production not updated.** Rebuilt ledger: **432 / 940 admitted**, **508 unresolved**, versus **429 / 940 admitted** in the last verified November 2 production. All 429 original record objects remain identical and in the same order.

| Candidate / source contest | Pinned image | First-party source |
| --- | --- | --- |
| Tom Kean Jr. (NJ-7, Republican) | Bioguide K000398 | https://kean.house.gov/about |
| John Olszewski (MD-2, Democrat) | Bioguide O000176 | https://www.elections.maryland.gov/elections/2026/general_candidates/2026_GG_statewide_candidatelist.html |
| Nicholas LaLota (NY-1, Republican) | Bioguide L000598 | https://usna.edu/Notables/Bios/2000lalota.php |

The official congressional site uses Thomas and Tom Kean Jr.; Maryland's election office lists John "Johnny O" Olszewski Jr.; the U.S. Naval Academy biography identifies Nicholas Joseph LaLota as Rep. Nick LaLota. These documentary links are combined with the existing state, party, congressional district, pinned Bioguide records and original public-domain Git blobs. No face recognition, generated faces, new photo downloads or substitutions were performed.

Original HTML SHA-256 digests and verbatim, hashed excerpts appear in `documented-aliases-2026-11-03.json` and `alias-captures-2026-11-03/`. Full HTML is not republished because it also contains unrelated candidate contact information, so the raw HTML digests are capture receipts rather than independently reproducible from the stored excerpts. The source-listed roster does not establish official ballot eligibility.

**Important exclusion:** Alaska Senate's Daniel J. Sullivan, source ID 23489, is a distinct person from incumbent Dan S. Sullivan (Bioguide S001198). The former remains unresolved. Other same-surname candidates and the unverified Pramilia/Pramila Jayapal spelling are not automatically matched.

Validation: `python scripts/build_candidate_portraits.py` and `--check` returned **432 admitted / 508 unresolved**. Existing portrait Python suite: 29 passing tests; new documented-alias regression suite: 5 passing tests; Node portrait suite: 11 passing tests. All earlier admitted records were compared individually. HTML and JS share a newly advanced asset-version token.

**Not deployed.** Only after GitHub review, run the existing `candidate-portraits` Firebase overlay plan and preview, verify the candidate cards and credits in a real browser, check all baseline API/unrelated file hashes, then promote the exact preview with a fresh live-version guard. The initial storage-quota issue and cleanup history from November 2 are not permission for any new deletion.
