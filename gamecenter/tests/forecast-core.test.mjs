import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateSnapshot, filteredGames, getGame, getWinner, gamePlayers, formatMetric, createGameUrl } from '../public/assets/forecast-core.mjs';
const snapshot=JSON.parse(fs.readFileSync(new URL('../public/data/2026-week8-shadow.json',import.meta.url),'utf8'));

test('preserves all 13 distinct game predictions and all 46 player metrics',()=>{
 const r=validateSnapshot(snapshot);
 assert.equal(r.valid,true,JSON.stringify(r.errors));
 assert.equal(snapshot.games.length,13);
 assert.equal(snapshot.players.length,46);
});
test('original Bengals prediction is 82.5% and projected 29 to 17',()=>{
 const g=getGame(snapshot.games,'TEN-CIN');
 assert.equal(getWinner(g).team,'CIN');
 assert.equal((getWinner(g).probability*100).toFixed(1),'82.5');
 assert.equal(g.score_home,29);
 assert.equal(g.score_away,17);
});
test('filter favorites returns five teams with at least 70 percent chance',()=>{
 const games=filteredGames(snapshot.games,{filter:'strong'});
 assert.equal(games.length,5);
 assert.ok(games.every(g=>getWinner(g).probability>=0.70));
});
test('close calls returns four less than 60 percent',()=>{
 const games=filteredGames(snapshot.games,{filter:'close'});
 assert.equal(games.length,4);
 assert.ok(games.every(g=>getWinner(g).probability<0.60));
});
test('search by team name is case insensitive',()=>{
 const games=filteredGames(snapshot.games,{filter:'all',search:'beNGals'});
 assert.deepEqual(games.map(g=>g.matchup),['TEN @ CIN']);
});
test('gamePlayers combines individual player metrics and preserves questionable status',()=>{
 const g=getGame(snapshot.games,'LV-NYJ');
 const roster=gamePlayers(snapshot.players,g);
 const hall=roster.find(p=>p.player==='Breece Hall');
 assert.equal(hall.projections.rush_yds,61);
 assert.match(hall.availability,/QUESTIONABLE/);
 const burrow=gamePlayers(snapshot.players,getGame(snapshot.games,'TEN-CIN')).find(p=>p.player==='Joe Burrow');
 assert.equal(burrow.projections.pass_tds,2.84);
});
test('metric label differentiates TD expectations from whole yard expectations',()=>{
 assert.equal(formatMetric('pass_tds',2.84),'2.84 expected pass TDs');
 assert.equal(formatMetric('rec_yds',84),'84 receiving yds');
});
test('deep link share URL sanitizes previous fragment and points at specified matchup',()=>{
 const url=createGameUrl('https://example.pages.dev/?src=wa#old','TEN-CIN');
 assert.equal(url,'https://example.pages.dev/?src=wa#game=TEN-CIN');
});
test('no selected game for unsupported slug',()=>{
 assert.equal(getGame(snapshot.games,'PINK-PLANET'),null);
});
