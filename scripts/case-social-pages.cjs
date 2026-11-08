'use strict';
// Standalone, dependency-free 1200×630 PNGs and individually shareable case pages.
// The only case facts come from the already-published Investigations HTML.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const W = 1200;
const H = 630;
const FONT = Object.fromEntries(Object.entries({
  A:'01110/10001/10001/11111/10001/10001/10001',
  B:'11110/10001/10001/11110/10001/10001/11110',
  C:'01111/10000/10000/10000/10000/10000/01111',
  D:'11110/10001/10001/10001/10001/10001/11110',
  E:'11111/10000/10000/11110/10000/10000/11111',
  F:'11111/10000/10000/11110/10000/10000/10000',
  G:'01111/10000/10000/10111/10001/10001/01111',
  H:'10001/10001/10001/11111/10001/10001/10001',
  I:'11111/00100/00100/00100/00100/00100/11111',
  J:'00111/00010/00010/00010/10010/10010/01100',
  K:'10001/10010/10100/11000/10100/10010/10001',
  L:'10000/10000/10000/10000/10000/10000/11111',
  M:'10001/11011/10101/10101/10001/10001/10001',
  N:'10001/11001/10101/10011/10001/10001/10001',
  O:'01110/10001/10001/10001/10001/10001/01110',
  P:'11110/10001/10001/11110/10000/10000/10000',
  Q:'01110/10001/10001/10001/10101/10010/01101',
  R:'11110/10001/10001/11110/10100/10010/10001',
  S:'01111/10000/10000/01110/00001/00001/11110',
  T:'11111/00100/00100/00100/00100/00100/00100',
  U:'10001/10001/10001/10001/10001/10001/01110',
  V:'10001/10001/10001/10001/10001/01010/00100',
  W:'10001/10001/10001/10101/10101/10101/01010',
  X:'10001/10001/01010/00100/01010/10001/10001',
  Y:'10001/10001/01010/00100/00100/00100/00100',
  Z:'11111/00001/00010/00100/01000/10000/11111',
  0:'01110/10011/10101/10101/11001/10001/01110',
  1:'00100/01100/00100/00100/00100/00100/01110',
  2:'01110/10001/00001/00010/00100/01000/11111',
  3:'11110/00001/00001/01110/00001/00001/11110',
  4:'00010/00110/01010/10010/11111/00010/00010',
  5:'11111/10000/10000/11110/00001/00001/11110',
  6:'01111/10000/10000/11110/10001/10001/01110',
  7:'11111/00001/00010/00100/01000/01000/01000',
  8:'01110/10001/10001/01110/10001/10001/01110',
  9:'01110/10001/10001/01111/00001/00001/11110',
  '-':'00000/00000/00000/11111/00000/00000/00000',
  ':':'00000/00100/00100/00000/00100/00100/00000',
  '.':'00000/00000/00000/00000/00000/00110/00110',
  ',':'00000/00000/00000/00000/00110/00110/00100',
  '/':'00001/00001/00010/00100/01000/10000/10000',
  '&':'01100/10010/10100/01000/10101/10010/01101',
  "'":'00100/00100/00000/00000/00000/00000/00000',
  ' ':'00000/00000/00000/00000/00000/00000/00000'
}).map(([k,v]) => [k, v.split('/')]));

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function plain(value) {
  return String(value).replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'");
}
function words(text, max) {
  const pieces = String(text).normalize('NFKD').toUpperCase().replace(/[\u2013\u2014]/g, '-').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const part of pieces) {
    if (line && (line + ' ' + part).length > max) { lines.push(line); line = part; }
    else line += (line ? ' ' : '') + part;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4).map(x => x.slice(0, max));
}
function crc32(data) {
  let c = 0xffffffff;
  for (const b of data) {
    c ^= b;
    for (let i=0;i<8;i++) c = (c & 1) ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(name, data) {
  const type = Buffer.from(name, 'ascii');
  const size = Buffer.alloc(4); size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([type,data])));
  return Buffer.concat([size,type,data,checksum]);
}
function makeCaseImage(item) {
  const stride = W*3+1;
  const bitmap = Buffer.alloc(stride*H);
  const colors = {CORP:[64,167,170],CYBER:[154,128,209],COURT:[215,154,91],
    MKT:[225,174,78],AI:[211,126,153],GEO:[196,118,112],AIR:[105,168,189],CHIP:[73,201,220],INSIGHT:[235,169,87]};
  const accent = colors[item.id.split('-')[0]] || [175,166,136];
  const number = Number(item.id.split('-')[1]) || 1;
  const back=[14,26,39], pale=[245,236,217], muted=[183,193,195];
  for (let y=0; y<H; y++) {
    const p=y*stride; bitmap[p]=0;
    for (let x=0; x<W; x++) {
      const i=p+1+x*3;
      bitmap[i]=back[0];bitmap[i+1]=back[1];bitmap[i+2]=back[2];
    }
  }
  function block(x,y,w,h,c) {
    const x0=Math.max(0,Math.floor(x)), x1=Math.min(W,Math.floor(x+w));
    const y0=Math.max(0,Math.floor(y)), y1=Math.min(H,Math.floor(y+h));
    for(let row=y0;row<y1;row++) for(let col=x0;col<x1;col++){
      const i=row*stride+1+col*3; bitmap[i]=c[0];bitmap[i+1]=c[1];bitmap[i+2]=c[2];
    }
  }
  function draw(value,x,y,scale,color) {
    for(const char of String(value).toUpperCase()) {
      const glyph=FONT[char] || FONT[' '];
      for(let yy=0;yy<7;yy++) for(let xx=0;xx<5;xx++)
        if(glyph[yy][xx]==='1') block(x+xx*scale,y+yy*scale,scale,scale,color);
      x+=6*scale;
    }
  }
  block(0,0,W,9,accent);block(0,0,19,H,accent);
  block(79,119,1030,2,[72,88,97]);
  draw('KAHRELUM / INVESTIGATIONS',82,69,5,muted);
  draw(item.id,82,158,13,accent);
  block(82,290,1030,2,accent);
  const lines=words(item.title, 34);
  lines.forEach((line,i)=>draw(line,83,328+i*52,6,pale));
  block(82,556,1030,2,[72,88,97]);
  draw('SOURCE-BOUND CASE RECORD',82,576,4,muted);
  // A distinct source-neutral design for each case, never fabricated photography.
  for(let i=0;i<6;i++)block(1015+i*23,158+(i*11+number*17)%55,9,65+(number*9+i*17)%86,accent);
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(W,0);ihdr.writeUInt32BE(H,4);ihdr[8]=8;ihdr[9]=2;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(bitmap,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function metaSwap(html, name, value, byName=false) {
  const type=byName?'name':'property';
  const re=new RegExp('<meta '+type+'="'+name+'" content="[^"]*">');
  if (!re.test(html)) throw new Error('Investigations metadata field missing: '+name);
  return html.replace(re, '<meta '+type+'="'+name+'" content="'+escapeHtml(value)+'">');
}
function extractCases(html) {
  const list=[];
  const regex=/<article class="case-record" id="case-([a-z0-9-]+)" data-case-id="([A-Z]+-[0-9]+)" data-reviewed="([0-9-]+)" data-status="([^"]+)">([\s\S]*?)<\/article>/g;
  for(const match of html.matchAll(regex)) {
    const title=plain(match[5].match(/<h3>([\s\S]*?)<\/h3>/)?.[1]||'');
    if(!title)throw new Error('Case without a title: '+match[2]);
    list.push({slug:match[1],id:match[2],reviewed:match[3],status:match[4],
      title,card:match[0]});
  }
  if(list.length!==12||new Set(list.map(x=>x.id)).size!==12)
    throw new Error('Expected twelve independent published case records; refusing incomplete case preview generation.');
  return list;
}
function caseDocument(item) {
  const url='https://kahrelum.com'+item.url;
  const image='https://kahrelum.com'+item.imagePath;
  const description=item.id+' · '+item.status+'. Historical evidence reviewed '+item.reviewed+
    '. Findings, source limitations and unresolved questions remain visible.';
  const alt=item.id+' case-specific KAHRELUM research preview, status '+item.status;
  const noindex=!item.includeInSitemap?'<meta name="robots" content="noindex,nofollow">':'';
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+escapeHtml(item.id+': '+item.title+' | KAHRELUM')+'</title>'+
    '<meta name="description" content="'+escapeHtml(description)+'">'+noindex+
    '<link rel="canonical" href="'+url+'">'+
    '<meta property="og:type" content="article"><meta property="og:url" content="'+url+'">'+
    '<meta property="og:title" content="'+escapeHtml(item.id+': '+item.title+' | KAHRELUM')+'">'+
    '<meta property="og:description" content="'+escapeHtml(description)+'">'+
    '<meta property="og:image" content="'+image+'"><meta property="og:image:secure_url" content="'+image+'">'+
    '<meta property="og:image:type" content="image/png">'+
    '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">'+
    '<meta property="og:image:alt" content="'+escapeHtml(alt)+'">'+
    '<meta name="twitter:card" content="summary_large_image">'+
    '<meta name="twitter:title" content="'+escapeHtml(item.id+': '+item.title+' | KAHRELUM')+'">'+
    '<meta name="twitter:description" content="'+escapeHtml(description)+'">'+
    '<meta name="twitter:image" content="'+image+'">'+
    '<link rel="stylesheet" href="/divisions.css"><link rel="stylesheet" href="/site-shell.css">'+
    '<style>body{background:#f4efe6;color:#161411;font:16px/1.6 Arial,sans-serif;margin:0}'+
    'main{max-width:960px;margin:2rem auto;padding:1rem}h1{font-size:clamp(1.9rem,4vw,3rem);line-height:1.2}'+
    '.case-record{background:#f8f4ec;border:1px solid #bfb6a7;padding:1.4rem;overflow-wrap:anywhere}'+
    '.case-top{display:flex;justify-content:space-between;gap:1rem}.case-id{font-weight:800}'+
    '.case-record h3{font-size:1.45rem}.case-record details{margin:1rem 0}'+
    'a{color:inherit}a:focus-visible{outline:3px solid #396e77}'+
    '</style></head><body><main id="main-content"><nav aria-label="Case navigation">'+
    '<a href="/investigations">All investigations</a> · <a href="/pilot">Commercial review</a></nav>'+
    '<p>KAHRELUM · Source-linked investigation</p><h1>'+escapeHtml(item.title)+'</h1>'+
    '<p><strong>'+escapeHtml(item.id)+'</strong> · '+escapeHtml(item.status)+
    ' · Source review '+escapeHtml(item.reviewed)+'</p>'+
    '<p>Published evidence state, not a finding of wrongdoing, an independently resolved event or a completed client case.</p>'+
    item.card+'<p><a href="/investigations#case-'+item.slug+'">See the original evidence-desk index entry</a></p>'+
    '</main></body></html>';
}
function buildCaseShareArtifacts(sourceHtml) {
  const entries=extractCases(sourceHtml);
  let overview=sourceHtml;
  const generic='Investigations & OSINT | KAHRELUM';
  const description='Source-linked investigations and OSINT case records. Review each case, status, original sources and unresolved questions separately.';
  const image='https://kahrelum.com/assets/social/og-investigations.png';
  overview=metaSwap(overview,'og:title',generic);
  overview=metaSwap(overview,'og:description',description);
  overview=metaSwap(overview,'og:image',image);
  overview=metaSwap(overview,'og:image:secure_url',image);
  overview=metaSwap(overview,'og:image:alt','KAHRELUM Investigations and OSINT overview');
  overview=metaSwap(overview,'twitter:title',generic,true);
  overview=metaSwap(overview,'twitter:description',description,true);
  overview=metaSwap(overview,'twitter:image',image,true);
  overview=metaSwap(overview,'twitter:image:alt','KAHRELUM Investigations and OSINT overview',true);
  const cases=entries.map(item=>{
    const url='/investigations/'+item.slug;
    const hostingPath=url+'.html';
    const imagePath=item.slug==='air-01'?'/assets/social/og-air01-v1.png':
      '/assets/social/og-'+item.slug+'-v1.png';
    const includeInSitemap=!['NEEDS REDACTION','NOT SUITABLE'].includes(item.status);
    const full={...item,url,hostingPath,imagePath,includeInSitemap};
    const imageBytes=item.slug==='air-01'
      ?fs.readFileSync(path.join(__dirname,'../assets/social/og-air01-v1.png'))
      :makeCaseImage(full);
    return {...full,html:caseDocument(full),image:imageBytes};
  });
  for(const item of cases) {
    const marker='<article class="case-record" id="case-'+item.slug+'"';
    const start=overview.indexOf(marker);
    const end=overview.indexOf('</article>',start);
    if(start<0||end<0)throw new Error('Missing original source article '+item.id);
    overview=overview.slice(0,end)+
      '<p class="case-share-link"><a href="'+item.url+'">Share '+escapeHtml(item.id)+' as its own case page</a></p>'+
      overview.slice(end);
  }
  return {overview,cases};
}
module.exports={buildCaseShareArtifacts,makeCaseImage,extractCases};
