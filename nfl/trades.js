"use strict";

const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl = (value) => { try { const url = new URL(value); return url.protocol === "https:" ? url.href : "#"; } catch (_) { return "#"; } };
const hardTypes = new Set(["COACH_CONFIRMED_PLAYER_REQUEST", "REPORTED_MARKET", "REPORTED_INQUIRY", "TEAM_RESISTING", "OFF_MARKET_REPORTED"]);
const reportedTypes = new Set([...hardTypes, "ESPN_WATCHLIST"]);
const BASIS = {CARRIED_FORWARD_JUDGMENT:"Carried-forward judgment", LOW_INFORMATION_BASELINE:"Low-information baseline", SOURCE_BACKED_JUDGMENT_REVISION:"Reviewed judgment update", INDEXED_SIGNAL_ESTIMATE:"Discounted indexed signal", ACCEPTED_SOURCE_REVIEW_REVISION:"Accepted source review revision", SOURCE_REVIEWED_STRUCTURED_JUDGMENT:"Source-reviewed estimate", INDEXED_SIGNAL_DISCOUNTED_SCENARIO:"Discounted indexed signal", INELIGIBLE_RELEASED_PLAYER:"Released · no active trade market", ROSTER_STATUS_NOT_FORECAST:"Released · status value, excluded from forecasting"};
let db = null, bundle = null, forecastMap = new Map(), portraitMap = new Map(), refreshing = false;

function prettyType(type) { return ({COACH_CONFIRMED_PLAYER_REQUEST:"Coach confirmed request",REPORTED_MARKET:"Reported market interest",REPORTED_INQUIRY:"Reported inquiry",TEAM_RESISTING:"Team reportedly resisting",OFF_MARKET_REPORTED:"Reported off market",ESPN_WATCHLIST:"ESPN watchlist",ANALYST_RADAR:"Analyst radar only"})[type] || "Research candidate"; }
function showTime(value) { const date = new Date(value); return value && Number.isFinite(date.getTime()) ? date.toLocaleString("en-US", {dateStyle:"medium", timeStyle:"short", timeZone:"America/New_York"}) + " Eastern" : "Not established"; }
function sourceLinks(ids, max = 4) { const map = new Map(db.sources.map((s) => [s.id, s])); return (ids || []).slice(0, max).map((id) => { const s = map.get(id); return s ? '<a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">' + esc(id) + '</a>' : ""; }).join(""); }

async function fetchJson(path, schema) {
  const stamp = Date.now();
  const candidates = [
    {url:"https://raw.githubusercontent.com/AuroraGrid/kahrelum-os/main/" + path + "?t=" + stamp, kind:"current repository"},
    {url:"https://api.github.com/repos/AuroraGrid/kahrelum-os/contents/" + path + "?ref=main&t=" + stamp, headers:{Accept:"application/vnd.github.raw+json"}, kind:"current repository"},
    {url:"/" + path + "?t=" + stamp, kind:"deployed fallback"},
  ];
  for (const candidate of candidates) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);
    try {
      const response = await fetch(candidate.url, {cache:"no-store", headers:candidate.headers || {}, signal:controller.signal});
      if (!response.ok) continue;
      const data = await response.json();
      if (schema && data.schema !== schema) continue;
      return {data, kind:candidate.kind};
    } catch (_) { /* Keep the previous dated view when a source is unavailable. */ }
    finally { clearTimeout(timeout); }
  }
  throw new Error("The current record and deployed fallback are unavailable.");
}

function playerPortrait(player) {
  const initials = player.name.split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("");
  const record = portraitMap.get(player.id);
  const valid = record && record.status === "VERIFIED_EXTERNAL" && (record.matchNames || [record.playerName]).includes(player.name) && safeUrl(record.url) !== "#";
  return '<div class="player-identity"><span class="player-photo" aria-label="' + esc(player.name) + '"><span aria-hidden="true">' + esc(initials) + '</span>' + (valid ? '<img src="' + esc(safeUrl(record.url)) + '" alt="' + esc(player.name) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer" width="72" height="72">' : '') + '</span><div><h3>' + esc(player.name) + '</h3><div class="org">' + esc(player.team) + ' · ' + esc(player.pos) + '</div>' + (valid ? '<a class="photo-credit" href="' + esc(safeUrl(record.sourceUrl)) + '" target="_blank" rel="noopener noreferrer">' + esc(record.attribution || "Photo source") + ' ↗</a>' : '') + '</div></div>';
}

function card(player) {
  const forecast = forecastMap.get(player.id);
  const probability = forecast && Number.isFinite(forecast.probability) ? Math.round(forecast.probability * 1000) / 10 : null;
  const label = forecast ? (BASIS[forecast.basis] || "Structured judgment") : "Forecast unavailable";
  const sensitivity = forecast?.sensitivity;
  const sensitivityText = sensitivity && Number.isFinite(sensitivity.low) && Number.isFinite(sensitivity.high) ? 'Sensitivity: ' + Math.round(sensitivity.low * 100) + '–' + Math.round(sensitivity.high * 100) + '%. Scenario range, not a confidence interval.' : '';
  const change = forecast?.change;
  const changed = change && change.percentagePoints !== null && Number.isFinite(change.percentagePoints) && change.percentagePoints !== 0;
  const details = forecast ? '<details class="forecast-explanation"><summary>Why this estimate</summary><p>' + esc(forecast.rationale) + '</p><p class="tiny">' + esc(sensitivityText) + '</p><p class="tiny">Evidence cutoff: ' + esc(showTime(forecast.informationCutoffUtc)) + '. Source review: ' + esc(showTime(forecast.lastSourceReviewAtUtc)) + '.</p>' + (forecast.counterarguments || []).map((reason) => '<p class="tiny">Countercase: ' + esc(reason) + '</p>').join('') + '<div class="source-links">' + (forecast.sourceUrls || []).slice(0, 4).map((url, i) => '<a href="' + esc(safeUrl(url)) + '" target="_blank" rel="noopener noreferrer">Evidence ' + (i + 1) + ' ↗</a>').join('') + '</div></details>' : '<p class="tiny">The dated source register is available; a current forecast could not be loaded.</p>';
  return '<article class="card candidate"><div class="cand-head">' + playerPortrait(player) + '</div><span class="tag ' + (hardTypes.has(player.evidenceType) ? 'mint' : '') + '">' + esc(prettyType(player.evidenceType)) + '</span><div class="p-pair"><div class="p-cell"><b>' + (probability === null ? 'Unavailable' : probability + '%') + '</b><span>' + (forecast?.cohortEligible === false ? 'KAHRELUM roster status' : 'KAHRELUM estimate') + '</span></div><div class="p-cell"><b>' + (Number.isFinite(player.espnProbability) ? player.espnProbability + '%' : '—') + '</b><span>ESPN · separate model</span></div></div><p class="forecast-basis">' + esc(label) + (changed ? ' · ' + (change.percentagePoints > 0 ? '+' : '') + esc(change.percentagePoints) + ' pp' : '') + '</p><div class="source-links">' + sourceLinks(player.sourceIds, 4) + '</div>' + details + '</article>';
}

function render() {
  if (!db) return;
  const q = $('#query').value.trim().toLowerCase(), team = $('#team').value, type = $('#evidence').value;
  const rows = db.candidates.filter((p) => (!q || (p.name + " " + p.team + " " + p.pos).toLowerCase().includes(q)) && (!team || p.team === team) && (type === "all" || type === "reported" && reportedTypes.has(p.evidenceType) || type === "reported-only" && hardTypes.has(p.evidenceType) || type === "radar" && p.evidenceType === "ANALYST_RADAR" || type === "priced" && forecastMap.has(p.id))).sort((a, b) => (forecastMap.get(b.id)?.probability ?? -1) - (forecastMap.get(a.id)?.probability ?? -1) || a.name.localeCompare(b.name));
  $('#resultCount').textContent = rows.length + ' of ' + db.candidates.length + ' players · ' + [...forecastMap.values()].filter((row) => row.cohortEligible !== false).length + ' forecasts + ' + [...forecastMap.values()].filter((row) => row.cohortEligible === false).length + ' roster status · updated ' + showTime(bundle?.currentForecasts?.generatedAtUtc);
  const open = new Set([...document.querySelectorAll('.candidate details[open]')].map((node) => node.closest('.candidate').querySelector('h3').textContent));
  $('#candidates').innerHTML = rows.length ? rows.map(card).join('') : '<p class="loading">No players match these filters.</p>';
  for (const node of document.querySelectorAll('.candidate details')) if (open.has(node.closest('.candidate').querySelector('h3').textContent)) node.open = true;
}

function renderActivity(data) {
  const approved = (data.publishedUpdates || []).slice(0, 3);
  $('#reviewedUpdates').innerHTML = approved.length ? approved.map((item) => '<article class="activity-item reviewed"><span class="tag mint">' + esc(item.evidenceClass) + ' · Reviewed</span><h3><a href="' + esc(safeUrl(item.sourceUrl)) + '" target="_blank" rel="noopener noreferrer">' + esc(item.headline) + ' ↗</a></h3><p>' + esc(item.claim || '') + '</p></article>').join('') : '';
  const activity = data.activity || [];
  $('#activityRows').innerHTML = activity.length ? activity.slice(0, 12).map((item) => '<article class="activity-item"><div class="activity-meta"><span class="tag">' + (item.claimType === 'OFFICIAL_COMPLETED_TRANSACTION' ? 'Official table · awaiting review' : 'Source headline · unreviewed') + '</span><time>' + esc(showTime(item.firstObservedAt)) + '</time></div><h3><a href="' + esc(safeUrl(item.originalUrl)) + '" target="_blank" rel="noopener noreferrer">' + esc(item.title) + ' ↗</a></h3><p class="tiny">' + esc(item.sourceName) + (item.sourcePublishedAt ? ' · Source published ' + esc(showTime(item.sourcePublishedAt)) : item.sourceDate ? ' · Source date ' + esc(item.sourceDate) + ' (no exact time)' : ' · Source publication time not supplied') + (item.linkCustody === 'DISCOVERY_REDIRECT_NOT_ORIGINAL_REPORT' ? ' · Discovery link; original reporting not yet verified.' : '') + '</p></article>').join('') : '<p class="note">No new trade-related source headlines are available in the current record.</p>';
}

function updateStatus(data, kind) {
  const status = data.sourceStatus || {};
  const checked = status.lastCompletedCheckAt || status.lastSuccessfulSourceCheckAt;
  const age = checked ? (Date.now() - new Date(checked).getTime()) / 60000 : Infinity;
  const archived = status.monitoringState === 'DEADLINE_WINDOW_CLOSED';
  const state = archived ? 'Deadline window closed' : age > 15 ? 'Source checks delayed' : status.feedFreshness === 'FRESH' ? 'Source checks current' : 'Some source checks unavailable';
  $('#sourceCheckStatus').textContent = state + ' · ' + (status.sourcesSucceeded ?? 0) + '/' + (status.sourcesAttempted ?? 0) + ' sources · last check ' + showTime(checked) + '. Requested every five minutes; actual checks may be delayed.';
  $('#stamp').textContent = 'Forecasts: ' + showTime(data.currentForecasts?.generatedAtUtc) + '. Reviewed news: ' + (data.latestEditorialPublicationAt ? showTime(data.latestEditorialPublicationAt) : 'no separately published update') + '. Reading the ' + kind + '.';
  $('#refreshMessage').textContent = 'View refreshed ' + new Date().toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}) + '. Checks for new data every minute while this tab is visible.';
  $('#deskState').textContent = archived ? 'ARCHIVED / OUTCOMES PENDING' : kind === 'deployed fallback' ? 'DATED FALLBACK' : 'ACTIVE / SOURCE UPDATES';
}

function renderAccountability(data) {
  const ledger = data.ledger || {eligibleLocks:[], historicalExcluded:[]}, audit = data.audit || {};
  const locks = ledger.eligibleLocks || [];
  $('#qualified').textContent = locks.length;
  $('#scoreState').textContent = (audit.brierScore == null ? 'N/A' : Number(audit.brierScore).toFixed(4)) + ' / ' + locks.length + ' LOCKS';
  $('#metricBrier').textContent = audit.brierScore == null ? 'N/A' : Number(audit.brierScore).toFixed(4);
  $('#forecastHistory').innerHTML = '<div class="list-row"><b>' + locks.length + '</b><div><strong>Prospective public locks</strong><div class="tiny">' + (locks.length ? 'Published ' + esc(showTime(locks[0].publicationTimestampUtc)) + '. Every admitted player stays in the scoring denominator.' : 'Current estimates await a verified public lock receipt.') + '</div></div><span>' + (ledger.historicalExcluded || []).length + ' historical exclusions</span><a href="https://github.com/AuroraGrid/kahrelum-os/blob/main/nfl/forecast-ledger.json">Ledger ↗</a></div>' + (ledger.historicalExcluded || []).filter((row) => row.provisionalBrierArithmetic !== undefined).map((row) => '<div class="list-row"><b>K ' + Math.round(row.probability * 100) + '%</b><div><strong>' + esc(row.player) + '</strong><div class="tiny">Historical arithmetic only · excluded from the prospective score</div></div><span class="historical-brier">Brier ' + Number(row.provisionalBrierArithmetic).toFixed(4) + '</span><a href="https://github.com/AuroraGrid/kahrelum-os/blob/main/nfl/forecast-ledger.json">Custody ↗</a></div>').join('');
  $('#auditStatus').textContent = 'Audit: ' + (audit.status || 'PENDING') + '. Brier: ' + (audit.brierScore == null ? 'N/A' : Number(audit.brierScore).toFixed(4)) + '. Official audit scheduled for ' + showTime(audit.scheduledForUtc) + '. Date-only boundary records stay unresolved until ordering is verified.';
  $('#contradictions').innerHTML = (data.contradictions || []).length ? data.contradictions.map((row) => '<div class="list-row"><b>REVIEW</b><div><strong>' + esc(row.player) + '</strong><div class="tiny">Opposing availability language needs original-source review.</div></div><span>Queued</span><a href="https://github.com/AuroraGrid/kahrelum-os/blob/main/nfl/review-queue.json">Record ↗</a></div>').join('') : '<p class="note">No automated contradiction is published as resolved. Absence of a flag does not establish that reports agree.</p>';
}

async function refreshDesk() {
  if (refreshing) return;
  refreshing = true;
  $('#refreshDesk').disabled = true;
  try {
    const result = await fetchJson('nfl/desk-live.json', 'KAHRELUM_NFL_DESK_LIVE_v1.0');
    const next = result.data;
    if (!Array.isArray(next.board?.candidates) || !Array.isArray(next.board?.sources) || !Array.isArray(next.board?.deals)) throw new Error('The desk record did not pass its data checks.');
    if (bundle && new Date(next.generatedAtUtc) < new Date(bundle.generatedAtUtc)) throw new Error('The available copy is older than the view already on screen.');
    const forecastRows = next.currentForecasts?.forecasts || [];
    const candidateIds = new Set(next.board.candidates.map((p) => p.id));
    const names = new Map(next.board.candidates.map((p) => [p.id, p.name]));
    if (next.currentForecasts?.schema !== 'KAHRELUM_CURRENT_NFL_FORECASTS_v1.0' || forecastRows.length !== candidateIds.size || new Set(forecastRows.map((f) => f.candidateId)).size !== candidateIds.size || forecastRows.some((f) => !candidateIds.has(f.candidateId) || f.player !== names.get(f.candidateId) || !Number.isFinite(f.probability) || f.probability < 0 || f.probability > 1)) throw new Error('The forecast file is incomplete; retaining the previous view.');
    const changed = !bundle || JSON.stringify(next) !== JSON.stringify(bundle);
    bundle = next; db = next.board;
    forecastMap = new Map(forecastRows.map((f) => [f.candidateId, f]));
    if (changed) {
      const selected = $('#team').value;
      $('#team').innerHTML = '<option value="">Every team</option>' + [...new Set(db.candidates.map((p) => p.team))].sort().map((team) => '<option value="' + esc(team) + '">' + esc(team) + '</option>').join('');
      $('#team').value = selected;
      $('#metricCandidates').textContent = db.candidates.length;
      $('#metricDeals').textContent = db.deals.length;
      $('#metricProbs').textContent = forecastMap.size;
      $('#dealsRows').innerHTML = db.deals.slice().reverse().map((deal) => '<div class="list-row"><b>' + esc(deal.date) + '</b><div><strong>' + esc(deal.name) + '</strong><div class="tiny">' + esc(deal.reportedTerms) + '</div></div><span>' + esc(deal.from) + ' → ' + esc(deal.to) + '</span><a href="https://www.nfl.com/news/nfl-trade-deadline-track-every-move-since-start-of-2026-regular-season" target="_blank" rel="noopener noreferrer">NFL ↗</a></div>').join('');
      $('#sourcesRows').innerHTML = db.sources.map((source) => '<article class="card"><span class="label">' + esc(source.kind) + '</span><h3>' + esc(source.name) + '</h3><p class="tiny">Source date: ' + esc(source.date) + '</p><a href="' + esc(safeUrl(source.url)) + '" target="_blank" rel="noopener noreferrer">Open attributable source ↗</a></article>').join('');
      render(); renderActivity(next); renderAccountability(next);
    }
    updateStatus(next, result.kind);
  } catch (error) {
    $('#refreshMessage').textContent = (bundle ? 'Keeping the last dated view. ' : 'Desk temporarily unavailable. ') + error.message;
    if (!bundle) $('#candidates').innerHTML = '<p class="loading">The desk could not load. <a href="https://github.com/AuroraGrid/kahrelum-os/tree/main/nfl">Inspect the published records ↗</a></p>';
  } finally { refreshing = false; $('#refreshDesk').disabled = false; }
}

async function init() {
  for (const selector of ['#query', '#team', '#evidence']) $(selector).addEventListener(selector === '#query' ? 'input' : 'change', render);
  $('#refreshDesk').addEventListener('click', refreshDesk);
  document.addEventListener('error', (event) => { if (event.target.matches?.('.player-photo img')) event.target.remove(); }, true);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDesk(); });
  const deskPromise = refreshDesk();
  const results = await Promise.allSettled([fetchJson('nfl/sourcegrid.json'), fetchJson('nfl/player-portraits.json', 'KAHRELUM_PLAYER_PORTRAITS_v1.0')]);
  if (results[0].status === 'fulfilled') {
    const grid = results[0].value.data;
    const operational = grid.operationalIntegrations || [];
    $('#operationalRows').innerHTML = operational.filter((s) => s.role !== 'OFFICIAL_TEAM_DISCOVERY').map((s) => '<article class="card"><span class="label">Operational · ' + esc(s.role) + '</span><h3>' + esc(s.name) + '</h3><p>Source discovery with dated checks.</p><a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener noreferrer">Open source ↗</a></article>').join('');
    $('#teamFeedSummary').textContent = operational.filter((s) => s.role === 'OFFICIAL_TEAM_DISCOVERY').length + ' first-party team feeds. A headline does not establish a completed trade.';
    $('#watchlistSummary').textContent = (grid.counts?.watchlistOnly || 0) + ' manual reporter and broadcast entries. Watchlist membership does not assert an automated check.';
  }
  if (results[1].status === 'fulfilled') { portraitMap = new Map((results[1].value.data.records || []).map((row) => [row.candidateId, row])); render(); }
  await deskPromise;
  setInterval(() => { if (!document.hidden) refreshDesk(); }, 60000);
}
init();
