'use strict';
// Submit only canonical, indexable URLs from the CURRENT LIVE KAHRELUM sitemap.
// Do not claim indexing: a successful IndexNow receipt proves notification, not search inclusion.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ORIGIN = 'https://kahrelum.com';
const SITEMAP_URL = ORIGIN + '/sitemap.xml';
const KEY_FILE = 'dedc67db0c224b1c9a4be1379f7937f5.txt';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const RESTRICTED = new Set(['/investigations/court-01','/investigations/court-05']);

function extractEligibleSitemapUrls(xml) {
  if (typeof xml !== 'string' || !xml.includes('<loc>')) throw new Error('Empty or unrecognized sitemap.');
  const values = Array.from(xml.matchAll(/<loc(?:\s[^>]*)?>([^<]+)<\/loc>/gi), m => m[1].trim().replace(/&amp;/g,'&'));
  if (!values.length) throw new Error('Empty sitemap URL set.');
  const seen = new Set();
  const urls = [];
  for (const text of values) {
    let parsed;
    try { parsed = new URL(text); } catch { throw new Error('Invalid sitemap URL: '+text); }
    if (parsed.origin !== ORIGIN || parsed.protocol !== 'https:') throw new Error('Off-host sitemap URL: '+text);
    if (parsed.search || parsed.hash || parsed.href !== text) throw new Error('Noncanonical sitemap URL: '+text);
    if (RESTRICTED.has(parsed.pathname)) throw new Error('Restricted case must not enter IndexNow: '+text);
    if (seen.has(parsed.href)) throw new Error('Duplicate URL in sitemap: '+text);
    seen.add(parsed.href);
    urls.push(parsed.href);
  }
  return urls;
}

async function main(argv=process.argv.slice(2)) {
  const mode=argv[0]||'--plan';
  if (!['--plan','--submit'].includes(mode)) throw new Error('Select --plan or --submit.');
  const receiptOption=argv.indexOf('--receipt');
  const receiptPath=receiptOption<0?null:argv[receiptOption+1];
  if (receiptOption>=0 && !receiptPath) throw new Error('--receipt requires a destination path.');
  const filename=path.join(__dirname,'..',KEY_FILE);
  const key=fs.readFileSync(filename,'utf8');
  if (key !== KEY_FILE.slice(0,-4) || !/^[a-z0-9-]{8,128}$/.test(key)) {
    throw new Error('Local IndexNow key does not match its root filename.');
  }
  const response=await fetch(SITEMAP_URL,{cache:'no-store'});
  if (!response.ok) throw new Error('Live sitemap request failed: HTTP '+response.status);
  const xml=await response.text();
  const urlList=extractEligibleSitemapUrls(xml);
  if (urlList.length < 40 || urlList.length > 10000) throw new Error('Incomplete or unexpectedly large live sitemap: '+urlList.length);
  for (const required of ['/investigations/chip-01','/insights/nvidia-megaspeed-chip-custody']) {
    if (!urlList.includes(ORIGIN+required)) throw new Error('Missing latest key publication route: '+required);
  }
  const keyUrl=ORIGIN+'/'+KEY_FILE;
  const proof=await fetch(keyUrl,{cache:'no-store'});
  if (!proof.ok) throw new Error('IndexNow key verification URL is not public: HTTP '+proof.status);
  const proofText=await proof.text();
  if (proofText.trim() !== key) throw new Error('IndexNow key verification file does not contain the expected key.');
  const summary={site:ORIGIN,sitemap:SITEMAP_URL,keyUrl,publicUrlCount:urlList.length,
    restrictedUrlsExcluded:Array.from(RESTRICTED),sitemapSha256:crypto.createHash('sha256').update(xml).digest('hex')};
  if (mode==='--plan') {console.log(JSON.stringify({status:'PLAN',...summary},null,2));return;}
  const payload={host:'kahrelum.com',key,keyLocation:keyUrl,urlList};
  const submitted=await fetch(INDEXNOW_ENDPOINT,{
    method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify(payload)
  });
  const accepted=responseStatusOk(submitted);
  const details=(await submitted.text()).slice(0,800);
  const result={status:accepted?'ACCEPTED':'REJECTED',httpStatus:submitted.status,
    receiptTimeUtc:new Date().toISOString(),...summary,
    note:'Do not claim indexing. IndexNow reports receipt or acceptance, not Google or Bing indexed status.',
    response:details};
  console.log(JSON.stringify(result,null,2));
  if (receiptPath) {
    fs.mkdirSync(path.dirname(receiptPath),{recursive:true});
    fs.writeFileSync(receiptPath,JSON.stringify(result,null,2)+'\n','utf8');
  }
  if (!accepted) throw new Error('IndexNow did not accept the submission. HTTP '+submitted.status);
}
function responseStatusOk(response) {
  return response.status === 200 || response.status === 202;
}
if (require.main===module) main().catch(err=>{console.error(err.message);process.exitCode=1;});
module.exports={extractEligibleSitemapUrls,responseStatusOk};
