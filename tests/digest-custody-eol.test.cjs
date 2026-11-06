'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const read=x=>fs.readFileSync(path.join(root,x));
test('all 34 captured election cohort source receipts are byte-identical to their locked hashes on every OS',()=>{
 const m=JSON.parse(read('research/election-challenge-2026/cohort-manifest.json'));
 assert.equal(Object.keys(m.sourceReceipts).length,34);
 for(const [sid,ref] of Object.entries(m.sourceReceipts)){
  assert.equal(sha(read(ref.path)),ref.sha256,sid+': raw source bytes must not be converted at checkout');
 }
});
test('NBA source catalog raw bytes match historical custody hash',()=>{
 const catalog='research/nba-player-portraits/espn-sources-2026-10-31.json';
 const ledger=JSON.parse(read('sports/nba-player-portraits.json'));
 assert.equal(sha(read(catalog)),ledger.sourceCatalogSha256);
});
test('cross-platform Git attributes pin exactly the two digest-bound data classes to LF',()=>{
 const attrs=read('.gitattributes').toString('utf8');
 assert.match(attrs,/^research\/election-challenge-2026\/sources\/\*\.json text eol=lf$/m);
 assert.match(attrs,/^research\/nba-player-portraits\/espn-sources-2026-10-31\.json text eol=lf$/m);
});
