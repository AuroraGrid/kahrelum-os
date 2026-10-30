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
test('chat API rejects browser-only authorization and sends valid turns only through configured backend',async t=>{
 t.after(()=>{process.env={...old};global.fetch=originalFetch});
 process.env.KAHRELUM_ONE_SESSION_SECRET=secret;process.env.KAHRELUM_ONE_INVITE_HASHES=hash;
 const originalFetch=global.fetch;
 let res=response();await chat(req('POST',{messages:[{role:'user',content:'hello'}],mode:'everyday'}),res);assert.equal(res.statusCode,401);
 process.env.GEMINI_API_KEY='test-secret';
 global.fetch=async(_url,options)=>{const request=JSON.parse(options.body);assert.equal(request.contents[0].parts[0].text,'hello');return {ok:true,json:async()=>({candidates:[{content:{parts:[{text:'Hi there.'}]}}]})}};
 const token=(()=>{const value=Buffer.from(JSON.stringify({aud:'kahrelum-one',exp:Math.floor(Date.now()/1000)+60})).toString('base64url');const mac=crypto.createHmac('sha256',secret).update(value).digest('base64url');return `${value}.${mac}`})();
 delete process.env.GEMINI_API_KEY;res=response();await chat(req('POST',{messages:[{role:'user',content:'hello'}],mode:'everyday'},{cookie:`k1_session=${token}`}),res);assert.equal(res.statusCode,503);assert.match(res.body.error,/not configured/);
 process.env.GEMINI_API_KEY='test-secret';
 res=response();await chat(req('POST',{messages:[{role:'user',content:'hello'}],mode:'everyday'},{cookie:`k1_session=${token}`}),res);assert.equal(res.statusCode,200);assert.equal(res.body.answer,'Hi there.');
});
test('PWA manifest includes Android-sized install icons and a scoped standalone start URL',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../one/manifest.webmanifest'),'utf8'));
 assert.equal(manifest.start_url,'/one/');assert.equal(manifest.scope,'/one/');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons){assert.ok(fs.existsSync(path.join(__dirname,'..',icon.src.slice(1))));}
 assert.ok(manifest.icons.some(icon=>icon.sizes==='192x192'));assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
});
