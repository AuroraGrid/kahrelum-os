export const teamCode = (c) => ({ LA: "LAR", JAC: "JAX", WSH: "WAS" })[c] || c;
export const gameKey = (year, type, week, away, home) =>
  `${year}-${type}-${week}-${teamCode(away)}-${teamCode(home)}`;
export const numeric = (x) =>
  typeof x === "number" && Number.isFinite(x) ? x : null;
export function sourceAge(source, now = Date.now()) {
  const fetched = Date.parse(source?.fetchedAt),
    updated = Date.parse(source?.updatedAt);
  return {
    fetchAgeSeconds: Number.isFinite(fetched)
      ? Math.max(0, Math.floor((now - fetched) / 1000))
      : null,
    sourceAgeSeconds: Number.isFinite(updated)
      ? Math.max(0, Math.floor((now - updated) / 1000))
      : null,
    stale:
      !Number.isFinite(fetched) ||
      fetched > now + 60000 ||
      now - fetched > (source?.staleAfterSeconds || 120) * 1000 ||
      Boolean(source?.error),
  };
}
export function archiveGames(snapshot) {
  return snapshot.games.map((g) => ({
    key: gameKey(snapshot.season, "REG", snapshot.week, g.away, g.home),
    season: snapshot.season,
    seasonType: "REG",
    week: snapshot.week,
    away: teamCode(g.away),
    home: teamCode(g.home),
    scheduled: g.kickoff_eastern,
    status: "unavailable",
    homeScore: null,
    awayScore: null,
    source: null,
    forecast: g,
  }));
}
export function attachForecast(g, snapshot) {
  const f =
    Number(g.season) === snapshot.season &&
    g.seasonType === "REG" &&
    Number(g.week) === snapshot.week
      ? snapshot.games.find(
          (x) => teamCode(x.home) === g.home && teamCode(x.away) === g.away,
        )
      : null;
  return { ...g, forecast: f || null };
}
export function brier(forecast, game) {
  if (
    !forecast ||
    game.status !== "closed" ||
    !game.source ||
    sourceAge(game.source).stale ||
    game.source.error
  )
    return { status: "PENDING", value: null };
  if (numeric(game.homeScore) === null || numeric(game.awayScore) === null)
    return { status: "PENDING", value: null };
  if (game.homeScore === game.awayScore)
    return { status: "TIE_WITHHELD", value: null };
  const p = forecast.home_win_probability,
    y = game.homeScore > game.awayScore ? 1 : 0;
  return {
    status: "FINAL_VERIFIED",
    value: (p - y) ** 2,
    outcome: y,
    probability: p,
  };
}
export const gameUrl = (base, g, tab = "game") => {
  const u = new URL(base);
  u.hash = "";
  u.search = "";
  u.searchParams.set("season", g.season);
  u.searchParams.set("type", g.seasonType);
  u.searchParams.set("week", g.week);
  u.searchParams.set("game", g.key);
  if (tab !== "game") u.searchParams.set("tab", tab);
  return u.href;
};
