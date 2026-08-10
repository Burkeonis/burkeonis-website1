const printButton = document.querySelector('#print-workbook');
if (printButton) printButton.addEventListener('click', () => window.print());

const audioPlayers = document.querySelectorAll('audio');
audioPlayers.forEach((player) => {
  player.addEventListener('play', () => {
    audioPlayers.forEach((otherPlayer) => {
      if (otherPlayer !== player && !otherPlayer.paused) otherPlayer.pause();
    });
  });
});


/* RAD Mirror native browser tool */
(() => {
'use strict';
const radRoot = document.getElementById('rad-app');
if (!radRoot) return;
let activeTab='understand', lens='balanced', mode='browser', pauseTimer=null, seconds=60;
const $=id=>document.getElementById(id);
const tabs=[...document.querySelectorAll('.rad-tab')], panels=[...document.querySelectorAll('[data-panel]')];
function setTab(next){activeTab=next;tabs.forEach(b=>{const on=b.dataset.tab===next;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});panels.forEach(p=>p.hidden=p.dataset.panel!==next);}
tabs.forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
document.querySelectorAll('.lens-btn').forEach(b=>b.addEventListener('click',()=>{lens=b.dataset.lens;document.querySelectorAll('.lens-btn').forEach(x=>x.classList.toggle('active',x===b));}));
function lines(text){return text.split(/\n+/).map(x=>x.trim()).filter(Boolean)}
const patterns=[
['POSSIBLE GASLIGHTING',/crazy|never happened|imagining things|too sensitive|making it up/i,'Language may deny memory, perception or emotional reality.'],
['POSSIBLE BLAME SHIFTING',/your fault|you made me|because of you|if you had not|would not have if/i,'Responsibility may be moved away from the behaviour being discussed.'],
['POSSIBLE GUILT OR PRESSURE',/after everything|if you loved me|you owe me|prove you|or else|everyone agrees/i,'Guilt, obligation or fear may be used to force agreement.'],
['POSSIBLE INVALIDATION',/get over it|calm down|not a big deal|overreacting|dramatic/i,'Feelings may be dismissed instead of the concern being addressed.'],
['POSSIBLE CONTROL',/you cannot|not allowed|do what i say|delete them|block them|permission/i,'Language may restrict contact, choices or independence.'],
['POSSIBLE DEFLECTION',/what about when you|but you always|this is about you|why are we talking about me/i,'The subject may be switched instead of answered.'],
['ESCALATION',/fuck you|shut up|hate you|threat|kill|hit|break|always|never/i,'The language may increase danger, contempt or emotional intensity.'],
['REPAIR ATTEMPT',/i am sorry|i hear you|i understand|can we talk|take responsibility|how can i fix/i,'The message may contain accountability, listening or repair.']
];
function localAnalysis(text){
 const ls=lines(text), speakers=new Map();
 ls.forEach(line=>{const m=line.match(/^([^:]{1,35}):\s*(.+)$/);if(m){if(!speakers.has(m[1]))speakers.set(m[1],[]);speakers.get(m[1]).push(m[2]);}});
 const found=patterns.filter(([,re])=>re.test(text));
 const focus=lens==='their-patterns'?'Focus requested: their possible red flags. This does not remove your part from the record.':lens==='my-patterns'?'Focus requested: your possible patterns and masks. This does not excuse the other person.':'Focus requested: both people without forced equal blame.';
 const speakerText=speakers.size?[...speakers].map(([n,v])=>n.toUpperCase()+': '+v.length+' attributed message(s).').join('\n'):'No reliable speaker labels were detected. Use “Name: message” to separate each side.';
 const findings=found.length?found.map(([name,re,why])=>{const evidence=ls.find(x=>re.test(x))||'';return name+'\n'+why+'\nEvidence marker: “'+evidence.slice(0,180)+'”';}).join('\n\n'):'No listed pattern phrase was detected. That is not proof the conversation is healthy or complete.';
 return 'RAD MIRROR / BROWSER MODE\n\n'+focus+'\n\nACCOUNT CHECK\n'+ls.length+' readable line(s) examined.\n\nSPEAKER MAP\n'+speakerText+'\n\nPOSSIBLE PATTERNS\n'+findings+'\n\nWHAT MAY BE MISSING\nWhat happened immediately before this exchange? What request was actually made? Which claim has independent evidence?\n\nYOUR CONTROLLABLE PART\nName your exact words, actions, timing and escalation without using their behaviour as permission.\n\nSAFEST NEXT STEP\nChoose one: clarify one fact, rewrite one message, pause contact, set one boundary, or wait until intensity drops below 5/10.\n\nThese are signals to inspect, not diagnoses or proof of intent.';
}
async function ollama(system,prompt){const model=$('ollamaModel').value.trim()||'gemma3:4b';const r=await fetch('http://localhost:11434/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({model,stream:false,messages:[{role:'system',content:system},{role:'user',content:prompt}]})});if(!r.ok)throw new Error('Could not reach Ollama. Confirm it is running and burkeonis.com is allowed in OLLAMA_ORIGINS.');const d=await r.json();return d.message?.content||'No response returned.'}
async function readScreenshot(){const f=$('radScreenshot').files[0];if(!f)return '';if(!window.Tesseract)throw new Error('Screenshot reader did not load.');$('radStatus').textContent='READING SCREENSHOT LOCALLY';const r=await window.Tesseract.recognize(f,'eng',{workerPath:'/assets/vendor/tesseract/worker.min.js',corePath:'/assets/vendor/tesseract/core',langPath:'/assets/vendor/tesseract/lang',workerBlobURL:false});return r.data.text.trim();}
$('radAnalyse').addEventListener('click',async()=>{try{$('radAnalyse').disabled=true;$('radStatus').textContent='READING / NOTHING IS SAVED';let text=$('radConversation').value.trim();const shot=await readScreenshot();if(shot)text+=(text?'\n\n':'')+shot;if(!text)throw new Error('Paste a conversation or add a screenshot first.');$('radAnalysis').textContent=mode==='ollama'?await ollama('You are RAD Mirror. Examine both people fairly. Identify possible communication patterns, evidence, inference, escalation, repair, missing context, the user’s controllable part, and the safest next step. Never diagnose or claim to know intent.',text):localAnalysis(text);$('radStatus').textContent=(mode==='ollama'?'OLLAMA':'BROWSER')+' ANALYSIS COMPLETE / NOTHING SAVED';}catch(e){$('radStatus').textContent=e.message;}finally{$('radAnalyse').disabled=false;}});
$('radClear').addEventListener('click',()=>{$('radConversation').value='';$('radScreenshot').value='';$('radAnalysis').textContent='Your analysis will appear here.';$('radStatus').textContent='CLEARED / NOTHING IS SAVED';});
function safeRewrite(){const raw=$('rawMessage').value.trim().replace(/\s+/g,' '),feeling=$('radFeeling').value.trim(),need=$('radNeed').value.trim(),request=$('radRequest').value.trim();if(!raw)return '';let cleaned=raw.replace(/\b(always|never|everyone|nobody)\b/gi,'often').replace(/\b(fuck you|shut up)\b/gi,'').replace(/\s+/g,' ').trim();return ['I want to explain this clearly without attacking you. What I am trying to say is: '+cleaned,feeling&&'I feel '+feeling+'.',need&&'What I need is '+need+'.',request&&'My request is: '+request+'.','I want this addressed directly and respectfully.'].filter(Boolean).join('\n\n');}
$('radRewrite').addEventListener('click',async()=>{try{$('radRewrite').disabled=true;const raw=$('rawMessage').value.trim();if(!raw)throw new Error('Write the message first.');$('radRewriteOutput').textContent=mode==='ollama'?await ollama('Rewrite this message so it is calm, direct and safe. Preserve the meaning and boundary. Remove insults, threats, absolutes and mind reading. Return only the message.',raw+'\nFeeling: '+$('radFeeling').value+'\nNeed: '+$('radNeed').value+'\nRequest: '+$('radRequest').value):safeRewrite();}catch(e){$('radRewriteOutput').textContent=e.message;}finally{$('radRewrite').disabled=false;}});
$('radCopy').addEventListener('click',async()=>{const t=$('radRewriteOutput').textContent;if(t&&!t.startsWith('Your rewritten')){await navigator.clipboard.writeText(t);$('radCopy').textContent='COPIED';setTimeout(()=>$('radCopy').textContent='COPY RESULT',1200);}});
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;localStorage.setItem('rad_mode',mode);$('radModeStatus').textContent=(mode==='ollama'?'OLLAMA MODE / LOCAL MODEL':'BROWSER MODE / NOTHING IS SAVED');}));
mode=localStorage.getItem('rad_mode')==='ollama'?'ollama':'browser';$('radModeStatus').textContent=(mode==='ollama'?'OLLAMA MODE / LOCAL MODEL':'BROWSER MODE / NOTHING IS SAVED');
function tick(){seconds=Math.max(0,seconds-1);$('pauseSeconds').textContent=seconds;$('pausePhase').textContent=seconds===0?'PAUSE COMPLETE':seconds%11>=7?'BREATHE IN':seconds%11>=2?'BREATHE OUT':'HOLD';if(seconds===0)clearInterval(pauseTimer);}
function openPause(){seconds=60;$('pauseSeconds').textContent='60';$('pauseLayer').hidden=false;document.body.style.overflow='hidden';clearInterval(pauseTimer);pauseTimer=setInterval(tick,1000);$('pauseClose').focus();}
function closePause(){clearInterval(pauseTimer);$('pauseLayer').hidden=true;document.body.style.overflow='';$('pauseOpen').focus();}
$('pauseOpen').addEventListener('click',openPause);$('pauseClose').addEventListener('click',closePause);$('pauseWait').addEventListener('click',closePause);
$('pauseIntensity').addEventListener('input',e=>$('pauseIntensityValue').textContent=e.target.value);
$('pauseRewrite').addEventListener('click',()=>{const t=$('pauseDraft').value.trim();if(t)$('rawMessage').value=t;closePause();setTab('rewrite');$('rawMessage').focus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('pauseLayer').hidden)closePause();});
})();