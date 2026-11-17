const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {patchDiscovery}=require('../scripts/mqa001-discovery.cjs');
for(const name of ['insights.html','sitemap.md'])test('MQA preserves live additions and rejects conflicting discovery: '+name,()=>{
 const source=fs.readFileSync(require('node:path').join(__dirname,'..',name),'utf8');
 const live=name==='insights.html'?'<main>Later unrelated evidence and links</main>':'# Later live directory\n';
 const out=patchDiscovery(live,source,name);
 assert.ok(out.includes('Later'));assert.equal(patchDiscovery(out,source,name),out);
 assert.equal(out.split('/insights/morgan-dollar-quote').length,2);
 assert.throws(()=>patchDiscovery(live+' /insights/morgan-dollar-quote',source,name),/Conflicting/);
 if(name==='insights.html')assert.equal(out.replace(/<section aria-labelledby="mqa001-title">[\s\S]*?<\/section>\n/,''),live);
 else assert.ok(out.startsWith(live));
});
