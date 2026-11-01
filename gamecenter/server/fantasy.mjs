import { numeric, teamCode } from "../public/assets/domain.mjs";
import { ApiError, getJSON } from "./http.mjs";
export const platforms = [
  {
    id: "yahoo",
    name: "Yahoo Fantasy",
    status: "NOT_CONNECTED",
    reason:
      "Approved Yahoo application and read-only OAuth connection required.",
    url: "https://football.fantasysports.yahoo.com/",
  },
  {
    id: "espn",
    name: "ESPN Fantasy",
    status: "DIRECT_ACCESS",
    reason: "No authorized supported application access verified.",
    url: "https://fantasy.espn.com/football/",
  },
  {
    id: "fleaflicker",
    name: "Fleaflicker",
    status: "NOT_CONNECTED",
    reason:
      "Documented read adapter ready; verified league connection required.",
    url: "https://www.fleaflicker.com/nfl",
  },
  {
    id: "cbs",
    name: "CBS Fantasy",
    status: "DIRECT_ACCESS",
    reason: "Current approved developer access has not been established.",
    url: "https://www.cbssports.com/fantasy/football/",
  },
  {
    id: "sleeper",
    name: "Sleeper Fantasy",
    status: "NOT_CONNECTED",
    reason:
      "Read adapter ready; verified league connection and permitted usage required.",
    url: "https://sleeper.com/",
  },
];
function id(value) {
  if (!/^\d{1,24}$/.test(String(value || "")))
    throw new ApiError(
      503,
      "INVALID_CONNECTION",
      "League connection is invalid",
    );
  return String(value);
}
export function sleeperLeague(
  connection,
  league,
  rosters,
  matchups,
  players,
  week,
) {
  if (
    league.sport !== "nfl" ||
    Number(league.season) !== Number(connection.season) ||
    String(league.league_id) !== String(connection.leagueId)
  )
    throw new ApiError(
      502,
      "LEAGUE_MISMATCH",
      "League or season did not match connection",
    );
  const own = rosters.find(
    (r) =>
      String(r.roster_id) === String(connection.teamId) &&
      [r.owner_id, ...(r.co_owners || [])]
        .map(String)
        .includes(String(connection.userId)),
  );
  if (!own)
    throw new ApiError(
      403,
      "LEAGUE_MEMBERSHIP",
      "Verified user is not associated with this roster",
    );
  const m = matchups.find(
    (m) => String(m.roster_id) === String(connection.teamId),
  );
  if (!m)
    throw new ApiError(
      502,
      "MATCHUP_UNAVAILABLE",
      "Weekly matchup unavailable",
    );
  const opponents =
    m.matchup_id == null
      ? []
      : matchups
          .filter(
            (x) => x.matchup_id === m.matchup_id && x.roster_id !== m.roster_id,
          )
          .map((x) => ({
            teamId: String(x.roster_id),
            points: numeric(x.custom_points) ?? numeric(x.points),
          }));
  return {
    id: connection.id,
    provider: "sleeper",
    name: league.name,
    season: Number(league.season),
    week,
    scoringRules: league.scoring_settings || {},
    rosterPositions: league.roster_positions || [],
    scoringBasis:
      "Provider-reported league-specific totals; no scoring assumptions",
    matchup: {
      teamId: String(m.roster_id),
      points: numeric(m.custom_points) ?? numeric(m.points),
      adjusted: numeric(m.custom_points) !== null,
      opponents,
    },
    players: (m.players || []).map((pid) => {
      const p = players[pid] || {},
        index = (m.starters || []).indexOf(pid);
      return {
        id: `sleeper:${pid}`,
        name:
          p.full_name ||
          [p.first_name, p.last_name].filter(Boolean).join(" ") ||
          `Player ${pid}`,
        team: teamCode(p.team) || null,
        starter: index >= 0,
        slot:
          index >= 0
            ? league.roster_positions?.filter((x) => x !== "BN")?.[index] ||
              "Starter"
            : "Bench",
        injury: p.injury_status || null,
        points: numeric(m.players_points?.[pid]),
        pointsStatus:
          numeric(m.players_points?.[pid]) === null
            ? "NOT_SUPPLIED"
            : "PROVIDER_REPORTED",
      };
    }),
  };
}
function snakeKeys(value) {
  if (Array.isArray(value)) return value.map(snakeKeys);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k.replace(/[A-Z]/g, (c) => "_" + c.toLowerCase()),
        snakeKeys(v),
      ]),
    );
  return value;
}
export function fleaLeague(c, rules, roster, scoreboard, week) {
  rules = snakeKeys(rules);
  roster = snakeKeys(roster);
  scoreboard = snakeKeys(scoreboard);
  const contest = (scoreboard.games || []).find(
    (x) =>
      String(x.home?.id) === String(c.teamId) ||
      String(x.away?.id) === String(c.teamId),
  );
  const side = String(contest?.home?.id) === String(c.teamId) ? "home" : "away",
    other = side === "home" ? "away" : "home";
  return {
    id: c.id,
    provider: "fleaflicker",
    name: c.name || "Fleaflicker league",
    season: Number(c.season),
    week,
    scoringRules: rules.groups || [],
    rosterPositions: rules.roster_positions || [],
    scoringBasis:
      "Provider-reported league-specific points; tiered bonuses and IDP are not recomputed",
    matchup: contest
      ? {
          teamId: String(c.teamId),
          points: numeric(
            contest[`${side}_score`]?.score?.value ??
              contest[`${side}_score`]?.value,
          ),
          opponents: [
            {
              teamId: String(contest[other]?.id),
              points: numeric(
                contest[`${other}_score`]?.score?.value ??
                  contest[`${other}_score`]?.value,
              ),
            },
          ],
        }
      : null,
    players: (roster.groups || []).flatMap((group) =>
      (group.slots || [])
        .filter((slot) => slot.league_player?.pro_player?.id)
        .map((slot) => {
          const lp = slot.league_player,
            p = lp.pro_player,
            grp = String(
              group.group || slot.position?.group || "",
            ).toUpperCase();
          return {
            id: `fleaflicker:${p.id}`,
            name: p.name_full,
            team: teamCode(p.pro_team_abbreviation || p.pro_team?.abbreviation),
            slot: slot.position?.label || group.group,
            starter: grp === "START",
            injury: p.injury?.description || null,
            points: numeric(lp.viewing_actual_points?.value),
            pointsStatus:
              numeric(lp.viewing_actual_points?.value) === null
                ? "NOT_SUPPLIED"
                : "PROVIDER_REPORTED",
          };
        }),
    ),
  };
}
async function playerDirectory(ctx, fetcher) {
  const cache = typeof caches === "undefined" ? null : caches.default,
    key = new Request("https://gamecenter-cache.invalid/sleeper/players/v1");
  const cached = await cache?.match(key);
  if (cached) return cached.json();
  const { data } = await getJSON("https://api.sleeper.app/v1/players/nfl", {
    fetcher,
    timeout: 20000,
  });
  // Only the documented public player directory is cached; never league data.
  if (cache)
    ctx.waitUntil(
      cache.put(
        key,
        new Response(JSON.stringify(data), {
          headers: {
            "Cache-Control": "public, max-age=86400",
            "Content-Type": "application/json",
          },
        }),
      ),
    );
  return data;
}
export async function fetchLeague(c, week, env, ctx, fetcher = fetch) {
  if (c.verifiedOwnership !== true || c.permittedUse !== true)
    throw new ApiError(
      403,
      "CONNECTION_NOT_APPROVED",
      "League ownership and supported access must be verified",
    );
  if (c.provider === "sleeper") {
    if (!["noncommercial", "licensed"].includes(env.SLEEPER_USAGE))
      throw new ApiError(
        503,
        "SLEEPER_USAGE_NOT_CONFIGURED",
        "Permitted Sleeper usage has not been configured",
      );
    const base = `https://api.sleeper.app/v1/league/${id(c.leagueId)}`;
    const [league, rosters, matchups, players] = await Promise.all([
      getJSON(base, { fetcher }),
      getJSON(base + "/rosters", { fetcher }),
      getJSON(base + "/matchups/" + week, { fetcher }),
      playerDirectory(ctx, fetcher),
    ]);
    return {
      ...sleeperLeague(
        c,
        league.data,
        rosters.data,
        matchups.data,
        players,
        week,
      ),
      fetchedAt: matchups.fetchedAt,
    };
  }
  if (c.provider === "fleaflicker") {
    const query = `sport=NFL&league_id=${id(c.leagueId)}&season=${Number(c.season)}&scoring_period=${week}`;
    const [rules, roster, scoreboard] = await Promise.all(
      ["FetchLeagueRules", "FetchRoster", "FetchLeagueScoreboard"].map((path) =>
        getJSON(
          `https://www.fleaflicker.com/api/${path}?${query}${path === "FetchRoster" ? "&team_id=" + id(c.teamId) : ""}`,
          { fetcher },
        ),
      ),
    );
    return {
      ...fleaLeague(c, rules.data, roster.data, scoreboard.data, week),
      fetchedAt: scoreboard.fetchedAt,
    };
  }
  throw new ApiError(
    503,
    "PLATFORM_NOT_CONNECTED",
    "This platform currently requires direct access",
  );
}
