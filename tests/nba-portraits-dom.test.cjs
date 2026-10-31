const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const client = require('../sports/nba-players.js');
const ledger = JSON.parse(fs.readFileSync(require.resolve('../sports/nba-player-portraits.json'), 'utf8'));

class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.dataset = {}; this.events = {}; this.value = ''; this.hidden = false; this.attributes = {}; this.classList = { add: (name) => { this.addedClass = name; } }; }
  append(...items) { for (const item of items) this.children.push(...(item.tagName === '#fragment' ? item.children : [item])); }
  replaceChildren(...items) { this.children = []; this.append(...items); }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(event, handler) { this.events[event] = handler; }
  focus() { this.focused = true; }
}
function documentStub() {
  const nodes = new Map();
  return { nodes, getElementById(id) { if (!nodes.has(id)) nodes.set(id, new Element()); return nodes.get(id); }, createElement: (tag) => new Element(tag), createDocumentFragment: () => new Element('#fragment') };
}

test('current NBA snapshot binds every roster player to the right league, team and portrait', () => {
  assert.equal(client.validateLedger(ledger), ledger);
  assert.equal(ledger.teams.length, 30);
  assert.equal(ledger.records.length, 522);
  assert.equal(ledger.records.filter(client.verifiedPortrait).length, 522);
  for (const player of ledger.records) assert.equal(client.verifiedPortrait(player), player.portrait.url);
});

test('filters retain player identity, support accentless searches and combine team with position', () => {
  for (const team of ledger.teams) {
    const matches = client.filterPlayers(ledger.records, { team: team.teamId });
    assert.equal(matches.length, team.players);
    assert.ok(matches.every((player) => player.teamId === team.teamId));
  }
  const fixture = [{ ...ledger.records[0], displayName: 'Nikola Jokić', fullName: 'Nikola Jokić', teamId: '7', teamName: 'Denver Nuggets', teamAbbreviation: 'DEN', position: 'C' }];
  assert.equal(client.filterPlayers(fixture, { query: 'jokic denver', team: '7', position: 'C' }).length, 1);
  assert.equal(client.filterPlayers(fixture, { query: 'jokic', team: '7', position: 'G' }).length, 0);
  assert.equal(client.filterPlayers(fixture, { query: 'missing player' }).length, 0);
});

test('mismatched photos, NFL images, executable URLs and wrong alt text cannot attach to NBA players', () => {
  for (const change of [
    (p) => { p.portrait.url = p.portrait.url.replace(p.playerId, '1'); },
    (p) => { p.portrait.url = p.portrait.url.replace('/nba/', '/nfl/'); },
    (p) => { p.portrait.url = 'javascript:alert(1)'; },
    (p) => { p.portrait.alt = 'Another Person'; },
    (p) => { p.portrait.imageCheck.url = 'https://example.com/wrong.png'; },
  ]) { const player = structuredClone(ledger.records[0]); change(player); assert.equal(client.verifiedPortrait(player), null); }
  for (const change of [
    (d) => { d.schema = 'KAHRELUM_PLAYER_PORTRAITS_v1.0'; },
    (d) => { d.records.push(d.records[0]); },
    (d) => { d.records[0].teamId = 'unknown'; },
    (d) => { d.records[0].id = 'NFL-ESPN-123'; },
    (d) => { d.records[0].sourceUid = 's:20~l:28~a:123'; },
    (d) => { d.records[0].sourceUrl = 'https://www.espn.com/nba/player/_/id/123/wrong-player'; },
  ]) { const data = structuredClone(ledger); change(data); assert.throws(() => client.validateLedger(data)); }
});

test('a broken photo exposes initials without losing the player or source link', () => {
  const card = client.playerCard(ledger.records[0], documentStub());
  const photo = card.children[0]; const img = photo.children.find((child) => child.tagName === 'img');
  assert.ok(img); assert.equal(img.alt, ledger.records[0].displayName);
  assert.equal(img.loading, 'lazy'); assert.equal(img.width, 112); assert.equal(img.height, 84);
  img.events.error(); assert.equal(img.hidden, true);
  assert.ok(photo.children[0].textContent); assert.equal(card.children[1].children[1].children[0].textContent, ledger.records[0].displayName);
});

test('the real page client renders, filters, clears, and recovers from a failed roster request', async () => {
  const previousFetch = global.fetch;
  const doc = documentStub(); let available = false;
  global.fetch = async (url) => { assert.equal(url, '/sports/nba-player-portraits.json'); return { ok: available, json: async () => structuredClone(ledger) }; };
  try {
    await client.init(doc);
    assert.equal(doc.getElementById('nbaLoadError').hidden, false);
    assert.equal(doc.getElementById('nbaPlayers').children.length, 0);
    available = true; await doc.getElementById('nbaRetry').events.click();
    assert.equal(doc.getElementById('nbaLoadError').hidden, true);
    assert.equal(doc.getElementById('nbaPlayers').children.length, 522);
    assert.equal(doc.getElementById('nbaPhotoCount').textContent, 522);
    const team = ledger.teams[0]; doc.getElementById('nbaTeam').value = team.teamId;
    doc.getElementById('nbaTeam').events.change(); assert.equal(doc.getElementById('nbaPlayers').children.length, team.players);
    doc.getElementById('nbaSearch').value = 'nonexistent athlete xyz'; doc.getElementById('nbaSearch').events.input();
    assert.equal(doc.getElementById('nbaNoResults').hidden, false);
    doc.getElementById('nbaClear').events.click(); assert.equal(doc.getElementById('nbaPlayers').children.length, 522);
    assert.equal(doc.getElementById('nbaSearch').focused, true);
  } finally { global.fetch = previousFetch; }
});
