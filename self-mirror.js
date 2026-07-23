(() => {
  'use strict';

  const MAX_FILES = 10;
  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_IMPORTED_CHARS = 100000;
  const OCR_OPTIONS = Object.freeze({
    workerPath: '/assets/vendor/tesseract/worker.min.js',
    corePath: '/assets/vendor/tesseract/core',
    langPath: '/assets/vendor/tesseract/lang',
    workerBlobURL: false,
  });

  let mode = 'mirror';
  let queuedFiles = [];
  const previewUrls = new Set();

  const modeCopy = {
    mirror: {
      title: 'MIRROR',
      body: 'Use this when you want the gap between your words, actions, standards, and excuses exposed. It focuses on contradictions, ownership, and the next decision.',
      use: 'BEST FOR: personal accountability, repeated patterns, mixed signals, avoidance.',
    },
    mediator: {
      title: 'MEDIATOR',
      body: 'Use this for conflict. It separates facts from assumptions, shows where escalation happened, and examines every side without declaring a winner.',
      use: 'BEST FOR: arguments, relationship conflict, texts, misunderstandings, repair.',
    },
    abyss: {
      title: 'ABYSS',
      body: 'Use this when the surface story is not enough. It looks underneath anger, obsession, shutdown, control, fear, and the payoff of staying stuck.',
      use: 'BEST FOR: deep patterns, hidden fear, self-sabotage, identity conflict, compulsive loops.',
    },
  };

  const input = document.getElementById('mirrorInput');
  const output = document.getElementById('mirrorOutput');
  const status = document.getElementById('status');
  const fileInput = document.getElementById('conversationFiles');
  const fileList = document.getElementById('fileList');
  const fileControls = document.getElementById('fileControls');
  const progressWrap = document.getElementById('uploadProgress');
  const progressBar = progressWrap.querySelector('span');
  const uploadZone = document.getElementById('uploadZone');
  const modeExplainer = document.getElementById('modeExplainer');
  const readableTextTypes = ['text/plain', 'text/markdown', 'application/json', 'text/csv'];
  const sentences = (text) => text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);

  function setMode(next) {
    if (!Object.hasOwn(modeCopy, next)) return;
    mode = next;
    document.querySelectorAll('.mode-btn').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const info = modeCopy[mode];
    modeExplainer.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = info.title;
    const body = document.createElement('p');
    body.textContent = info.body;
    const use = document.createElement('span');
    use.className = 'mode-use';
    use.textContent = info.use;
    modeExplainer.append(title, body, use);
    status.textContent = `${info.title} MODE SELECTED / READY / NOTHING IS SAVED`;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  function revokePreviewUrls() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.clear();
  }

  function renderFiles() {
    revokePreviewUrls();
    fileList.replaceChildren();
    queuedFiles.forEach((file, index) => {
      const row = document.createElement('div');
      row.className = 'file-item';
      let visual;
      if (file.type.startsWith('image/')) {
        visual = document.createElement('img');
        visual.className = 'file-thumb';
        visual.alt = '';
        const previewUrl = URL.createObjectURL(file);
        previewUrls.add(previewUrl);
        visual.src = previewUrl;
      } else {
        visual = document.createElement('div');
        visual.className = 'file-icon';
        visual.textContent = 'FILE';
      }
      const meta = document.createElement('div');
      meta.className = 'file-meta';
      const name = document.createElement('strong');
      name.textContent = file.name;
      const details = document.createElement('small');
      details.textContent = `${file.type || 'unknown type'} / ${formatBytes(file.size)}`;
      meta.append(name, details);
      const remove = document.createElement('button');
      remove.className = 'file-remove';
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${file.name}`);
      remove.textContent = '×';
      remove.addEventListener('click', () => {
        queuedFiles.splice(index, 1);
        renderFiles();
      });
      row.append(visual, meta, remove);
      fileList.appendChild(row);
    });
    fileControls.hidden = !queuedFiles.length;
  }

  function addFiles(files) {
    const incoming = [...files];
    const allowed = incoming.filter((file) => (
      file.size <= MAX_FILE_BYTES
      && (
        ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        || readableTextTypes.includes(file.type)
        || /\.(txt|md|json|csv|log)$/i.test(file.name)
      )
    ));
    const existing = new Set(queuedFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
    allowed.forEach((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      if (!existing.has(key) && queuedFiles.length < MAX_FILES) {
        queuedFiles.push(file);
        existing.add(key);
      }
    });
    renderFiles();
    status.textContent = `${queuedFiles.length} FILE${queuedFiles.length === 1 ? '' : 'S'} READY / MAX 10 FILES, 5 MB EACH / NOTHING IS SAVED`;
  }

  async function extractFile(file, index, total) {
    status.textContent = `READING ${index + 1} OF ${total}: ${file.name} / PROCESSING LOCALLY`;
    progressBar.style.width = `${Math.round((index / total) * 100)}%`;
    if (file.type.startsWith('image/')) {
      if (!window.Tesseract) throw new Error('OCR library did not load.');
      const result = await window.Tesseract.recognize(file, 'eng', {
        ...OCR_OPTIONS,
        logger(message) {
          if (message.status === 'recognizing text') {
            progressBar.style.width = `${Math.round(((index + (message.progress || 0)) / total) * 100)}%`;
          }
        },
      });
      return result.data.text.trim();
    }
    return (await file.text()).slice(0, MAX_IMPORTED_CHARS).trim();
  }

  function build(text) {
    const lines = sentences(text);
    const absolutes = text.match(/\b(always|never|everyone|nobody|everything|nothing|every time)\b/gi) || [];
    const blame = text.match(/\b(made me|forced me|because of them|their fault|had no choice)\b/gi) || [];
    const uncertainty = text.match(/\b(maybe|probably|I think|I guess|seems|must have)\b/gi) || [];
    const ownership = text.match(/\b(I said|I did|I chose|I lied|I avoided|I ignored|I threatened|I left|I stayed)\b/gi) || [];
    const fact = lines[0] || text.slice(0, 180);
    if (mode === 'mediator') {
      return `MEDIATOR MODE\n\nOBSERVABLE FACT\n${fact}\n\nASSUMPTIONS\n${uncertainty.length ? `Your account contains ${uncertainty.length} uncertainty marker(s). Those are interpretations, not proven facts.` : 'Separate what was seen or said from what you concluded.'}\n\nESCALATION\nName the first action that changed this from disagreement into conflict. Then name your contribution after that point.\n\nUNMET INTEREST\nWhat was each person actually trying to protect?\n\nNEXT STEP\nState one boundary or repair attempt without threat, punishment, insult, or mind-reading.`;
    }
    if (mode === 'abyss') {
      return `ABYSS MODE\n\nSURFACE STORY\n${fact}\n\nDEFENCE DETECTED\n${blame.length ? `External-control language appeared ${blame.length} time(s). Pressure can explain behaviour. It does not erase choice.` : 'The clean version of the story may be protecting you from the part that costs pride.'}\n\nTHE FEAR UNDER IT\nWhat becomes true about you if the other person never admits you were right?\n\nTHE PAYOFF\nWhat does staying angry, numb, obsessed, busy, high, or confused let you postpone?\n\nTHE COST\nWhat has this pattern already taken?\n\nONE CUT\nName the behaviour you will stop today.`;
    }
    return `MIRROR MODE\n\nWHAT YOU SAID HAPPENED\n${fact}\n\nLANGUAGE FLAGS\n${absolutes.length ? `Absolute language appeared ${absolutes.length} time(s): ${[...new Set(absolutes.map((item) => item.toLowerCase()))].join(', ')}.` : 'No obvious absolute language detected.'}\n\nOWNERSHIP CHECK\n${ownership.length ? `You named at least ${ownership.length} action(s) as your own.` : 'Your account says more about what happened to you than what you chose. Add your exact words and actions.'}\n\nEVIDENCE VS STORY\nSeparate what could be recorded from what you believe it meant.\n\nCONTRADICTION\nWhat standard are you demanding from someone else that your own behaviour did not meet?\n\nNEXT DECISION\nChoose one action: repair, enforce a boundary, leave, or stop feeding the loop.`;
  }

  fileInput.addEventListener('change', (event) => {
    addFiles(event.target.files);
    fileInput.value = '';
  });
  ['dragenter', 'dragover'].forEach((type) => uploadZone.addEventListener(type, (event) => {
    event.preventDefault();
    uploadZone.classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach((type) => uploadZone.addEventListener(type, (event) => {
    event.preventDefault();
    uploadZone.classList.remove('dragging');
  }));
  uploadZone.addEventListener('drop', (event) => addFiles(event.dataTransfer.files));

  document.querySelectorAll('.mode-btn').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  document.getElementById('processFilesBtn').addEventListener('click', async () => {
    if (!queuedFiles.length) return;
    progressWrap.hidden = false;
    progressBar.style.width = '0%';
    const blocks = [];
    try {
      for (let index = 0; index < queuedFiles.length; index += 1) {
        const text = await extractFile(queuedFiles[index], index, queuedFiles.length);
        if (text) blocks.push(`--- SOURCE ${index + 1}: ${queuedFiles[index].name} ---\n${text}`);
      }
      const combined = blocks.join('\n\n').slice(0, MAX_IMPORTED_CHARS);
      if (!combined) {
        status.textContent = 'NO READABLE TEXT FOUND. TRY CLEARER SCREENSHOTS.';
        return;
      }
      input.value = input.value.trim() ? `${input.value.trim()}\n\n${combined}` : combined;
      progressBar.style.width = '100%';
      status.textContent = `${queuedFiles.length} FILE${queuedFiles.length === 1 ? '' : 'S'} READ LOCALLY / REVIEW THEN RUN ${modeCopy[mode].title}`;
      window.setTimeout(() => {
        progressWrap.hidden = true;
      }, 900);
    } catch (error) {
      console.error('Local file processing failed.', error);
      status.textContent = 'LOCAL FILE READING FAILED. TRY FEWER OR CLEARER FILES.';
      progressWrap.hidden = true;
    }
  });

  document.getElementById('removeAllBtn').addEventListener('click', () => {
    queuedFiles = [];
    renderFiles();
    status.textContent = 'FILE QUEUE CLEARED / NOTHING WAS SAVED';
  });

  document.getElementById('analyzeBtn').addEventListener('click', () => {
    const text = input.value.trim().slice(0, MAX_IMPORTED_CHARS);
    if (text.length < 40) {
      status.textContent = 'ADD MORE DETAIL: FACTS, WORDS, ACTIONS, AND WHAT HAPPENED NEXT.';
      return;
    }
    output.textContent = build(text);
    status.textContent = `${modeCopy[mode].title} COMPLETE / NOT SAVED`;
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    input.value = '';
    output.textContent = 'Your reflection will appear here.\n\nStart with facts. The mirror cannot expose what you deliberately keep outside the frame.';
    queuedFiles = [];
    renderFiles();
    status.textContent = 'CLEARED / NOTHING RETAINED';
  });

  document.getElementById('copyBtn').addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.textContent);
    status.textContent = 'RESULT COPIED / NOT SAVED';
  });

  window.addEventListener('beforeunload', revokePreviewUrls);
  try {
    localStorage.removeItem('selfMirrorHistory');
  } catch {
    // Storage can be unavailable in hardened browser modes.
  }
  setMode('mirror');
})();
