import { teamCode } from "./domain.mjs";
export const SOURCES = [
  "X",
  "Bleacher Report",
  "B/R Gridiron",
  "House of Highlights",
  "Sleeper",
  "NFL",
];
// No discovered search result is admitted automatically. Evidence is specific to
// this exact player, publication, game, production origin and both viewports.
export function eligibleClip(c, g, origin, now = Date.now()) {
  if (
    !c ||
    !SOURCES.includes(c.source) ||
    c.contentType !== "game_action" ||
    c.matchVerified !== true ||
    c.rights?.embedPermitted !== true ||
    !c.rights?.evidenceUrl
  )
    return false;
  if (
    c.gameKey !== g.key ||
    c.season !== g.season ||
    c.week !== g.week ||
    c.seasonType !== g.seasonType ||
    teamCode(c.away) !== g.away ||
    teamCode(c.home) !== g.home ||
    !c.playId
  )
    return false;
  if (
    !c.publisher ||
    !c.description ||
    !Number.isFinite(Date.parse(g.scheduled)) ||
    !Number.isFinite(Date.parse(c.publishedAt)) ||
    Date.parse(c.publishedAt) < Date.parse(g.scheduled) ||
    Date.parse(c.publishedAt) > now
  )
    return false;
  // The first implementation supports the official YouTube IFrame API, which
  // provides playback/error events. Other players remain withheld until their
  // permitted integration and observable playback can be verified.
  if (c.player !== "youtube" || !/^[\w-]{11}$/.test(c.videoId || ""))
    return false;
  if (
    !c.availability?.available ||
    c.availability.videoId !== c.videoId ||
    !Number.isFinite(Date.parse(c.availability.checkedAt)) ||
    now - Date.parse(c.availability.checkedAt) > 900000 ||
    Date.parse(c.availability.checkedAt) > now
  )
    return false;
  for (const viewport of ["mobile", "desktop"]) {
    const p = c.playback?.[viewport];
    if (
      !p ||
      p.origin !== origin ||
      p.videoId !== c.videoId ||
      p.gameKey !== g.key ||
      p.actualGameAction !== true ||
      p.secondsAdvanced < 3 ||
      p.inline !== true ||
      !p.evidenceRef ||
      !Number.isFinite(Date.parse(p.testedAt)) ||
      now - Date.parse(p.testedAt) > 21600000 ||
      Date.parse(p.testedAt) > now
    )
      return false;
  }
  return true;
}
export function selectClips(clips, game, origin, now = Date.now()) {
  const byPlay = new Map(),
    seen = new Set();
  for (const c of clips
    .filter((x) => eligibleClip(x, game, origin, now))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))) {
    const key = `${c.player}:${c.videoId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const play = byPlay.get(c.playId) || [];
    if (play.some((x) => (x.angle || "main") === (c.angle || "main"))) continue;
    play.push(c);
    byPlay.set(c.playId, play);
  }
  return [...byPlay].map(([playId, angles]) => ({
    playId,
    primary: angles[0],
    alternatives: angles.slice(1),
  }));
}
