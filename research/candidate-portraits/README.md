# Candidate portrait admission — 31 October 2026

The election browser now has **421 verified portraits for 940 source-listed candidate cards** (421 unique people). This is partial coverage: the original 397 congressional portraits are preserved exactly, and 24 additional candidates have first-party FEC identities and reviewed Commons photographs. The remaining 519 cards have no unique reviewed identity/photo combination and keep initials. The original supplement covers 13 congressional identities that previously lacked photographs and eleven former congressional members.

## Sources and rights

- Identity crosswalk: [unitedstates/congress-legislators, pinned CSV](https://raw.githubusercontent.com/unitedstates/congress-legislators/577ca04282d14688cb14f6559eb27b52bdc50dfc/legislators-current.csv). This community-maintained dataset links congressional names, explicit aliases, states and parties to official Bioguide identifiers. It is not an official ballot roster.
- Images: [unitedstates/images, pinned edition](https://github.com/unitedstates/images/tree/aec3e4a88af843b282c0576f420b930f6a9a46ad). Its [public-domain declaration](https://github.com/unitedstates/images/blob/aec3e4a88af843b282c0576f420b930f6a9a46ad/README.md#public-domain) describes congressional photographs as public domain and links the GPO's assurance. The project dedicates contributions to the public domain.
- Supplemental identities: [the same pinned edition's historical CSV](https://raw.githubusercontent.com/unitedstates/congress-legislators/577ca04282d14688cb14f6559eb27b52bdc50dfc/legislators-historical.csv) supplies individually reviewed name/state/party/Bioguide matches for eleven former members listed below. Their images exist at the already-reviewed pinned image edition. Mike Rogers of Alabama and John H. Sununu are distinct identities and are not substituted. Historical-name matches are not admitted automatically: the 1818-born John Stuart Williams is an unrelated namesake of the source-listed Kentucky candidate and was excluded.
- Supplemental images: `supplemental-sources-2026-10-31.json` records 13 official congressional portraits from Wikimedia Commons. Each has an explicit public-domain declaration, an official House/Senate/Bioguide origin, a captured Commons metadata revision and original-image SHA-1. Unchanged provider thumbnail bytes are stored under `assets/candidate-portraits/` with SHA-256 filenames and actual dimensions; the 13 images total 434,552 bytes. The original Commons API evidence is retained as `commons-metadata-2026-10-31.json` with a verified digest. No generated faces, photographic alterations, or inferred visual identity are used.
- Every original congressional record preserves a pinned image URL and Git blob SHA, or locally stored image bytes and SHA-256, its genuine Bioguide ID, exact matching name and source field, candidate ID/state/party/contest/chamber, source URL, original-source metadata where available, public-domain evidence URL, and UTC review time. Where the archive lacks separate per-image metadata, the pinned original image and corpus declaration provide the recorded source chain. No commercial editorial image licenses are claimed.

The base catalog captures 539 identities and 524 available image references. The supplement adds eleven historical identities, eleven corresponding pinned archive images, and 13 local image captures. Identity records keep only fields used by this resolver, not telephone numbers, addresses, or dates of birth. The original 373 admitted records retain their original image URLs and review timestamps unchanged. The seven later additions also preserve all 390 records from the first supplement exactly and carry their own later review timestamps.

### Newly covered portraits

| Source | Candidates |
| --- | --- |
| Official public-domain Commons images | Nick Begich; Adelita Grijalva; James Gallagher; Aisha Wahab; Clay Fuller; Tom Barrett; Wesley Bell; Analilia Mejia; Matt Van Epps; Christian Menefee; James Walkinshaw; Jon Husted; Darline Graham |
| Pinned congressional archive plus historical identity crosswalk | Mary Peltola; Sherrod Brown; Mike Rogers (Michigan); John E. Sununu; Jerry Carl; Hilda Solis; Melissa Bean; Colin Allred; Ben McAdams; Elaine Luria; Tom Perriello |

## Non-Congress candidates and licensed Commons photographs

`noncongress-sources-2026-10-31.json` adds seven House candidates and seventeen Senate candidates with `identityType: FEC_CANDIDATE` and their actual FEC candidate identifiers. It does not invent Bioguide identifiers. Each photograph is tied to the exact existing discovery record: source candidate ID, name, state, party, chamber and contest. The captured FEC page independently supplies legal name, state, party and office; House candidates must also match the district. FEC registration identifies a filing and does not certify active candidacy, nomination or ballot eligibility.

The identity evidence in `noncongress/fec-identities-2026-10-31.json` records the source URL, HTTP status, capture time, complete original HTML SHA-256 and hashed extracts of the candidate heading and identity sections. It preserves the source party label, including Democratic-Farmer-Labor for Peggy Flanagan. Explicit committee or official-office evidence connects Peggy/Margaret Flanagan, Angie/Angela Nixon and Ken/Warren Kenneth Paxton. Mike McGuire and Manny Rutinel use the public given names already present in their FEC records.

The Commons API captures retain the exact file title, description-page revision, image URL, original image SHA-1, creator and license declaration. The new photographs use only recorded public-domain, CC0, CC BY or CC BY-SA permissions. Images requiring unresolved permission or a disputed source chain are excluded. The 24 downloaded source thumbnails were decoded and inspected, with SHA-256, dimensions, image content type and retrieval time recorded. They are served from their captured Commons URLs; an external URL can later change or fail, so the stored hash describes the captured edition rather than promising immutable hosting. No image bytes are altered, and the existing initials fallback remains available.

Creator attribution, the Commons revision/source link and the reuse-license link are visible beside every additional photograph. The display identifies these as source thumbnails with no additional edits. CC BY-SA conditions remain applicable to image adaptations. These permissions describe each specific photograph; no blanket federal-public-domain claim is applied to state officials or other non-Congress candidates.

| Chamber | Added source-listed candidates |
| --- | --- |
| House | Scott Wiener; Mike McGuire; Connie Chan; Manny Rutinel; Paul LePage; Amish Shah; Rebecca Cooke |
| Senate | Abdul El-Sayed; Adam Hamilton; Angie Nixon; Bert Mizusawa; Dan Osborn; James Talarico; John Deaton; Juliana Stratton; Ken Paxton; Kurt Alme; Mark Baisley; Michael Whatley; Michele Tafoya; Peggy Flanagan; Roy Cooper; Todd Achilles; Troy Jackson |

The adapter never replaces a previously admitted portrait. All 397 pre-adapter records were compared with the preserved input ledger and remain exactly identical. The election forecast locks, projection probabilities and fresh research checkpoint are unaffected.

## Matching and display

Congressional-source admission requires a unique exact documented name or source alias together with the same state and party. FEC-source admission uses the separately captured identity and contest checks above. Punctuation and accents are normalized; optional middle names and suffixes are derived only from source fields. Parenthesized given names are explicit source alternatives. The crosswalk's Wikipedia-title field supplies documented aliases such as Greg Steube. There is no generic nickname dictionary, substring matching, edit-distance matching, or facial identification.

Candidate record IDs alone cannot attach a picture: the browser rechecks the displayed name, state, party, contest and chamber. Duplicate or stale identities are ignored. A portrait verifies the pictured identity and source provenance, not nomination, ballot eligibility, or the discovery roster's incumbent flag. Cross-chamber candidacy is allowed when the identity is otherwise exact.

Portrait counts come from the records actually attached to the displayed roster, rather than the older projection file's zero-portrait snapshot. State counts follow the selected chamber. A missing portrait ledger does not take forecasts offline. Each image reserves its display dimensions, loads lazily, includes candidate-name alt text, and has initials underneath; failed image requests reveal that fallback. Source and rights links appear beside each photo.

## Reproduce and verify

```sh
python scripts/build_candidate_portraits.py
python scripts/build_candidate_portraits.py --check
python -m unittest discover -s tests -p 'test_*candidate_portraits.py'
node --test tests/candidate-portraits.test.cjs
```

The importer makes no live requests. Refresh and review the captured source catalogs before admitting a new edition. It rejects duplicate candidate IDs, ambiguous identities, missing rights declarations, malformed image identifiers, replacement of existing archive images, mismatched Commons evidence, altered local image bytes, and paths outside the allowed candidate-photo directory. The tests preserve all earlier 397 records exactly, reject mismatched FEC identities, House districts, undocumented aliases and incomplete reuse licenses, and distinguish the two politicians named Mike Rogers. Refreshing a projection file must be followed by a rebuild so candidate-card bindings are recalculated.
