'use strict';
// Real Chrome regression: open KAHRELUM's shared dropdown at narrow phone
// widths and measure its geometry, not merely the page's closed-menu overflow.
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const origin=(process.argv[2]||'').replace(/\/+$/,'');
if(!/^https:\/\/kahrelum-public-hosting--safe-overlay-[a-z0-9-]+\.web\.app$/.test(origin)){
 console.error('Only a verified, isolated KAHRELUM Firebase preview is accepted');process.exit(2);
}
function chromeBinary(){
 for(const bin of [process.env.CHROME_PATH,'google-chrome-stable','google-chrome','chromium-browser','chromium'].filter(Boolean)){
  if(fs.existsSync(bin))return bin;
  const r=cp.spawnSync('which',[bin],{encoding:'utf8'});if(r.status===0)return r.stdout.trim();
 }
 throw Error('Chrome not found: refuse unverified mobile release');
}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'kahrelum-mobile-nav-'));
 const port=+(process.env.KAHRELUM_MOBILE_CDP_PORT||9324);
 const child=cp.spawn(chromeBinary(),['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--remote-debugging-port='+port,'--user-data-dir='+tmp,'about:blank'],{stdio:'ignore'});
 let ws;let nextId=0;const awaiting=new Map(),results=[];
 try{
  let tab;
  for(let n=0;n<100;n++){
   try{const tabs=await(await fetch('http://127.0.0.1:'+port+'/json/list')).json();tab=tabs.find(t=>t.type==='page'&&t.webSocketDebuggerUrl);if(tab)break}catch{}
   await wait(150);
  }
  assert.ok(tab,'Chrome debug tab unavailable');
  ws=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
  ws.addEventListener('message',e=>{
   const res=JSON.parse(e.data);
   if(res.id&&awaiting.has(res.id)){const p=awaiting.get(res.id);awaiting.delete(res.id);res.error?p.reject(Error(JSON.stringify(res.error))):p.resolve(res.result)}
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++nextId;awaiting.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
  const evaluate=async expression=>{
   const answer=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
   if(answer.exceptionDetails)throw Error(JSON.stringify(answer.exceptionDetails));
   return answer.result.value;
  };
  await send('Page.enable');await send('Runtime.enable');
  for(const width of [320,390,414,768]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:true});
   for(const route of ['/','/assurance','/pilot']){
    const check=await fetch(origin+route,{redirect:'follow'});
    assert.equal(check.status,200,'Preview HTTP failure '+route);
    await send('Page.navigate',{url:origin+route});
    let ready=false;
    for(let t=0;t<80;t++){
     await wait(160);
     if(await evaluate('document.readyState === "complete" && !!document.querySelector(".site-mobile-group")')){ready=true;break}
    }
    assert.ok(ready,'Page or grouped mobile menu not ready '+route+' @'+width);
    const result=await evaluate(`(()=>{const menu=document.querySelector('.site-mobile-menu');
      if(!menu)return {error:'missing mobile menu'};
      menu.open=true;
      const panel=menu.querySelector('.site-mobile-panel');
      if(!panel)return {error:'missing panel'};
      const r=panel.getBoundingClientRect();
      return {viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,
        panelWidth:Math.round(r.width),left:Math.round(r.left),right:Math.round(r.right),
        open:menu.open,menuVisible:getComputedStyle(menu).display!=='none',
        linkCount:panel.querySelectorAll('a').length,
        narrowLinks: [...panel.querySelectorAll('a')].filter(a=>a.getBoundingClientRect().width<110).map(a=>a.textContent.trim())
      };
    })()`);
    if(result.error)throw Error(result.error+': '+route);
    const minWidth=Math.min(width<=480?width-32:width*.92,384);
    assert.equal(result.open,true,'Menu did not open');
    assert.equal(result.menuVisible,true,'Mobile menu unexpectedly hidden');
    assert.ok(result.panelWidth>=minWidth-3,
      'Dropdown collapsed: '+JSON.stringify({route,width,minWidth,...result}));
    assert.ok(result.left>=-1&&result.right<=width+1,
      'Dropdown escapes viewport: '+JSON.stringify({route,width,...result}));
    assert.ok(result.scroll<=result.viewport+4,
      'Page scrolls sideways with dropdown open: '+JSON.stringify({route,width,...result}));
    assert.ok(result.linkCount>=8,'Grouped navigation links missing');
    assert.equal(result.narrowLinks.length,0,'Unreadably narrow menu links '+JSON.stringify(result.narrowLinks));
    results.push({route,width,panelWidth:result.panelWidth,overflow:result.scroll-result.viewport,links:result.linkCount});
   }
  }
  console.log('MOBILE_NAV_BROWSER_QA_PASS '+JSON.stringify({origin,checks:results.length,results}));
 }finally{
  try{ws?.close()}catch{}
  try{child.kill('SIGTERM')}catch{}
  try{fs.rmSync(tmp,{recursive:true,force:true})}catch{}
 }
})().catch(e=>{console.error('MOBILE_NAV_BROWSER_QA_FAIL '+(e.stack||e));process.exitCode=1});
