export const TEAM_NAMES = Object.freeze({
  ARI:'Cardinals',ATL:'Falcons',BAL:'Ravens',BUF:'Bills',CAR:'Panthers',CHI:'Bears',CIN:'Bengals',CLE:'Browns',DAL:'Cowboys',DEN:'Broncos',DET:'Lions',GB:'Packers',HOU:'Texans',IND:'Colts',JAX:'Jaguars',KC:'Chiefs',LA:'Rams',LAC:'Chargers',LV:'Raiders',MIA:'Dolphins',MIN:'Vikings',NE:'Patriots',NO:'Saints',NYG:'Giants',NYJ:'Jets',PHI:'Eagles',PIT:'Steelers',SEA:'Seahawks',SF:'49ers',TB:'Buccaneers',TEN:'Titans',WAS:'Commanders'
});
export const TEAM_COLORS=Object.freeze({
  ARI:'#a52240',ATL:'#c72b42',BAL:'#8057b8',BUF:'#2474cb',CAR:'#1c9ee0',CHI:'#d26729',CIN:'#ed743d',CLE:'#b97037',DAL:'#5699c0',DEN:'#e57e3e',DET:'#3e98d7',GB:'#63ac83',HOU:'#b84b66',IND:'#4e83b4',JAX:'#30a79b',KC:'#d34758',LA:'#f0b845',LAC:'#e8be45',LV:'#b6c3d0',MIA:'#44b4ab',MIN:'#9866b6',NE:'#7f9bc4',NO:'#c5b37a',NYG:'#c15660',NYJ:'#589a78',PHI:'#279b8e',PIT:'#f0c154',SEA:'#67b7ae',SF:'#c05356',TB:'#d15252',TEN:'#64a4ce',WAS:'#c79d59'
});
export const getSlug=g=>`${g.away}-${g.home}`;
export function getWinner(g){
 if(!g) return null;
 const team=g.winner;
 return {team,name:TEAM_NAMES[team]||team,probability:g.win_probability};
}
export function getGame(games,slug){
 return games.find(g=>getSlug(g)===slug)||null;
}
export function validateSnapshot(s){
 const errors=[];
 if(!s||!Array.isArray(s.games)||!Array.isArray(s.players))return {valid:false,errors:['Missing games or players']};
 const seen=new Set();
 for(const g of s.games){
  if(!TEAM_NAMES[g.home]||!TEAM_NAMES[g.away]||g.home===g.away)errors.push(`Unknown/matching teams ${g.matchup}`);
  if(!(g.win_probability>0&&g.win_probability<1)||Math.abs(g.home_win_probability+g.away_win_probability-1)>0.002)errors.push(`Probability invalid for ${g.matchup}`);
  if(g.winner!==(g.home_win_probability>=.5?g.home:g.away))errors.push(`Winner inconsistent in ${g.matchup}`);
  if(seen.has(getSlug(g)))errors.push(`Duplicate ${getSlug(g)}`);
  seen.add(getSlug(g));
 }
 if(s.audit?.forecast_count!==s.games.length)errors.push('Audit forecast_count mismatch');
 if(s.audit?.player_metric_count!==s.players.length)errors.push('Audit player_metric_count mismatch');
 return {valid:errors.length===0,errors};
}
export function filteredGames(games,{filter='all',search='',sort='time'}={}){
 let rows=games.filter(g=>{
  const p=getWinner(g).probability;
  if(filter==='strong'&&p<.7)return false;
  if(filter==='close'&&p>=.6)return false;
  if(filter==='sunday'&&g.kickoff_eastern.slice(0,10)!=='2026-11-01')return false;
  const term=search.trim().toLowerCase();
  if(!term)return true;
  return [g.away,g.home,g.winner,TEAM_NAMES[g.away],TEAM_NAMES[g.home],g.matchup].some(x=>x.toLowerCase().includes(term));
 });
 return rows.sort((a,b)=>sort==='confidence'?getWinner(b).probability-getWinner(a).probability:new Date(a.kickoff_eastern)-new Date(b.kickoff_eastern)||a.matchup.localeCompare(b.matchup));
}
export function gamePlayers(players,g){
 if(!g)return [];
 const byName=new Map();
 for(const p of players){
  if(p.team!==g.away&&p.team!==g.home)continue;
  const id=p.player+'|'+p.team;
  if(!byName.has(id))byName.set(id,{player:p.player,team:p.team,availability:p.availability,projections:{}});
  byName.get(id).projections[p.metric]=p.projection;
 }
 return [...byName.values()].sort((a,b)=>a.team===g.home&&b.team!==g.home?-1:b.team===g.home&&a.team!==g.home?1:a.player.localeCompare(b.player));
}
export function formatMetric(metric,value){
 const map={pass_yds:'passing yds',rush_yds:'rushing yds',rec_yds:'receiving yds',pass_tds:'expected pass TDs'};
 return `${metric==='pass_tds'?Number(value).toFixed(2):value} ${map[metric]??metric}`;
}
export function confidenceLabel(prob){
 return prob>=.75?'Strong model lean':prob>=.7?'Clear model lean':prob>=.6?'Moderate advantage':'Close call';
}
export function createGameUrl(base,slug){
 const url=new URL(base);
 url.hash=`game=${encodeURIComponent(slug)}`;
 return url.toString();
}
export function percentage(p){return `${(p*100).toFixed(1)}%`}
export function kickoffLabel(iso){return new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short',hour:'numeric',minute:'2-digit',hour12:true}).format(new Date(iso))+' ET'}
