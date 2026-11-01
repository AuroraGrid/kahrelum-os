# KAHRELUM Sports GameCenter

This isolated application continues the recovered Week 8 GameCenter package. It replaces the preview-video interface with the requested compact Game / Stats / Highlights / Fantasy / Predict layout and a Cloudflare Pages server data layer. It is **not a completed live deployment**. No live-data account, private fantasy connection, or inline production video playback has been verified in this build session.

The existing `main` website and `lineups-and-lines` branch are not changed by this directory. Deploy only to a separate Pages project after inspecting the authenticated Cloudflare account. The intended project name in `wrangler.jsonc` is a requested name, not evidence that the project exists.

## Preserved original

Source: `KAHRELUM_NFL_WEEK8_LIVE_SOURCE_AND_TESTS.zip`, recovered November 1, 2026. The original JSON and imported snapshot module are copied without byte changes. `FORECAST_SHA256.txt` records the JSON digest. All 13 probabilities and 46 player metric projections remain unchanged. TEN at CIN is stored as `0.8249`, displayed **82.5%**, with a projected **CIN 29–TEN 17**.

The source describes a shadow composite, not a validated live forecasting engine. It does not supply independently authenticated pre-kickoff timestamp evidence. The interface preserves that limitation. Completed-result claims embedded in the source are not promoted into the actual live scoreboard. Brier scoring requires an exact matching game, a recent successful provider retrieval and `closed` status; ties remain withheld under the original binary rule.

## Build and checks

Requires Node 22 or newer.

```sh
npm ci
npm test
npm run build
npm run dev
```

`dist` contains the public assets and a bundled advanced-mode `_worker.js`. No runtime dependency installation, paid database, KV namespace or paid infrastructure is created by the build. Worker requests and provider calls are still subject to their account quotas. Use `npm run test:browser` with Playwright installed and an available Chromium browser; `CHROMIUM_EXECUTABLE` can point at an existing Chromium binary. All synthetic live data stays inside tests and never enters `public` or `dist`.

Cloudflare Git build settings, after account inspection:

- Source branch: `codex/nfl-gamecenter-20261101`.
- Root directory: `gamecenter`.
- Build command: `npm ci && npm test && npm run build`.
- Output directory: `dist`.
- Separate project only; never bind this source to `lineupsandlives` or deploy it to Firebase.

## Live data

Implemented provider: documented Sportradar NFL official production v7 endpoints, using a server-only `x-api-key` header. Requires both `SPORTRADAR_API_KEY` and `SPORTRADAR_DISTRIBUTION_AUTHORIZED=true`, backed by actual rights to distribute the data. A trial key is not silently treated as production authorization. Neither value was available to this session. No subscription was purchased.

The adapter uses weekly schedule, per-game box score, play-by-play and statistics. The game key includes season, season type, week and exact home/away teams. Sportradar UUIDs identify games and players. Revised plays replace earlier versions by event ID. No name-based cross-platform player joins are performed.

Public responses are not cached in visitors' browsers. Provider responses use the Cloudflare edge Cache API with a one-hour schedule interval, 60-second active game interval and 600-second closed-game interval. These are per-edge caches, not a global quota limiter. Production activation still requires sizing provider/account limits to traffic. This first build polls only the current week's games and the selected game's details; it does not implement an unattended schedule or change-log ingestion service. Cache loss can cause a fresh source call. API/source timestamps are displayed separately from retrieval time. Missing source update timestamps are reported as unknown latency.

Before configuration the application exposes only the 13 saved Week 8 forecast matchups. Other weeks have a truthful unavailable state. It does **not** claim full NFL coverage while disconnected. The prior undocumented ESPN scoreboard is not active in the production build.

## Highlights — strict inline playback

The registry `server/highlights.json` is intentionally empty. No video is currently admitted. The prior pregame preview is excluded.

Admission requires all of: exact game key/season/type/week/teams, a play ID, game-action review, publisher and publication time, documented permitted embedding, recent availability check, and actual playback evidence from both mobile and desktop **on the deployment's exact origin**. Evidence records must state that media time advanced and real game action was seen. Iframe load, preview-origin checks and thumbnails are insufficient. The implementation validates recorded evidence; it does not manufacture it or independently recognize the content of footage.

Current player implementation: official YouTube IFrame API, with provider controls and branding intact. This may carry an authorized clip from an approved publisher, but no such clip was verified. Playback errors or no advancing playback after 20 seconds remove the item. The client never substitutes an outbound watch link. Empty state: **No playable highlights available**. Same-play duplicates are collapsed by play ID and angle; separately verified alternative angles remain available.

X, Bleacher Report/B/R Gridiron/House of Highlights and Sleeper were evaluated. X has an official embed surface; that alone is not playback evidence or proof of game identity. A permitted direct B/R or Sleeper player and discovery feed were not established. The documented Sleeper fantasy API does not establish a highlight API. These providers remain withheld. Automated discovery and third-party player adapters remain unimplemented until permitted mechanisms and verifiable playback are available. No video bytes are downloaded, rehosted, proxied or stripped of branding.

Every candidate must be manually verified on the actual deployed origin before adding evidence to the registry. Availability evidence expires after 15 minutes and playback evidence after six hours; expired records disappear. An operational re-verification process is still needed before claiming an ongoing highlights service.

## Private fantasy

The entire `/api/fantasy` endpoint verifies an RS256 Cloudflare Access application JWT: signature, issuer, audience, expiry, issued-at and subject. Unconfigured auth fails closed. Spoofed identity/email headers and arbitrary league query parameters confer no access. Responses use `private, no-store`; private league data never enters the public static bundle or public provider cache.

Configure an Access application protecting `/fantasy` and `/api/fantasy*` on the separate production origin, and provide `ACCESS_ISSUER` and `ACCESS_AUD`. Public game pages remain public. Set the secret `FANTASY_CONNECTIONS` to a server-side mapping from **verified Access subjects** to their own approved league connections. This build does not include self-service account linking. No credentials or league IDs belong in the repository. User-controlled IDs are never accepted as ownership proof.

A connection record uses `id`, `provider`, `season`, `leagueId`, `teamId`, `userId` (Sleeper), optional `name`, and explicit `verifiedOwnership` and `permittedUse` flags. An operator must verify ownership and permitted access before setting those flags.

- **Sleeper:** documented read-only league, roster, matchup and player directory adapter. Requires `SLEEPER_USAGE=noncommercial` for qualifying use or `licensed` with actual commercial permission. API documentation limits free access to noncommercial use. The app uses reported league points and any supplied player-points field; missing player points remain unavailable. Commissioner overrides, IDP rules, superflex slots and each league's roster/scoring settings are preserved separately.
- **Fleaflicker:** documented read endpoints for league rules, roster and scoreboard; snake_case and camelCase JSON field forms are normalized. Displays source-calculated points, without assuming universal scoring or recomputing tiered bonuses. Private provider auth and actual league access remain unverified; restricted leagues use direct access until supported authentication is established.
- **Yahoo:** approved OAuth/application connection was not available. OAuth and Yahoo response parsing are not implemented in this build; clearly labeled direct access remains. Do not claim Yahoo is connected.
- **ESPN/CBS:** authorized supported app access was not established. Direct-access fallback only; no browser cookies are extracted or reused as an unofficial API integration.

There are no lineup, trade, add, drop, or other fantasy mutation routes. A player in two leagues appears in two separate league sections with separate platform-reported scores. Team/week filtering is used for game impacts; historical player identity crosswalks and stat-correction notifications have not been validated.

## Verification boundary and blockers

Read `VERIFICATION.md` for test results and remaining production acceptance checks. The connected remote-device tool reported the ThinkPad offline. The authorized Edge browser showed Cloudflare's sign-in page. No Cloudflare account configuration, deployment ID or production URL could therefore be verified. No claim of production availability is made.

## Primary documentation consulted

- [Sportradar NFL overview](https://developer.sportradar.com/football/reference/nfl-overview)
- [Live game retrieval and response shapes](https://developer.sportradar.com/football/docs/nfl-ig-live-game-retrieval)
- [Sportradar weekly schedule](https://developer.sportradar.com/football/reference/nfl-weekly-schedule)
- [Sportradar player/team statistics](https://developer.sportradar.com/football/reference/nfl-game-statistics)
- [Sleeper API and usage terms](https://docs.sleeper.com/)
- [Fleaflicker API](https://www.fleaflicker.com/api-docs/index.html)
- [Yahoo Fantasy developer documentation](https://sports.yahoo.com/developer/docs/)
- [Yahoo application confirmation](https://sports.yahoo.com/developer/application-confirmation/)
- [X official embed help](https://help.x.com/en/using-x/how-to-embed-a-post)
- [Bleacher Report video sharing guidance](https://support.bleacherreport.com/hc/en-us/articles/36113741275539-Managing-Live-Streams-and-Video-Sharing-on-Bleacher-Report)
- [Cloudflare Access JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)
