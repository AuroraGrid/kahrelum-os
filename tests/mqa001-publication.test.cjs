const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const route='/insights/morgan-dollar-quote',url='https://kahrelum.com'+route;
test('MQA canonical, social metadata and structured data agree',()=>{
 const s=read('insights/morgan-dollar-quote.html');
 for(const [name,value] of [['canonical',url],['og:url',url],['og:image','https://kahrelum.com/assets/social/og-mqa001.png'],['twitter:card','summary_large_image']]){
  assert.equal(s.split(name==='canonical'?'rel="canonical"':`="${name}"`).length-1,1);assert.ok(s.includes(value));
 }
 const schema=JSON.parse(s.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);assert.equal(schema.mainEntityOfPage,url);assert.equal(schema['@type'],'Article');
 assert.equal((s.match(/<h1>/g)||[]).length,1);assert.ok(s.includes('scope="col"'));assert.ok(s.includes('Skip to main content'));
});
test('MQA publication preserves unrecovered evidence and synthetic boundaries',()=>{
 const s=read('insights/morgan-dollar-quote.html');
 for(const phrase of ['Current case decision: HOLD','original conversation and the named pilot ZIP were not recovered','not establish that a commercial AI product failed','not a market quote','39 of 40','claimed 15-test baseline','0.77345051','exactly three'])assert.ok(s.includes(phrase),phrase);
});
test('all four original social assets have exact dimensions and distinct bytes',()=>{
 const seen=new Set();for(const [name,w,h] of [['og-mqa001',1200,630],['mqa001-linkedin',1200,627],['mqa001-substack',1456,1048],['mqa001-x-article',1500,600]]){
  const b=fs.readFileSync(path.join(root,'assets/social',name+'.png'));assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(b.readUInt32BE(16),w);assert.equal(b.readUInt32BE(20),h);seen.add(require('node:crypto').createHash('sha256').update(b).digest('hex'));
 }assert.equal(seen.size,4);
});
test('discovery and manual release profile include the exact new route',()=>{
 for(const p of ['insights.html','sitemap.md','scripts/firebase-overlay-release.cjs'])assert.ok(read(p).includes(route),p);
 assert.ok(read('scripts/deploy-unified-firebase.ps1').includes('"mqa001-review"'));
 assert.ok(!read('.github/workflows/firebase-scoped-release.yml').includes('selections+=(mqa001-review)'));
});
test('fifteen prospects are unique, five original and ten additional; no traction invented',()=>{
 const x=JSON.parse(read('research/mqa-001/prospects.json')).companies;
 assert.equal(x.length,15);assert.equal(new Set(x.map(r=>r.company)).size,15);assert.equal(x.filter(r=>r.cohort==='original').length,5);
 assert.ok(read('research/mqa-001/experiment-30-days.md').includes('total cumulative cash $2,500, not $3,250'));
});
test('protected historical content matches canonical Git bytes across checkout EOLs',()=>{
 const hashes=JSON.parse(read('research/mqa-001/protected-git-baseline.json'));
 for(const [p,expected] of Object.entries(hashes))assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n')).digest('hex'),expected,p);
});
