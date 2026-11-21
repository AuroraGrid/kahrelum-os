'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'site-shell.js'),'utf8');
const analytics=source.slice(source.indexOf('// Optional analytics:'));
function run(consent,gpc=false){
 const callbacks={},loaded=[];
 const document={
  head:{appendChild(el){loaded.push(el.src)}},
  body:{appendChild(){}},
  createElement(tag){return {nodeName:tag,style:{},setAttribute(){},replaceChildren(){},appendChild(){}};},
  addEventListener(name,callback){callbacks[name]=callback;},
  cookie:''
 };
 const location={origin:'https://kahrelum.com',pathname:'/pilot',href:'https://kahrelum.com/pilot?private=value',hostname:'kahrelum.com'};
 const navigator={globalPrivacyControl:gpc,doNotTrack:'0'};
 const localStorage={getItem(){return consent;}};
 const window={dataLayer:[]};
 const context={document,location,navigator,localStorage,window,URL,Date};
 vm.runInNewContext(analytics,context,{filename:'site-shell-analytics.js'});
 return {callbacks,loaded,window};
}
const payloads=(ctx)=>ctx.window.dataLayer.filter(x=>x&&x[0]==='event').map(x=>[x[1],JSON.parse(JSON.stringify(x[2]))]);
test('no analytics or inquiry telemetry without affirmative consent',()=>{
 const no=run('no');
 assert.equal(no.loaded.length,0);
 assert.equal(no.callbacks.click,undefined);
 assert.equal(no.callbacks.submit,undefined);
 const gpc=run('yes',true);
 assert.equal(gpc.loaded.length,0);
 assert.equal(gpc.callbacks.click,undefined);
 assert.equal(gpc.callbacks.submit,undefined);
});
test('opted-in visitors record inquiry drafting/copying as intent, never completed leads',()=>{
 const ctx=run('yes');
 assert.equal(ctx.loaded.length,1);
 ctx.callbacks.click({target:{closest(selector){
  return selector==='button' ? {id:'copyInquiry'} : null;
 }}});
 ctx.callbacks.submit({target:{id:'pilotInquiry'}});
 const events=payloads(ctx);
 assert.deepEqual(events.map(e=>e[0]),['pilot_inquiry_copy_attempt','pilot_inquiry_email_draft_request']);
 assert.deepEqual(events.map(e=>e[1]),[
  {page_location:'https://kahrelum.com/pilot'},
  {page_location:'https://kahrelum.com/pilot'}
 ]);
 assert.ok(!JSON.stringify(events).includes('private=value'));
 assert.ok(!JSON.stringify(events).includes('workflow'));
 assert.ok(!JSON.stringify(events).includes('concern'));
});
test('unrelated buttons/forms are ignored and existing mailto attribution survives',()=>{
 const ctx=run('yes');
 ctx.callbacks.click({target:{closest(selector){
  return selector==='button'?{id:'someOtherButton'}:null;
 }}});
 ctx.callbacks.submit({target:{id:'irrelevantForm'}});
 ctx.callbacks.click({target:{closest(selector){
  return selector==='button'?null:{getAttribute(){return 'mailto:hasan@kahrelum.com'}};
 }}});
 assert.deepEqual(payloads(ctx).map(e=>e[0]),['contact_click']);
});
test('guarded hosting workflow selects only consented script and tests for this release',()=>{
 const wf=fs.readFileSync(path.join(root,'.github/workflows/firebase-scoped-release.yml'),'utf8');
 const release=fs.readFileSync(path.join(root,'scripts/firebase-overlay-release.cjs'),'utf8');
 assert.match(wf,/profiles="ga4-consent"/);
 assert.match(wf,/site-shell\.js\|tests\/analytics-intent\.test\.cjs/);
 assert.match(wf,/ga4-consent\|/);
 assert.match(release,/'ga4-consent':\s*\{\s*overlayFiles:\s*\['site-shell.js'\]/);
 assert.match(release,/profileName === 'ga4-consent' && changedPaths\.some/);
});
