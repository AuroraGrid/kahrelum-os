import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { handle } from "../server/worker.mjs";
import { verifyIdentity, connectionsFor } from "../server/auth.mjs";
import { sleeperLeague, fleaLeague } from "../server/fantasy.mjs";
import {
  normalizeGame,
  normalizePlays,
  normalizeStats,
} from "../server/sportradar.mjs";
import {
  eligibleClip,
  selectClips,
} from "../public/assets/highlight-policy.mjs";
import {
  archiveGames,
  brier,
  gameKey,
  sourceAge,
  gameUrl,
  attachForecast,
} from "../public/assets/domain.mjs";
const snapshot = JSON.parse(
  fs.readFileSync(
    new URL("../public/data/2026-week8-shadow.json", import.meta.url),
  ),
);
const original = archiveGames(snapshot).find((g) => g.home === "CIN");
const now = Date.parse("2026-11-01T20:00:00Z"),
  stamp = new Date(now).toISOString(),
  origin = "https://gamecenter.example";
const game = { ...original, scheduled: "2026-11-01T18:00:00Z" };
function clip(patch = {}) {
  const proof = {
    origin,
    videoId: "abcdefghijk",
    gameKey: game.key,
    actualGameAction: true,
    secondsAdvanced: 4,
    inline: true,
    evidenceRef: "test-only-not-production",
    testedAt: stamp,
  };
  return {
    source: "NFL",
    contentType: "game_action",
    matchVerified: true,
    rights: { embedPermitted: true, evidenceUrl: "https://www.youtube.com/" },
    gameKey: game.key,
    season: 2026,
    seasonType: "REG",
    week: 8,
    away: "TEN",
    home: "CIN",
    playId: "play-1",
    publisher: "Test fixture",
    description: "Test-only game action",
    publishedAt: stamp,
    player: "youtube",
    videoId: "abcdefghijk",
    availability: { available: true, videoId: "abcdefghijk", checkedAt: stamp },
    playback: { mobile: { ...proof }, desktop: { ...proof } },
    ...patch,
  };
}
test("source forecast bytes have a fixed SHA-256", () => {
  const bytes = fs.readFileSync(
    new URL("../public/data/2026-week8-shadow.json", import.meta.url),
  );
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    process.env.EXPECTED_FORECAST_SHA ||
      fs
        .readFileSync(
          new URL("../FORECAST_SHA256.txt", import.meta.url),
          "utf8",
        )
        .trim(),
  );
});
test("raw Bengals value remains .8249, not rounded and written back", () =>
  assert.equal(original.forecast.win_probability, 0.8249));
test("stable game IDs include season, type, week and home/away", () => {
  assert.equal(game.key, "2026-REG-8-TEN-CIN");
  assert.notEqual(gameKey(2025, "REG", 8, "TEN", "CIN"), game.key);
});
test("forecast attach rejects another season and reversed opponents", () => {
  assert.equal(
    attachForecast({ ...game, season: 2025 }, snapshot).forecast,
    null,
  );
  assert.equal(
    attachForecast({ ...game, away: "CIN", home: "TEN" }, snapshot).forecast,
    null,
  );
});
test("highlights admit only full production-specific playback evidence", () =>
  assert.equal(eligibleClip(clip(), game, origin, now), true));
for (const [label, patch] of Object.entries({
  preview: { contentType: "pregame_preview" },
  text: { contentType: "text" },
  wrongSeason: { season: 2025 },
  wrongGame: { gameKey: "2026-REG-9-TEN-CIN" },
  wrongTeams: { away: "BAL" },
  unreviewed: { matchVerified: false },
  deleted: { availability: { available: false } },
  malformedAvailability: {
    availability: { available: true, videoId: "abcdefghijk", checkedAt: "bad" },
  },
  unlicensed: { rights: { embedPermitted: false } },
  noPlayId: { playId: null },
  unsupportedPlayer: { player: "x" },
  badVideo: { videoId: "javascript:alert(1)" },
  historical: { publishedAt: "2025-01-01T12:00:00Z" },
}))
  test("highlight rejected: " + label, () =>
    assert.equal(eligibleClip(clip(patch), game, origin, now), false),
  );
test("an iframe load and thumbnail without advancing video is not playback", () => {
  const c = clip();
  c.playback.mobile.secondsAdvanced = 0;
  assert.equal(eligibleClip(c, game, origin, now), false);
});
test("playback on preview origin cannot certify production", () =>
  assert.equal(
    eligibleClip(clip(), game, "https://production.example", now),
    false,
  ));
test("stale availability and playback evidence fail closed", () => {
  assert.equal(eligibleClip(clip(), game, origin, now + 900001), false);
  const c = clip();
  c.playback.desktop.testedAt = "2026-10-01T12:00:00Z";
  assert.equal(eligibleClip(c, game, origin, now), false);
});
test("same-play coverage is deduplicated; different angle remains selectable", () => {
  const a = clip(),
    b = clip({ videoId: "lmnopqrstuv" }),
    c = clip({ videoId: "zyxwvutsrqp", angle: "sideline" });
  for (const v of [b, c]) {
    v.availability.videoId = v.videoId;
    for (const p of Object.values(v.playback)) p.videoId = v.videoId;
  }
  const groups = selectClips([a, a, b, c], game, origin, now);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].alternatives.length, 1);
});
test("errors make recently fetched data stale; retrieval does not invent source time", () => {
  const s = { fetchedAt: new Date().toISOString(), updatedAt: null };
  assert.equal(sourceAge(s).sourceAgeSeconds, null);
  assert.equal(sourceAge({ ...s, error: "unavailable" }).stale, true);
});
test("Brier is pending without authoritative closed results", () => {
  assert.equal(
    brier(original.forecast, {
      ...game,
      status: "inprogress",
      homeScore: 30,
      awayScore: 0,
    }).value,
    null,
  );
});
test("Brier uses original full precision and does not silently score ties", () => {
  const g = {
    ...game,
    status: "closed",
    source: { fetchedAt: new Date().toISOString() },
    homeScore: 29,
    awayScore: 17,
  };
  assert.equal(brier(original.forecast, g).value, (0.8249 - 1) ** 2);
  assert.equal(
    brier(original.forecast, { ...g, awayScore: 29 }).status,
    "TIE_WITHHELD",
  );
});
test("share links remove fantasy identifiers and unrelated query data", () => {
  const u = new URL(
    gameUrl(origin + "/?league=private&token=secret#old", game),
  );
  assert.equal(u.searchParams.has("league"), false);
  assert.equal(u.searchParams.has("token"), false);
  assert.equal(u.searchParams.get("game"), game.key);
});
const srId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  srGame = {
    id: srId,
    home: { alias: "CIN", points: 0 },
    away: { alias: "TEN", points: 0 },
    status: "scheduled",
    scheduled: game.scheduled,
  };
test("schedule does not invent an actual 0-0 score before kickoff", () => {
  const g = normalizeGame(srGame, { season: 2026, type: "REG", week: 8 }, {});
  assert.equal(g.homeScore, null);
  assert.equal(g.awayScore, null);
});
test("live zero scores are preserved as observed", () => {
  const g = normalizeGame(
    { ...srGame, status: "inprogress" },
    { season: 2026, type: "REG", week: 8 },
    {},
  );
  assert.equal(g.homeScore, 0);
});
test("corrected play IDs replace prior play versions", () => {
  const data = {
    periods: [
      {
        number: 1,
        pbp: [
          {
            type: "drive",
            events: [
              {
                type: "play",
                id: "p",
                sequence: 1,
                description: "original",
                updated_at: "2026-11-01T19:00:00Z",
              },
              {
                type: "play",
                id: "p",
                sequence: 1,
                description: "corrected",
                updated_at: stamp,
              },
            ],
          },
        ],
      },
    ],
  };
  const p = normalizePlays(data);
  assert.equal(p.plays.length, 1);
  assert.equal(p.plays[0].text, "corrected");
});
test("statistics preserve player identifiers and observed zero metrics", () => {
  const d = normalizeStats({
    statistics: {
      home: {
        alias: "CIN",
        passing: {
          totals: { yards: 0 },
          players: [{ id: "player", name: "Test Player", yards: 0 }],
        },
      },
    },
  });
  assert.equal(d.playerStats[0].id, "sportradar:player");
  assert.equal(d.playerStats[0].stats[0].value, 0);
});
const c = { id: "a", leagueId: "123", season: 2026, teamId: "1", userId: "99" };
const league = {
  league_id: "123",
  name: "Test League",
  sport: "nfl",
  season: "2026",
  roster_positions: ["QB", "SUPER_FLEX", "DL", "BN"],
  scoring_settings: { rec: 1, idp_sack: 5 },
};
const rosters = [{ roster_id: 1, owner_id: "99" }],
  matchups = [
    {
      roster_id: 1,
      matchup_id: 2,
      players: ["q", "d", "b"],
      starters: ["q", "d"],
      points: 14,
      custom_points: 0,
      players_points: { q: 8, d: 6, b: 3 },
    },
    { roster_id: 2, matchup_id: 2, points: 9 },
  ];
const directory = {
  q: { full_name: "QB", team: "CIN" },
  d: { full_name: "IDP", team: "TEN" },
  b: { full_name: "Bench", team: "TEN" },
};
test("league-specific points, superflex, IDP and bench are preserved", () => {
  const l = sleeperLeague(c, league, rosters, matchups, directory, 8);
  assert.equal(l.matchup.points, 0);
  assert.equal(l.players[2].starter, false);
  assert.equal(l.rosterPositions[1], "SUPER_FLEX");
  assert.equal(l.scoringRules.idp_sack, 5);
  assert.equal(l.players[1].points, 6);
});
test("same player in multiple leagues retains separate scoring", () => {
  const a = sleeperLeague(c, league, rosters, matchups, directory, 8),
    b = sleeperLeague(
      { ...c, id: "b" },
      league,
      rosters,
      [{ ...matchups[0], players_points: { q: 11 } }],
      directory,
      8,
    );
  assert.equal(a.players[0].points, 8);
  assert.equal(b.players[0].points, 11);
  assert.notEqual(a.id, b.id);
});
test("missing player points stay missing rather than being inferred", () => {
  const l = sleeperLeague(
    c,
    league,
    rosters,
    [{ ...matchups[0], players_points: undefined }],
    directory,
    8,
  );
  assert.equal(l.players[0].points, null);
});
test("Sleeper mismatched membership or season rejected", () => {
  assert.throws(() =>
    sleeperLeague(
      { ...c, userId: "0" },
      league,
      rosters,
      matchups,
      directory,
      8,
    ),
  );
  assert.throws(() =>
    sleeperLeague(
      { ...c, season: 2025 },
      league,
      rosters,
      matchups,
      directory,
      8,
    ),
  );
});
test("Fleaflicker scoring values are league-specific and not recalculated", () => {
  const l = fleaLeague(
    c,
    { groups: [{ label: "IDP" }], roster_positions: [{ label: "SUPER_FLEX" }] },
    {
      groups: [
        {
          group: "START",
          slots: [
            {
              position: { label: "DL" },
              league_player: {
                pro_player: {
                  id: 1,
                  name_full: "Test",
                  pro_team_abbreviation: "TEN",
                },
                viewing_actual_points: { value: 7.5 },
              },
            },
          ],
        },
      ],
    },
    { games: [] },
    8,
  );
  assert.equal(l.players[0].points, 7.5);
  assert.equal(l.players[0].starter, true);
});
test("private endpoint fails closed without auth configuration", async () => {
  const r = await handle(new Request(origin + "/api/fantasy"));
  assert.equal(r.status, 503);
  assert.match(r.headers.get("cache-control"), /no-store/);
  assert.equal((await r.json()).error, "AUTH_NOT_CONFIGURED");
});
test("forged identity headers and query league IDs do not grant access", async () => {
  const r = await handle(
    new Request(origin + "/api/fantasy?league=123", {
      headers: { "Cf-Access-Authenticated-User-Email": "owner@example.com" },
    }),
    { ACCESS_ISSUER: "https://test.cloudflareaccess.com", ACCESS_AUD: "aud" },
  );
  assert.equal(r.status, 401);
});
test("all mutation methods are rejected", async () => {
  for (const method of ["POST", "PUT", "DELETE", "PATCH"]) {
    const r = await handle(new Request(origin + "/api/fantasy", { method }));
    assert.equal(r.status, 405);
  }
});
test("without credentials public games contain only archive forecasts and no fake results", async () => {
  const r = await handle(new Request(origin + "/api/games"));
  const d = await r.json();
  assert.equal(d.games.length, 13);
  assert.equal(d.coverage, "FROZEN_FORECAST_SLATE_ONLY");
  assert.equal(
    d.games.every((g) => g.homeScore === null && g.source === null),
    true,
  );
});
test("unconfigured highlights response contains no fabricated videos", async () => {
  const r = await handle(
    new Request(origin + "/api/highlights?game=" + game.key),
  );
  assert.deepEqual((await r.json()).groups, []);
});
test("unavailable weeks do not reuse Week 8 predictions", async () => {
  const r = await handle(new Request(origin + "/api/games?week=9"));
  assert.deepEqual((await r.json()).games, []);
});
test("invalid selection rejected before upstream requests", async () => {
  const r = await handle(new Request(origin + "/api/games?week=999"));
  assert.equal(r.status, 400);
});
test("an API key without distribution authorization never activates live feed", async () => {
  let fetched = false;
  await handle(
    new Request(origin + "/api/games"),
    { SPORTRADAR_API_KEY: "test-secret" },
    { waitUntil: () => {} },
    () => {
      fetched = true;
    },
  );
  assert.equal(fetched, false);
});
test("upstream credential errors never disclose secrets", async () => {
  const r = await handle(
    new Request(origin + "/api/games"),
    {
      SPORTRADAR_API_KEY: "test-secret",
      SPORTRADAR_DISTRIBUTION_AUTHORIZED: "true",
    },
    { waitUntil: () => {} },
    async () => new Response("denied", { status: 401 }),
  );
  assert.equal(r.status, 502);
  assert.equal((await r.text()).includes("test-secret"), false);
});
test("private data never enters public status responses", async () => {
  const r = await handle(new Request(origin + "/api/status"), {
    FANTASY_CONNECTIONS: JSON.stringify({
      "private-sub": [{ leagueId: "very-private-league" }],
    }),
  });
  assert.equal((await r.text()).includes("very-private"), false);
});
test("RS256 verification checks signature, audience, expiry, and subject", async () => {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  jwk.kid = "test-key";
  const env = {
      ACCESS_ISSUER: "https://jwt-test.cloudflareaccess.com",
      ACCESS_AUD: "test-audience",
    },
    fetcher = async () =>
      new Response(JSON.stringify({ keys: [jwk] }), {
        headers: { "Content-Type": "application/json" },
      });
  async function token(patch = {}) {
    const sec = Math.floor(Date.now() / 1000),
      encode = (x) => Buffer.from(JSON.stringify(x)).toString("base64url"),
      h = encode({ alg: "RS256", kid: "test-key" }),
      p = encode({
        iss: env.ACCESS_ISSUER,
        aud: [env.ACCESS_AUD],
        sub: "user-a",
        iat: sec,
        exp: sec + 600,
        ...patch,
      }),
      sig = await crypto.subtle.sign(
        "RSASSA-PKCS1-v1_5",
        pair.privateKey,
        new TextEncoder().encode(h + "." + p),
      );
    return h + "." + p + "." + Buffer.from(sig).toString("base64url");
  }
  const request = (t) =>
    new Request(origin, { headers: { "Cf-Access-Jwt-Assertion": t } });
  assert.equal(
    (await verifyIdentity(request(await token()), env, fetcher)).sub,
    "user-a",
  );
  for (const patch of [
    { aud: ["other"] },
    { exp: 0 },
    { sub: "" },
    { iss: "https://evil.example" },
  ])
    await assert.rejects(() =>
      token(patch).then((t) => verifyIdentity(request(t), env, fetcher)),
    );
  const forged = (await token()).split(".");
  forged[2] = "AAAA";
  await assert.rejects(() =>
    verifyIdentity(request(forged.join(".")), env, fetcher),
  );
});

test("verified subjects cannot read another user connection map", () => {
  const env = {
    FANTASY_CONNECTIONS: JSON.stringify({
      "user-a": [{ id: "own" }],
      "user-b": [{ id: "other" }],
    }),
  };
  assert.deepEqual(connectionsFor(env, { sub: "user-a" }), [{ id: "own" }]);
  assert.deepEqual(connectionsFor(env, { sub: "unknown" }), []);
});
