'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),http=require('http'),cp=require('child_process'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..');
const output=path.join(os.homedir(),'Documents','KAHRELUM_Custody','results-multi-release-20261105','browser-qa');
fs.mkdirSync(output,{recursive:true});
const port=8766;
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
  let resource;try{resource=new URL(req.url,'http://127.0.0.1').pathname;}catch{res.writeHead(400);res.end();return;}
  if(resource==='/election-results-2026')resource='/election-results-2026.html';
  if(resource==='/israel-certified-2026')resource='/israel-certified-2026.html';
  if(resource==='/nfl/deadline-watch-2026')resource='/nfl/deadline-watch-2026.html';
  const file=path.resolve(root,'.'+resource);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  fs.createReadStream(file).pipe(res);
});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chromeExe='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const args=['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9229','--window-size=390,844','--user-data-dir='+path.join(output,'chrome-qa-profile'),'http://127.0.0.1:'+port+'/election-results-2026.html'];
async function main(){
  await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve));
  const chrome=cp.spawn(chromeExe,args,{stdio:'ignore'});
  let socket;
  try{
    let target;
    for(let i=0;i<60;i++){
      try{const all=await (await fetch('http://127.0.0.1:9229/json/list')).json();target=all.find(x=>x.type==='page'&&x.webSocketDebuggerUrl);if(target)break;}catch{}
      await delay(200);
    }
    assert.ok(target,'Chrome CDP did not open');
    socket=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true})});
    let next=0;const pending=new Map();
    socket.addEventListener('message',e=>{const p=JSON.parse(e.data);if(p.id&&pending.has(p.id)){const x=pending.get(p.id);pending.delete(p.id);p.error?x.reject(Error(JSON.stringify(p.error))):x.resolve(p.result);}});
    const request=(method,params={})=>new Promise((resolve,reject)=>{const id=++next;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
    const js=async expr=>{const r=await request('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
    await request('Runtime.enable');await request('Page.enable');await request('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    async function navigate(file){
      await request('Page.navigate',{url:'http://127.0.0.1:'+port+'/'+file});
      for(let i=0;i<50;i++){await delay(160);const status=await js('document.readyState');if(status==='complete')break;}
      await delay(600);
    }
    await navigate('election-results-2026.html');
    const us=await js(`({mapStates:document.querySelectorAll('#usMap path').length,house:document.querySelector('#houseTotal').textContent,rows:document.querySelector('#rowCount').textContent,source:document.querySelector('#updatedLine').textContent,overflow:document.documentElement.scrollWidth-window.innerWidth})`);
    assert.equal(us.mapStates,50);assert.ok(us.house.includes('239 D'));assert.ok(us.rows.includes('506'));assert.ok(us.source.includes('not certified'));assert.ok(us.overflow<=2);
    const filter=await js(`(()=>{const x=document.querySelector('#query');x.value='Alaska';x.dispatchEvent(new Event('input',{bubbles:true}));return document.querySelector('#rowCount').textContent})()`);
    assert.ok(filter.includes('matching races'));assert.ok(!filter.includes('of 506 matching'));
    await navigate('israel-certified-2026.html');
    const israel=await js(`({rows:document.querySelectorAll('#resultsRows tr').length,mae:document.querySelector('#mae').textContent,external:document.querySelector('#externalMae').textContent,status:document.querySelector('#resultsStatus').textContent,overflow:document.documentElement.scrollWidth-window.innerWidth})`);
    assert.equal(israel.rows,14);assert.equal(israel.mae,'0.571');assert.equal(israel.external,'1.429');assert.ok(israel.status.includes('L1'));assert.ok(israel.overflow<=2);
    await navigate('nfl/deadline-watch-2026.html');
    const nfl=await js(`({deals:document.querySelectorAll('#deals article').length,official:document.querySelector('#officialCount').textContent,review:document.querySelector('#queueCount').textContent,source:document.querySelector('#statusDetail').textContent,error:document.querySelector('#error').textContent,overflow:document.documentElement.scrollWidth-window.innerWidth})`);
    assert.equal(nfl.deals,7);assert.equal(nfl.official,'7');assert.equal(nfl.error,'');assert.ok(nfl.review.length>0);assert.ok(nfl.overflow<=2);
    const report={checkedAtUtc:new Date().toISOString(),source:'LOCAL_UNPUBLISHED_RELEASE_PREVIEW',us,filter,israel,nfl,status:'PASS'};
    fs.writeFileSync(path.join(output,'results-browser-e2e.json'),JSON.stringify(report,null,2));
    console.log('E2E_PASS '+JSON.stringify(report));
  }finally{try{socket?.close()}catch{}try{chrome.kill()}catch{}server.close();}
}
main().catch(e=>{console.error('E2E_FAILED '+String(e.stack||e));process.exitCode=1;server.close();});
