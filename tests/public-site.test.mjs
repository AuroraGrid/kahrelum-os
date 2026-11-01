import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=()=>readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const script=()=>readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const readme=()=>readFileSync(new URL('../README.md',import.meta.url),'utf8');

test('the sports project stands on its own branding without Kahrelum website links',()=>{
 const h=html();assert.match(h,/<title>Lineups &amp; Lines/);
 assert.match(h,/Fantasy Drafts/);assert.match(h,/Odds Board/);assert.match(h,/Edge Lab/);
 assert.doesNotMatch(h,/href="https:\/\/kahrelum\.com/);
});

test('every search and refresh control has a real handler',()=>{
 const h=html(),s=script();
 for(const id of ['sportSelect','regionSelect','marketSelect','refreshOdds','oddsResults','oddsStatus','leagueId','fetchDrafts','draftResults','probabilityInput','oddsInput','calculateEdge','edgeResult']){
  assert.match(h,new RegExp(`id="${id}"`));
  if(id!=='calculateEdge')assert.match(s,new RegExp(id));
 }
 assert.match(h,/<button id="calculateEdge"[^>]+type="submit"/);
 assert.match(s,/fetch\('\/api\/odds/);
 assert.match(s,/fetch\('\/api\/drafts/);
});

test('front end prohibits fake live bookmaker quotes and displays timestamp',()=>{
 const h=html(),s=script();
 assert.doesNotMatch(h,/data-fake-odds/);
 assert.match(h,/No odds loaded/);
 assert.match(s,/observedAt/);
 assert.match(s,/updatedAt/);
 assert.match(h,/not streaming/);
});

test('documentation gives a Cloudflare Pages deploy and key-and-KV setup',()=>{
 const d=readme();
 for(const word of ['Cloudflare Pages','ODDS_API_KEY','ODDS_CACHE','Connect to Git','Main branch','public','functions','The Odds API','Sleeper','quota'])assert.ok(d.includes(word),word);
 assert.match(d,/lineupsandlines\.pages\.dev/);
});
