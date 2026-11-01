import { classifyBet } from './lib/policy.mjs';

const $ = (id) => document.getElementById(id);
const fmtDate = (iso) => iso && Number.isFinite(Date.parse(iso)) ? new Date(iso).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',timeZoneName:'short'}) : 'Timestamp unavailable';
const fmtOdds = (n) => n > 0 ? `+${n}` : `${n}`;
const safeText = (x) => String(x ?? '');
const node=(tag,className,text)=>{const el=document.createElement(tag);if(className)el.className=className;if(text!==undefined)el.textContent=safeText(text);return el};
const clear=(element)=>element.replaceChildren();
const emptyState=(title,detail)=>{const box=node('div','empty');box.append(node('span','empty-mark','∅'),node('h3','',title),node('p','',detail));return box};

function setView(name) {
  for (const view of document.querySelectorAll('.view')) {view.hidden=view.id!==name;view.classList.toggle('active-view',view.id===name);}
  for (const tab of document.querySelectorAll('[data-view]')) {const active=tab.dataset.view===name;tab.classList.toggle('active',active);tab.setAttribute('aria-selected',String(active));}
  if(name==='sources')location.hash='sources';else if(location.hash==='#sources')history.replaceState(null,'',location.pathname);
}
for (const tab of document.querySelectorAll('[data-view]'))tab.addEventListener('click',()=>setView(tab.dataset.view));
for(const a of document.querySelectorAll('a[href="#sources"]')) a.addEventListener('click',e=>{e.preventDefault();setView('sources')});
if (location.hash==='#sources')setView('sources');

async function health() {
  try {
    const r=await fetch('/api/status',{cache:'no-store'});if(!r.ok)throw Error('status not available');
    const x=await r.json();const odds=x.feeds?.find(f=>f.provider==='THE_ODDS_API');
    const live=odds?.state==='CONFIGURED';
    $('serviceStatus').classList.toggle('ok',live);
    $('serviceStatus').lastChild.textContent=live?' Odds feed configured':' Odds feed needs key';
    $('oddsProviderStatus').textContent=live?'Connected, snapshot service':'Not configured';
  } catch {$('serviceStatus').lastChild.textContent=' Feed status unavailable';}
}

function bestOutcomes(event,market){
  const best=new Map();
  for(const b of event.books||[])for(const m of b.markets||[]){
    if(m.key!==market)continue;
    for(const o of m.outcomes||[]){const key=`${o.name}|${o.point ?? ''}`;if(!best.has(key)||o.americanOdds>best.get(key))best.set(key,o.americanOdds);}
  }
  return best;
}
function displayOdds(data) {
  const holder=$('oddsResults');clear(holder);
  $('oddsTime').textContent=data.observedAt ? `Snapshot ${fmtDate(data.observedAt)}` : 'No verified observation timestamp';
  if(data.status!=='OK') {
    $('oddsStatus').textContent=`${data.status?.replaceAll('_',' ')||'FEED ERROR'} · ${data.detail||'No refreshed quote available'}`;
    if(!data.events?.length){holder.append(emptyState('No current quotes available','This is a real empty state. Connect the key, respect free-tier quotas, or try another supported market.'));return;}
  }else {
    $('oddsStatus').textContent=`${data.events.length} games · ${data.bookmakerCount} distinct books · ${data.region.toUpperCase()} · ${data.market.toUpperCase()} · ${data.cache==='HIT'?'cached':'fetched'} quote snapshot`;
  }
  if(!data.events?.length){holder.append(emptyState('No available events','The provider returned no events for this region and market.'));return;}
  for(const game of data.events){
    const card=node('article','game-card');const header=node('header','game-header');const t=node('div');
    t.append(node('h3','',`${game.away} @ ${game.home}`),node('p','',fmtDate(game.commenceTime)));
    header.append(t,node('span','market-state',game.eventState==='STARTED_STATUS_UNCONFIRMED'?'STARTED · MARKET STATUS UNCONFIRMED':'SCHEDULED'));
    card.append(header);
    const best=bestOutcomes(game,data.market);
    let count=0;
    for(const b of game.books||[]){
      const m=(b.markets||[]).find(m=>m.key===data.market);if(!m?.outcomes?.length)continue;count++;
      const row=node('div','book-row');row.append(node('div','book-name',b.title),node('div','book-time',`Market observed ${fmtDate(m.updatedAt)}`));
      const quoteList=node('div','outcome-list');
      for(const o of m.outcomes){
        const key=`${o.name}|${o.point ?? ''}`;const bestPrice=best.get(key)===o.americanOdds;
        const quote=node('div',bestPrice?'quote best':'quote');
        const point=o.point===null?'':` ${o.point>0?'+':''}${o.point}`;
        quote.append(node('b','',fmtOdds(o.americanOdds)),node('span','',`${o.name}${point}`));
        if(bestPrice && best.size>1)quote.append(node('small','','BEST OBSERVED'));
        quoteList.append(quote);
      }
      row.append(quoteList);card.append(row);
    }
    if(count)holder.append(card);
  }
  if(!holder.childNodes.length)holder.append(emptyState('No valid quotes','All returned markets lacked valid prices and timestamps.'));
}
$('oddsForm').addEventListener('submit',async(e)=>{
  e.preventDefault();const button=$('refreshOdds');button.disabled=true;button.firstChild.textContent='Fetching source… ';
  $('oddsStatus').textContent='Contacting The Odds API through the server. No prices are displayed until confirmed.';
  const p=new URLSearchParams({sport:$('sportSelect').value,region:$('regionSelect').value,market:$('marketSelect').value});
  try{
    const res=await fetch('/api/odds' + '?' + p.toString(),{cache:'no-store'});
    const data=await res.json();displayOdds(data);
  }catch {displayOdds({status:'NETWORK_ERROR',detail:'Request failed. The service did not return any quotes.',events:[]});}
  finally{button.disabled=false;button.firstChild.textContent='Fetch verified quotes ';}
});

function displayDrafts(data){
  const holder=$('draftResults');clear(holder);
  $('draftTime').textContent=data.observedAt?`Checked ${fmtDate(data.observedAt)}`:'Source: official Sleeper API';
  if(data.status!=='OK'){
    $('draftStatus').textContent=`${data.status} · ${data.detail||'Data unavailable'}`;
    holder.append(emptyState('Draft data unavailable','Check the numeric league ID or try again after the provider responds.'));return;
  }
  $('draftStatus').textContent=`${data.league?.name||'League'} · ${data.drafts?.length||0} draft(s) · ${data.picks?.length||0} latest draft picks`;
  if(!data.drafts?.length){holder.append(emptyState('No drafts listed','Sleeper returned the league but no draft records.'));return;}
  const box=node('div','game-card');const title=node('div','game-header');title.append(node('h3','',`${data.league?.name||'Sleeper League'} · ${data.drafts[0]?.status||'Status unknown'}`));box.append(title);
  if(!data.picks?.length)box.append(emptyState('No selections yet','Draft exists, but no picks were available in the response.'));
  for(const p of data.picks){const row=node('div','book-row');row.append(node('div','book-name',`#${p.pickNumber||'?'} · Round ${p.round||'?'}`),node('div','book-time',p.position||'Position unavailable'),node('div','',`${p.playerName||p.playerId||'Unknown player'} ${p.team?'· '+p.team:''}`));box.append(row);}
  holder.append(box);
}
$('draftForm').addEventListener('submit',async(e)=>{
  e.preventDefault();const button=$('fetchDrafts');button.disabled=true;button.firstChild.textContent='Loading draft… ';
  $('draftStatus').textContent='Retrieving documented Sleeper league/draft records…';
  const p=new URLSearchParams({league_id:$('leagueId').value.trim()});
  try{const res=await fetch('/api/drafts' + '?' + p.toString(),{cache:'no-store'});displayDrafts(await res.json());}
  catch{displayDrafts({status:'NETWORK_ERROR',detail:'Sleeper request could not complete.',drafts:[],picks:[]});}
  finally{button.disabled=false;button.firstChild.textContent='Read draft records ';}
});
function displayEdge(r){
  const h=$('edgeResult');clear(h);
  h.append(node('p','micro-label','PRICE-CHECK RESULT'),node('h3','',r.tier.replaceAll('_',' ')));
  const m=node('div','metrics');
  for(const [k,v] of [['Break even',`${r.breakEvenPercent.toFixed(2)}%`],['Model edge',`${r.edgePercentagePoints>=0?'+':''}${r.edgePercentagePoints.toFixed(2)} pp`],['Expected ROI',`${r.expectedRoiPercent>=0?'+':''}${r.expectedRoiPercent.toFixed(2)}%`]]){
    const box=node('div','metric');box.append(node('b','',v),node('span','',k));m.append(box);
  }
  h.append(m);
  h.append(node('p','callout',r.conditionalStakeCapUsd ? `Conditional tier cap $${r.conditionalStakeCapUsd}; current public calculator stake: $0 until independent review.`:'No wager recommended under this tier.'));
  h.append(node('p','', 'The exact offered ticket odds determine break-even. This model probability is user-entered and unverified.'));
}
$('edgeForm').addEventListener('submit',(e)=>{
  e.preventDefault();const p=Number($('probabilityInput').value),odds=Number($('oddsInput').value);
  try{displayEdge(classifyBet(p,odds,false));}
  catch(err){const h=$('edgeResult');clear(h);h.append(node('p','micro-label','VALIDATION ERROR'),node('h3','',err.message));}
});
health();
