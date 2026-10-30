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
test('session advertises live research whenever the Gemini model key exists',async t=>{
 t.after(()=>{process.env={...old}});
 process.env.KAHRELUM_ONE_SESSION_SECRET=secret;process.env.KAHRELUM_ONE_INVITE_HASHES=hash;process.env.GEMINI_API_KEY='test-gemini';delete process.env.TAVILY_API_KEY;
 const token=signedToken();let res=response();await session(req('GET',{}, {cookie:`k1_session=${token}`}),res);assert.equal(res.body.liveResearchAvailable,true);
 delete process.env.GEMINI_API_KEY;res=response();await session(req('GET',{}, {cookie:`k1_session=${token}`}),res);assert.equal(res.body.liveResearchAvailable,false);
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
test('live research uses no-key DuckDuckGo search, cites results, and fails closed on throttling',async t=>{
 t.after(()=>{process.env={...old};global.fetch=originalFetch});
 process.env.KAHRELUM_ONE_SESSION_SECRET=secret;process.env.KAHRELUM_ONE_INVITE_HASHES=hash;process.env.GEMINI_API_KEY='test-gemini';
 const originalFetch=global.fetch, token=signedToken();let calls=[];
 delete process.env.TAVILY_API_KEY;
 let res=response();
 global.fetch=async(url,options)=>{
  calls.push(url);
  if(url.startsWith('https://html.duckduckgo.com/html/?q=')){
   assert.match(url,/%3F|%20|%3F/);assert.match(options.headers.Accept,/text\/html/);
   return{ok:true,text:async()=>'<div class="result"><a class="result__a" href="https://example.org/current">Official update</a><a class="result__snippet">A current source excerpt &amp; detail.</a></div>'};
  }
  assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));assert.equal(options.headers['x-goog-api-key'],'test-gemini');
  const body=JSON.parse(options.body);assert.match(body.contents.at(-1).parts[0].text,/\[1\] Official update/);assert.match(body.contents.at(-1).parts[0].text,/search-result excerpts/);
  return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'The update says this [1].'}]}}]})};
 };
 res=response();await chat(req('POST',{messages:[{role:'user',content:'What changed today?'}],mode:'check',liveResearch:true},{cookie:`k1_session=${token}`}),res);
 assert.equal(res.statusCode,200);assert.equal(calls.length,4);assert.ok(calls[0].startsWith('https://html.duckduckgo.com/html/?q='));assert.ok(calls.slice(1).every(url=>url.startsWith('https://generativelanguage.googleapis.com/')));assert.equal(res.body.sources[0].url,'https://example.org/current');assert.match(res.body.answer,/\[1\]/);assert.equal(res.body.pipeline.reviewPasses,3);
 calls=[];global.fetch=async url=>{calls.push(url);return{ok:false,status:429,text:async()=>''}};
 res=response();await chat(req('POST',{messages:[{role:'user',content:'What changed today?'}],mode:'check',liveResearch:true},{cookie:`k1_session=${token}`}),res);
 assert.equal(res.statusCode,503);assert.match(res.body.error,/rate-limited/);assert.equal(calls.length,1);assert.ok(calls[0].startsWith('https://html.duckduckgo.com/html/?q='));
});
test('DuckDuckGo parser unwraps redirects, decodes snippets, and excludes unsafe links',()=>{
 const {parseDuckDuckGoResults}=chat;
 const html='<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.org%2Fstory%3Fa%3D1%26b%3D2">A &amp; B</a><a class="result__snippet">One &amp; two &#39;three&#39;.</a><a class="result__a" href="http://insecure.example/x">Insecure</a><a class="result__a" href="https://duckduckgo.com/about">Search engine</a>';
 const results=parseDuckDuckGoResults(html);assert.equal(results.length,1);assert.equal(results[0].url,'https://example.org/story?a=1&b=2');assert.equal(results[0].title,'A & B');assert.equal(results[0].content,"One & two 'three'.");
});
test('router sends explicit verification requests through ordered staged review passes',async t=>{
 t.after(()=>{process.env={...old};global.fetch=originalFetch});
 process.env.KAHRELUM_ONE_SESSION_SECRET=secret;process.env.KAHRELUM_ONE_INVITE_HASHES=hash;process.env.GEMINI_API_KEY='test-gemini';
 const originalFetch=global.fetch,token=signedToken(),prompts=[],stageInputs=[];
 global.fetch=async(url,options)=>{
  assert.ok(url.startsWith('https://generativelanguage.googleapis.com/'));
  const body=JSON.parse(options.body);prompts.push(body.systemInstruction.parts[0].text);stageInputs.push(body.contents.at(-1).parts[0].text);
  const n=prompts.length;
  return{ok:true,json:async()=>({candidates:[{content:{parts:[{text:n===1?'Evidence map: one claim is unverified.':n===2?'Countercase: the evidence has a gap.':'**Conclusion.**'}]}}]})};
 };
 const res=response();
 await chat(req('POST',{messages:[{role:'user',content:'Verify whether this claim is true.'}],mode:'everyday'},{cookie:'k1_session='+token}),res);
 assert.equal(res.statusCode,200);assert.equal(prompts.length,3);
 assert.match(prompts[0],/Terra evidence-alignment pass/);
 assert.match(prompts[1],/Blackglass-I adversarial pass/);
 assert.match(prompts[2],/Sol\/Command synthesis/);
 assert.match(stageInputs[1],/Evidence map/);assert.match(stageInputs[2],/Countercase/);
 assert.equal(res.body.answer,'Conclusion.');
 assert.equal(res.body.pipeline.route,'check');assert.equal(res.body.pipeline.reviewPasses,3);
 assert.equal(res.body.pipeline.recordRetention,'not persisted by server');
 assert.match(res.body.pipeline.responseFingerprint,/^[a-f0-9]{64}$/);
});
test('PWA manifest includes Android-sized install icons and a scoped standalone start URL',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../one/manifest.webmanifest'),'utf8'));
 assert.equal(manifest.start_url,'/one/');assert.equal(manifest.scope,'/one/');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons){assert.ok(fs.existsSync(path.join(__dirname,'..',icon.src.slice(1))));}
 assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
});
