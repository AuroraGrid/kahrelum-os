'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const image='assets/social/og-ai-intelligence-evaluation-2026.png';
test('synthetic AI evaluation has a distinct 1200x630 source-bound social image',()=>{
  const html=read('ai-intelligence-evaluation-2026.html');
  const imageUrl='https://kahrelum.com/'+image;
  assert.ok(html.includes('property="og:image" content="'+imageUrl+'"'));
  assert.ok(html.includes('name="twitter:image" content="'+imageUrl+'"'));
  assert.match(html,/name="twitter:card" content="summary_large_image"/);
  assert.ok(html.includes('name="og:image:alt"')||html.includes('property="og:image:alt"'));
  const data=fs.readFileSync(path.join(root,image));
  assert.equal(data.subarray(1,4).toString('ascii'),'PNG');
  assert.equal(data.readUInt32BE(16),1200);
  assert.equal(data.readUInt32BE(20),630);
});
test('AI evaluation guarded profile includes the image and verifies public bytes',()=>{
  const pub=read('scripts/firebase-overlay-release.cjs');
  const match=pub.match(/  'ai-evaluation': \{([\s\S]*?)\n  \},/);
  assert.ok(match,'AI evaluation release profile');
  assert.ok(match[1].includes(image));
  assert.match(pub,/AI evaluation social preview readback failed/);
  assert.match(pub,/AI evaluation release attempted to change an unrelated live Firebase path/);
});
