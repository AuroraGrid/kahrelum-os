# Poliwave-first US election watch: reference and verification protocol

**Status:** Implemented as a reference-only source directory on November 5, 2026. No election returns, model outputs, race calls, maps, or compiled Poliwave datasets are ingested, redistributed, or used to revise an earlier forecast.

## Purpose and scope

KAHRELUM uses [Poliwave's 2026 results](https://www.poliwave.com/us/live/midterms-2026) as its **first-look monitoring reference** for the 470 House and Senate contests already recorded in `election/current-projections.json` (435 House districts, 35 Senate contests). Every race card links to the relevant Poliwave state page or state House delegation page. The [local watchlist](../../election/poliwave-watchlist.json) has 470 independently generated navigational records. It is derived from **KAHRELUM's existing race list**, not from an extraction of Poliwave content.

Poliwave also provides [governor results](https://www.poliwave.com/us/live/midterms-2026/governors), state legislature results and ballot measures, but those are **not** part of the 470-race KAHRELUM congressional forecast register. They must not be silently described as part of this catalog.

## Evidence hierarchy and resolution

1. **First look:** Open the linked Poliwave results to spot races with important leads, margins, counting changes, reported-source switches, or claims of a winner. A link is a route to inspect, not evidence of a result actually checked.
2. **Verify:** Read the applicable state or local election authority's original publication, timestamp, precinct/ballot counting convention, official canvass, and certification record when available. Avoid treating precincts reported as a percentage of ballots counted.
3. **Independent cross-check:** Use AP, DDHQ, or another independently documented source when a call, discrepancy, recount, ranked-choice count, runoff, or certification is consequential. Preserve disagreement and publication timestamps. If the official page cannot be read, log the access limitation and source attribution instead of inventing returns.
4. **Record lock and scoring:** KAHRELUM's pre-election probabilities, receipt hashes, cohort admission, and original forecast locks are immutable historical records. A post-election observation cannot be relabeled a pre-election forecast. A result is scored only against its documented resolution terms, after authoritative verification.

Source status vocabulary: `LINK_REFERENCE_ONLY`, `UNOFFICIAL_OBSERVED`, `OFFICIAL_PRELIMINARY`, `INDEPENDENTLY_CORROBORATED`, `CERTIFIED`, `CONTESTED`, `SOURCE_UNAVAILABLE`. The current watchlist uses only a link-only status; it reports **no** observed votes or calls.

## Poliwave rights and limits

[Poliwave's rights and licensing notice](https://www.poliwave.com/about/licensing) allows ordinary linking and short credited excerpts but requires **prior written permission** to bulk extract, mirror, or republish its compiled datasets, proprietary model output, maps or interface. Attribution alone is not a license. Contact the site through its [rights and licensing notice](https://www.poliwave.com/about/licensing) to seek permission for any proposed bulk use.

The current implementation generates **only external hyperlinks from KAHRELUM's own roster**. It does not call a Poliwave API, automate extraction of every race, save Poliwave results, or use Poliwave calls to settle a contest. Any future automatic result pipeline needs an authorized data source, published terms permitting that use, and testable data-provenance controls.

## Reproduce the link-only catalog

```sh
node scripts/build-poliwave-watchlist.cjs --check
node --test tests/poliwave-race-watch.test.cjs
```

To regenerate after a **reviewed update of KAHRELUM's own race list**, run `node scripts/build-poliwave-watchlist.cjs --write` and rerun the checks. Regeneration must not alter original probabilities, frozen source editions, candidate portrait custody, or scoring criteria. Publishing uses the scoped `poliwave-watch` Firebase profile in Plan → Preview → Promote order and must preserve all production-only files.
