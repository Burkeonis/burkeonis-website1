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
  const sentences = (text) => text.split(/(?<=[.!?])\s+/).map((sentence) => sentence.trim()).filter(Boolean);

  function buildMediator(text) {
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const speakerMap = new Map();
    const quotes = [];
    const assumptions = [];
    const escalations = [];
    lines.forEach((line) => {
      const speakerMatch = line.match(/^([A-Za-z][A-Za-z0-9 _-]{0,38})\s*:\s*(.+)$/);
      if (speakerMatch) {
        const speaker = speakerMatch[1].trim();
        const words = speakerMatch[2].trim();
        if (!speakerMap.has(speaker)) speakerMap.set(speaker, []);
        speakerMap.get(speaker).push(words);
        quotes.push(`${speaker}: “${words.slice(0, 180)}”`);
      }
      if (/\b(maybe|probably|i think|i guess|obviously|clearly|must have|they wanted|they meant)\b/i.test(line)) assumptions.push(line);
      if (/\b(yell|scream|threat|block|insult|lie|lied|leave|left|fuck you|shut up|always|never)\b/i.test(line)) escalations.push(line);
    });
    const speakers = [...speakerMap.entries()];
    const contribution = speakers.length
      ? speakers.map(([speaker, messages]) => `${speaker.toUpperCase()}\n- ${messages.length} attributed message(s)\n- What they directly said: ${messages.slice(0, 2).map((item) => `“${item.slice(0, 140)}”`).join(' / ')}`).join('\n\n')
      : 'No reliable speaker labels were detected. Label transcript lines as “Name: message” to separate contributions.';
    return `MEDIATOR MODE

EVIDENCE RECEIVED
${lines.length} non-empty line(s) were examined from the combined account and uploaded evidence.
${speakers.length} explicitly labelled speaker(s) detected.

DIRECTLY ATTRIBUTED MATERIAL
${quotes.length ? quotes.slice(0, 10).join('\n') : 'No direct speaker attribution detected. Do not assign statements to a person without labels or visible evidence.'}

EACH SIDE’S CONTRIBUTION
${contribution}

INTERPRETATION MARKERS
${assumptions.length ? `${assumptions.length} line(s) contain uncertainty, mind-reading, or interpretation. Example: ${assumptions[0].slice(0, 220)}` : 'No obvious interpretation markers detected. This does not make every statement proven.'}

ESCALATION EVIDENCE
${escalations.length ? `${escalations.length} possible escalation marker(s) detected. First marker: ${escalations[0].slice(0, 220)}` : 'No clear escalation marker detected in the supplied text.'}

WHAT IS STILL MISSING
What happened immediately before the first escalation? What exact request or boundary was made? What response followed? Which claim has independent evidence?

NO FALSE BALANCE
Both people can contribute differently. Do not force equal blame. Separate initiating harm, reaction, retaliation, repair attempts, and repeated behaviour.

NEXT MOVE
Write one neutral timeline using only observable actions. Then choose one: clarify, repair, set a boundary, pause contact, or end the loop.`;
  }

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
      return buildMediator(text);
    }
    if (mode === 'abyss') {
      return `ABYSS MODE

THE STORY YOU CAN ALREADY EXPLAIN
${fact}

THE PART YOUR STORY PROTECTS
${blame.length ? `External-control language appeared ${blame.length} time(s). What happened to you matters. It still cannot make your next choice for you.` : 'Your account may be accurate and still incomplete. Accuracy about their behaviour is not evidence that you have faced your own.'}

THE PRIVATE CONTRACT
Finish this without polishing it:
“As long as I can prove __________, I do not have to __________.”

THE IDENTITY AT RISK
Who would you have to stop being if this pattern ended—victim, rescuer, abandoned one, dangerous one, misunderstood one, needed one, or the only person who sees the truth?

THE PAYOFF
What does staying angry, numb, obsessed, high, confused, unavailable, or permanently betrayed let you avoid doing?

THE REHEARSAL
Where have you rebuilt this same emotional ending with different people, different details, and the same role for yourself?

THE CONTRADICTION
What do you say you want that your repeated choices are designed to prevent?

THE COST LEDGER
What has this pattern taken from your body, children, relationships, work, dignity, time, and future? Name only costs you can defend with evidence.

THE TRUTH THAT COLLAPSES THE EXCUSE
Write the sentence you would hate to hear from someone who knows the entire story—including your part.

THE LINE BETWEEN EXPLANATION AND PERMISSION
Your history may explain the reflex. It does not grant the reflex permanent authority.

ONE CUT
Name one behaviour that keeps the pattern alive. Stop feeding that behaviour for the next twenty-four hours and record what the pattern tries to make you do instead.`;
    }
    if (mode === 'builder') {
      return `BUILDER MODE\n\nTHE REAL PROBLEM\n${fact}\n\nWHAT IS IN YOUR CONTROL\nName the exact behaviour, decision, boundary, or environment you can change without waiting for anyone else.\n\nPROOF OF CHANGE\nChoose one action small enough to complete in the next 24 hours and concrete enough that another person could verify it happened.\n\nFRICTION\nWhat will make you avoid it, delay it, or replace it with another explanation?\n\nSYSTEM\nRemove one obstacle. Add one reminder. Name one consequence if you do not follow through.\n\nNEXT ACTION\nWrite the action as: I will [specific action] by [time] because [value], and I will record what happened.`;
    }
    if (mode === 'bullshit') {
      const promises = text.match(/\b(i promise|trust me|believe me|next time|soon|someday|i will change|never again|guarantee)\b/gi) || [];
      const urgency = text.match(/\b(now|immediately|last chance|act fast|today only|before it is too late|you have to)\b/gi) || [];
      const reversals = text.match(/\b(you made me|this is your fault|you are too sensitive|that never happened|i was only joking|after all i have done)\b/gi) || [];
      const evidence = text.match(/\b(text|email|photo|video|recording|receipt|statement|date|timestamp|witness|bank)\b/gi) || [];
      return `BULLSHIT DETECTOR

CLAIM UNDER TEST
${fact}

EVIDENCE
${evidence.length ? `${evidence.length} evidence reference(s) detected. Verify the actual files, dates, authorship, and full context.` : 'No obvious independent evidence reference detected. Conviction, memory, and repetition do not become proof by volume.'}

STORY ADDED TO THE EVIDENCE
Which motive, intention, diagnosis, or future outcome is being treated as established fact?

PATTERN
Does the behaviour repeat across time, people, or situations? One event can be serious. A pattern requires comparable data points.

PROMISE VS BEHAVIOUR
${promises.length ? `${promises.length} promise marker(s) detected. Compare every promise with the next observable action and its date.` : 'No obvious promise marker detected. Compare claims with behaviour anyway.'}

PRESSURE AND PERCEPTION CONTROL
${urgency.length ? `${urgency.length} urgency marker(s) detected.` : 'No obvious false-urgency marker detected.'}
${reversals.length ? `${reversals.length} possible blame-reversal or reality-control marker(s) detected. These are signals to inspect, not automatic proof of manipulation.` : 'No obvious blame-reversal phrase detected.'}

CONTRADICTION
What two claims, actions, dates, or standards cannot both be true?

MISSING INFORMATION
What document, complete conversation, timeline, independent source, or opposing account would materially change the conclusion?

DISCONFIRMING EVIDENCE
Name the strongest evidence against your current belief. If you cannot name any, bias may be choosing what counts.

SELF-BULLSHIT CHECK
What do you gain by believing your preferred version? What action would become unavoidable if the preferred version were false?

REALITY CHECK
Behaviour is stronger than promises. A repeated pattern is stronger than an isolated explanation. Missing evidence must remain missing.

VERDICT
Choose only one: SUPPORTED / PARTLY SUPPORTED / UNPROVEN / CONTRADICTED / NOT ENOUGH INFORMATION.

NEXT ACTION
Collect one missing fact, enforce one evidence-based boundary, or stop repeating a claim you cannot currently prove.`;
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
