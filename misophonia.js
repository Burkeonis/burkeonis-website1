(()=>{
  'use strict';
  const KEY='burkeonis_misophonia_v1';
  const form=document.getElementById('miso-form');
  if(!form)return;

  const state=document.getElementById('miso-state');
  const copyState=document.getElementById('copy-state');
  const fields=[...form.querySelectorAll('textarea')];
  const setState=t=>{if(state)state.textContent=t;};

  const collect=()=>Object.fromEntries(fields.map(field=>[field.name,field.value]));

  const safeStorage={
    get(){try{return JSON.parse(localStorage.getItem(KEY)||'{}');}catch{return {}; }},
    set(data){try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch{return false;}},
    remove(){try{localStorage.removeItem(KEY);return true;}catch{return false;}}
  };

  const save=()=>{
    const ok=safeStorage.set(collect());
    setState(ok?'SAVED ON THIS DEVICE':'SAVE BLOCKED BY BROWSER');
    return ok;
  };

  const restored=safeStorage.get();
  fields.forEach(field=>{if(typeof restored[field.name]==='string')field.value=restored[field.name];});
  if(Object.values(restored).some(value=>typeof value==='string'&&value.trim()))setState('RESTORED');

  document.getElementById('miso-save')?.addEventListener('click',save);
  fields.forEach(field=>field.addEventListener('input',()=>setState('UNSAVED CHANGES')));

  document.getElementById('miso-clear')?.addEventListener('click',()=>{
    if(!window.confirm('Erase all saved misophonia notes from this browser?'))return;
    fields.forEach(field=>{field.value='';});
    safeStorage.remove();
    setState('ERASED');
  });

  document.getElementById('miso-print')?.addEventListener('click',()=>window.print());

  document.getElementById('miso-export')?.addEventListener('click',()=>{
    save();
    let text='BURKEONIS — MISOPHONIA TRIGGER MAP\n\n';
    fields.forEach(field=>{
      const label=field.closest('label');
      const heading=label?.childNodes?.[0]?.textContent?.trim()||field.name;
      text+=`${heading.toUpperCase()}\n${field.value||'[No response]'}\n\n`;
    });
    const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;
    link.download=`burkeonis-misophonia-trigger-map-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1500);
    setState('NOTES EXPORTED');
  });

  let remaining=90;
  let interval=null;
  let targetTime=0;
  const display=document.getElementById('timer');
  const toggle=document.getElementById('timer-toggle');
  const render=()=>{if(display)display.textContent=`${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;};
  const stop=label=>{if(interval)window.clearInterval(interval);interval=null;if(toggle)toggle.textContent=label;};
  const tick=()=>{
    remaining=Math.max(0,Math.ceil((targetTime-Date.now())/1000));
    render();
    if(remaining===0)stop('COMPLETE');
  };

  toggle?.addEventListener('click',()=>{
    if(interval){tick();stop('RESUME');return;}
    if(remaining<=0){remaining=90;render();}
    targetTime=Date.now()+remaining*1000;
    toggle.textContent='PAUSE';
    interval=window.setInterval(tick,250);
  });

  document.getElementById('timer-reset')?.addEventListener('click',()=>{
    stop('START 90 SECONDS');
    remaining=90;
    render();
  });

  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&interval)tick();});

  document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
    const text=button.dataset.copy||'';
    try{
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      if(copyState)copyState.textContent='BOUNDARY COPIED';
    }catch{
      if(copyState)copyState.textContent=text;
    }
  }));

  render();
})();