(() => {
  'use strict';
  const selected = [];
  const symbols = document.getElementById('canvasSymbols');
  const ring = document.querySelector('.canvas-ring');
  const scale = document.getElementById('symbolScale');
  const rotation = document.getElementById('symbolRotation');
  const vault = document.getElementById('vaultList');
  const key = 'burkeonisSigilVaultV1';

  function draw() {
    symbols.textContent = selected.length ? selected.map((item) => item.symbol).join('') : 'SELECT SYMBOLS TO BEGIN';
    symbols.classList.toggle('canvas-placeholder', !selected.length);
    symbols.style.fontSize = `${scale.value}px`;
    symbols.style.transform = `rotate(${rotation.value}deg)`;
    ring.hidden = !document.getElementById('ringToggle').checked;
    document.getElementById('placementMark').textContent = selected.map((item) => item.symbol).join('') || 'ᛉ';
  }

  function saved() {
    try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
  }

  function renderVault() {
    const items = saved();
    vault.replaceChildren(...items.map((item) => {
      const article = document.createElement('article');
      const title = document.createElement('strong');
      title.textContent = item.symbols || 'UNTITLED MARK';
      const detail = document.createElement('p');
      detail.textContent = `${item.intention || 'No intention recorded'} / ${new Date(item.date).toLocaleDateString()}`;
      article.append(title, detail);
      return article;
    }));
  }

  document.querySelectorAll('.symbol-palette button').forEach((button) => button.addEventListener('click', () => {
    if (selected.length < 5) selected.push({ symbol: button.dataset.symbol, name: button.dataset.name });
    draw();
  }));
  [scale, rotation, document.getElementById('ringToggle')].forEach((control) => control.addEventListener('input', draw));
  document.getElementById('clearCanvas').addEventListener('click', () => { selected.length = 0; draw(); });
  document.getElementById('forgeButton').addEventListener('click', () => {
    const intention = document.getElementById('intention').value.trim();
    document.getElementById('logicOutput').textContent = intention
      ? `INTENTION: ${intention}\nUse the fewest symbols needed. Protect the silhouette. Meaning first, decoration second.`
      : 'Name what this mark must carry before choosing symbols.';
  });
  document.getElementById('saveDesign').addEventListener('click', () => {
    const items = saved();
    items.unshift({ symbols: selected.map((item) => item.symbol).join(''), intention: document.getElementById('intention').value.trim(), date: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(items.slice(0, 50)));
    renderVault();
  });
  document.getElementById('clearVault').addEventListener('click', () => {
    if (confirm('Erase every saved symbol concept from this browser?')) { localStorage.removeItem(key); renderVault(); }
  });
  document.getElementById('downloadSvg').addEventListener('click', () => {
    const mark = selected.map((item) => item.symbol).join('') || 'ᛉ';
    const circle = document.getElementById('ringToggle').checked ? '<circle cx="300" cy="300" r="210" fill="none" stroke="black" stroke-width="8"/>' : '';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="white"/>${circle}<text x="300" y="340" text-anchor="middle" font-size="${scale.value}" transform="rotate(${rotation.value} 300 300)">${mark}</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const link = document.createElement('a'); link.href = url; link.download = 'burkeonis-sigil-concept.svg'; link.click(); URL.revokeObjectURL(url);
  });
  document.getElementById('printStencil').addEventListener('click', () => window.print());
  document.getElementById('placement').addEventListener('change', (event) => { document.getElementById('placementCaption').textContent = `${event.target.value.toUpperCase()} / CHECK WITH YOUR ARTIST`; });
  draw();
  renderVault();
})();
