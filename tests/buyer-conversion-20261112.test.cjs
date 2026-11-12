'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');

test('assurance shows relevant buyer-intent information without fictional cases',()=>{
 const html=read('assurance.html');
 assert.match(html,/<title>AI Agent Decision Audits &amp; Assurance \| KAHRELUM<\/title>/);
 const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
 assert.ok(description.length>=110&&description.length<=165,description.length);
 assert.match(description,/historical AI agent decisions/i);
 assert.match(html,/<section id="example-decision-audits"/);
 assert.match(html,/Illustrative scenarios only; not customer cases or verified defects/i);
 for(const term of ['Approval gate','Escalation rule','Source cutoff','/demo','/pilot#request']){
  assert.ok(html.includes(term),'Missing assurance proof and CTA: '+term);
 }
 assert.match(html,/href="https:\/\/kahrelum\.com\/assurance"/);
 assert.match(html,/og-assurance\.png/);
 assert.match(html,/"@type":"Service"/);
 assert.match(html,/\$750/);
 assert.match(html,/\$2,500/);
 assert.match(html,/No live third-party system access/i);
});

test('pilot communicates price, manual-send inquiry, and fit check steps without claims of certification',()=>{
 const html=read('pilot.html');
 assert.match(html,/<title>AI Decision Audit: \$750 Fit Check \| KAHRELUM<\/title>/);
 const description=html.match(/<meta name="description" content="([^"]+)"/)?.[1]||'';
 assert.ok(description.length>=110&&description.length<=165,description.length);
 assert.match(description,/three authorized historical AI decisions/i);
 assert.match(html,/<section id="fit-check-process"/);
 assert.match(html,/No confidential materials at inquiry/i);
 assert.match(html,/you send/i);
 assert.match(html,/id="pilotInquiry"/);
 assert.match(html,/id="copyInquiry"/);
 assert.match(html,/not automatically transmitted|not automatically sent/i);
 assert.match(html,/<meta property="og:image" content="https:\/\/kahrelum\.com\/assets\/social\/og-pilot\.png">/);
 assert.match(html,/name="twitter:card" content="summary_large_image"/);
 assert.match(html,/No production access/i);
 assert.match(html,/\$750/);
 assert.match(html,/\$2,500/);
});

test('buyer improvements alter no investigation, forecast, election or archived social content',()=>{
 const {execFileSync}=require('node:child_process');
 const changed=execFileSync('git',['diff','--name-only','main...HEAD'],{cwd:path.join(__dirname,'..'),encoding:'utf8'})
 .split(/\r?\n/).filter(Boolean);
 for(const filename of changed){
   if(filename.startsWith('assets/')||filename.startsWith('research/')||filename.startsWith('election/')||
     filename.startsWith('investigations/')||filename.startsWith('nfl/')) {
     assert.fail('Protected source modified: '+filename);
   }
 }
});
