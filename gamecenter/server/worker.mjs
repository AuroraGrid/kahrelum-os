import snapshot from "../public/data/2026-week8-shadow.json" with { type: "json" };
import registry from "./highlights.json" with { type: "json" };
import { archiveGames, attachForecast } from "../public/assets/domain.mjs";
import { selectClips } from "../public/assets/highlight-policy.mjs";
import { ApiError, json, selection } from "./http.mjs";
import { configured, schedule, liveBoard, detail } from "./sportradar.mjs";
import { authConfigured, verifyIdentity, connectionsFor } from "./auth.mjs";
import { platforms, fetchLeague } from "./fantasy.mjs";
const security = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-Frame-Options": "DENY",
};
export async function handle(
  request,
  env = {},
  ctx = { waitUntil: () => {} },
  fetcher = fetch,
) {
  const url = new URL(request.url),
    path = url.pathname;
  if (request.method !== "GET")
    return json(
      { error: "READ_ONLY", message: "Only read access is supported" },
      405,
    );
  try {
    if (path === "/api/status")
      return json({
        live: configured(env) ? "CONFIGURED_UNVERIFIED" : "NOT_CONFIGURED",
        provider: "Sportradar",
        fantasyAuthentication: authConfigured(env)
          ? "CONFIGURED"
          : "NOT_CONFIGURED",
        platforms,
        highlights: "PLAYBACK_UNVERIFIED",
        sources: registry.sources,
      });
    if (path === "/api/fantasy") {
      const identity = await verifyIdentity(request, env, fetcher),
        s = selection(url),
        connections = connectionsFor(env, identity).filter(
          (c) => Number(c.season) === s.season,
        );
      const leagues = await Promise.all(
        connections.map(async (c) => {
          try {
            return {
              status: "CONNECTED",
              ...(await fetchLeague(c, s.week, env, ctx, fetcher)),
            };
          } catch (e) {
            return {
              id: c.id,
              provider: c.provider,
              name: c.name || c.provider,
              status: "UNAVAILABLE",
              message:
                e instanceof ApiError ? e.message : "Platform unavailable",
            };
          }
        }),
      );
      return json({ leagues, platforms, readOnly: true });
    }
    if (
      path === "/api/games" ||
      path === "/api/game" ||
      path === "/api/highlights"
    ) {
      const s = selection(url);
      let board;
      if (!configured(env))
        board = {
          games:
            s.season === snapshot.season &&
            s.type === "REG" &&
            s.week === snapshot.week
              ? archiveGames(snapshot)
              : [],
          source: null,
          error: "Authorized live data is not connected",
          coverage: "FROZEN_FORECAST_SLATE_ONLY",
        };
      else
        board = {
          ...(await (path === "/api/games" ? liveBoard : schedule)(
            s,
            env,
            ctx,
            fetcher,
          )),
          coverage: "PROVIDER_SCHEDULE",
        };
      if (path === "/api/games")
        return json({
          ...board,
          games: board.games.map((g) => attachForecast(g, snapshot)),
          pollAfterSeconds: 60,
        });
      const game = board.games.find(
        (g) => g.key === url.searchParams.get("game"),
      );
      if (!game)
        throw new ApiError(
          404,
          "GAME_NOT_FOUND",
          "Game not found in this season and week",
        );
      if (path === "/api/highlights")
        return json({
          groups: selectClips(registry.clips, game, url.origin),
          status: "ONLY_VERIFIED_INLINE_PLAYBACK",
          sources: registry.sources,
        });
      if (!configured(env))
        return json({
          game: attachForecast(game, snapshot),
          plays: [],
          drives: [],
          playerStats: [],
          teamStats: [],
          errors: [{ resource: "live", message: board.error }],
          pollAfterSeconds: 60,
        });
      const d = await detail(game, env, ctx, fetcher);
      return json({ ...d, game: attachForecast(d.game, snapshot) });
    }
    if (path.startsWith("/api/")) return json({ error: "NOT_FOUND" }, 404);
    if (path === "/fantasy") {
      await verifyIdentity(request, env, fetcher);
      return Response.redirect(`${url.origin}/?tab=fantasy`, 302);
    }
    if (!env.ASSETS)
      return new Response("Asset binding missing", { status: 503 });
    const r = await env.ASSETS.fetch(request),
      headers = new Headers(r.headers);
    for (const [k, v] of Object.entries(security)) headers.set(k, v);
    return new Response(r.body, { status: r.status, headers });
  } catch (e) {
    return json(
      {
        error: e instanceof ApiError ? e.code : "SOURCE_UNAVAILABLE",
        message:
          e instanceof ApiError ? e.message : "Source temporarily unavailable",
      },
      e instanceof ApiError ? e.status : 502,
    );
  }
}
export default { fetch: handle };
