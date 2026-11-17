// Exercises the actual client against the checked-in data, without claiming a
// browser layout or network-image test. Browser binaries are optional in CI.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT=path.resolve(__dirname,'..');
const read=name=>JSON.parse(fs.readFileSync(path.join(ROOT,name),'utf8'));

async function boot({portraitsUnavailable=false}={}) {
  const elements=new Map();
  const events=new Map();
  const element=selector=>{
    if (!elements.has(selector)) elements.set(selector,{
      value:selector==='#evidence'?'all':'',textContent:'',innerHTML:'',disabled:false,
      addEventListener(type,handler){events.set(selector+':'+type,handler);},
    });
    return elements.get(selector);
  };
  const document={hidden:false,querySelector:element,querySelectorAll:()=>[],addEventListener:(event,handler)=>events.set('document:'+event,handler)};
  const fetches=[];
  const intervals=[];
  let deskResponse;
  const context=vm.createContext({
    document,console,URL,AbortController,
    setTimeout:()=>1,clearTimeout:()=>{},setInterval:(handler,period)=>intervals.push({handler,period}),
    fetch:async url=>{
      fetches.push(url);
      const parsed=new URL(url,'https://kahrelum.test');
      let file=parsed.pathname.replace(/^\//,'').replace(/^AuroraGrid\/kahrelum-os\/main\//,'').replace(/^repos\/AuroraGrid\/kahrelum-os\/contents\//,'');
      if (portraitsUnavailable && file==='nfl/player-portraits.json') return {ok:false};
      if (!fs.existsSync(path.join(ROOT,file))) return {ok:false};
      return {ok:true,json:async()=>file==='nfl/desk-live.json' && deskResponse!==undefined ? structuredClone(deskResponse) : read(file)};
    },
  });
  const source=fs.readFileSync(path.join(ROOT,'nfl/trades.js'),'utf8').replace(/\ninit\(\);\s*$/,'\nthis.ready = init();');
  vm.runInContext(source,context,{filename:'nfl/trades.js'});
  await context.ready;
  const filter=(query='',team='',evidence='all')=>{
    element('#query').value=query;element('#team').value=team;element('#evidence').value=evidence;
    vm.runInContext('render()',context);
    return element('#candidates').innerHTML;
  };
  return {element,events,fetches,intervals,context,filter,setDeskResponse:data=>{deskResponse=data;}};
}
const count=(html,pattern)=>(html.match(pattern)||[]).length;

test('actual NFL client renders 124 dated values and 124 source-matched portraits',async()=>{
  const app=await boot(); const html=app.element('#candidates').innerHTML;
  assert.equal(count(html,/class="card candidate"/g),124);
  assert.equal(count(html,/<img /g),124);
  assert.equal(count(html,/KAHRELUM (?:estimate|roster status)<\/span>/g),124);
  const forecastRows=read('nfl/desk-live.json').currentForecasts.forecasts;
  assert.equal(count(html,/KAHRELUM roster status<\/span>/g),forecastRows.filter(row=>row.cohortEligible===false).length);
  assert.equal(count(html,/Photo: ESPN/g),124);
  assert.equal(count(html,/loading="lazy"/g),124);
  assert.equal(count(html,/width="72" height="72"/g),124);
  assert.doesNotMatch(html,/>Unavailable</);
  assert.match(app.element('#resultCount').textContent,/124 of 124 players/);
  assert.equal(app.intervals[0].period,60000);
});

test('each player search retains the right portrait and every team filter matches the data',async()=>{
  const app=await boot(); const board=read('nfl/desk-live.json').board;
  const portraits=new Map(read('nfl/player-portraits.json').records.map(row=>[row.candidateId,row]));
  for (const player of board.candidates) {
    const html=app.filter(player.name);
    const expected=board.candidates.filter(p=>(p.name+' '+p.team+' '+p.pos).toLowerCase().includes(player.name.toLowerCase())).length;
    assert.equal(count(html,/class="card candidate"/g),expected,player.name);
    assert.ok(html.includes(portraits.get(player.id).url),player.name+' photo');
  }
  for (const team of new Set(board.candidates.map(p=>p.team))) {
    const html=app.filter('',team);
    const expected=board.candidates.filter(p=>p.team===team).length;
    assert.equal(count(html,/class="card candidate"/g),expected,team);
    assert.equal(count(html,/<img /g),expected,team+' portraits');
  }
  assert.match(app.filter('not-a-real-player'),/No players match these filters/);
});

test('all evidence filters preserve photographs and current estimates',async()=>{
  const app=await boot(); const board=read('nfl/desk-live.json').board;
  const hard=new Set(['COACH_CONFIRMED_PLAYER_REQUEST','REPORTED_MARKET','REPORTED_INQUIRY','TEAM_RESISTING','OFF_MARKET_REPORTED']);
  const expected={
    all:board.candidates.length,
    reported:board.candidates.filter(p=>hard.has(p.evidenceType)||p.evidenceType==='ESPN_WATCHLIST').length,
    'reported-only':board.candidates.filter(p=>hard.has(p.evidenceType)).length,
    radar:board.candidates.filter(p=>p.evidenceType==='ANALYST_RADAR').length,
    priced:board.candidates.length,
  };
  for (const [filter,total] of Object.entries(expected)) {
    const html=app.filter('','',filter);
    assert.equal(count(html,/class="card candidate"/g),total,filter);
    assert.equal(count(html,/<img /g),total,filter+' portraits');
    assert.equal(count(html,/KAHRELUM (?:estimate|roster status)<\/span>/g),total,filter+' dated values');
  }
});

test('image errors expose initials; unavailable ledger does not take the board offline',async()=>{
  const app=await boot(); let removed=false;
  app.events.get('document:error')({target:{matches:selector=>selector==='.player-photo img',remove:()=>{removed=true;}}});
  assert.equal(removed,true);
  assert.match(app.element('#candidates').innerHTML,/<span aria-hidden="true">[A-Z]+<\/span>/);
  const offline=await boot({portraitsUnavailable:true});
  const html=offline.element('#candidates').innerHTML;
  assert.equal(count(html,/class="card candidate"/g),124);
  assert.equal(count(html,/<img /g),0);
  assert.equal(count(html,/KAHRELUM (?:estimate|roster status)<\/span>/g),124);
});

test('empty or missing forecasts on refresh preserve all 124 records and the selected filters',async()=>{
  const app=await boot();
  const valid=read('nfl/desk-live.json');
  const original=app.element('#candidates').innerHTML;
  const originalStamp=app.element('#stamp').textContent;
  assert.equal(count(original,/class="card candidate"/g),124);
  for (const failure of ['empty','missing']) {
    const invalid=structuredClone(valid);
    invalid.generatedAtUtc=new Date(Date.parse(valid.generatedAtUtc)+60000).toISOString();
    invalid.board.candidates[0].name='Unexpected replacement from invalid refresh';
    if (failure==='empty') invalid.currentForecasts.forecasts=[];
    else delete invalid.currentForecasts;
    app.setDeskResponse(invalid);

    await app.events.get('#refreshDesk:click')();
    assert.equal(app.element('#candidates').innerHTML,original,failure+' retains complete dated board');
    assert.equal(app.element('#stamp').textContent,originalStamp,failure+' retains original provenance');
    assert.match(app.element('#refreshMessage').textContent,/Keeping the last dated view\..*forecast file is incomplete/i);
    assert.equal(app.element('#refreshDesk').disabled,false);

    const filtered=app.filter('Daron Payne','WAS','reported-only');
    const filteredCount=app.element('#resultCount').textContent;
    assert.equal(count(filtered,/class="card candidate"/g),1);
    await app.events.get('#refreshDesk:click')();
    assert.equal(app.element('#candidates').innerHTML,filtered,failure+' preserves visible filtered result');
    assert.equal(app.element('#resultCount').textContent,filteredCount);
    assert.deepEqual(['#query','#team','#evidence'].map(selector=>app.element(selector).value),['Daron Payne','WAS','reported-only']);
    assert.match(app.element('#refreshMessage').textContent,/Keeping the last dated view\..*forecast file is incomplete/i);
    assert.equal(app.filter(),original,failure+' still exposes all 124 original records after clearing filters');
  }
});
