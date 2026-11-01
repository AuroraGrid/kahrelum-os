import test from 'node:test';
import assert from 'node:assert/strict';
import { handleDrafts } from '../functions/api/drafts.js';
function req(q='league_id=123456789'){return new Request('https://lineupsandlines.pages.dev/api/drafts?'+q)}
async function read(r){return r.json()}
const league={league_id:'123456789',name:'Sample NFL League',sport:'nfl',season:'2026'};
const drafts=[{draft_id:'923456789',status:'drafting',season:'2026',type:'snake',settings:{rounds:15,teams:12}}];
const picks=[{pick_no:1,round:1,roster_id:1,player_id:'9999',metadata:{first_name:'Jordan',last_name:'Example',position:'RB',team:'ATL'}}];

test('rejects unsupported ids before requesting upstream',async()=>{
 for(const q of ['','league_id=abc','league_id=123/evil','league_id=123456789%20AND%201=1']){
  const r=await handleDrafts({request:req(q),env:{}},async()=>{throw Error('must not fetch')});
  assert.equal(r.status,400);
 }
});

test('fetches documented Sleeper league, drafts and picks without a paid key',async()=>{
 const calls=[];const fetcher=async u=>{
  calls.push(u);
  if(u.endsWith('/drafts'))return Response.json(drafts);
  if(u.endsWith('/picks'))return Response.json(picks);
  return Response.json(league);
 };
 const r=await handleDrafts({request:req(),env:{}},fetcher,Date.parse('2026-11-01T04:05:00Z'));
 const x=await read(r);assert.equal(r.status,200);assert.equal(x.status,'OK');
 assert.equal(x.league.name,'Sample NFL League');assert.equal(x.drafts.length,1);
 assert.equal(x.picks[0].playerName,'Jordan Example');
 assert.ok(calls.every(u=>u.startsWith('https://api.sleeper.app/v1/')));
 assert.equal(x.license,'NONCOMMERCIAL_PUBLIC_READ_ONLY');
});

test('returns upstream unavailable rather than dummy draft data',async()=>{
 const r=await handleDrafts({request:req(),env:{}},async()=>new Response('no', {status:503}));
 const x=await read(r);assert.equal(r.status,502);assert.equal(x.status,'PROVIDER_ERROR');
 assert.deepEqual(x.drafts,[]);assert.deepEqual(x.picks,[]);
});

test('league without a draft is a real empty state',async()=>{
 const r=await handleDrafts({request:req(),env:{}},async u=>Response.json(u.endsWith('/drafts')?[]:league));
 const x=await read(r);assert.equal(x.status,'OK');assert.deepEqual(x.drafts,[]);
 assert.equal(x.picks.length,0);
});
