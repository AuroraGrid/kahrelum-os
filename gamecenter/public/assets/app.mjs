import { snapshot } from "./snapshot.mjs";
import { archiveGames, gameUrl, sourceAge } from "./domain.mjs";
import {
  h,
  name,
  empty,
  gameTile,
  gameHeader,
  playsPanel,
  statsPanel,
  predictPanel,
  fantasyPanel,
} from "./views.mjs";
import { renderHighlights } from "./highlights.mjs";
const $ = (s) => document.querySelector(s),
  params = new URL(location.href).searchParams;
const tabs = ["game", "stats", "highlights", "fantasy", "predict"];
let saved = [];
try {
  saved = JSON.parse(localStorage.getItem("kahrelum:favorites:v1") || "[]");
} catch {}
const state = {
  season: Number(params.get("season")) || 2026,
  week: Number(params.get("week")) || 8,
  type: ["REG", "PRE", "PST"].includes(params.get("type"))
    ? params.get("type")
    : "REG",
  gameKey: params.get("game"),
  tab: tabs.includes(params.get("tab")) ? params.get("tab") : "game",
  games: [],
  details: new Map(),
  revision: 0,
  search: "",
  favorites: new Set(Array.isArray(saved) ? saved : []),
  favoritesOnly: false,
  platforms: [],
  authReady: false,
  fantasy: null,
  loading: false,
};
state.week = Math.max(1, Math.min(23, state.week));
let disposeVideos = () => {},
  pollTimer;
const current = () => state.games.find((g) => g.key === state.gameKey),
  contextQuery = () =>
    new URLSearchParams({
      season: state.season,
      type: state.type,
      week: state.week,
    });
async function api(path, query) {
  const r = await fetch(path + (query ? "?" + query : ""), {
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.timeout(25000),
  });
  const d = await r.json();
  if (!r.ok)
    throw Object.assign(Error(d.message || "Source unavailable"), {
      code: d.error,
    });
  return d;
}
function writeUrl(replace = false) {
  const g = current();
  if (g)
    history[replace ? "replaceState" : "pushState"](
      {},
      "",
      gameUrl(location.href, g, state.tab),
    );
}
function board() {
  $("#weekTitle").textContent = `Week ${state.week}`;
  $("#season").value = String(state.season);
  $("#seasonType").value = state.type;
  $("#previousWeek").disabled = state.week <= 1;
  $("#nextWeek").disabled = state.week >= (state.type === "REG" ? 18 : 23);
  const rows = state.games.filter(
    (g) =>
      (!state.favoritesOnly || state.favorites.has(g.key)) &&
      (!state.search ||
        [g.away, g.home, name(g.away), name(g.home)]
          .join(" ")
          .toLowerCase()
          .includes(state.search.toLowerCase())),
  );
  $("#gameList").innerHTML =
    rows
      .map((g) =>
        gameTile(g, g.key === state.gameKey, state.favorites.has(g.key)),
      )
      .join("") || '<p class="empty">No games found.</p>';
  $("#favoritesOnly").setAttribute("aria-pressed", String(state.favoritesOnly));
}
function header() {
  const g = current();
  $("#gameHeader").innerHTML = g ? gameHeader(g) : empty("No game selected");
  for (const button of $("#tabs").querySelectorAll("button")) {
    if (button.dataset.tab === state.tab)
      button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
}
async function panel() {
  disposeVideos();
  disposeVideos = () => {};
  header();
  const g = current(),
    body = $("#tabBody"),
    revision = state.revision,
    tab = state.tab;
  if (!g) {
    body.innerHTML = empty(
      "No game available",
      "No schedule is available for this week.",
    );
    return;
  }
  const d = state.details.get(g.key);
  if (tab === "game") body.innerHTML = playsPanel(d);
  if (tab === "stats") body.innerHTML = statsPanel(d);
  if (tab === "predict") body.innerHTML = predictPanel(g, snapshot);
  if (tab === "highlights") {
    body.innerHTML = empty("Checking playable highlights");
    try {
      const q = contextQuery();
      q.set("game", g.key);
      const data = await api("/api/highlights", q);
      if (
        revision === state.revision &&
        state.tab === tab &&
        current()?.key === g.key
      )
        disposeVideos = renderHighlights(body, data.groups || []);
    } catch {
      if (revision === state.revision && state.tab === tab)
        body.innerHTML = empty("No playable highlights available");
    }
  }
  if (tab === "fantasy") {
    body.innerHTML = fantasyPanel(
      state.fantasy,
      state.platforms,
      g,
      state.authReady,
    );
    try {
      const d = await api("/api/fantasy", contextQuery());
      if (revision !== state.revision || state.tab !== tab) return;
      state.fantasy = d;
      body.innerHTML = fantasyPanel(
        d,
        d.platforms || state.platforms,
        g,
        state.authReady,
      );
    } catch (e) {
      if (revision !== state.revision || state.tab !== tab) return;
      state.fantasy = { message: e.message };
      body.innerHTML = fantasyPanel(
        state.fantasy,
        state.platforms,
        g,
        state.authReady,
      );
    }
  }
}
async function loadDetail() {
  const g = current();
  if (!g) return;
  const revision = state.revision,
    q = contextQuery();
  q.set("game", g.key);
  try {
    const d = await api("/api/game", q);
    if (revision !== state.revision || current()?.key !== g.key) return;
    state.details.set(g.key, d);
    state.games = state.games.map((x) => (x.key === g.key ? d.game : x));
    header();
    board();
    if (["game", "stats", "predict"].includes(state.tab)) await panel();
  } catch (e) {
    if (revision !== state.revision || current()?.key !== g.key) return;
    const old = state.details.get(g.key);
    const fail = {
      ...g,
      source: g.source ? { ...g.source, error: e.message } : null,
    };
    state.games = state.games.map((x) => (x.key === g.key ? fail : x));
    state.details.set(g.key, {
      ...old,
      game: fail,
      errors: [{ resource: "live", message: e.message }],
    });
    header();
    board();
    if (["game", "stats", "predict"].includes(state.tab)) await panel();
  }
}
async function refresh() {
  if (state.loading || document.hidden) return;
  state.loading = true;
  const revision = state.revision;
  $("#refresh").disabled = true;
  try {
    const data = await api("/api/games", contextQuery());
    if (revision !== state.revision) return;
    state.games = data.games;
    $("#boardNote").textContent =
      data.coverage === "FROZEN_FORECAST_SLATE_ONLY"
        ? "13 saved forecast matchups. Full NFL schedule requires a connected source."
        : "Schedule supplied by Sportradar.";
    $("#feedStatus").textContent =
      data.error ||
      `${state.games.length} games · Source results refreshed automatically · Times shown in your timezone`;
    if (!current()) state.gameKey = state.games[0]?.key || null;
    board();
    header();
    writeUrl(true);
    await panel();
    await loadDetail();
  } catch (e) {
    if (revision !== state.revision) return;
    $("#feedStatus").textContent =
      e.message + " · Retained data is last known, not live.";
    state.games = state.games.map((g) => ({
      ...g,
      source: g.source ? { ...g.source, error: e.message } : null,
    }));
    board();
    header();
    if (state.tab === "predict") await panel();
  } finally {
    state.loading = false;
    $("#refresh").disabled = false;
  }
}
async function selectGame(key) {
  state.gameKey = key;
  state.revision++;
  board();
  writeUrl();
  await panel();
  await loadDetail();
}
async function selectWeek(delta) {
  state.week += delta;
  state.revision++;
  state.gameKey = null;
  state.games = [];
  state.fantasy = null;
  state.loading = false;
  disposeVideos();
  board();
  header();
  $("#tabBody").innerHTML = empty("Loading week");
  await refresh();
}
$("#gameList").addEventListener("click", (e) => {
  const f = e.target.closest("[data-favorite]");
  if (f) {
    const k = f.dataset.favorite;
    if (state.favorites.has(k)) state.favorites.delete(k);
    else state.favorites.add(k);
    try {
      localStorage.setItem(
        "kahrelum:favorites:v1",
        JSON.stringify([...state.favorites]),
      );
    } catch {}
    board();
    return;
  }
  const t = e.target.closest("[data-game]");
  if (t) selectGame(t.dataset.game);
});
$("#tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-tab]");
  if (!b) return;
  state.tab = b.dataset.tab;
  writeUrl();
  panel();
});
$("#search").addEventListener("input", (e) => {
  state.search = e.target.value;
  board();
});
$("#favoritesOnly").addEventListener("click", () => {
  state.favoritesOnly = !state.favoritesOnly;
  board();
});
$("#previousWeek").addEventListener("click", () => selectWeek(-1));
$("#nextWeek").addEventListener("click", () => selectWeek(1));
$("#season").addEventListener("change", (e) => {
  state.season = Number(e.target.value);
  selectWeek(0);
});
$("#seasonType").addEventListener("change", (e) => {
  state.type = e.target.value;
  state.week = 1;
  selectWeek(0);
});
$("#refresh").addEventListener("click", refresh);
function toast(text) {
  $("#toast").textContent = text;
  $("#toast").hidden = false;
  setTimeout(() => ($("#toast").hidden = true), 2200);
}
function share() {
  const g = current();
  const url = g ? gameUrl(location.href, g) : location.origin + "/",
    title = g ? `${g.away} at ${g.home} · KAHRELUM Sports` : "KAHRELUM Sports";
  $("#shareUrl").value = url;
  $("#shareTitle").textContent = title;
  $("#whatsappLink").href =
    "https://wa.me/?text=" + encodeURIComponent(title + " " + url);
  $("#shareDialog").showModal();
}
$("#shareBoard").addEventListener("click", share);
$("#gameHeader").addEventListener("click", (e) => {
  if (e.target.closest("[data-share]")) share();
});
$("#closeShare").addEventListener("click", () => $("#shareDialog").close());
$("#copyLink").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("#shareUrl").value);
    toast("Game link copied");
  } catch {
    $("#shareUrl").select();
    toast("Select and copy the game link");
  }
});
addEventListener("popstate", () => {
  const p = new URL(location.href).searchParams;
  state.season = Number(p.get("season")) || 2026;
  state.week = Number(p.get("week")) || 8;
  state.type = p.get("type") || "REG";
  state.gameKey = p.get("game");
  state.tab = tabs.includes(p.get("tab")) ? p.get("tab") : "game";
  state.revision++;
  state.loading = false;
  refresh();
});
function schedulePoll() {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    if (!document.hidden) {
      if (["highlights", "fantasy"].includes(state.tab)) {
        await loadDetail();
        if (state.tab === "fantasy") await panel();
      } else await refresh();
    }
    schedulePoll();
  }, 60000);
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    refresh();
    schedulePoll();
  }
});
state.games =
  state.season === 2026 && state.week === 8 && state.type === "REG"
    ? archiveGames(snapshot)
    : [];
if (!current()) state.gameKey = state.games[0]?.key || null;
board();
panel();
api("/api/status")
  .then((d) => {
    state.platforms = d.platforms || [];
    state.authReady = d.fantasyAuthentication === "CONFIGURED";
    if (state.tab === "fantasy") panel();
  })
  .catch(() => {});
refresh();
schedulePoll();
