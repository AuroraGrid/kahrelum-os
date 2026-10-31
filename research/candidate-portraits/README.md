# Candidate portrait admission — 31 October 2026

The election browser now has **373 verified portraits for 940 source-listed candidate cards** (373 unique people). This is partial coverage. Another 13 records match a congressional identity but have no image in the captured archive; 554 have no unique exact documented identity match. They keep initials.

## Sources and rights

- Identity crosswalk: [unitedstates/congress-legislators, pinned CSV](https://raw.githubusercontent.com/unitedstates/congress-legislators/577ca04282d14688cb14f6559eb27b52bdc50dfc/legislators-current.csv). This community-maintained dataset links congressional names, explicit aliases, states and parties to official Bioguide identifiers. It is not an official ballot roster.
- Images: [unitedstates/images, pinned edition](https://github.com/unitedstates/images/tree/aec3e4a88af843b282c0576f420b930f6a9a46ad). Its [public-domain declaration](https://github.com/unitedstates/images/blob/aec3e4a88af843b282c0576f420b930f6a9a46ad/README.md#public-domain) describes congressional photographs as public domain and links the GPO's assurance. The project dedicates contributions to the public domain.
- Every admitted record preserves an immutable image URL and Git blob SHA, Bioguide ID, exact matching name and source field, candidate ID/state/party/contest/chamber, source URL, original-source metadata where available, public-domain evidence URL, and UTC review time. Where the archive lacks separate per-image metadata, the pinned original image and corpus declaration provide the recorded source chain. No commercial editorial image licenses are claimed.

The checked-in catalog captures 539 identities and 524 available image references. It keeps only the identity fields used by this resolver, not telephone numbers, addresses, or dates of birth. Images are externally hosted at their pinned source edition; the site does not need a bulk image archive.

## Matching and display

Admission requires a unique exact documented name or source alias together with the same state and party. Punctuation and accents are normalized; optional middle names and suffixes are derived only from source fields. Parenthesized given names are explicit source alternatives. The crosswalk's Wikipedia-title field supplies documented aliases such as Greg Steube. There is no generic nickname dictionary, substring matching, edit-distance matching, or facial identification.

Candidate record IDs alone cannot attach a picture: the browser rechecks the displayed name, state, party, contest and chamber. Duplicate or stale identities are ignored. A portrait verifies the pictured identity and source provenance, not nomination, ballot eligibility, or the discovery roster's incumbent flag. Cross-chamber candidacy is allowed when the identity is otherwise exact.

Portrait counts come from the records actually attached to the displayed roster, rather than the older projection file's zero-portrait snapshot. State counts follow the selected chamber. A missing portrait ledger does not take forecasts offline. Each image reserves its display dimensions, loads lazily, includes candidate-name alt text, and has initials underneath; failed image requests reveal that fallback. Source and rights links appear beside each photo.

## Reproduce and verify

```sh
python scripts/build_candidate_portraits.py
python scripts/build_candidate_portraits.py --check
python -m unittest discover -s tests -p test_candidate_portraits.py
node --test tests/candidate-portraits.test.cjs
```

The importer makes no live requests. Refresh and review the captured source catalog before admitting a new edition. It will reject duplicate candidate IDs, ambiguous identities, missing rights declarations and malformed image identifiers. Refreshing a projection file must be followed by a rebuild so candidate-card bindings are recalculated.
