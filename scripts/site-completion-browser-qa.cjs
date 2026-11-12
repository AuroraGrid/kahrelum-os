'use strict';
const assert=require('node:assert/strict'),cp=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin=(process.argv[2]||'').replace(/\/+$/,'');
if(!/^https:\/\/[a-z0-9.-]+\.web\.app$/.test(origin)&&origin!=='https://kahrelum.com'){
 console.error('Use public verified Firebase preview or kahrelum.com');process.exit(2);
}
function findChrome(){
 for(const bin of [process.env.CHROME_PATH,'google-chrome-stable','google-chrome','chromium-browser','chromium'].filter(Boolean)){
  const x=cp.spawnSync('which',[bin],{encoding:'utf8'});if(x.status===0)return x.stdout.trim();
  if(fs.existsSync(bin))return bin;
 }
 throw Error('Headless Chrome missing; mobile QA cannot pass.');
}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function main(){
 if(typeof WebSocket!=='function')throw Error('Node 22 WebSocket required for browser QA');
 const chrome=findChrome(),dir=fs.mkdtempSync(path.join(os.tmpdir(),'kahrelum-responsive-'));
 const port=+(process.env.KAHRELUM_CDP_PORT||9323);
 const proc=cp.spawn(chrome,['--headless=new','--disable-gpu','--disable-dev-shm-usage','--no-sandbox','--no-first-run','--remote-debugging-port='+port,'--user-data-dir='+dir,'about:blank'],{stdio:'ignore'});
 let ws,calls=0;const pending=new Map(),reports=[];
 try{
  let target;
  for(let i=0;i<90;i++){
   try{const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();target=tabs.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(target)break}catch{}
   await delay(150);
  }
  assert.ok(target,'Chrome did not open DevTools');
  ws=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
  ws.addEventListener('message',e=>{const msg=JSON.parse(e.data);if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);msg.error?p.reject(Error(JSON.stringify(msg.error))):p.resolve(msg.result)}});
  const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++calls;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
  const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value};
  await call('Page.enable');await call('Runtime.enable');
  const inspector="(()=>({scrollWidth:document.documentElement.scrollWidth,clientWidth:document.documentElement.clientWidth,viewportWidth:window.innerWidth,hasH1:!!document.querySelector('main h1'),siteMobileMenu:!!document.querySelector('.site-mobile-menu summary'),pilotInquiry:!!document.querySelector('#pilotInquiry'),pilotPreview:!!document.querySelector('#inquiryPreview'),formLabels:document.querySelector('#pilotInquiry')?Array.from(document.querySelectorAll('#pilotInquiry input,#pilotInquiry select,#pilotInquiry textarea')).every(el=>!!document.querySelector('label[for=\"'+el.id+'\"]')):true,navMs:Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd||0),firstContentfulPaint:Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime||0)}))()";
  for(const width of [320,390,768,1280]){
   await call('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<=390});
   for(const route of ['/','/pilot','/insights','/nfl/deadline-watch-2026']){
    const response=await fetch(origin+route,{redirect:'follow'});
    assert.equal(response.status,200,'HTTP error on '+route+' @'+width);
    await call('Page.navigate',{url:origin+route});
    let ready=false;
    for(let t=0;t<65;t++){await delay(150);if(await evaluate('document.readyState')==='complete'){ready=true;break}}
    assert.ok(ready,'No completed load for '+route+' @'+width);
    const result=await evaluate(inspector);
    const overflow=Math.max(0,result.scrollWidth-result.clientWidth);
    reports.push({route,width,overflow,...result});
    assert.ok(result.hasH1,'Missing public page H1: '+route);
    assert.ok(result.siteMobileMenu,'Mobile navigation missing: '+route);
    assert.ok(overflow<=4,'Horizontal overflow '+overflow+'px on '+route+' @'+width+'px');
    if(route==='/pilot'){assert.ok(result.pilotInquiry&&result.pilotPreview,'Buyer preview missing');assert.ok(result.formLabels,'Unlabelled buyer input')}
   }
  }
  console.log('SITE_BROWSER_QA_PASS '+JSON.stringify({origin,checks:reports.length,maxOverflow:Math.max(...reports.map(x=>x.overflow)),reports}));
 }finally{try{ws?.close()}catch{}try{proc.kill('SIGTERM')}catch{}try{fs.rmSync(dir,{recursive:true,force:true})}catch{}}
}
main().catch(e=>{console.error('SITE_BROWSER_QA_FAIL '+String(e.stack||e));process.exitCode=1});
