export function onRequestGet({env={}}) {
  return new Response(JSON.stringify({
    service:'LINEUPS_AND_LINES', status:'PREVIEW',
    feeds:[
      {provider:'THE_ODDS_API',type:'ODDS_SNAPSHOTS',state:env.ODDS_API_KEY&&env.ODDS_CACHE?'CONFIGURED':'NOT_CONFIGURED',authRequired:true,refresh:'ON_DEMAND_CAPPED_AND_CACHED'},
      {provider:'SLEEPER',type:'FANTASY_DRAFTS',state:'PUBLIC_READ_ONLY',authRequired:false,usage:'NONCOMMERCIAL_ONLY'},
      {provider:'YAHOO_FANTASY',type:'USER_LEAGUES',state:'NEEDS_APP_APPROVAL_AND_OAUTH',authRequired:true},
      {provider:'ESPN_FANTASY',type:'USER_LEAGUES',state:'NOT_CONNECTED',authRequired:true}
    ]
  }),{headers:{'content-type':'application/json','cache-control':'no-store','x-robots-tag':'noindex'}});
}
