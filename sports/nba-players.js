'use strict';

(() => {
  const SCHEMA = 'KAHRELUM_NBA_PLAYER_PORTRAITS_v1.0';
  const normalize = (value) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const initials = (name) => String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  function sourceProfile(value) {
    try { const url = new URL(value); return url.protocol === 'https:' && ['espn.com', 'www.espn.com'].includes(url.hostname) ? url.href : null; } catch { return null; }
  }
  function verifiedPortrait(player) {
    const portrait = player.portrait;
    if (!portrait || portrait.status !== 'VERIFIED_EXTERNAL' || portrait.imageCheck?.status !== 'AVAILABLE') return null;
    try {
      const url = new URL(portrait.url);
      if (url.protocol !== 'https:' || url.hostname !== 'a.espncdn.com' || !url.pathname.includes('/nba/') || !url.pathname.endsWith(`/${player.playerId}.png`) || portrait.imageCheck.url !== url.href) return null;
      if (normalize(portrait.alt) !== normalize(player.displayName) && normalize(portrait.alt) !== normalize(player.fullName)) return null;
      return url.href;
    } catch { return null; }
  }
  function validateLedger(data) {
    if (data?.schema !== SCHEMA || data.league !== 'NBA' || !Array.isArray(data.records) || !Array.isArray(data.teams) || !data.records.length || !Number.isFinite(Date.parse(data.updatedAtUtc))) throw new Error('Invalid NBA roster');
    const ids = new Set();
    const teams = new Set(data.teams.map((team) => String(team.id ?? team.teamId)));
    for (const player of data.records) {
      const profile = sourceProfile(player.sourceUrl);
      if (!/^\d+$/.test(player.playerId) || player.id !== `NBA-ESPN-${player.playerId}` || player.sourceUid !== `s:40~l:46~a:${player.playerId}` || ids.has(player.playerId) || !player.displayName || !teams.has(String(player.teamId)) || !profile || !new URL(profile).pathname.startsWith(`/nba/player/_/id/${player.playerId}/`)) throw new Error('NBA identity mismatch');
      ids.add(player.playerId);
    }
    return data;
  }
  function filterPlayers(records, { query = '', team = '', position = '' } = {}) {
    const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
    return records.filter((player) => (!team || String(player.teamId) === team) && (!position || player.position === position) && terms.every((term) => normalize(`${player.displayName} ${player.fullName || ''} ${player.teamName} ${player.teamAbbreviation}`).includes(term)));
  }
  function playerCard(player, doc) {
    const card = doc.createElement('article');
    card.className = 'nba-player-card'; card.setAttribute('role', 'listitem'); card.dataset.playerId = player.playerId;
    const photo = doc.createElement('div'); photo.className = 'nba-player-photo';
    const fallback = doc.createElement('span'); fallback.className = 'nba-initials'; fallback.textContent = initials(player.displayName); fallback.setAttribute('aria-hidden', 'true'); photo.append(fallback);
    const photoUrl = verifiedPortrait(player);
    if (photoUrl) {
      const img = doc.createElement('img'); img.src = photoUrl; img.alt = player.displayName; img.width = 112; img.height = 84; img.loading = 'lazy'; img.decoding = 'async'; img.referrerPolicy = 'no-referrer';
      img.addEventListener('error', () => { img.hidden = true; photo.classList.add('photo-unavailable'); }, { once: true }); photo.append(img);
    }
    const details = doc.createElement('div'); details.className = 'nba-player-details';
    const team = doc.createElement('p'); team.className = 'nba-team-name'; team.textContent = player.teamName;
    const heading = doc.createElement('h3');
    const link = doc.createElement('a'); link.className = 'nba-player-name'; link.href = sourceProfile(player.sourceUrl); link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = player.displayName; heading.append(link);
    const meta = doc.createElement('p'); meta.className = 'nba-player-meta'; meta.textContent = [player.position, player.jersey != null && player.jersey !== '' ? `#${player.jersey}` : ''].filter(Boolean).join(' · ');
    const credit = doc.createElement('a'); credit.className = 'nba-photo-credit'; credit.href = sourceProfile(player.sourceUrl); credit.target = '_blank'; credit.rel = 'noopener noreferrer'; credit.textContent = photoUrl ? 'Photo: ESPN' : 'ESPN player profile';
    details.append(team, heading, meta, credit); card.append(photo, details); return card;
  }
  async function init(doc) {
    const get = (id) => doc.getElementById(id);
    if (!get('nbaDirectory')) return;
    let ledger;
    const controls = { query: get('nbaSearch'), team: get('nbaTeam'), position: get('nbaPosition') };
    function render() {
      if (!ledger) return;
      const players = filterPlayers(ledger.records, Object.fromEntries(Object.entries(controls).map(([name, control]) => [name, control.value])));
      const fragment = doc.createDocumentFragment(); players.forEach((player) => fragment.append(playerCard(player, doc))); get('nbaPlayers').replaceChildren(fragment);
      get('nbaResultCount').textContent = `${players.length} of ${ledger.records.length} players`;
      get('nbaNoResults').hidden = players.length > 0;
    }
    function option(select, value, text) { const item = doc.createElement('option'); item.value = value; item.textContent = text; select.append(item); }
    async function load() {
      get('nbaDirectory').setAttribute('aria-busy', 'true'); get('nbaLoadError').hidden = true;
      get('nbaResultCount').textContent = 'Loading NBA player profiles…';
      try {
        const response = await fetch('/sports/nba-player-portraits.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('Roster request failed');
        ledger = validateLedger(await response.json());
        ledger.records.sort((a, b) => a.displayName.localeCompare(b.displayName));
        controls.team.replaceChildren(); option(controls.team, '', 'All teams');
        const teams = new Map(ledger.records.map((player) => [String(player.teamId), player.teamName]));
        [...teams].sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => option(controls.team, id, name));
        controls.position.replaceChildren(); option(controls.position, '', 'All positions');
        [...new Set(ledger.records.map((player) => player.position).filter(Boolean))].sort().forEach((position) => option(controls.position, position, position));
        get('nbaTeamCount').textContent = teams.size; get('nbaPlayerCount').textContent = ledger.records.length;
        get('nbaPhotoCount').textContent = ledger.records.filter(verifiedPortrait).length;
        get('nbaCapturedAt').textContent = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }).format(new Date(ledger.updatedAtUtc));
        get('nbaSourceTime').textContent = `Source snapshot: ${ledger.updatedAtUtc}. Roster and photo coverage are recorded separately from NBA forecasts.`;
        get('nbaFilters').hidden = false; render();
      } catch {
        ledger = null; get('nbaPlayers').replaceChildren(); get('nbaFilters').hidden = true; get('nbaNoResults').hidden = true; get('nbaLoadError').hidden = false;
        get('nbaResultCount').textContent = 'No player records loaded.'; get('nbaCapturedAt').textContent = 'Unavailable';
      } finally { get('nbaDirectory').setAttribute('aria-busy', 'false'); }
    }
    controls.query.addEventListener('input', render); controls.team.addEventListener('change', render); controls.position.addEventListener('change', render);
    get('nbaClear').addEventListener('click', () => { Object.values(controls).forEach((control) => { control.value = ''; }); render(); controls.query.focus(); });
    get('nbaRetry').addEventListener('click', load); await load();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { validateLedger, verifiedPortrait, filterPlayers, playerCard, initials, init };
  if (typeof document !== 'undefined') init(document);
})();
