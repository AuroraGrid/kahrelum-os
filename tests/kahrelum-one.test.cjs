const {test}=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const redeem=require('../api/one/redeem');
const session=require('../api/one/session');
const chat=require('../api/one/chat');
const secret='test-only-session-secret-with-more-than-32-characters';
const code='K1-test-invite-code-that-is-long-enough-1234567890';
const hash=crypto.createHash('sha256').update(code).digest('hex');
function response(){return {headers:{},statusCode:200,setHeader(k,v){this.headers[k]=v;return this},status(n){this.statusCode=n;return this},json(value){this.body=value;return this}}}
function req(method,body={},headers={}){return {method,body,headers:{host:'localhost:3000',...headers}}}
function signedToken(){const value=Buffer.from(JSON.stringify({aud:'kahrelum-one',exp:Math.floor(Date.now()/1000)+60})).toString('base64url');const mac=crypto.createHmac('sha256',secret).update(value).digest('base64url');return `${value}.${mac}`}
const old={...process.env};
test('invite redemption and signed session enforce server-side access',async t=>{
 t.after(()=>{process.env={...old}});
 process.env.KAHRELUM_ONE_SESSION_SECRET=secret;process.env.KAHRELUM_ONE_INVITE_HASHES=hash;
 let res=response();await redeem(req('POST',{code:'wrong-code-long-enough-000000000'}),res);assert.equal(res.statusCode,401);
 res=response();await redeem(req('POST',{code}),res);assert.equal(res.statusCode,200);const cookie=res.headers['Set-Cookie'];assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);
 const token=decodeURIComponent(cookie.match(/k1_session=([^;]+)/)[1]);
 res=response();await session(req('GET',{}, {cookie:`k1_session=${token}`}),res);assert.equal(res.statusCode,200);
 const tampered=token.slice(0,-1)+(token.endsWith('a')?'b':'a');res=response();await session(req('GET',{}, {cookie:`k1_session=${tampered}`}),res);assert.equal(res.statusCode,401);
});
test('existing Vercel ONE_* secrets can configure the invite gate without new secret names',async t=>{
 t.after(()=>{process.env={...old}});
 delete process.env.KAHRELUM_ONE_SESSION_SECRET;delete process.env.KAHRELUM_ONE_INVITE_HASHES;
 process.env.ONE_SESSION_SECRET=secret;process.env.ONE_INVITES_JSON=JSON.stringify([{sha256:hash}]);
 const res=response();await redeem(req('POST',{code}),res);assert.equal(res.statusCode,200);
});
test('session only advertises live research when both free-tier provider keys exist',async t=>{
 t.after(()=>{process.env={...old}});
 process.env.KAHRELUM_ONE_SESSION_SECRET=secret;process.env.KAHRELUM_ONE_INVITE_HASHES=hash;process.env.GEMINI_API_KEY='test-gemini';process.env.TAVILY_API_KEY='test-tavily';
 const token=signedToken();let res=response();await session(req('GET',{}, {cookie:`k1_session=${token}`}),res);assert.equal(res.body.liveResearchAvailable,true);
 delete process.env.TAVILY_API_KEY;res=response();await session(req('GET',{}, {cookie:`k1_session=${token}`}),res);assert.equal(res.body.liveResearchAvailable,false);
});
test('chat API rejects browser-only authorization and sends valid turns only through configured backend',async t=>{
 t.after(()=>{process.env={...old};global.fetch=originalFetch});
 process.env.KAHRELUM_ONE_SESSION_SECRET=secret;process.env.KAHRELUM_ONE_INVITE_HASHES=hash;
 const originalFetch=global.fetch;
 let res=response();await chat(req('POST',{messages:[{role:'user',content:'hello'}],mode:'everyday'}),res);assert.equal(res.statusCode,401);
 process.env.GEMINI_API_KEY='test-secret';
 global.fetch=async(_url,options)=>{const request=JSON.parse(options.body);assert.equal(request.contents[0].parts[0].text,'hello');return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Hi there.'}]}}]})}};
 const token=signedToken();
 delete process.env.GEMINI_API_KEY;res=response();await chat(req('POST',{messages:[{role:'user',content:'hello'}],mode:'everyday'},{cookie:`k1_session=${token}`}),res);assert.equal(res.statusCode,503);assert.match(res.body.error,/not configured/);
 process.env.GEMINI_API_KEY='test-secret';
 res=response();await chat(req('POST',{messages:[{role:'user',content:'hello'}],mode:'everyday'},{cookie:`k1_session=${token}`}),res);assert.equal(res.statusCode,200);assert.equal(res.body.answer,'Hi there.');
});
test('live research is explicit, free-tier basic search, cited, and fails closed without a Tavily key',async t=>{
 t.after(()=>{process.env={...old};global.fetch=originalFetch});
 process.env.KAHRELUM_ONE_SESSION_SECRET=secret;process.env.KAHRELUM_ONE_INVITE_HASHES=hash;process.env.GEMINI_API_KEY='test-gemini';
 const originalFetch=global.fetch, token=signedToken();let calls=[];
 delete process.env.TAVILY_API_KEY;
 global.fetch=async()=>{throw new Error('A provider must not be called without its key')};
 let res=response();await chat(req('POST',{messages:[{role:'user',content:'What changed today?'}],mode:'check',liveResearch:true},{cookie:`k1_session=${token}`}),res);assert.equal(res.statusCode,503);assert.match(res.body.error,/No search or model request/);
 process.env.TAVILY_API_KEY='test-tavily';
 global.fetch=async(url,options)=>{
  calls.push(url);
  if(url==='https://api.tavily.com/search'){
   assert.equal(options.headers.Authorization,'Bearer test-tavily');const body=JSON.parse(options.body);assert.equal(body.search_depth,'basic');assert.equal(body.max_results,5);assert.equal(body.include_answer,false);
   return{ok:true,json:async()=>({results:[{title:'Official update',url:'https://example.org/current',content:'A verified current source excerpt.'}]})};
  }
  assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));assert.equal(options.headers['x-goog-api-key'],'test-gemini');
  const body=JSON.parse(options.body);assert.match(body.contents.at(-1).parts[0].text,/\[1\] Official update/);
  return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'The update says this [1].'}]}}]})};
 };
 res=response();await chat(req('POST',{messages:[{role:'user',content:'What changed today?'}],mode:'check',liveResearch:true},{cookie:`k1_session=${token}`}),res);
 assert.equal(res.statusCode,200);assert.deepEqual(calls,['https://api.tavily.com/search',calls[1]]);assert.equal(res.body.sources[0].url,'https://example.org/current');assert.match(res.body.answer,/\[1\]/);
 calls=[];global.fetch=async url=>{calls.push(url);return{ok:false,status:429,json:async()=>({})}};
 res=response();await chat(req('POST',{messages:[{role:'user',content:'What changed today?'}],mode:'check',liveResearch:true},{cookie:`k1_session=${token}`}),res);
 assert.equal(res.statusCode,503);assert.match(res.body.error,/quota is exhausted/);assert.deepEqual(calls,['https://api.tavily.com/search']);
});
test('PWA manifest includes Android-sized install icons and a scoped standalone start URL',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../one/manifest.webmanifest'),'utf8'));
 assert.equal(manifest.start_url,'/one/');assert.equal(manifest.scope,'/one/');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons){assert.ok(fs.existsSync(path.join(__dirname,'..',icon.src.slice(1))));}
 assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
});
