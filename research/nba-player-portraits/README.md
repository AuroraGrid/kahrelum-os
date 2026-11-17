# NBA roster portraits — 31 October 2026

This capture contains **522 roster-listed players from all 30 NBA teams**, with **522 unique ESPN athlete IDs**. All 522 source-supplied portrait URLs returned HTTP 200 and `Content-Type: image/png` during HEAD checks. The capture completed at **2026-10-31 04:55:39 UTC**. There were no duplicate player identities across the captured team rosters and no missing portrait records.

The public ledger is `sports/nba-player-portraits.json`; its schema is `KAHRELUM_NBA_PLAYER_PORTRAITS_v1.0`. It is a player directory and portrait snapshot. It does not activate trade monitoring, injury monitoring, predictions, player grades or game statistics.

## Source and custody

The team universe comes from the [ESPN NBA team index](https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams?limit=100). Each team ID is copied from that response and used to read its public ESPN NBA roster endpoint. The minimized catalog preserves the exact roster API URL, source timestamp, season, retrieval timestamp, HTTP metadata, original response byte count and SHA-256 digest for every roster and the team index. ESPN identifies this capture's season as 2026–27.

Athlete numeric IDs, NBA-specific UIDs, exact displayed names, team assignments, positions, jersey numbers, profile URLs, headshot URLs and headshot alt text are copied from each roster response. The builder never infers a headshot URL from a name or constructs an athlete ID. NBA record IDs use the `NBA-ESPN-` prefix and require the source's `s:40~l:46~a:` namespace, keeping them separate from NFL records.

The source catalog keeps only fields needed for the directory and its evidence receipts. It omits dates of birth, salaries, contracts, injuries, personal background, statistics and forecasts. Full source responses are not checked in; their hashes identify the bytes observed, while the minimized captured fields make the directory reproducible. These are provider roster listings, not independent verification of NBA eligibility or availability for a particular game. Team roster sizes range from 15 to 19 in this snapshot; the builder preserves what the provider returned rather than inventing a fixed roster size.

## Photo identity, availability and rights

Each photo is accepted only when its HTTPS ESPN CDN URL contains that exact source athlete ID in the NBA headshot path, its source alt text matches a documented name, its supplied ESPN NBA profile URL contains the same ID, and its availability check belongs to the same URL. Duplicate teams, duplicate athlete IDs, cross-league identities and mismatched image/profile identifiers fail the build. There is no fuzzy name matching or facial identification.

All checks in this edition used HEAD requests. They establish current endpoint availability and image media type, not perpetual availability or a separate visual audit of every image. Each record includes its check method, URL, HTTP status, media type and UTC check time.

Images remain externally hosted. Display the supplied URL with the player's name as alt text, reserved dimensions, lazy loading, a linked **Photo: ESPN** attribution and an initials fallback. Copyright and related rights remain with their respective owners. No open license, public-domain status, endorsement or copyright transfer is claimed. The project does not store a bulk archive of these images.

Missing or unavailable pictures do not remove players from the directory. They produce an `UNRESOLVED` portrait with `url: null`, a recorded reason and a corresponding entry in the ledger's `unresolved` array. This capture has zero such records, but failed future image requests must still show initials.

## Reproduce and refresh

The default rebuild and check are offline and deterministic:

```sh
python3 scripts/build_nba_player_portraits.py
python3 scripts/build_nba_player_portraits.py --check
python3 -m unittest discover -s tests -p test_nba_player_portraits.py -v
```

An explicitly requested new capture reads public source endpoints and checks every supplied photo URL:

```sh
python3 scripts/build_nba_player_portraits.py --capture
```

For a separately dated edition, supply a new `--catalog` path and retain the earlier catalog. Each successful build records the catalog's SHA-256 digest in the output. New roster or image identity conflicts must be reviewed before publishing a replacement snapshot.

The seven tests pass for the actual captured directory and exercise full team coverage, unique identity accounting, exact source bindings, cross-league rejection, duplicate team/player failures, missing-photo fallbacks and invalid source receipts. They are software and source-binding checks, not evidence of basketball forecasting skill.
