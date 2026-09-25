(() => {
  'use strict';
  const input=document.getElementById('quickInput'), run=document.getElementById('quickRun'), result=document.getElementById('quickResult');
  if(!input||!run||!result)return;
  const pattern=document.getElementById('quickPattern'), callout=document.getElementById('quickCallout'), move=document.getElementById('quickMove');
  const deeper=document.getElementById('quickDeeper'), share=document.getElementById('quickShare'), full=document.getElementById('mirrorInput');
  const rules=[
    {name:'THE CHASER LOOP',rx:/check|reply|text|message|answer|respond|chase|reach out|call|waiting/i,call:'You may be looking for certainty from the same situation creating the uncertainty.',move:'Do not send the next message yet. Name what answer you are trying to force.'},
    {name:'THE EXIT LOOP',rx:/leave|done|over|walk away|break up|quit|end it/i,call:'Your words point toward leaving. Check whether your next behavior actually moves you away from the loop.',move:'Choose one observable boundary that matches what you said.'},
    {name:'THE RESCUER LOOP',rx:/fix|save|help them|take care|protect|rescue|need me/i,call:'Helping may be useful, but it can also keep you responsible for an outcome you do not control.',move:'Separate what is yours to do from what belongs to the other person.'},
    {name:'THE PROOF LOOP',rx:/prove|right|wrong|lie|lied|truth|evidence|believe me|understand/i,call:'You may be spending more energy proving your version than deciding what the evidence requires you to do next.',move:'Write one fact you can prove and one decision that does not require their agreement.'},
    {name:'THE RETURN LOOP',rx:/again|same|every time|keep|back together|went back|repeat/i,call:'Your sentence contains repetition language. That is a signal to compare this moment with what happened before.',move:'Name the earliest point where this cycle usually becomes predictable.'},
    {name:'THE CONTROL LOOP',rx:/make them|need them to|should|have to|force|control|won't let/i,call:'Part of the outcome you want may depend on another person behaving differently.',move:'Choose the next move that remains possible even if they do not change.'}
  ];
  const fallback={name:'THE UNCLEAR LOOP',call:'There is not enough evidence in one sentence to name a pattern confidently. That uncertainty matters.',move:'Add what happened, what you did next, and what has happened more than once.'};
  let last=null;
  function mirror(){
    const text=input.value.trim();
    if(text.length<12){input.focus();return;}
    const hit=rules.find(r=>r.rx.test(text))||fallback;
    last={...hit,text};
    pattern.textContent=hit.name; callout.textContent=hit.call; move.textContent=hit.move; result.hidden=false;
    try{
      const key='selfmirror.quick.v1', data=JSON.parse(localStorage.getItem(key)||'{"runs":[]}');
      data.runs=[{at:new Date().toISOString(),pattern:hit.name},...(data.runs||[])].slice(0,30);
      localStorage.setItem(key,JSON.stringify(data));
    }catch{}
  }
  run.addEventListener('click',mirror);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();mirror();}});
  deeper.addEventListener('click',()=>{
    if(last&&full){full.value=last.text;full.dispatchEvent(new Event('input',{bubbles:true}));}
    document.getElementById('reflect')?.scrollIntoView({behavior:'smooth',block:'start'}); full?.focus({preventScroll:true});
  });
  share.addEventListener('click',async()=>{
    if(!last)return;
    const text='SELF MIRROR — '+last.name+'\n\n'+last.call+'\n\nWhat loop are you in?\nburkeonis.com/self-mirror';
    try{
      if(navigator.share) await navigator.share({title:'My Self Mirror',text});
      else {await navigator.clipboard.writeText(text);share.textContent='COPIED';setTimeout(()=>share.textContent='SHARE RESULT',1500);}
    }catch{}
  });
})();