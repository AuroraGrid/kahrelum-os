const $ = selector => document.querySelector(selector);
const inviteScreen = $('#inviteScreen');
const chatScreen = $('#chatScreen');
const form = $('#chatForm');
const input = $('#messageInput');
const conversation = $('#conversation');
const welcomePanel = $('#welcomePanel');
const installButton = $('#installButton');
const preferencesButton = $('#preferencesButton');
const preferencesDialog = $('#preferencesDialog');
const PERSONALIZATION_KEY = 'kahrelum-one-personalization-v1';
let personalization = { instructions: '', memories: [] };
let deferredInstall = null;
let verificationMode = false;
let liveResearchAvailable = false;
let turns = [];

function showChat() { inviteScreen.hidden = true; chatScreen.hidden = false; $('#newChatButton').hidden = false; preferencesButton.hidden = false; input.focus(); }
function showInvite() { chatScreen.hidden = true; inviteScreen.hidden = false; $('#newChatButton').hidden = true; preferencesButton.hidden = true; }

function loadPersonalization() {
  try {
    const saved = JSON.parse(localStorage.getItem(PERSONALIZATION_KEY) || '{}');
    personalization = {
      instructions: typeof saved.instructions === 'string' ? saved.instructions.slice(0, 2000) : '',
      memories: Array.isArray(saved.memories) ? saved.memories.filter(item => typeof item === 'string').slice(0, 15).map(item => item.slice(0, 200)) : []
    };
  } catch { personalization = { instructions: '', memories: [] }; }
}
async function checkSession() {
  try {
    const response = await fetch('/api/one/session', { credentials: 'same-origin' });
    if (response.ok) { const config=await response.json(); liveResearchAvailable=Boolean(config.liveResearchAvailable); showChat(); }
    else showInvite();
  } catch { showInvite(); }
}

$('#inviteForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  const code = $('#inviteCode').value.trim();
  const note = $('#inviteError');
  button.disabled = true; button.textContent = 'Checking…'; note.textContent = '';
  try {
    const response = await fetch('/api/one/redeem', { method: 'POST', credentials: 'same-origin', headers: {'Content-Type':'application/json'}, body: JSON.stringify({code}) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'That code could not be redeemed.');
    $('#inviteCode').value = ''; await loadPersonalization();
checkSession();
  } catch (error) { note.textContent = error.message === 'Failed to fetch' ? 'The assistant service is not connected yet. Try again shortly.' : error.message; }
  finally { button.disabled = false; button.innerHTML = 'Continue <span aria-hidden="true">→</span>'; }
});

function setMode(enabled) {
  verificationMode = enabled;
  if(!enabled) $('#liveResearchToggle').checked=false;
  $('#modeToggle').setAttribute('aria-pressed', String(enabled));
  $('#modeName').textContent = enabled ? 'KAHRELUM Check' : 'Everyday';
  $('#modeBadge').textContent = enabled ? 'KAHRELUM Check' : 'Everyday';
  $('#modeHint').textContent = enabled ? 'Three ordered Gemini passes align evidence, challenge it, then synthesize. Search is optional; free-tier limits apply.' : 'Simple, helpful answers for everyday questions.';
  $('#researchOption').hidden = !enabled;
  $('#liveResearchToggle').disabled = !liveResearchAvailable;
  $('#researchAvailability').textContent = liveResearchAvailable ? 'Sends this question to Tavily. 1 free credit; stops at the monthly limit.' : 'Live search is not configured on this beta yet.';
}
$('#modeToggle').addEventListener('click', () => setMode(!verificationMode));

function addMessage(role, text) {
  welcomePanel.hidden = true;
  const el = document.createElement('div'); el.className = `message ${role}`; el.textContent = text;
  conversation.appendChild(el); conversation.scrollTop = conversation.scrollHeight; return el;
}
function addError(message) { const el = document.createElement('div'); el.className = 'error-card'; el.textContent = message; conversation.appendChild(el); conversation.scrollTop = conversation.scrollHeight; }
async function send(text) {
  const clean = text.trim(); if (!clean) return;
  addMessage('user', clean); input.value = ''; input.style.height = 'auto';
  const pending = addMessage('assistant', verificationMode ? 'Routing, aligning evidence, and challenging the answer…' : 'Thinking…');
  const button = $('.send-button'); button.disabled = true;
  const history = [...turns, {role:'user', content:clean}].slice(-12);
  try {
    const response = await fetch('/api/one/chat', {method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'}, body:JSON.stringify({messages:history, mode:verificationMode?'check':'everyday', liveResearch:verificationMode&&liveResearchAvailable&&$('#liveResearchToggle').checked, customInstructions:personalization.instructions, memories:personalization.memories})});
    const payload = await response.json();
    if (response.status === 401) { pending.remove(); showInvite(); throw new Error('Your access session ended. Enter your invite code again.'); }
    if (!response.ok) throw new Error(payload.error || 'The assistant could not answer right now.');
    pending.textContent = payload.answer;
    if(Array.isArray(payload.sources)&&payload.sources.length){
      const list=document.createElement('div');list.className='source-list';
      const label=document.createElement('span');label.textContent='Sources searched just now';list.append(label);
      payload.sources.forEach((source,index)=>{
        try{const url=new URL(source.url);if(url.protocol!=='https:')return;const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=`[${index+1}] ${source.title||url.hostname}`;list.append(link);}catch{}
      });
      pending.append(list);
    }
    if(payload.pipeline&&Array.isArray(payload.pipeline.stages)){
      const trace=document.createElement('details');trace.className='review-trace';
      const summary=document.createElement('summary');summary.textContent='KAHRELUM Check review trail';trace.append(summary);
      const stages=document.createElement('ol');
      payload.pipeline.stages.forEach(stage=>{const item=document.createElement('li');item.textContent=stage.name+': '+stage.detail;stages.append(item);});
      trace.append(stages);
      const limitation=document.createElement('p');limitation.textContent='Beta limitation: all review passes use the same Gemini model. This is not independent multi-model verification, and the server does not retain an immutable record.';
      trace.append(limitation);
      if(payload.pipeline.responseFingerprint){const fingerprint=document.createElement('code');fingerprint.textContent='Response fingerprint: '+payload.pipeline.responseFingerprint;trace.append(fingerprint);}
      pending.append(trace);
    }
    turns = [...history, {role:'assistant', content:payload.answer}].slice(-12);
  } catch(error) { pending.remove(); addError(error.message); }
  finally { button.disabled = false; input.focus(); }
}
form.addEventListener('submit', event => {event.preventDefault(); send(input.value);});
input.addEventListener('input', () => {input.style.height='auto'; input.style.height=Math.min(input.scrollHeight,150)+'px';});
input.addEventListener('keydown', event => { if(event.key==='Enter'&&!event.shiftKey){event.preventDefault(); form.requestSubmit();} });
document.querySelectorAll('[data-prompt]').forEach(button => button.addEventListener('click', () => send(button.dataset.prompt)));
$('#newChatButton').addEventListener('click', () => {turns=[]; conversation.replaceChildren(welcomePanel); welcomePanel.hidden=false; input.focus();});

preferencesButton.addEventListener('click', () => {
  $('#customInstructions').value = personalization.instructions;
  $('#memoryInput').value = personalization.memories.join('\n');
  $('#preferencesStatus').textContent = '';
  preferencesDialog.showModal();
  $('#customInstructions').focus();
});
$('#closePreferencesButton').addEventListener('click', () => preferencesDialog.close());
$('#cancelPreferencesButton').addEventListener('click', () => preferencesDialog.close());
$('#preferencesForm').addEventListener('submit', event => {
  event.preventDefault();
  const memories = $('#memoryInput').value.split(/\r?\n/).map(item => item.trim()).filter(Boolean).slice(0, 15).map(item => item.slice(0, 200));
  const next = { instructions: $('#customInstructions').value.trim().slice(0, 2000), memories };
  try {
    localStorage.setItem(PERSONALIZATION_KEY, JSON.stringify(next));
    personalization = next;
    $('#preferencesStatus').textContent = 'Saved on this device. It will apply to your next message.';
    window.setTimeout(() => preferencesDialog.close(), 600);
  } catch {
    $('#preferencesStatus').textContent = 'Could not save in this browser. Check your storage settings and try again.';
  }
});
$('#forgetAllButton').addEventListener('click', () => {
  if (!window.confirm('Forget all saved instructions and memories on this device?')) return;
  try {
    localStorage.removeItem(PERSONALIZATION_KEY);
    personalization = { instructions: '', memories: [] };
    $('#customInstructions').value = '';
    $('#memoryInput').value = '';
    $('#preferencesStatus').textContent = 'Saved details forgotten on this device.';
  } catch {
    $('#preferencesStatus').textContent = 'Could not clear saved details in this browser.';
  }
});
window.addEventListener('beforeinstallprompt', event => {event.preventDefault();deferredInstall=event;installButton.hidden=false;});
installButton.addEventListener('click', async () => { if(!deferredInstall)return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall=null; installButton.hidden=true; });
if('serviceWorker' in navigator) navigator.serviceWorker.register('/one/sw.js').catch(()=>{});
checkSession();
