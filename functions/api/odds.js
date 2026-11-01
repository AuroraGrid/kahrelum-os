// Cloudflare Pages read-only sports-odds dashboard backend.
// Prevent a public proxy by limiting sports, regions, markets, response shape, and quota.
// Do not resell or expose this UI endpoint as a general-purpose odds-data service.

export const SPORTS = Object.freeze({
  americanfootball_nfl:'NFL', americanfootball_ncaaf:'NCAA Football', basketball_nba:'NBA',
  basketball_ncaab:'NCAA Basketball', icehockey_nhl:'NHL', baseball_mlb:'MLB',
  soccer_epl:'English Premier League', soccer_uefa_champs_league:'UEFA Champions League',
  soccer_spain_la_liga:'La Liga', soccer_germany_bundesliga:'Bundesliga',
  aussierules_afl:'Australian Football', rugby_league_nrl:'NRL', cricket_ipl:'IPL'
});
export const REGIONS = Object.freeze(['us','us2','uk','eu','au','ca','fr','se','fi','us_dfs']);
export const MARKETS = Object.freeze(['h2h','spreads','totals']);

const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers:{'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store','x-content-type-options':'nosniff',
    'x-robots-tag':'noindex, nofollow'}
});
const empty = (status, extras = {}) => ({status,source:'THE_ODDS_API',events:[],bookmakerCount:0,
  disclaimer:'Quote snapshots only. Odds can change or be unavailable. Not a sportsbook, not an offer or instruction to wager.', ...extras});
const validPrice = (x) => Number.isInteger(x) && Math.abs(x) >= 100;
const isISO = (x) => typeof x === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:/.test(x) && Number.isFinite(Date.parse(x));
const label = (x) => typeof x === 'string' ? x.slice(0,140) : '';
const strictLimit = (value, fallback, max) => {
  const v = Number(value);
  return Number.isInteger(v) && v > 0 ? Math.min(v,max) : fallback;
};

export function normalizedEvents(raw, now = Date.now()) {
  if (!Array.isArray(raw)) throw new Error('Odds provider returned unexpected non-array payload');
  return raw.slice(0,80).filter(e=>e && typeof e==='object' && isISO(e.commence_time)).map(e=>({
    id:label(e.id), sportKey:label(e.sport_key), home:label(e.home_team), away:label(e.away_team),
    commenceTime:e.commence_time,
    eventState:Date.parse(e.commence_time) <= now ? 'STARTED_STATUS_UNCONFIRMED':'SCHEDULED',
    books:(Array.isArray(e.bookmakers)?e.bookmakers:[]).slice(0,60).map(b=>({
      key:label(b.key), title:label(b.title),
      updatedAt:isISO(b.last_update)?b.last_update:null,
      markets:(Array.isArray(b.markets)?b.markets:[]).filter(m=>MARKETS.includes(m.key)).map(m=>({
        key:m.key,updatedAt:isISO(m.last_update)?m.last_update:(isISO(b.last_update)?b.last_update:null),
        outcomes:(Array.isArray(m.outcomes)?m.outcomes:[]).filter(o=>validPrice(o.price)).slice(0,6).map(o=>({
          name:label(o.name),americanOdds:o.price,point:Number.isFinite(o.point)?o.point:null
        }))
      }))
    })).filter(b=>b.key && b.markets.length)
  })).filter(e=>e.id && e.home && e.away);
}

export async function handleOdds(context, fetcher = fetch, nowMs = Date.now()) {
  const u = new URL(context.request.url);
  const sport = u.searchParams.get('sport') || 'americanfootball_nfl';
  const region = u.searchParams.get('region') || 'us';
  const market = u.searchParams.get('market') || 'h2h';
  if (!(sport in SPORTS) || !REGIONS.includes(region) || !MARKETS.includes(market)) {
    return response(empty('INVALID_QUERY',{allowedSports:Object.keys(SPORTS),allowedRegions:REGIONS,allowedMarkets:MARKETS}),400);
  }
  const env=context.env||{};
  if (!env.ODDS_API_KEY || typeof env.ODDS_API_KEY !== 'string') return response(empty('NOT_CONFIGURED',{detail:'Connect The Odds API key as an encrypted Cloudflare secret.'}),503);
  if (!env.ODDS_CACHE || typeof env.ODDS_CACHE.get !== 'function' || typeof env.ODDS_CACHE.put !== 'function') {
    return response(empty('QUOTA_STORE_MISSING',{detail:'Bind Cloudflare KV namespace ODDS_CACHE before enabling API calls.'}),503);
  }
  const iso = new Date(nowMs).toISOString();
  const today = iso.slice(0,10); const month = iso.slice(0,7);
  const cacheKey = `odds:quote:${sport}:${region}:${market}`;
  const dailyKey = `usage:daily:${today}`;
  const monthlyKey = `usage:monthly:${month}`;
  const dailyLimit = strictLimit(env.ODDS_DAILY_CREDIT_LIMIT,10,10);
  const monthlyLimit = strictLimit(env.ODDS_MONTHLY_CREDIT_LIMIT,300,300);
  let stored = null, daily = 0, monthly = 0;
  try {
    const results = await Promise.all([env.ODDS_CACHE.get(cacheKey),env.ODDS_CACHE.get(dailyKey),env.ODDS_CACHE.get(monthlyKey)]);
    if(results[0]) stored = JSON.parse(results[0]);
    daily = Number(results[1] || 0); monthly = Number(results[2] || 0);
    if (!Number.isSafeInteger(daily) || !Number.isSafeInteger(monthly) || daily<0 || monthly<0) throw new Error('Corrupt usage counter');
  } catch {
    return response(empty('QUOTA_STORE_UNAVAILABLE',{detail:'Failing closed rather than spending credits without accounting.'}),503);
  }
  if (stored && Number.isFinite(stored.fetchedAtMs) && nowMs - stored.fetchedAtMs < 30*60*1000 && nowMs >= stored.fetchedAtMs) {
    return response({...stored.payload,cache:'HIT'});
  }
  if (daily >= dailyLimit || monthly >= monthlyLimit) {
    return response(empty(daily >= dailyLimit?'DAILY_BUDGET_EXHAUSTED':'MONTHLY_BUDGET_EXHAUSTED',{
      detail:'Free API credit allowance is exhausted. Select cached data later; no substitute quotes are fabricated.',
      lastSnapshotAt:stored?.payload?.observedAt||null,
      dataAgeMinutes:stored ? Math.max(0,Math.floor((nowMs - stored.fetchedAtMs)/60000)) : null,
      events:stored?.payload?.events || [],bookmakerCount:stored?.payload?.bookmakerCount||0,cache:stored?'STALE':'MISS'
    }),429);
  }
  const api = new URL(`https://api.the-odds-api.com/v4/sports/${encodeURIComponent(sport)}/odds/`);
  api.searchParams.set('apiKey',env.ODDS_API_KEY);api.searchParams.set('regions',region);
  api.searchParams.set('markets',market);api.searchParams.set('oddsFormat','american');
  api.searchParams.set('dateFormat','iso');
  let upstream;
  try { upstream = await fetcher(api.toString(),{headers:{'accept':'application/json'},signal:AbortSignal.timeout(12000)}); }
  catch {return response(empty('PROVIDER_UNREACHABLE',{detail:'The odds feed could not be reached; data was not updated.'}),502);}
  if(!upstream.ok) return response(empty('PROVIDER_ERROR',{
    providerHttpStatus:upstream.status,
    detail:upstream.status===401?'API key not authorized.':upstream.status===429?'Provider quota reached.':'Provider did not supply odds for this query.'
  }),502);
  let events;
  try {events = normalizedEvents(await upstream.json(),nowMs);} catch {return response(empty('PROVIDER_INVALID_RESPONSE'),502);}
  const chargeRaw = Number(upstream.headers.get('x-requests-last'));
  const charge = Number.isInteger(chargeRaw) && chargeRaw>=0 && chargeRaw<=5 ? chargeRaw : 1;
  const remainingRaw = Number(upstream.headers.get('x-requests-remaining'));
  const remainingCredits = upstream.headers.has('x-requests-remaining') && Number.isInteger(remainingRaw)?remainingRaw:null;
  const bookNames = new Set(events.flatMap(event=>event.books.map(b=>b.key)));
  const payload = {
    status:'OK',source:'THE_ODDS_API',sport,region,market,
    observedAt:iso,providerCreditRemaining:remainingCredits,
    events,bookmakerCount:bookNames.size,
    disclaimer:'Timestamped snapshot from The Odds API; not streaming. Quotes may change; check official bookmaker ticket. No automatic wagers.'
  };
  try {
    // KV is eventually consistent and not a distributed atomic counter. Conservative
    // daily/monthly caps protect small private betas, not high-concurrency public usage.
    await env.ODDS_CACHE.put(cacheKey,JSON.stringify({fetchedAtMs:nowMs,payload}),{expirationTtl:2*24*3600});
    await env.ODDS_CACHE.put(dailyKey,String(daily+charge),{expirationTtl:36*3600});
    await env.ODDS_CACHE.put(monthlyKey,String(monthly+charge),{expirationTtl:35*24*3600});
  } catch {
    // Never promise data persistence. The already-completed call can still be displayed.
    return response({...payload,cache:'UNPERSISTED',warning:'Quota persistence failed; future requests will fail closed or re-fetch.'});
  }
  return response({...payload,cache:'MISS'});
}

export function onRequestGet(context) {return handleOdds(context);}
