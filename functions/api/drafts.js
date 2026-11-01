// Sleeper's official read-only endpoints are free for noncommercial use.
// Never use this connector in a commercial deployment without licensing.
const reply=(body,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=120', 'x-content-type-options':'nosniff','x-robots-tag':'noindex, nofollow'}
});
const clean=(value)=>typeof value==='string'?value.slice(0,160):'';
const empty=(status)=>({status,provider:'SLEEPER',league:null,drafts:[],picks:[],license:'NONCOMMERCIAL_PUBLIC_READ_ONLY'});
const load=async (url,fetcher)=>{
 const r=await fetcher(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw new Error(`Sleeper provider HTTP ${r.status}`);
 return r.json();
};
export async function handleDrafts(context,fetcher=fetch,nowMs=Date.now()) {
 const url=new URL(context.request.url);
 const leagueId=url.searchParams.get('league_id');
 if(!leagueId || !/^\d{5,20}$/.test(leagueId)) return reply({...empty('INVALID_LEAGUE_ID'),detail:'Enter a numeric Sleeper league ID (5–20 digits).'},400);
 const root='https://api.sleeper.app/v1';
 try {
   const [league,drafts]=await Promise.all([
     load(`${root}/league/${leagueId}`,fetcher),load(`${root}/league/${leagueId}/drafts`,fetcher)
   ]);
   if(!league || !Array.isArray(drafts))throw new Error('Unexpected Sleeper payload');
   const latest=drafts[0] || null;
   const picks=latest && /^\d{5,20}$/.test(latest.draft_id||'') ?
      await load(`${root}/draft/${latest.draft_id}/picks`,fetcher) : [];
   if(!Array.isArray(picks))throw new Error('Unexpected picks payload');
   return reply({
     status:'OK',provider:'SLEEPER',license:'NONCOMMERCIAL_PUBLIC_READ_ONLY',observedAt:new Date(nowMs).toISOString(),
     league:{id:leagueId,name:clean(league.name),season:clean(league.season),sport:clean(league.sport)},
     drafts:drafts.slice(0,15).map(d=>({id:clean(d.draft_id),status:clean(d.status),type:clean(d.type),season:clean(d.season),rounds:Number(d.settings?.rounds)||null,teams:Number(d.settings?.teams)||null})),
     picks:picks.slice(0,350).map(p=>({
       pickNumber:Number(p.pick_no)||null,round:Number(p.round)||null,rosterId:Number(p.roster_id)||null,
       playerId:clean(p.player_id),playerName:[clean(p.metadata?.first_name),clean(p.metadata?.last_name)].filter(Boolean).join(' '),
       position:clean(p.metadata?.position),team:clean(p.metadata?.team)
     })),
     disclaimer:'Read-only Sleeper league/draft snapshot; no pick is made or lineup edited.'
   });
 }catch{return reply({...empty('PROVIDER_ERROR'),detail:'Sleeper did not return usable league/draft data.'},502);}
}
export function onRequestGet(context) {return handleDrafts(context);}
