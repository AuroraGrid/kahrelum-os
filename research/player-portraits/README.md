# NFL player portraits — 31 October 2026

The reviewed photo ledger covers **all 124 board players**, with 124 distinct ESPN athlete IDs and 124 headshot URLs copied from their source records. It includes 123 players listed by the captured team rosters and one verified free agent, Jack Jones. Photo identity does not establish active roster status or forecast eligibility.

All 124 image resources passed an availability check on 31 October: 116 returned image responses; the eight URLs unsupported by the initial image fetcher were independently checked and each returned HTTP 200 with `Content-Type: image/png`. The catalog records the method, URL and UTC check time for every image. Subsequent CDN failures remain possible and the UI retains its initials fallback.

## Capture and matching

The source catalog captures the identity index from all 32 [ESPN NFL team endpoints](https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=100): 2,559 roster entries. Each roster response provides its team, season, timestamp and athlete records. Only the 124 required athlete photo details are retained alongside the complete name/ID/team/position index. Unrelated personal fields are omitted.

Admission uses an exact normalized documented name, matching team and compatible position, with one unique athlete ID. Suffixes and punctuation may differ. The image URL must already appear in the captured record and its filename ID and source alt text must match that athlete. There is no URL inference from a player's name and no fuzzy nickname lookup.

Three explicit name exceptions have independent official club provenance:

| Board name | Source identity | Verification |
| --- | --- | --- |
| Marquise Brown | Hollywood Brown, ESPN 4241372 | [Eagles profile](https://www.philadelphiaeagles.com/team/players-roster/hollywood-brown/) identifies Marquise Brown and explains his Hollywood nickname. |
| Josh Palmer | Joshua Palmer, ESPN 4242433 | [Bills profile](https://www.buffalobills.com/team/players-roster/joshua-palmer/) uses Josh Palmer at his Joshua Palmer profile URL. |
| Khalil Benson | Kahlil Benson, ESPN 4566190 | [Chiefs profile](https://www.chiefs.com/team/players-roster/kahlil-benson-2/) and ESPN agree on Kahlil Benson, KC offensive tackle. The old board spelling is retained only as a reviewed correction alias. |

## Jack Jones status correction

Jones was absent from the fresh SF roster and his club player page returned 404. The [49ers' 28 October announcement](https://www.49ers.com/news/the-49ers-acquire-dl-deforest-buckner) and [official transaction list](https://www.49ers.com/team/transactions/2026) confirm his release. His [ESPN athlete record](https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/4035686?lang=en&region=us) supplies the name and photo, reports Free Agent status, and retains a historical SF team reference. The ledger therefore records sourceTeam FA, lastTeam SF, and the official release evidence. The old SF board entry must not be interpreted as a current tradeable roster slot.

## Display and rights

These are externally hosted editorial player portraits. Copyright and related rights remain with their respective owners. The ledger does **not** describe ESPN or NFL photos as public domain, CC0, or otherwise openly licensed, and it does not claim that publicly accessible hosting transfers rights. No bulk photo archive is copied into the site.

Display a small portrait from its supplied URL with `Photo: ESPN` linked to the source profile. Keep width and height attributes, lazy loading, player-name alt text and an initials fallback for errors or unavailable records. Bind by the stable board candidate ID plus an explicit `matchNames` entry. Source team and status are provenance fields; use the separate reviewed board/forecast status for current trade eligibility.

## Rebuild and tests

```sh
python scripts/build_player_portraits.py
python scripts/build_player_portraits.py --check
python -m unittest discover -s tests -p test_player_portraits.py
node --test tests/nfl-portraits-dom.test.cjs
```

Rebuild after a canonical board name or team correction. The importer is deterministic and offline. It requires a new reviewed catalog before accepting new roster identities or headshots. Tests cover complete real-board coverage, wrong-team/position rejection, explicit aliases, ambiguous names, missing images, invalid image IDs and Jones's free-agent state.

The DOM harness exercises the actual NFL client against the local desk bundle: all 124 cards, probabilities and photos; all 124 player searches; every team and evidence filter; image-error fallback; and a failed portrait-ledger request. This is functional DOM verification, not rendered browser layout QA. Local Chromium was absent, the connected browser extension was unavailable, and the cloud browser did not expose a permitted local-artifact/viewport bridge, so responsive screenshots at 320, 768 and 1440 pixels were not produced in this environment.
