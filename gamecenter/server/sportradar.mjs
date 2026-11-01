import { gameKey, teamCode, numeric } from "../public/assets/domain.mjs";
import { ApiError, getJSON } from "./http.mjs";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
export function configured(env) {
  return Boolean(
    env.SPORTRADAR_API_KEY && env.SPORTRADAR_DISTRIBUTION_AUTHORIZED === "true",
  );
}
export function normalizeGame(raw, selection, source) {
  if (!UUID.test(raw.id || "") || !raw.away?.alias || !raw.home?.alias)
    throw new ApiError(
      502,
      "INVALID_GAME",
      "Source game identity is incomplete",
    );
  const { season, week, type } = selection,
    started = ["inprogress", "complete", "closed", "suspended"].includes(
      raw.status,
    );
  const situation = raw.situation || {};
  return {
    key: gameKey(season, type, week, raw.away.alias, raw.home.alias),
    providerId: raw.id,
    season,
    seasonType: type,
    week,
    away: teamCode(raw.away.alias),
    home: teamCode(raw.home.alias),
    scheduled: raw.scheduled,
    status: raw.status,
    awayScore: started
      ? numeric(raw.away.points ?? raw.scoring?.away_points)
      : null,
    homeScore: started
      ? numeric(raw.home.points ?? raw.scoring?.home_points)
      : null,
    period: raw.quarter ?? null,
    clock: raw.clock ?? null,
    source,
    venue: raw.venue?.name || null,
    situation: {
      possession: teamCode(situation.possession?.alias) || null,
      down: situation.down ?? null,
      distance: situation.yfd ?? null,
      yardline: situation.location?.yardline ?? null,
      territory: teamCode(situation.location?.alias) || null,
    },
  };
}
export function normalizePlays(raw) {
  const plays = new Map(),
    drives = [];
  for (const period of raw.periods || [])
    for (const item of period.pbp || []) {
      if (item.type === "drive" && item.scoring_drive)
        drives.push({
          id: item.id,
          period: period.number,
          description: item.end_reason,
          plays: item.play_count,
          yards: item.gain,
          duration: item.duration,
        });
      for (const p of item.type === "drive" ? item.events || [] : [item])
        if (p.id && p.type === "play" && p.description) {
          const row = {
            id: p.id,
            sequence: p.sequence || 0,
            period: period.number,
            clock: p.clock || null,
            text: p.description,
            updatedAt: p.updated_at || null,
            playType: p.play_type || null,
          };
          const prev = plays.get(p.id);
          if (
            !prev ||
            Date.parse(row.updatedAt) >= Date.parse(prev.updatedAt) ||
            !prev.updatedAt
          )
            plays.set(p.id, row);
        }
    }
  return {
    plays: [...plays.values()].sort((a, b) => b.sequence - a.sequence),
    drives,
  };
}
export function normalizeStats(raw) {
  const playerStats = [],
    teamStats = [];
  for (const side of ["away", "home"]) {
    const team = raw.statistics?.[side] || raw[side];
    if (!team) continue;
    const code = teamCode(team.alias || raw[side]?.alias),
      statistics = team.statistics || team;
    for (const [category, group] of Object.entries(statistics)) {
      if (!group || typeof group !== "object" || Array.isArray(group)) continue;
      const totals = group.totals || group.total;
      if (totals)
        for (const [metric, value] of Object.entries(totals))
          if (numeric(value) !== null)
            teamStats.push({ team: code, category, metric, value });
      for (const player of group.players || [])
        if (player.id && player.name)
          playerStats.push({
            id: `sportradar:${player.id}`,
            team: code,
            name: player.name,
            category,
            stats: Object.entries(player)
              .filter(
                ([k, v]) =>
                  numeric(v) !== null && !["jersey", "number"].includes(k),
              )
              .map(([metric, value]) => ({ metric, value })),
          });
    }
  }
  return { playerStats, teamStats };
}
export async function providerGet(path, env, ctx, seconds, fetcher = fetch) {
  if (!configured(env))
    throw new ApiError(
      503,
      "LIVE_NOT_CONFIGURED",
      "Authorized live data is not connected",
    );
  const url = `https://api.sportradar.com/nfl/official/production/v7/en/${path}`;
  const cache = typeof caches === "undefined" ? null : caches.default;
  const key = new Request(`https://gamecenter-cache.invalid/v1/${path}`);
  const cached = await cache?.match(key);
  if (cached) return cached.json();
  const result = await getJSON(url, {
    headers: { "x-api-key": env.SPORTRADAR_API_KEY },
    fetcher,
  });
  const output = {
    ...result,
    source: {
      name: "Sportradar",
      fetchedAt: result.fetchedAt,
      updatedAt: result.data.updated_at || result.modifiedAt || null,
      staleAfterSeconds: seconds + 90,
      error: null,
    },
  };
  if (cache) {
    const saved = new Response(JSON.stringify(output), {
      headers: {
        "Cache-Control": `public, max-age=${seconds}`,
        "Content-Type": "application/json",
      },
    });
    ctx.waitUntil(cache.put(key, saved));
  }
  return output;
}
export async function schedule(selection, env, ctx, fetcher = fetch) {
  const r = await providerGet(
    `games/${selection.season}/${selection.type}/${selection.week}/schedule.json`,
    env,
    ctx,
    3600,
    fetcher,
  );
  const games = r.data.week?.games || r.data.games;
  if (!Array.isArray(games))
    throw new ApiError(
      502,
      "INVALID_SCHEDULE",
      "Source schedule is incomplete",
    );
  return {
    games: games
      .filter((g) => !g.deleted)
      .map((g) =>
        normalizeGame(g, selection, { ...r.source, staleAfterSeconds: 3690 }),
      ),
    source: r.source,
  };
}
export async function liveBoard(selection, env, ctx, fetcher = fetch) {
  const board = await schedule(selection, env, ctx, fetcher);
  const games = await Promise.all(
    board.games.map(async (g) => {
      if (
        ["cancelled", "unnecessary", "postponed", "time-tbd"].includes(
          g.status,
        ) ||
        Date.parse(g.scheduled) > Date.now() + 600000
      )
        return g;
      try {
        const r = await providerGet(
          `games/${g.providerId}/boxscore.json`,
          env,
          ctx,
          g.status === "closed" ? 600 : 60,
          fetcher,
        );
        const live = normalizeGame(r.data, selection, r.source);
        if (live.providerId !== g.providerId || live.key !== g.key)
          throw Error("Identity mismatch");
        return live;
      } catch {
        return {
          ...g,
          source: { ...g.source, error: "Current box score unavailable" },
        };
      }
    }),
  );
  return { ...board, games };
}
export async function detail(game, env, ctx, fetcher = fetch) {
  if (!UUID.test(game.providerId || ""))
    throw new ApiError(400, "INVALID_GAME", "Invalid provider game ID");
  if (
    ["scheduled", "created", "time-tbd"].includes(game.status) &&
    Date.parse(game.scheduled) > Date.now() + 600000
  )
    return {
      game,
      plays: [],
      drives: [],
      playerStats: [],
      teamStats: [],
      errors: [],
      pollAfterSeconds: 60,
    };
  const ttl = game.status === "closed" ? 600 : 60;
  const resources = ["boxscore", "pbp", "statistics"];
  const results = await Promise.allSettled(
    resources.map((name) =>
      providerGet(
        `games/${game.providerId}/${name}.json`,
        env,
        ctx,
        ttl,
        fetcher,
      ),
    ),
  );
  const parts = {},
    sources = {},
    errors = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      if (r.value.data.id !== game.providerId)
        throw new ApiError(
          502,
          "GAME_MISMATCH",
          "Source returned a different game",
        );
      parts[resources[i]] = r.value.data;
      sources[resources[i]] = r.value.source;
    } else
      errors.push({
        resource: resources[i],
        message:
          r.reason instanceof ApiError
            ? r.reason.message
            : "Source unavailable",
      });
  }
  if (!parts.boxscore)
    throw new ApiError(
      502,
      "BOX_SCORE_UNAVAILABLE",
      "Current game score unavailable",
    );
  const current = normalizeGame(
    { ...game, ...parts.boxscore },
    { season: game.season, type: game.seasonType, week: game.week },
    sources.boxscore,
  );
  if (current.key !== game.key)
    throw new ApiError(
      502,
      "GAME_MISMATCH",
      "Source teams do not match selected game",
    );
  return {
    game: current,
    ...normalizePlays(parts.pbp || {}),
    ...normalizeStats(parts.statistics || {}),
    sources,
    errors,
    pollAfterSeconds: ttl,
  };
}
