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
      body: 'The deepest Burkeonis mode. It does not stop at what happened. It exposes the identity being protected, the private contract underneath the pattern, the payoff of staying stuck, and the truth that would destroy the excuse.',
      use: 'BEST FOR: the pattern you understand but still repeat, the pain you defend, and the truth you keep negotiating around.',
    },
    builder: {
      title: 'BUILDER',
      body: 'Use this after the truth is visible. It turns insight into one boundary, repair, system, or measurable next action instead of another promise.',
      use: 'BEST FOR: decisions, repair plans, boundaries, habits, goals, and proving change through action.',
    },
    bullshit: {
      title: 'BULLSHIT DETECTOR',
      body: 'Use this to test a claim, promise, argument, sales pitch, relationship story, or your own excuse. It separates evidence from conviction and makes missing information visible.',
      use: 'BEST FOR: manipulation signals, promises, red flags, conflicting accounts, scams, excuses, and self-deception.',
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
  const heading = { mirror: 'MIRROR', mediator: 'MEDIATOR', abyss: 'ABYSS', builder: 'BUILDER', bullshit: 'BULLSHIT DETECTOR' };
  function renderReflection(reflection) {
    const list = (items) => items.length ? items.map(({ point, quote, source }) =>
      `• ${point}\n  EVIDENCE (${source}): “${quote}”`).join('\n\n') : 'No supported finding in the supplied account.';
    return `${heading[mode]} MODE

WHAT YOU BROUGHT IN
${list(reflection.summary)}

WHAT THE MATERIAL SUPPORTS
${list(reflection.observations)}

WHAT IS INTERPRETATION
${list(reflection.interpretations)}

WHAT IS STILL MISSING
${reflection.missing.length ? reflection.missing.map((item) => `• ${item}`).join('\n') : 'No specific missing detail identified.'}

ONE MOVE
${reflection.nextMove}

Evidence quotes are excerpts from your supplied account, not independent verification.`;
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
    const processButton = document.getElementById('processFilesBtn');
    const analyzeButton = document.getElementById('analyzeBtn');
    processButton.disabled = true;
    analyzeButton.disabled = true;
    progressWrap.hidden = false;
    progressBar.style.width = '0%';
    const blocks = [];
    const failures = [];
    try {
      for (let index = 0; index < queuedFiles.length; index += 1) {
        try {
          const text = await extractFile(queuedFiles[index], index, queuedFiles.length);
          if (text) blocks.push(`--- SOURCE ${index + 1}: ${queuedFiles[index].name} ---\n${text}`);
          else failures.push(queuedFiles[index].name);
        } catch (error) {
          console.error(`Could not read ${queuedFiles[index].name}.`, error);
          failures.push(queuedFiles[index].name);
        }
      }
      const rawCombined = blocks.join('\n\n');
      const remainingCapacity = Math.max(0, MAX_IMPORTED_CHARS - input.value.trim().length - 2);
      const truncated = rawCombined.length > remainingCapacity;
      const combined = rawCombined.slice(0, remainingCapacity);
      if (!combined) {
        status.textContent = remainingCapacity === 0 ? 'TEXT LIMIT REACHED / CLEAR OR SHORTEN THE ACCOUNT BEFORE IMPORTING FILES' : 'NO READABLE TEXT FOUND / TRY CLEARER SCREENSHOTS';
        return;
      }
      input.value = input.value.trim() ? `${input.value.trim()}\n\n${combined}` : combined;
      progressBar.style.width = '100%';
      const words = combined.split(/\s+/).filter(Boolean).length;
      status.textContent = `${blocks.length} OF ${queuedFiles.length} FILES READ / ${words} WORDS EXTRACTED${failures.length ? ` / ${failures.length} NEED REVIEW` : ''}${truncated ? ' / TEXT LIMIT REACHED: CONTENT WAS TRUNCATED' : ''}`;
      window.setTimeout(() => {
        progressWrap.hidden = true;
      }, 900);
    } catch (error) {
      console.error('Local file processing failed.', error);
      status.textContent = 'LOCAL FILE READING FAILED. TRY FEWER OR CLEARER FILES.';
      progressWrap.hidden = true;
    } finally {
      processButton.disabled = false;
      analyzeButton.disabled = false;
    }
  });

  document.getElementById('removeAllBtn').addEventListener('click', () => {
    queuedFiles = [];
    renderFiles();
    status.textContent = 'FILE QUEUE CLEARED / NOTHING WAS SAVED';
  });

  document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const text = input.value.trim();
    if (text.length < 40 || text.length > 16000) {
      status.textContent = 'ENTER 40 TO 16,000 CHARACTERS OF FACTS, WORDS, ACTIONS, AND CONTEXT.';
      return;
    }
    const button = document.getElementById('analyzeBtn');
    button.disabled = true;
    status.textContent = 'REFLECTING / CHECKING EVIDENCE';
    try {
      const response = await fetch('/api/self-mirror/reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'AI reflection unavailable.');
      output.textContent = renderReflection(data.reflection);
      status.textContent = `${modeCopy[mode].title} COMPLETE / AI ANALYSIS / SOURCE QUOTES CHECKED / NOT SAVED`;
      document.dispatchEvent(new CustomEvent('self-mirror:reflection-complete', { detail: { text, result: output.textContent } }));
      output.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      status.textContent = 'REFLECTION UNAVAILABLE / NO ANALYSIS GENERATED';
      output.textContent = error instanceof Error ? error.message : 'Could not generate a verified reflection.';
    } finally {
      button.disabled = false;
    }
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
