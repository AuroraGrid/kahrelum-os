# October 31 prospective election comparison

This cohort completes the current 14-provider admission review with **13 House probabilities ready for a prospective public lock**. Scrutinel's House observation is excluded because two current widgets disagree. All 14 Senate slots are retained and excluded: 12 have numerical observations whose event definitions have not been shown equivalent to KAHRELUM's conditional caucus model, and two have no captured Senate probability.

`election/comparator-admission.json` is the machine-readable publication status. A record becomes `ADMITTED_PROSPECTIVE` only after a verified public commit anchors the manifest and all 34 factual source receipts. Until that step, the 13 House records are `READY_PENDING_PUBLIC_LOCK`; they are not represented as already published locks.

## What this comparison means

The declared collection window is **2026-10-31 04:12:00–05:12:00 UTC**. Actual source retrieval brackets run from **04:12:28 through 04:19:11 UTC**. Clock readings bound capture time; they are not independent timestamp authority receipts. The policy was declared during the session and was not independently timestamped before collection.

The comparison observes what each provider made public during one window. It **does not establish equal underlying information cutoffs**. For example, the COYNTOSS House page still uses inputs through October 18, while ElectIndex's captured chamber file was modified on October 31. Every source edition and known input date remains visible. Admission permits qualified prospective probability scoring under the stated event; it does not establish a fair matched-input superiority test or general calibration from two chamber outcomes.

The old strict cohort remains at zero. The original KAHRELUM House lock stays **91%**, and the original Senate lock stays **46.090647437793264%**. The fresh reference observes the already-existing computed KAHRELUM edition, including its **90.57450487619074%** House result. That observation does not replace or backdate the original lock.

## Reviewed roster

All values below are percentages from the new primary captures. They do not overwrite the older public source-check snapshot.

| Provider | House | Senate | House admission review | Senate admission review |
| --- | ---: | ---: | --- | --- |
| [Decision Desk HQ](https://votes.decisiondeskhq.com/forecast/2026) | 82 | 62 | Ready: explicit 218 threshold and control marginal | Independent-caucus policy not established |
| [99chambers Horizon](https://99chambers.app/updates/2026-10-30) | 98 | 80 | Ready: Horizon version, 218 of 435 | Complete independent mapping not established |
| [CalltheMap](https://www.callthemap.com/house) | 85 | 60 | Ready: 218 threshold | New independent winners are presumed Democratic-aligned |
| [COYNTOSS](https://chasecoyne.com/house) | 80.5 | 70.85 | Ready: experimental House edition, input age retained | Allied-independent mapping not proven equivalent |
| [Scrutinel](https://scrutinel.com/) | 93 / 92 | 70 | Excluded: headline and distribution conflict | Osborn is assigned to Democrats, other independents differ |
| [Vote-Scope](https://vote-scope.com/en/us/house/) | 97 | — | Ready: explicit 218 of 435 | No captured numerical Senate forecast |
| [ElectIndex](https://electindex.com/forecasts/) | 91.8 | 72.5 | Ready: exact publisher-linked CSV, threshold 218 | Independent challenger treatment not fully matched |
| [Datum Signals](https://datumsignals.com/) | 72 | 63 | Ready: real HTML counter target, threshold 218 | Page describes 33 Senate races; specials and caucus mapping unresolved |
| [Fred Cornell](https://fredcornell.com/us) | 99 | 68.7 | Ready: at least 218 seats | Separate independent-control event not matched |
| [Yale PLSC 2219](https://kevinmdeluca.com/forecast/class/) | 95 | 43 | Ready: selected class model, threshold 218 | Party-side substitutions are not verified final caucus membership |
| [Dave Manuel](https://www.davemanuel.com/2026-midterm-forecast.php) | 94 | 70 | Ready: explicit 218 of 435 | Uncommitted independents are a separate control outcome |
| [On Point Politics](https://www.tpsielections.com/forecast) | 97 | 90 | Ready: consistent control probability, threshold 218 | Methods explicitly put Osborn in the Democratic column |
| [VotePredictor](https://votepredictor.com/house) | 76 | — | Ready: explicit 218 threshold | No captured numerical Senate forecast |
| [Midterm Forecast](https://midtermforecast.com/) | 91 | 71 | Ready: explicit 218 threshold | Uncommitted independents can hold the balance separately |

Every House admission is for the source's reported Democratic chamber-control event with the documented 218-seat majority threshold. Seat summaries are descriptive only. A source's new conflicting or materially different definition requires a new review; the locked observation is never silently rewritten.

## Why Senate records remain held

The original target is at least **51 Democratic-caucus seats out of 100**; 50 resolves NO. Matching that number alone is insufficient. KAHRELUM flags independent-candidate risks in **Idaho, Montana, Nebraska and South Dakota**. Source rules differ over whether a new independent belongs in the Democratic side, is an expected ally, or leaves neither party in control. A generic label such as Democratic control cannot settle those differences.

The source methods make the differences concrete. [Yale's class model](https://kevinmdeluca.com/forecast/class/) assigns an independent replacing a party nominee to that party's side. [On Point's methodology](https://www.tpsielections.com/forecast/methodology) assigns Osborn to the Democratic column. [Dave Manuel](https://www.davemanuel.com/2026-midterm-forecast.php) includes King and Sanders but separates new uncommitted independents. [Midterm Forecast's methodology](https://midtermforecast.com/methodology/) also has a separate independent-balance outcome. These are useful documented observations, but no candidate-level equivalence review has been completed against KAHRELUM's conditional mapping.

A subsequent Senate admission must record a complete candidate-level caucus mapping, link its primary evidence, match the target, and create a new prospective public lock before the cutoff. A model assumption about an independent must not be represented as an established caucus commitment. No missing probability is filled in, and no independent category is renormalized into one party.

## Custody and quantities

`cohort-manifest.json` contains the fixed observations, event reviews, known publication times, source edition labels, input dates, exclusions and short reasons. `sources/*.json` contains the 34 factual receipts: primary URLs, bounded retrieval times, tool receipt identifiers, source sizes, source-representation SHA-256 digests, short exact excerpts with offsets, and related source-review context. ElectIndex's small factual CSV is included verbatim as machine-readable data.

Hashes describe the UTF-8 representation returned by the retrieval tools. They are **not claimed to be exact HTTP-wire bytes**. Full working HTML captures were retained separately for local hash and excerpt verification; they are not republished in the public repository. The public commit anchors the factual observations and their digest trail, not a complete independently replayable HTTP archive. This custody grade is different from the old strict historical gate.

Published precision is preserved. Datum's temporary animated zero is ignored in favor of its explicit HTML target (72 House, 63 Senate). ElectIndex's fresh CSV is 91.8 House and 72.5 Senate; its rounded interface shows 92 and 73. COYNTOSS's current Senate release gives 70.85, rounded to 70.9 at the top. Fred Cornell's detail gives 68.7, rounded to 69 in the summary.

Means, medians, counts of favored districts and unspecified projected figures are different quantities. Vote-Scope's 241 favored districts are kept separate from its 246-seat median. COYNTOSS's House mean of 236.2 is kept separate from its median of 235. On Point's inconsistent seat summaries are not admitted to a seat-error comparison even though the 97% House control probability is consistent. **No seat-error scoring is admitted by this probability-only gate.**

## Validation and publication

Run the gate with an actual trusted clock reading; the container clock is not assumed to equal the session clock:

```sh
python scripts/election_admission.py build --now ACTUAL_UTC_TIMESTAMP
python -m unittest discover -s tests -p test_election_admission.py -v
```

For local custody verification, add `--raw-captures` pointing to the retained working capture directory. This checks all representation hashes, UTF-8 sizes and exact-evidence offsets. It is optional in a public checkout because full publisher pages are not redistributed.

Publication is a two-step operation:

1. Publish the manifest and every referenced factual receipt in one public commit. Verify the public commit and immutable file contents through GitHub. Keep the actual commit and verification times.
2. Save a verified anchor receipt and rebuild `election/comparator-admission.json` with `--anchor-file`. Publish the resulting status in a subsequent commit. The first commit establishes custody; the second reports that verified custody without a self-referential commit hash.

The anchor receipt must contain `status: VERIFIED_PUBLIC_COMMIT`, the full `commit`, `committedAtUtc`, `verifiedAtUtc`, canonical commit `url`, `immutableManifestUrl`, `verificationMethod: GITHUB_COMMIT_AND_IMMUTABLE_FILES`, the exact `manifestSha256`, the `custodySetSha256`, and `verifiedFileCount`. `python scripts/election_admission.py custody` lists the 35 files (manifest plus 34 source receipts) and their custody-set digest. The validator rejects changed receipts, changed manifests, incomplete custody, an anchor preceding capture, a post-cutoff anchor, or a local hash presented as public verification.

The script validates the supplied public-verification receipt; it does not perform a network verification itself. The publishing operator must actually perform that remote check. A fabricated receipt does not constitute independent evidence.

The 22 regression tests cover missing providers and probabilities, event mismatch, Senate alignment, conflicting marginals, invalid probability values, source tampering, capture-window and publication timing, original-lock preservation, quantity distinctions and pre-cutoff public publication. Tests use controlled anchor fixtures only; fixture commits are never written to the live ledger.

## Final cutoff task

`cutoff-roster.json` is the current 14-provider specification for the scheduled freeze. The cutoff remains **2026-11-03 00:00 America/New_York (EST), or 05:00 UTC**. A task starting November 2 at 23:00 New York has one hour before cutoff; its actual capture and public publication must still finish before 05:00 UTC.

The scheduled task must create a new final cohort instead of overwriting this one, retain both chamber slots for every provider, preserve missing and excluded records, use primary sources, keep independent outcomes distinct, and anchor the actual pre-cutoff record. A post-cutoff retrieval cannot be relabeled as a pre-cutoff lock. Official results, Brier scores and any winner remain pending under the documented resolution rules.
