# Lineups & Lines

**Separate sports research property.** This project is independent of KAHRELUM's business website and has its own sources, methods, and release process. The intended no-cost address is `lineupsandlines.pages.dev` **only if Cloudflare accepts and registers it**; it is **not claimed, live or deployed** by this repository alone.

## What works today

- **Odds Board**: timestamped US and international bookmaker comparisons via The Odds API v4. A free key is required. Upstream bookmaker coverage and provider entitlements determine actual records. Server-side calls are credit-capped, cached and explicitly fail closed without a secret and KV namespace. A quote is **not streaming**, and no price is invented.
- **Fantasy Drafts**: Sleeper official public NFL league/draft/pick lookup. This API is free **only for noncommercial use**. Do not monetize or serve commercial users without Sleeper approval.
- **Edge Lab**: straight-bet-only expected-value calculator. FRIENDS 52.5–54.49% informational; FRIENDS SLIGHT EDGE 54.5–54.99% if the offered odds clear a 2pp edge and +3% modeled ROI; STRONG OPTIONAL 55–57.99%, conditional $25; CERTIFIED 58%+, conditional $50. All positive stake caps require independent model review, which the public calculator does not supply, so displayed actionable stake is always $0.
- **Provider register**: registered, gated, and unconnected feeds are explicitly separate. No automatic wagers, Yahoo OAuth, ESPN login, ticket purchases, private account access, or bookmaker scraping.

## Install, run tests, use local preview

Node.js >=20 is needed. No npm dependencies. Run:

```shell
npm test
npm run check
```

For a full Cloudflare Functions preview, use the official Wrangler CLI, if installed:

```shell
npx wrangler pages dev public
```

The static files can be previewed in an HTTP static server, but `/api/*` features require Cloudflare Pages Functions. Site root is the `public` directory, and endpoints are in the top-level `functions` directory.

## Deploy: Cloudflare Pages, free tier, Git-connected

1. Go to Cloudflare Dashboard > Workers & Pages > Create application > Pages > **Connect to Git**.
2. Select the source GitHub repository or dedicated `lineups-and-lines` branch. **Main branch:** select the actual sports branch if the code is staged there; do not accidentally connect the KAHRELUM business `main` branch. Choose project name `lineupsandlines` **if available**. Production branch must contain this project, not the business website.
3. Framework preset `None`; Build command **blank**; output directory **`public`**; Functions are detected from the top-level **`functions`** directory. The default project URL is `<chosen-project>.pages.dev`.
4. Open **Settings > Variables and Secrets**. Add `ODDS_API_KEY` as an **encrypted secret** only (never public JS, repo, or URL). Get a $0/free key directly from [The Odds API](https://the-odds-api.com/).
5. Under **Settings > Bindings**, create or attach a Workers KV namespace bound as **`ODDS_CACHE`** to both production and preview if needed. Without it, the odds endpoint fails closed (no remote credits spent). Use encrypted secrets, not the public `vars` setting for API keys.
6. Optionally set plaintext `ODDS_DAILY_CREDIT_LIMIT=10` and `ODDS_MONTHLY_CREDIT_LIMIT=300`. The code clamps higher values to 10/300. These are conservative ceilings below The Odds API's 500-credit free tier to leave headroom and avoid exhaustion.
7. Deploy, visit `/api/status` and `/api/odds?region=us&market=h2h&sport=americanfootball_nfl`. Confirm timestamps and bookmaker data are real before showing public users.
8. With no API key, the website remains a valid UI and clearly reports **NOT_CONFIGURED**, not fake odds. For heavy concurrency or commercial traffic, replace KV counter with an atomic Durable Object service and secure licensing before production rollout.

## Quota and data fidelity

The Odds API charges credits by sport, market and region. Only **one sport, one region, one market per request** is permitted. The server caches each combination for 30 minutes, globally via Workers KV, and limits calls to at most 10 credits per day and 300 credits per calendar month based on KV counters. Note: **Workers KV is eventually consistent**, so counters are not transactional under concurrent requests. This conservative implementation is appropriate only for low-traffic, noncommercial beta testing; high-concurrency deployments require an atomic global quota gate (such as a Durable Object). A 500-credit allowance **does not permit continuous live streaming across every bookmaker, sport and region**. The upstream provider's own remaining-credit header is surfaced without exposing the secret.

Also, the API's `observedAt` is **when our server received the snapshot**; each bookmaker market has its separate `updatedAt` timestamp. Started events are labeled `STARTED_STATUS_UNCONFIRMED`, not guaranteed active live markets. A prospective *first-observed* quote is not necessarily an actual bookmaker opening line. Do not backfill fabricated opening prices. A 3-market, 4-region request every 5 minutes would burn through a free quota rapidly, so this project does not implement it.

**Provider rights:** The Odds API permits display within an analytical website but prohibits standalone raw-data feed resale. Do not redistribute this app's backing endpoint as a data product. Sleeper's no-token API is expressly noncommercial. Yahoo Fantasy requires developer approval and OAuth. Direct sportsbook scraping of protected interfaces is not used. Check jurisdiction and provider restrictions before any commercial expansion.

**Free vs live:** Cloudflare Pages has a free tier; an unclaimed `pages.dev` subdomain does not belong to you until Cloudflare creates the project. The website does not place real bets or promote guaranteed gains.

## Sources

- [The Odds API v4 documentation](https://the-odds-api.com/liveapi/guides/v4/)
- [The Odds API free pricing](https://the-odds-api.com/)
- [The Odds API bookmaker list](https://the-odds-api.com/sports-odds-data/bookmaker-apis.html)
- [The Odds API terms](https://the-odds-api.com/terms-and-conditions.html)
- [Sleeper official API](https://docs.sleeper.com/)
- [Yahoo developer portal](https://sports.yahoo.com/developer/)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Cloudflare Pages Functions secrets](https://developers.cloudflare.com/pages/functions/bindings/)
- [Cloudflare KV limits](https://developers.cloudflare.com/kv/platform/limits/)

## Upstream custody and separation

Original KAHRELUM betting-rule implementation is recoverable in the public repository history at commit `1eb4e92392adbfe0884987bdc7fc5dc1d24c25ab`; it was subsequently removed from the KAHRELUM production overlay at commit `c998879c6a9764e6395eca2db9103890775c4fdc`. This project reimplements the reviewed rules independently. No forecasts, wins, losses, or bets have been imported or reclassified as prospective.
