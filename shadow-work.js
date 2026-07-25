(() => {
  const STORAGE_KEY = 'burkeonis_shadow_first_descent_v1';
  const form = document.getElementById('descent-form');
  const saveState = document.getElementById('save-state');
  const completionState = document.getElementById('completion-state');
  const stages = [...document.querySelectorAll('.descent-stage')];
  const doorButtons = [...document.querySelectorAll('.shadow-door')];

  if (!form) return;

  function collectData() {
    const data = Object.fromEntries(new FormData(form).entries());
    data.threat = [...form.querySelectorAll('input[name="threat"]:checked')].map(input => input.value);
    data.defence = [...form.querySelectorAll('input[name="defence"]:checked')].map(input => input.value);
    data.updatedAt = new Date().toISOString();
    data.version = 1;
    return data;
  }

  function stageComplete(stage) {
    const textareas = [...stage.querySelectorAll('textarea')];
    const textFilled = textareas.length === 0 || textareas.some(field => field.value.trim().length > 0);
    const checkboxGroups = [...new Set([...stage.querySelectorAll('input[type="checkbox"]')].map(input => input.name))];
    const checksFilled = checkboxGroups.every(name => stage.querySelector(`input[name="${name}"]:checked`));
    const requiredDate = stage.querySelector('input[type="datetime-local"]');
    const dateFilled = !requiredDate || requiredDate.value;
    return textFilled && checksFilled && dateFilled;
  }

  function updateProgress() {
    const completed = stages.filter(stageComplete).length;
    completionState.textContent = `${completed} / ${stages.length} STAGES`;
    saveState.textContent = completed === 0 ? 'NOT STARTED' : completed === stages.length ? 'READY TO ACT' : 'IN PROGRESS';
  }

  function saveLocal(showConfirmation = false) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collectData()));
    if (showConfirmation) {
      saveState.textContent = 'SAVED LOCALLY';
      form.classList.add('save-flash');
      setTimeout(() => form.classList.remove('save-flash'), 750);
    }
  }

  function restore() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    if (!saved) return;

    Object.entries(saved).forEach(([name, value]) => {
      if (['threat', 'defence', 'updatedAt', 'version'].includes(name)) return;
      const field = form.elements.namedItem(name);
      if (field && typeof value === 'string') field.value = value;
    });

    ['threat', 'defence'].forEach(name => {
      const selected = Array.isArray(saved[name]) ? saved[name] : [];
      form.querySelectorAll(`input[name="${name}"]`).forEach(input => {
        input.checked = selected.includes(input.value);
      });
    });

    if (saved.selectedDoor) {
      doorButtons.forEach(button => button.classList.toggle('active', button.dataset.door === saved.selectedDoor));
    }
    updateProgress();
  }

  function exportCase() {
    const data = collectData();
    const date = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify({
      title: 'BURKEONIS // FIRST DESCENT CASE FILE',
      privacy: 'Exported by the user from local browser storage.',
      ...data
    }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `burkeonis-first-descent-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  doorButtons.forEach(button => {
    button.addEventListener('click', () => {
      doorButtons.forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      form.elements.selectedDoor.value = button.dataset.door;
      const eventField = form.elements.event;
      if (!eventField.value.trim()) eventField.placeholder = button.dataset.prompt;
      saveLocal();
      document.getElementById('first-descent').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => eventField.focus(), 450);
    });
  });

  form.addEventListener('input', () => {
    updateProgress();
    clearTimeout(window.burkeonisShadowSaveTimer);
    window.burkeonisShadowSaveTimer = setTimeout(() => saveLocal(false), 450);
  });

  document.getElementById('save-case').addEventListener('click', () => saveLocal(true));
  document.getElementById('export-case').addEventListener('click', exportCase);
  document.getElementById('print-case').addEventListener('click', () => window.print());
  document.getElementById('reset-case').addEventListener('click', () => {
    const confirmed = window.confirm('Erase this locally saved case file from this browser?');
    if (!confirmed) return;
    form.reset();
    localStorage.removeItem(STORAGE_KEY);
    doorButtons.forEach(button => button.classList.remove('active'));
    updateProgress();
    saveState.textContent = 'RESET COMPLETE';
  });

  restore();
  updateProgress();
})();