(() => {
  'use strict';

  const states = [
    ['AK','Alaska',2,1],['AL','Alabama',7,7],['AR','Arkansas',6,5],['AZ','Arizona',6,2],['CA','California',5,1],
    ['CO','Colorado',5,3],['CT','Connecticut',3,11],['DE','Delaware',5,10],['FL','Florida',8,9],['GA','Georgia',7,8],
    ['HI','Hawaii',7,1],['IA','Iowa',4,5],['ID','Idaho',3,2],['IL','Illinois',4,6],['IN','Indiana',4,7],
    ['KS','Kansas',6,4],['KY','Kentucky',5,6],['LA','Louisiana',7,5],['MA','Massachusetts',2,12],['MD','Maryland',5,9],
    ['ME','Maine',1,12],['MI','Michigan',3,7],['MN','Minnesota',3,5],['MO','Missouri',5,5],['MS','Mississippi',7,6],
    ['MT','Montana',3,3],['NC','North Carolina',6,7],['ND','North Dakota',3,4],['NE','Nebraska',5,4],['NH','New Hampshire',2,11],
    ['NJ','New Jersey',4,10],['NM','New Mexico',6,3],['NV','Nevada',4,2],['NY','New York',3,10],['OH','Ohio',4,8],
    ['OK','Oklahoma',7,4],['OR','Oregon',4,1],['PA','Pennsylvania',4,9],['RI','Rhode Island',3,12],['SC','South Carolina',6,8],
    ['SD','South Dakota',4,4],['TN','Tennessee',6,6],['TX','Texas',8,4],['UT','Utah',5,2],['VA','Virginia',5,8],
    ['VT','Vermont',2,10],['WA','Washington',3,1],['WI','Wisconsin',3,6],['WV','West Virginia',5,7],['WY','Wyoming',4,3]
  ];
  const stateByCode = Object.fromEntries(states.map(([code,name]) => [code,name]));
  let races = [];
  let selectedState = 'ALL';
  let displayLimit = 40;
  let seatProjectionData = null;
  let currentProjectionData = null;
  let challengerData = null;
  let seatComparisonMode = 'house';
  let mapChamber = 'ALL';
  let mapGeometry = null;

  const byId = (id) => document.getElementById(id);
  const pct = (value) => `${Math.round(value * 100)}%`;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

  function renderChamberTracker(targetId,title,value,total,threshold,seatType) {
    const opposing = total - value;
    const valueWidth = (value / total) * 100;
    const thresholdPosition = (threshold / total) * 100;
    byId(targetId).innerHTML = `<h4>${escapeHtml(title)}</h4><div class="seat-total"><strong>${value.toFixed(2)}</strong><span>Democratic${title === 'Senate' ? '-caucus' : ''} seats</span></div><div class="chamber-seat-bar" aria-label="${value.toFixed(2)} Democratic seats and ${opposing.toFixed(2)} Republican${title === 'Senate' ? '-aligned' : ''} seats"><i class="democratic" style="width:${valueWidth.toFixed(3)}%"></i><i class="republican" style="width:${(100 - valueWidth).toFixed(3)}%"></i><i class="majority-line" style="left:${thresholdPosition.toFixed(3)}%" title="Control threshold: ${threshold}"></i></div><div class="seat-split"><span class="party-dem">D ${value.toFixed(2)}</span><span>Control ${threshold}</span><span class="party-rep">R ${opposing.toFixed(2)}</span></div><p class="fine">${escapeHtml(seatType)} · fresh execution</p>`;
  }

  function renderSeatTracker(data) {
    renderChamberTracker('houseSeatTracker','House',data.house.expectedDemocraticSeats,435,data.house.controlThreshold,'expected seats');
    renderChamberTracker('senateSeatTracker','Senate',data.senate.expectedDemocraticCaucusSeats,100,51,'expected caucus seats');
  }

  function renderSeatComparison() {
    const chamber = seatProjectionData[seatComparisonMode];
    const [minimum,maximum] = chamber.chartRange;
    const threshold = seatComparisonMode === 'house' ? chamber.democraticControlThreshold : chamber.democraticCaucusControlThreshold;
    const thresholdPosition = ((threshold - minimum) / (maximum - minimum)) * 100;
    const rows = chamber.observations.map((item) => {
      const position = Math.max(0,Math.min(100,((item.democraticSeats - minimum) / (maximum - minimum)) * 100));
      const precision = Number.isInteger(item.democraticSeats) ? item.democraticSeats.toFixed(0) : item.democraticSeats.toFixed(2).replace(/0$/,'');
      return `<div class="comparison-row"><div class="comparison-provider"><a href="${escapeHtml(item.sourceUrl)}">${escapeHtml(item.provider)}</a><small>${escapeHtml(item.edition)}</small></div><div class="comparison-bar" aria-label="${escapeHtml(item.provider)}: ${precision} Democratic seats, ${escapeHtml(item.seatType)}"><i style="width:${position.toFixed(3)}%"></i><span class="control-mark" style="left:${thresholdPosition.toFixed(3)}%" title="Control threshold: ${threshold}"></span></div><div class="comparison-value"><strong>${precision}</strong><small>${escapeHtml(item.seatType)}</small></div></div>`;
    }).join('');
    byId('seatComparisonChart').innerHTML = `<div class="comparison-axis"><span>Publisher / edition</span><div><span>${minimum} D seats</span><span>Control ${threshold}</span><span>${maximum} D seats</span></div><span>Statistic</span></div>${rows}`;
  }

  function formatControlProbability(value) {
    if (value === null || value === undefined) return '<span class="missing">Not verified</span>';
    const precision = Number.isInteger(value) ? value.toFixed(1) : value.toFixed(6).replace(/0+$/,'').replace(/\.$/,'');
    return `${precision}%`;
  }

  function renderChallengerTable() {
    const rows = challengerData.records.map((record) => {
      const provider = record.provider === 'KAHRELUM' ? `<strong>${escapeHtml(record.provider)}</strong>` : `<a href="${escapeHtml(record.sourceUrl)}">${escapeHtml(record.provider)}</a>`;
      return `<tr><td data-label="Provider / edition">${provider} / ${escapeHtml(record.edition)}</td><td data-label="House D control">${formatControlProbability(record.houseDemocraticControlPct)}</td><td data-label="Senate D control">${formatControlProbability(record.senateDemocraticControlPct)}</td><td data-label="Publisher edition">${escapeHtml(record.sourceEdition)}</td><td data-label="Evidence note">${escapeHtml(record.note)} <span class="fine">${escapeHtml(record.retrievalStatus)}</span></td></tr>`;
    }).join('');
    byId('challengerRows').innerHTML = rows;
    byId('challengerCheckStatus').textContent = `Fresh source check: ${new Date(challengerData.checkedAtUtc).toLocaleString()} · ${challengerData.challengersWithAtLeastOneVerifiedControlProbability} numerical challengers included.`;
  }

  function buildRaces(houseLock, current) {
    const originalIds = new Set(houseLock.competitive_districts.map((item) => item.district));
    const houseRaces = current.house.districts.map((item) => ({
      id:item.contestId,state:item.state,chamber:'House',tier:item.tier,pDem:item.pDem,
      sourceDate:current.sources.house.publisherEdition,event:'Democratic nominee wins district',coverage:'current',
      originalLock:originalIds.has(item.contestId),candidates:item.candidates || []
    }));
    const senateRaces = current.senate.races.map((item) => ({
      id:`${item.state} Senate${item.contestId.endsWith('-special') ? ' special' : ''}`,state:item.state,
      chamber:'Senate',tier:item.tier,pDem:item.pDemocraticCaucus,sourceDate:current.sources.senate.publisherEdition,
      event:'Democratic-caucus candidate wins seat',coverage:'current',originalLock:true,candidates:item.candidates || [],
      independentCandidateRisk:item.independentCandidateRisk
    }));
    return [...houseRaces, ...senateRaces];
  }

  function applyPortraitLedger(raceRecords,portraitLedger) {
    const admitted = new Map(portraitLedger.records.map((record) => [String(record.sourceCandidateId),record]));
    raceRecords.forEach((race) => race.candidates.forEach((candidate) => {
      const portrait = admitted.get(String(candidate.sourceCandidateId));
      if (portrait) candidate.portrait = portrait;
    }));
  }

  function stateSummary(code) {
    const stateRaces = races.filter((race) => race.state === code && (mapChamber === 'ALL' || race.chamber === mapChamber));
    const house = stateRaces.filter((race) => race.chamber === 'House');
    const senate = stateRaces.filter((race) => race.chamber === 'Senate');
    const average = stateRaces.length ? stateRaces.reduce((sum,race) => sum + race.pDem,0) / stateRaces.length : null;
    const projectedDem = stateRaces.filter((race) => race.pDem > .5).length;
    const projectedRep = stateRaces.filter((race) => race.pDem < .5).length;
    const tossups = stateRaces.filter((race) => race.pDem === .5).length;
    const expectedHouseDem = house.reduce((sum,race) => sum + race.pDem,0);
    return {stateRaces,house,senate,average,projectedDem,projectedRep,tossups,expectedHouseDem};
  }

  function mapClass(summary) {
    if (summary.average === null) return 'unmodeled';
    if (Math.abs(summary.average - .5) < .001) return 'toss';
    return summary.average > .5 ? 'dem' : 'rep';
  }

  function renderMap() {
    const map = byId('challengeUsMap');
    map.textContent = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('viewBox',mapGeometry.viewBox);
    svg.setAttribute('role','img');
    svg.setAttribute('aria-labelledby','usMapTitle usMapDescription');
    svg.classList.add('us-map-svg');
    const title = document.createElementNS('http://www.w3.org/2000/svg','title');
    title.id = 'usMapTitle';
    title.textContent = `United States ${mapChamber === 'ALL' ? 'congressional' : mapChamber} forecast map`;
    const description = document.createElementNS('http://www.w3.org/2000/svg','desc');
    description.id = 'usMapDescription';
    description.textContent = 'Select a state to filter the race files. Blue indicates a Democratic average edge, red a Republican average edge, and gold an even average.';
    svg.append(title,description);
    mapGeometry.locations.forEach((location) => {
      const code = location.id.toUpperCase();
      const name = stateByCode[code];
      if (!name) return;
      const summary = stateSummary(code);
      const state = document.createElementNS('http://www.w3.org/2000/svg','path');
      state.setAttribute('d',location.path);
      state.setAttribute('class',`state-shape ${mapClass(summary)}`);
      state.setAttribute('data-state',code);
      state.setAttribute('tabindex','0');
      state.setAttribute('role','button');
      state.setAttribute('aria-pressed',selectedState === code ? 'true' : 'false');
      state.setAttribute('aria-label',`${name}: ${summary.projectedDem} Democratic-leaning calls, ${summary.projectedRep} Republican-leaning calls, ${summary.tossups} toss-ups across ${summary.stateRaces.length} ${mapChamber === 'ALL' ? 'congressional' : mapChamber} contests`);
      const tooltip = document.createElementNS('http://www.w3.org/2000/svg','title');
      tooltip.textContent = `${name} — D ${summary.projectedDem}, R ${summary.projectedRep}, toss-up ${summary.tossups}`;
      state.appendChild(tooltip);
      state.addEventListener('click',() => selectState(code));
      state.addEventListener('keydown',(event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectState(code); }
      });
      svg.appendChild(state);
    });
    map.appendChild(svg);
    const chamberLabel = mapChamber === 'ALL' ? 'all House and Senate contests' : `${mapChamber} contests`;
    const stateLabel = selectedState === 'ALL' ? 'National view' : stateByCode[selectedState];
    byId('mapViewSummary').textContent = `${stateLabel} · ${chamberLabel}. Select a state on the map or use the state menu.`;
  }

  function selectState(code) {
    selectedState = selectedState === code ? 'ALL' : code;
    displayLimit = 40;
    byId('raceState').value = selectedState;
    byId('mapStateJump').value = selectedState;
    renderMap();
    renderStateBrief();
    renderRaces();
    if (selectedState !== 'ALL' && window.matchMedia('(max-width: 900px)').matches) byId('stateBrief').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function renderStateBrief() {
    const panel = byId('stateBrief');
    if (selectedState === 'ALL') {
      panel.innerHTML = `<p class="eyebrow">National projection</p><h3>Choose a state</h3><div class="state-code">USA</div><p>The current KAHRELUM edition prices all 470 congressional contests. Each state shape summarizes D-leaning, R-leaning and toss-up race calls for the selected chamber.</p><dl><div><dt>Expected Democratic House seats</dt><dd>${currentProjectionData.house.expectedDemocraticSeats.toFixed(2)}</dd></div><div><dt>Democratic House control</dt><dd>${pct(currentProjectionData.house.pDemocraticControl)}</dd></div><div><dt>Expected D-caucus Senate seats</dt><dd>${currentProjectionData.senate.expectedDemocraticCaucusSeats.toFixed(2)}</dd></div><div><dt>Democratic Senate control</dt><dd>${pct(currentProjectionData.senate.pDemocraticCaucusControl)}</dd></div></dl><div class="boundary">Map colors summarize KAHRELUM probabilities from the latest accessible rating editions, not votes counted or certified results.</div>`;
      return;
    }
    const summary = stateSummary(selectedState);
    const averageText = summary.average === null ? `No ${mapChamber} contest on the current file` : `${pct(summary.average)} average D probability`;
    panel.innerHTML = `<p class="eyebrow">State projection file</p><h3>${escapeHtml(stateByCode[selectedState])}</h3><div class="state-code">${selectedState}</div><p>Current KAHRELUM race-level projection for the selected ${mapChamber === 'ALL' ? 'House and Senate' : mapChamber} view in this state.</p><dl><div><dt>House expected D seats</dt><dd>${summary.expectedHouseDem.toFixed(2)} / ${summary.house.length}</dd></div><div><dt>Senate races</dt><dd>${summary.senate.length}</dd></div><div><dt>D / R / toss-up calls</dt><dd>${summary.projectedDem} / ${summary.projectedRep} / ${summary.tossups}</dd></div><div><dt>Model signal</dt><dd>${averageText}</dd></div><div><dt>Admitted candidate portraits</dt><dd>${currentProjectionData.coverage.admittedPortraits}</dd></div></dl><div class="boundary">Names below are source-listed discovery records, not official nominee certification. Portraits remain withheld pending identity and reuse-rights verification.</div>`;
  }

  function admittedPortrait(candidate) {
    const portrait = candidate.portrait;
    if (!portrait || portrait.status !== 'ADMITTED' || !portrait.url || !portrait.sourceUrl || !portrait.license) return null;
    return portrait;
  }

  function candidateCards(race) {
    if (!race.candidates.length) return '<p class="roster-warning">No source-listed candidate record was returned for this race.</p>';
    const partyOrder = {D:0,R:1,I:2,L:3};
    const orderedCandidates = [...race.candidates].sort((a,b) => (partyOrder[a.party] ?? 9) - (partyOrder[b.party] ?? 9));
    return `<div class="nominee-grid">${orderedCandidates.map((candidate) => {
      const party = candidate.party || 'UNKNOWN';
      const label = `${party}${candidate.incumbent ? ' · incumbent' : ''}`;
      const portrait = admittedPortrait(candidate);
      const visual = portrait ? `<img class="nominee-photo" src="${escapeHtml(portrait.url)}" alt="${escapeHtml(candidate.name)}" width="56" height="56" loading="lazy">` : `<span class="nominee-avatar party-${escapeHtml(party.toLowerCase())}" aria-hidden="true">${escapeHtml(candidate.name.split(/\s+/).map((part) => part[0]).join('').slice(0,2) || '?')}</span>`;
      const custody = portrait ? `<a class="portrait-source" href="${escapeHtml(portrait.sourceUrl)}">Photo source · ${escapeHtml(portrait.license)}</a>` : 'source-listed · photo pending identity and rights review';
      return `<div class="nominee">${visual}<div><strong>${escapeHtml(candidate.name)}</strong><small>${escapeHtml(label)} · ${typeof custody === 'string' && !custody.startsWith('<') ? escapeHtml(custody) : custody}</small></div></div>`;
    }).join('')}</div>`;
  }

  function raceCard(race) {
    const dem = pct(race.pDem);
    const rep = pct(1 - race.pDem);
    return `<article class="race-record">
      <div><div class="race-id">${escapeHtml(race.id)}</div><div class="race-tier">${escapeHtml(race.chamber)} · ${escapeHtml(race.tier)}</div><p class="fine">Publisher rating edition: ${escapeHtml(race.sourceDate)}${race.originalLock ? ' · also present in original lock' : ''}</p></div>
      <div><div class="race-tier">KAHRELUM party-outcome probability</div><div class="probability-pair"><div class="party-dem"><strong>${dem}</strong><span>Democratic side</span></div><div class="party-rep"><strong>${rep}</strong><span>Republican side</span></div></div><div class="probability-track" aria-label="${dem} Democratic probability and ${rep} Republican probability"><i class="democratic" style="width:${dem}"></i><i class="republican" style="width:${rep}"></i></div><p class="fine">Event: ${escapeHtml(race.event)}. This is not a named-candidate probability.</p></div>
      <div><div class="race-tier">Source-listed candidate file</div>${candidateCards(race)}<p class="roster-warning">Discovery roster only; official ballot identity and portrait rights remain unverified.</p></div>
    </article>`;
  }

  function matchesBand(race, band) {
    if (band === 'original') return race.originalLock;
    if (band === 'competitive') return race.pDem >= .3 && race.pDem <= .7;
    if (band === 'dem') return race.pDem > .5;
    if (band === 'rep') return race.pDem < .5;
    if (band === 'toss') return race.pDem === .5;
    return true;
  }

  function renderRaces() {
    const chamber = byId('raceChamber').value;
    const band = byId('raceBand').value;
    const query = byId('raceSearch').value.trim().toLowerCase();
    const filtered = races.filter((race) =>
      (selectedState === 'ALL' || race.state === selectedState) &&
      (chamber === 'ALL' || race.chamber === chamber) && matchesBand(race,band) &&
      (!query || `${race.id} ${stateByCode[race.state]} ${race.tier} ${race.chamber} ${race.candidates.map((candidate) => candidate.name).join(' ')}`.toLowerCase().includes(query))
    );
    const displayed = filtered.slice(0,displayLimit);
    byId('raceResultCount').textContent = `Showing ${displayed.length} of ${filtered.length} matching contests · ${races.length} nationwide`;
    byId('raceList').innerHTML = displayed.length ? displayed.map(raceCard).join('') : '<div class="map-status">No contest matches these filters.</div>';
    byId('loadMoreRaces').hidden = displayed.length >= filtered.length;
  }

  function populateStateFilter() {
    const select = byId('raceState');
    states.slice().sort((a,b) => a[1].localeCompare(b[1])).forEach(([code,name]) => {
      const option = document.createElement('option'); option.value = code; option.textContent = `${name} (${code})`; select.appendChild(option);
      byId('mapStateJump').appendChild(option.cloneNode(true));
    });
  }

  function populateSearchSuggestions() {
    const suggestions = byId('raceSearchSuggestions');
    const fragment = document.createDocumentFragment();
    races.forEach((race) => {
      const raceOption = document.createElement('option');
      raceOption.value = race.id;
      raceOption.label = `${stateByCode[race.state]} · ${race.chamber} · ${race.tier}`;
      fragment.appendChild(raceOption);
      race.candidates.forEach((candidate) => {
        const candidateOption = document.createElement('option');
        candidateOption.value = candidate.name;
        candidateOption.label = `${candidate.party || 'unknown party'} · ${race.id} · source-listed`;
        fragment.appendChild(candidateOption);
      });
    });
    suggestions.appendChild(fragment);
  }

  function setMapChamber(chamber) {
    mapChamber = chamber;
    byId('raceChamber').value = chamber;
    document.querySelectorAll('[data-map-chamber]').forEach((item) => item.setAttribute('aria-pressed',String(item.dataset.mapChamber === chamber)));
    displayLimit = 40;
    renderMap(); renderStateBrief(); renderRaces();
  }

  function resetNationalView() {
    selectedState = 'ALL';
    byId('raceState').value = 'ALL';
    byId('mapStateJump').value = 'ALL';
    renderMap(); renderStateBrief(); renderRaces();
  }

  async function init() {
    try {
      const [houseResponse,senateResponse,currentResponse,seatsResponse,challengerResponse,mapResponse,portraitResponse] = await Promise.all([
        fetch('/election/house-forecast-lock.json'),fetch('/election/senate-forecast-lock.json'),fetch('/election/current-projections.json'),fetch('/election/seat-projections.json'),fetch('/election/challenger-source-checks.json'),fetch('/assets/us-states-map.json'),fetch('/election/candidate-portraits.json')
      ]);
      if (![houseResponse,senateResponse,currentResponse,seatsResponse,challengerResponse,mapResponse,portraitResponse].every((response) => response.ok)) throw new Error('One or more forecast files, the geographic map or the portrait ledger could not be loaded.');
      const [house,senate,current,seats,challengers,geometry,portraits] = await Promise.all([houseResponse.json(),senateResponse.json(),currentResponse.json(),seatsResponse.json(),challengerResponse.json(),mapResponse.json(),portraitResponse.json()]);
      seatProjectionData = seats;
      currentProjectionData = current;
      challengerData = challengers;
      mapGeometry = geometry;
      races = buildRaces(house,current);
      applyPortraitLedger(races,portraits);
      if (races.length !== 470 || current.house.raceCount !== 435 || current.senate.raceCount !== 35 || current.coverage.racesWithSourceListedCandidates !== 470 || house.competitive_districts.length !== 81 || challengers.records.length !== 15 || challengers.challengersChecked !== 14 || challengers.unpricedChallengers !== 0 || challengers.records.some((record) => record.houseDemocraticControlPct === null && record.senateDemocraticControlPct === null) || geometry.schema !== 'KAHRELUM_US_STATES_MAP_v1.0' || geometry.locations.length !== 50 || portraits.schema !== 'KAHRELUM_CANDIDATE_PORTRAITS_v1.0' || portraits.records.length !== current.coverage.admittedPortraits) throw new Error('Fresh election projection did not pass race, candidate, portrait, map and challenger validation.');
      byId('mapHouseCount').textContent = current.house.raceCount;
      byId('mapSenateCount').textContent = current.senate.raceCount;
      byId('mapCandidateCount').textContent = current.coverage.sourceListedCandidateRecords;
      byId('mapPortraitCount').textContent = current.coverage.admittedPortraits;
      byId('currentEditionLine').textContent = `Fresh retrieval and computation: ${new Date(current.computedAtUtc).toLocaleString()} · House publisher rating edition: ${current.sources.house.publisherEdition} · Senate publisher rating edition: ${current.sources.senate.publisherEdition}.`;
      byId('mapLoadStatus').hidden = true;
      populateStateFilter(); populateSearchSuggestions(); renderMap(); renderStateBrief(); renderRaces(); renderSeatTracker(current); renderSeatComparison(); renderChallengerTable();
      const resetAndRender = () => {displayLimit=40;renderRaces();};
      byId('raceSearch').addEventListener('input',resetAndRender);
      byId('raceChamber').addEventListener('change',(event) => setMapChamber(event.target.value));
      byId('raceBand').addEventListener('change',resetAndRender);
      byId('raceState').addEventListener('change',(event) => {selectedState=event.target.value;displayLimit=40;byId('mapStateJump').value=selectedState;renderMap();renderStateBrief();renderRaces();});
      byId('mapStateJump').addEventListener('change',(event) => {selectedState=event.target.value;displayLimit=40;byId('raceState').value=selectedState;renderMap();renderStateBrief();renderRaces();});
      byId('loadMoreRaces').addEventListener('click',() => {displayLimit+=40;renderRaces();});
      byId('houseComparisonButton').addEventListener('click',() => {seatComparisonMode='house';byId('houseComparisonButton').setAttribute('aria-pressed','true');byId('senateComparisonButton').setAttribute('aria-pressed','false');renderSeatComparison();});
      byId('senateComparisonButton').addEventListener('click',() => {seatComparisonMode='senate';byId('senateComparisonButton').setAttribute('aria-pressed','true');byId('houseComparisonButton').setAttribute('aria-pressed','false');renderSeatComparison();});
      document.querySelectorAll('[data-map-chamber]').forEach((button) => button.addEventListener('click',() => setMapChamber(button.dataset.mapChamber)));
      byId('nationalMapButton').addEventListener('click',resetNationalView);
      void senate;
    } catch (error) {
      byId('mapLoadStatus').hidden = false;
      byId('mapLoadStatus').textContent = `Map unavailable: ${error.message} The headline forecast record remains visible below.`;
    }
  }
  document.addEventListener('DOMContentLoaded',init);
})();
