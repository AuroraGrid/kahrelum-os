import {
  TEAM_NAMES,
  gamePlayers,
  formatMetric,
  percentage,
} from "./forecast-core.mjs";
import { sourceAge, brier } from "./domain.mjs";
export const h = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const name = (c) => TEAM_NAMES[c === "LAR" ? "LA" : c] || c;
export const empty = (title, body = "") =>
  `<div class="empty"><h2>${h(title)}</h2>${body ? `<p>${h(body)}</p>` : ""}</div>`;
export const formatTime = (x) =>
  x && Number.isFinite(Date.parse(x))
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(x))
    : "Time unavailable";
export function status(g) {
  if (!g) return "Unavailable";
  if (g.status === "unavailable") return "LIVE DATA UNAVAILABLE";
  if (g.source && sourceAge(g.source).stale) return "LAST KNOWN · STALE";
  return (
    {
      scheduled: "SCHEDULED",
      created: "SCHEDULED",
      inprogress: "LIVE",
      complete: "FINAL · STATS PENDING",
      closed: "FINAL",
      delayed: "DELAYED",
      postponed: "POSTPONED",
      suspended: "SUSPENDED",
      cancelled: "CANCELLED",
    }[g.status] || "STATUS UNAVAILABLE"
  );
}
const score = (x) => (typeof x === "number" ? x : "—");
export function sourceLine(s) {
  if (!s) return "Live source not connected. No actual score is available.";
  const a = sourceAge(s);
  return `${s.name} · Fetched ${formatTime(s.fetchedAt)} · ${a.fetchAgeSeconds ?? "Unknown"}s since retrieval${s.updatedAt ? ` · Source updated ${formatTime(s.updatedAt)}` : " · Source update time not supplied; data latency unknown"}${a.stale ? " · Stale data" : ""}`;
}
export function gameTile(g, selected, favorite) {
  return `<article class="game-tile ${selected ? "selected" : ""}"><button class="game-open" data-game="${h(g.key)}" aria-label="${h(name(g.away))} at ${h(name(g.home))}" ${selected ? 'aria-current="true"' : ""}><span class="tile-meta"><span>${h(g.status === "scheduled" ? formatTime(g.scheduled) : status(g))}</span></span><span class="team-line"><span class="team-token">${h(g.away)}</span><span class="name">${h(name(g.away))}</span><b>${score(g.awayScore)}</b></span><span class="team-line"><span class="team-token">${h(g.home)}</span><span class="name">${h(name(g.home))}</span><b>${score(g.homeScore)}</b></span></button><button class="favorite" data-favorite="${h(g.key)}" aria-label="Favorite ${h(g.away)} at ${h(g.home)}" aria-pressed="${favorite}">${favorite ? "★" : "☆"}</button></article>`;
}
export function gameHeader(g) {
  if (!g) return empty("Choose an NFL game");
  const s = g.situation || {};
  return `<div class="score-header"><div class="score-topline"><span>${h(formatTime(g.scheduled))}</span><button data-share>Share game</button></div><div class="score-pair"><div class="score-side"><div class="team-display"><b>${h(g.away)}</b><span>${h(name(g.away))} · Away</span></div><strong>${score(g.awayScore)}</strong></div><div class="score-state">${h(status(g))}${g.period ? `<br>Q${h(g.period)} ${h(g.clock || "")}` : ""}</div><div class="score-side home"><div class="team-display"><b>${h(g.home)}</b><span>${h(name(g.home))} · Home</span></div><strong>${score(g.homeScore)}</strong></div></div><div class="situation">${s.possession ? `${h(s.possession)} possession${s.down ? ` · ${h(s.down)} & ${h(s.distance ?? "—")}` : ""}${s.yardline != null ? ` · ${h(s.territory || "")} ${h(s.yardline)}` : ""}` : g.status === "scheduled" ? "Waiting for kickoff" : "Game situation unavailable"}</div><p class="source-note">${h(sourceLine(g.source))}</p></div>`;
}
export function playsPanel(d) {
  const errors = d?.errors || [];
  return `<div class="section-row"><h2>Play-by-play</h2><span class="eyebrow">Latest first</span></div>${errors.length ? `<p class="note" role="status">${errors.map((e) => h(e.message)).join(" · ")}</p>` : ""}${d?.plays?.length ? `<p class="source-note">${h(sourceLine(d.sources?.pbp))}</p><ol class="play-list">${d.plays.map((p) => `<li class="play"><time>Q${h(p.period)}<br>${h(p.clock || "")}</time><p>${h(p.text)}</p></li>`).join("")}</ol>` : empty("No play-by-play available", d?.game?.status === "scheduled" ? "Plays will appear after kickoff when the source supplies them." : "No verified live play feed is connected for this game.")}`;
}
export function statsPanel(d) {
  if (!d?.playerStats?.length && !d?.teamStats?.length)
    return empty(
      "No reported statistics available",
      "Actual player and team statistics will appear here when the authorized feed supplies them.",
    );
  return `<h2>Player statistics</h2><p class="source-note">${h(sourceLine(d.sources?.statistics))}</p>${d.playerStats.map((p) => `<article class="player"><div class="player-title"><h3>${h(p.name)}</h3><span>${h(p.team)} · ${h(p.category)}</span></div><div class="stat-chips">${p.stats.map((s) => `<span class="stat-chip"><b>${h(s.value)}</b>${h(s.metric.replaceAll("_", " "))}</span>`).join("")}</div></article>`).join("")}<h2 class="subhead">Team statistics</h2><div class="stat-list">${d.teamStats.map((s) => `<div class="stat-row"><span>${h(s.team)} · ${h(s.category)} ${h(s.metric.replaceAll("_", " "))}</span><b>${h(s.value)}</b></div>`).join("")}</div><h2 class="subhead">Scoring drives</h2>${d.drives?.length ? d.drives.map((d) => `<div class="stat-row"><span>Q${h(d.period)} · ${h(d.description)}</span><b>${h(d.yards)} yds · ${h(d.plays)} plays</b></div>`).join("") : '<p class="note">No scoring drives supplied.</p>'}`;
}
export function predictPanel(g, snapshot) {
  const f = g?.forecast;
  if (!f)
    return empty(
      "No frozen forecast for this game",
      "No probability will be inferred from the current score.",
    );
  const result = brier(f, g);
  return `<div class="section-row"><h2>KAHRELUM pregame forecast</h2><span class="tag">SHADOW MODEL</span></div><div class="probability"><span>${h(name(f.winner))} to win</span><strong>${percentage(f.win_probability)}</strong></div><div class="forecast-score"><div><small>Projected ${h(f.away)} score</small><b>${h(f.score_away)}</b></div><div><small>Projected ${h(f.home)} score</small><b>${h(f.score_home)}</b></div></div><p class="note">Original Week 8 values preserved. These are predictions, not actual scores. This composite has no established calibration advantage.</p><h3 class="subhead">Live prediction</h3><p class="note">Unavailable. No validated live probability model is connected.</p><details><summary>Model assumptions and original record</summary><p>60% no-vig market probability, 25% independent statistical model, 15% team-strength signal. Home-win input: ${h(f.home_win_probability)}.</p><p>${h(snapshot.source_cutoff_note)}</p><p>No independent pre-kickoff timestamp was supplied with this package. Preservation of these bytes does not authenticate a prospective lock.</p><a href="/data/2026-week8-shadow.json" download>Download original forecast record</a></details><h3>Postgame verification</h3><p class="note">${result.value !== null ? `Brier score ${result.value.toFixed(6)} for home-win probability ${result.probability}. Lower is better. Source marks the game closed.` : result.status === "TIE_WITHHELD" ? "Tie: withheld because the original binary scoring rule does not specify ties." : "Pending a verified, closed game result. No outcomes have been manufactured."}</p><p class="note">Brier = (forecast probability − outcome)². One game measures error; calibration requires a larger verified set.</p><h3 class="subhead">Original player projections</h3><p class="note">Scenario estimates, conditional on playing. These are not observed statistics.</p>${gamePlayers(
    snapshot.players,
    f,
  )
    .map(
      (p) =>
        `<article class="player"><div class="player-title"><h3>${h(p.player)}</h3><span>${h(p.team)}</span></div><div class="stat-chips">${Object.entries(
          p.projections,
        )
          .map(
            ([k, v]) =>
              `<span class="stat-chip">${h(formatMetric(k, v))}</span>`,
          )
          .join(
            "",
          )}</div><p class="source-note">${h(p.availability)}</p></article>`,
    )
    .join("")}`;
}
export function fantasyPanel(data, platforms, g, authReady = false) {
  let html =
    '<div class="section-row"><h2>Your fantasy impact</h2><span class="tag">PRIVATE · READ ONLY</span></div>';
  if (!data?.leagues)
    html +=
      empty(
        "Fantasy leagues are not connected",
        data?.message ||
          "Sign in to see your own leagues. Private scores are never included in shared game links.",
      ) +
      (authReady
        ? '<p class="subhead"><a href="/fantasy" class="primary">Sign in to fantasy</a></p>'
        : '<p class="note subhead">Fantasy sign-in is not available yet.</p>');
  for (const l of data?.leagues || []) {
    html += `<article class="league"><h3>${h(l.name)}</h3><p class="eyebrow">${h(l.provider)} · Week ${h(l.week || "")} · ${h(l.status)}</p>`;
    if (l.status !== "CONNECTED") {
      html += `<p class="note">${h(l.message)}</p></article>`;
      continue;
    }
    html += `<p class="matchup-points">${l.matchup?.points ?? "—"} <span class="note">weekly points</span></p><p class="note">${l.matchup?.opponents?.map((o) => `Opponent ${h(o.teamId)}: ${o.points ?? "—"}`).join(" · ") || "Matchup not supplied"}</p>`;
    const players = l.players.filter(
      (p) => p.team === g.away || p.team === g.home,
    );
    html += players.length
      ? players
          .map(
            (p) =>
              `<div class="player"><div class="player-title"><h3>${h(p.name)}</h3><b>${p.points ?? "—"} pts</b></div><p class="note">${h(p.team)} · ${h(p.slot)} · ${p.starter ? "Starter" : "Bench"}${p.injury ? " · " + h(p.injury) : ""}${p.points == null ? " · Player points not supplied" : ""}</p></div>`,
          )
          .join("")
      : '<p class="note">No roster players matched to this NFL game.</p>';
    html += `<details><summary>League scoring and roster rules</summary><p>${h(l.scoringBasis)}</p><p>${h(l.rosterPositions.map((x) => (typeof x === "string" ? x : x.label)).join(" · "))}</p><ul class="rule-list">${Object.entries(
      l.scoringRules,
    )
      .map(
        ([k, v]) =>
          `<li>${h(k)}: ${h(typeof v === "object" ? JSON.stringify(v) : v)}</li>`,
      )
      .join(
        "",
      )}</ul></details><p class="source-note">Retrieved ${h(formatTime(l.fetchedAt))}. Platform totals may be corrected later.</p></article>`;
  }
  html += '<h3 class="subhead">Fantasy platforms</h3>';
  for (const p of platforms)
    html += `<article class="platform"><div class="platform-head"><h3>${h(p.name)}</h3><span class="tag">${data?.leagues?.some((l) => l.provider === p.id && l.status === "CONNECTED") ? "CONNECTED" : h(p.status.replaceAll("_", " "))}</span></div><p>${h(p.reason)}</p><a href="${h(p.url)}" target="_blank" rel="noopener noreferrer">Direct access to ${h(p.name)} ↗</a></article>`;
  return html;
}
