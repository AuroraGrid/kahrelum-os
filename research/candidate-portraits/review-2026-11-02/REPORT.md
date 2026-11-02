# Candidate portrait review — November 2, 2026

**Production is published and browser-verified as of November 2, 2026, 20:54 UTC.** The [live election page](https://kahrelum.com/election-challenge) shows **429 admitted portraits**; all eight additions loaded in the returning production browser.

The updated ledger contains **429 verified photographic identities out of 940 source-listed candidate records (45.6%)**, leaving **511 unresolved**. The original 421 admitted records remain identical. Identity verification does not certify nomination or ballot eligibility; the source roster and forecast locks have not been changed.

## What production displayed before this release

The production ledger and map implementation were inspected at https://kahrelum.com/election-challenge. Its ledger was semantically identical to the 421-record admitted ledger at repository commit `b5380b4a4347f8457374861c9eb25c5ca2f5ead6` (940 total records, 519 unresolved). The page reported 421 attached portraits.

- 397 files (13 local and 384 pinned congressional archive images) downloaded, decoded as images and matched their captured image hashes. Per-candidate results: [production-baseline-image-audit.json](production-baseline-image-audit.json).
- All 24 externally hosted Commons portraits loaded in actual candidate cards, with nonzero natural image dimensions: [production-baseline-browser-audit.json](production-baseline-browser-audit.json). The command-line client received 403 responses for this subset; browser success shows that this was not a general production-image outage.
- Images load lazily as candidate cards enter view. The initial visible page does not load all 421 simultaneously. Download/hash checks and browser rendering checks are reported separately rather than calling every ledger entry an observed browser render.

Baseline live ledger SHA-256: `0b8bb6d3e150a429f00b89cb547b41402973012d149e08827ea0c44dc633b19f`.

Baseline live map script SHA-256: `c0eceb292f3ae7daef6c4512bd645cfa4be5b1c05fec7fd77126e5a11e1f8611`.

## Eight additions

| Candidate | Source-listed contest | FEC identity | Image permission / creator |
|---|---|---|---|
| Josh Turek | Iowa Senate | S6IA00298 | Iowa General Assembly free-use permission, reviewed Commons VRT ticket 2010030210041811 |
| Christina Bohannan | IA-1 House | H2IA02111 | Iowa General Assembly free-use permission, same reviewed ticket |
| Derek Merrin | OH-9 House | H4OH09169 | CC BY 4.0 — SchOg |
| Paige Cognetti | PA-8 House | H6PA08293 | CC BY 2.0 — US Department of Labor; photograph credited to Liz Roll |
| Jonathan Nez | AZ-2 House | H4AZ02184 | CC BY-SA 4.0 — Wikiuser159597 |
| Hallie Shoffner | Arkansas Senate | S6AR00199 | CC BY-SA 4.0 — Arkansas Agricultural Experiment Station |
| Charles Booker | Kentucky Senate | S6KY00385 | CC BY-SA 4.0 — Breadwin |
| Annie Andrews | South Carolina Senate | S6SC04239 | CC0 — Stimpus1 |

The first five were sourced during this review. The final three were recovered from unpublished commit `87869ea13a60a0d5fbea43d30cbfae316c1bc97b` and strengthened with first-party FEC evidence. Their original 96×96 derivatives and source records were retained. All eight files are stored locally, hashed and visually inspected for usable portrait presentation. Subject identification rests on documentary evidence, never facial comparison.

All four new House photographs and Iowa Senate were prioritized using the existing KAHRELUM competitive-contest band (Democratic probability 0.30–0.70). Annie Andrews was already in the recovered batch and also falls in that band. Arkansas and Kentucky were retained as previously researched additions; they are not described as competitive based on this model.

Each addition has a recorded FEC URL, exact candidate/office/party/state/district binding, captured normalized page text and original HTML digest. Original HTML is preserved as gzip with a [capture manifest](fec-original-captures.json). Josh/Joshua Turek's name variation is substantiated by the FEC legal name and the named committee, not a generic nickname rule. Commons page captures, revision links, creator credits, license versions and local JPEG hashes are in the [local source catalog](../local-sources-2026-11-02.json) and [recovered source catalog](../licensed-sources-2026-11-02.json).

## Coverage and unresolved records

| Measure | Before | Updated |
|---|---:|---:|
| Admitted portraits | 421 | 429 |
| House | 370 | 374 |
| Senate | 51 | 55 |
| Locally stored | 13 | 21 |
| Externally hosted | 408 | 408 |
| Unresolved identities | 519 | 511 |

The [full unresolved CSV](unresolved-candidates.csv) retains all 511 candidates, their source IDs, contests and `IDENTITY_NOT_VERIFIED` reason. The [priority backlog](priority-backlog.json) lists 60 unresolved candidate records within the existing competitive-contest band, including Jay Feely (AZ-1), JoAnna Mendoza (AZ-6), Randy Villegas (CA-22), Sarah Trone Garriott (IA-3), Laurie Buckhout (NC-1), Cait Conley (NY-17) and two source-listed Alaska Senate records. This is a research queue, not a claim that each person is a certified ballot candidate or has no reusable photograph anywhere.

## Validation and release

The deterministic importer rebuild and `--check` passed. Twenty-nine Python portrait tests and fourteen JavaScript portrait/deployment-byte tests passed. Checks cover wrong names, parties, offices and House districts; undocumented aliases; substituted photos; altered source digests; missing or incorrect licenses; Iowa permission scope; duplicate/replacement records; visible credit; image-error initials; and byte-for-byte JPEG preservation. All 421 original JSON records were compared individually with the baseline and remain unchanged.

The release uses the established Firebase live-file-map overlay, preview and exact-version promotion workflow with a narrow `candidate-portraits` profile. It preserves unrelated live files, Hosting configuration and API hashes, and checks that the deployed roster attaches all 429 portraits. The authenticated plan passed: **8 new JPEGs + 3 replaced files**, **3,237 existing file hashes preserved**, **zero removals**, unchanged Hosting configuration. However, Firebase rejected version creation with HTTP 429 because the project exceeded its Hosting storage quota. No Firebase preview was created and no promotion occurred. A readback at **20:35:34 UTC** confirmed production still serves **421 admitted / 519 unresolved**, with the same baseline ledger SHA-256. This is a storage-capacity blocker, not missing authentication.

The automatically generated [Vercel branch preview](https://kahrelum-apq07yges-hasan-kazmi-s-projects.vercel.app/election-challenge) reports 429 admitted portraits. All eight additions loaded in actual browser cards with their visible source and licensing credits ([browser audit](branch-preview-browser-audit.json), [screenshot](branch-preview.jpg)). Josh Turek's first observation preceded completion of its lazy image load; a second observation confirmed a loaded 250-pixel image. This branch preview verifies the UI but does **not** substitute for the required Firebase preview and promotion. GitHub's [Public Surface Integrity check](https://github.com/AuroraGrid/kahrelum-os/actions/runs/41520065421) passed.

## Storage cleanup proposal and subsequent approval

Read-only Firebase inspection found **125 finalized versions**, totaling **10,778,889,898 stored bytes**. The [cleanup proposal](storage-cleanup-proposal.json) identifies five older November 1 versions, totaling **414,733,426 bytes**, which are neither a current channel head nor among the latest ten distinct live releases:

| Version | Created UTC | Stored bytes |
|---|---|---:|
| `39a23669d1ef54af` | November 1, 01:57 | 79,558,995 |
| `19b135529a0ef046` | November 1, 08:49 | 82,038,690 |
| `39f1339c5243f454` | November 1, 15:15 | 84,309,737 |
| `74316b96d5ffcfb1` | November 1, 15:27 | 84,378,759 |
| `aed095fa7baad015` | November 1, 15:39 | 84,447,245 |

Deleting those five versions permanently removes those historical rollback copies. At the proposal stage, no deletion, retention-setting change or billing upgrade had been performed. Before any approved cleanup, re-read the current channel heads and recent live releases and exclude any selected version that has become protected. Firebase documents that release-content deletion can take up to 24 hours to reclaim storage: https://firebase.google.com/docs/hosting/manage-hosting-resources. After capacity is reclaimed, rerun the portrait plan, Firebase preview, browser checks and exact-version promotion; do not bypass the stale-live-version guard.

The source changes are recorded in [pull request #26](https://github.com/AuroraGrid/kahrelum-os/pull/26).


## Approved cleanup execution

The user approved the five-version cleanup in this conversation. Each version was rechecked immediately before deletion against every current channel head, the latest ten distinct live versions and the original protected set. All five approved versions returned `DELETED`; no other version was selected. The deleted versions represented **414,733,426 stored bytes**. The live channel stayed on `38ff517af8aad9a7` throughout cleanup. The complete [cleanup receipt](storage-cleanup-receipt.json) retains the individual guards and confirmations.

The first Firebase preview and exact-version promotion then succeeded at **20:49:34 UTC**, producing version `05a93f2a275fa68c` with 3,248 files and 429 attached portraits ([initial production receipt](firebase-initial-production-receipt.json)). All 21 local image hashes and all three existing API hashes passed. A returning-browser check exposed a stale cached October 31 map bundle: the HTML script version had not been advanced. The correction changes only the HTML script query version and the map's shared asset version to `20261102-portraits-1`. The 14 portrait and binary-integrity tests passed again. This correction passed a second Firebase preview and exact-version promotion. No direct production replacement was used.


## Final production receipt

The corrected preview was promoted at **2026-11-02 20:54:29 UTC**, to Firebase version `b91f562a2ba5048c`, from source commit `cec0b280d77cb928d0c421bf23b075cf7d43680b` ([merged PR #27](https://github.com/AuroraGrid/kahrelum-os/pull/27)). The final version contains **3,248 files**. Hosting configuration and all three API response hashes are unchanged. The second overlay changed only the two cache-version strings' files and preserved all other 3,246 live file hashes. Across the portrait release, the original 3,237 unrelated file hashes remain preserved and no live path was removed.

- [Final Firebase preview receipt](firebase-final-preview-receipt-summary.json)
- [Final production receipt](firebase-production-receipt.json)
- [Production browser audit: all eight additions loaded](production-browser-audit.json)
- [Production screenshot](production-portraits.jpg)
- [Complete release audit, including ledger readback hash](release-audit.json)

A normal reload of the returning production browser now fetches `/election-challenge-map.js?v=20261102-portraits-1` and displays **429 portraits admitted**. All eight added candidates' images have nonzero natural widths. The served ledger equals the repository ledger; its 421 original records remain identical. Remaining unresolved records stay at **511**, retaining their initials and verification boundary. No billing plan or retention setting changed.
