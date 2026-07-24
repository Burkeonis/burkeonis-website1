(() => {
  const KEY = 'burkeonis_no_last_words_v1';
  const form = document.getElementById('nlw-form');
  if (!form) return;
  const steps = [...document.querySelectorAll('.nlw-step')];
  const state = document.getElementById('nlw-save-state');
  const progressText = document.getElementById('nlw-progress-text');
  const progressBar = document.getElementById('nlw-progress-bar');
  const audio = document.getElementById('nlw-audio');
  const audioStatus = document.getElementById('audio-status');
  let timer;

  const collect = () => ({
    title: 'BURKEONIS // NO LAST WORDS // UNFINISHED CONVERSATION',
    version: 1,
    updatedAt: new Date().toISOString(),
    entries: Object.fromEntries(new FormData(form).entries())
  });

  function updateProgress() {
    let complete = 0;
    steps.forEach(step => {
      const fields = [...step.querySelectorAll('textarea')];
      const done = fields.some(field => field.value.trim().length > 0);
      step.classList.toggle('complete', done);
      if (done) complete += 1;
    });
    const percent = Math.round((complete / steps.length) * 100);
    progressText.textContent = `${complete} / ${steps.length} COMPLETE`;
    progressBar.style.width = `${percent}%`;
    if (complete === 0) state.textContent = 'NOT STARTED';
    else if (complete === steps.length) state.textContent = 'LETTER COMPLETE';
    else state.textContent = 'IN PROGRESS';
  }

  function save(show = false) {
    try {
      localStorage.setItem(KEY, JSON.stringify(collect()));
      if (show) {
        state.textContent = 'SAVED ON THIS DEVICE';
        form.classList.add('save-flash');
        setTimeout(() => form.classList.remove('save-flash'), 650);
      }
    } catch {
      state.textContent = 'SAVE BLOCKED BY BROWSER';
    }
  }

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!saved?.entries) return;
      Object.entries(saved.entries).forEach(([name, value]) => {
        const field = form.elements.namedItem(name);
        if (field && typeof value === 'string') field.value = value;
      });
    } catch {
      localStorage.removeItem(KEY);
    }
  }

  function makeLetter(data) {
    const e = data.entries;
    return `NO LAST WORDS\nA private unfinished-conversation letter\nExported ${new Date(data.updatedAt).toLocaleString()}\n\nWHAT HAPPENED\n${e.loss || ''}\n\nWHAT STILL FEELS IMPOSSIBLE\n${e.acceptance || ''}\n\nTHE LAST REAL MOMENT\n${e.lastMoment || ''}\n\nWHAT I WISH I UNDERSTOOD\n${e.understood || ''}\n\nWHAT NEVER GOT SAID\n${e.unsaid || ''}\n\nWHAT I AM ANGRY ABOUT\n${e.anger || ''}\n\nWHAT I KEEP PUNISHING MYSELF FOR\n${e.guilt || ''}\n\nWHAT I THINK YOU WOULD SAY\n${e.reply || ''}\n\nWHAT STILL LIVES THROUGH ME\n${e.legacy || ''}\n\nHOW I WILL REMEMBER YOU\n${e.act || ''}\n\nCreated privately through BURKEONIS // No Last Words.`;
  }

  function exportLetter() {
    const data = collect();
    const blob = new Blob([makeLetter(data)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `no-last-words-letter-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    save(false);
    state.textContent = 'LETTER EXPORTED';
  }

  form.addEventListener('input', () => {
    updateProgress();
    clearTimeout(timer);
    timer = setTimeout(() => save(false), 450);
  });
  document.getElementById('nlw-save').addEventListener('click', () => save(true));
  document.getElementById('nlw-export').addEventListener('click', exportLetter);
  document.getElementById('nlw-print').addEventListener('click', () => window.print());
  document.getElementById('nlw-reset').addEventListener('click', () => {
    if (!window.confirm('Erase the No Last Words writing saved in this browser?')) return;
    form.reset();
    localStorage.removeItem(KEY);
    updateProgress();
    state.textContent = 'ERASED';
  });

  if (audio) {
    audio.addEventListener('canplay', () => { audioStatus.textContent = 'WEB MASTER READY'; });
    audio.addEventListener('error', () => { audioStatus.textContent = 'AUDIO DEPLOYMENT PENDING'; });
  }

  restore();
  updateProgress();
})();