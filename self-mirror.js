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
  const sentences = (text) => text
    .replace(/^--- SOURCE[^\n]*---$/gim, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.replace(/\s+/g, ' ').trim())
    .filter((sentence) => sentence.length > 12);
  const clip = (value, limit = 240) => value.length > limit ? `${value.slice(0, limit).trim()}…` : value;
  const unique = (items) => [...new Set(items.map((item) => item.trim()).filter(Boolean))];

  function selectAcrossAccount(items, count = 6) {
    if (items.length <= count) return items;
    return unique(Array.from({ length: count }, (_, index) => String(Math.round(index * (items.length - 1) / (count - 1)))))
      .map(Number).map((index) => items[index]);
  }

  function collectMatches(items, pattern, limit = 5) {
    return unique(items.filter((item) => pattern.test(item))).slice(0, limit);
  }

  function analyzeAccount(text) {
    const allSentences = sentences(text);
    const sourceMatches = [...text.matchAll(/^--- SOURCE\s+\d+:\s*(.+?)\s*---$/gim)];
    const costMap = [
      ['TRUST', /\btrust|lie|lied|betray|honest/i], ['HOME', /\bhome|house|room|mess|chaos|belonging|stuff|moved/i],
      ['RELATIONSHIP', /\brelationship|partner|girlfriend|boyfriend|wife|husband|stranger|love|intimacy/i],
      ['FAMILY', /\bchild|children|kid|son|daughter|family/i], ['HEALTH', /\bhealth|sleep|body|drug|high|sober|pain|anxiety/i],
      ['MONEY', /\bmoney|rent|bill|paid|cost|debt|buy|bought/i], ['WORK', /\bwork|job|business|client|career/i],
      ['TIME', /\btime|hour|day|week|month|year|future/i],
    ];
    return {
      allSentences,
      representative: selectAcrossAccount(allSentences),
      evidence: collectMatches(allSentences, /\b(said|wrote|texted|sent|called|left|moved|paid|bought|took|gave|record|photo|video|receipt|date|timestamp|message|screenshot)\b/i, 6),
      interpretations: collectMatches(allSentences, /\b(i think|i feel like|probably|maybe|obviously|clearly|must|wanted to|meant to|doesn't care|does not care|on purpose|trying to)\b/i),
      ownership: collectMatches(allSentences, /\b(i said|i did|i chose|i lied|i avoided|i ignored|i threatened|i left|i stayed|i took|i yelled|i screamed|i refused|i kept)\b/i),
      needs: collectMatches(allSentences, /\b(i need|i want|i asked|i expect|boundary|respect|trust|safe|space|order|honest|love)\b/i),
      escalation: collectMatches(allSentences, /\b(yell|scream|threat|insult|block|fight|rage|hit|push|break|fuck you|shut up|always|never)\b/i),
      costs: costMap.filter(([, pattern]) => pattern.test(text)).map(([label]) => label),
      wordCount: text.trim().split(/\s+/).filter(Boolean).length,
      charCount: text.length,
      sources: sourceMatches.map((match) => match[1].trim()),
    };
  }

  function bulletList(items, fallback, limit = 5) {
    return items.length ? items.slice(0, limit).map((item) => `• ${clip(item)}`).join('\n') : fallback;
  }

  const accountSummary = (analysis) => bulletList(analysis.representative, 'Not enough readable material was found to summarize the account.', 6);

  function buildMediator(text, analysis) {
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

FULL ACCOUNT CHECK
${analysis.wordCount} words / ${analysis.charCount} characters / ${analysis.allSentences.length} readable statements examined.
${analysis.sources.length ? `${analysis.sources.length} uploaded source(s): ${analysis.sources.join(', ')}` : 'No labelled uploaded sources. The written account was examined in full.'}
${speakers.length} explicitly labelled speaker(s) detected.

WHAT YOU BROUGHT IN
${accountSummary(analysis)}

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

YOUR CONTROLLABLE PART
${bulletList(analysis.ownership, 'Your exact words and actions are not clearly named. Add them before assigning a complete pattern.', 4)}

ONE MOVE
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
    status.textContent = `${info.title} MODE SELECTED / READY / YOUR CONTENT IS NOT SAVED`;
    window.dispatchEvent(new CustomEvent('selfmirror:modechange'));
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
    const rejected = incoming.length - allowed.length;
    const acceptedKeys = new Set(queuedFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`));
    const notQueued = allowed.filter((file) => !acceptedKeys.has(`${file.name}-${file.size}-${file.lastModified}`)).length;
    const issues = [
      rejected ? `${rejected} UNSUPPORTED OR OVER 5 MB` : '',
      notQueued ? `${notQueued} OVER THE 10-FILE LIMIT` : '',
    ].filter(Boolean);
    status.textContent = `${queuedFiles.length} FILE${queuedFiles.length === 1 ? '' : 'S'} READY / MAX 10 FILES, 5 MB EACH${issues.length ? ` / ${issues.join(' / ')}` : ''} / YOUR CONTENT IS NOT SAVED`;
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
    const analysis = analyzeAccount(text);
    const absolutes = text.match(/\b(always|never|everyone|nobody|everything|nothing|every time)\b/gi) || [];
    const blame = text.match(/\b(made me|forced me|because of them|their fault|had no choice)\b/gi) || [];
    if (mode === 'mediator') {
      return buildMediator(text, analysis);
    }
    if (mode === 'abyss') {
      return `ABYSS MODE

FULL ACCOUNT CHECK
${analysis.wordCount} words / ${analysis.charCount} characters / ${analysis.allSentences.length} readable statements examined.
${analysis.sources.length ? `${analysis.sources.length} uploaded source(s) included.` : 'Written account examined in full.'}

WHAT YOU BROUGHT IN
${accountSummary(analysis)}

WHAT THE MATERIAL SUPPORTS
${bulletList(analysis.evidence, 'The account contains claims but little independently checkable evidence. That limits certainty; it does not automatically make the account false.')}

WHAT IS INTERPRETATION
${bulletList(analysis.interpretations, 'No obvious motive claims were detected. Missing context still remains missing.', 4)}

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
${analysis.needs.length ? `You say you need or value:\n${bulletList(analysis.needs, '', 3)}\nWhich repeated choice makes that outcome less likely?` : 'What do you say you want that your repeated choices are designed to prevent?'}

THE COST LEDGER
${analysis.costs.length ? `The account points to possible costs involving: ${analysis.costs.join(', ')}. Name only the costs you can defend with evidence.` : 'Name what this pattern has taken using only costs you can defend with evidence.'}

THE TRUTH THAT COLLAPSES THE EXCUSE
Write the sentence you would hate to hear from someone who knows the entire story—including your part.

THE LINE BETWEEN EXPLANATION AND PERMISSION
Your history may explain the reflex. It does not grant the reflex permanent authority.

ONE CUT
${analysis.escalation.length ? `First visible escalation marker: ${clip(analysis.escalation[0])}\nStop feeding one escalation behaviour for twenty-four hours and record what the pattern tries to make you do instead.` : 'Name one observable behaviour that keeps the pattern alive. Stop it for twenty-four hours and record the pull to repeat it.'}`;
    }
    if (mode === 'builder') {
      return `BUILDER MODE\n\nFULL ACCOUNT CHECK\n${analysis.wordCount} words / ${analysis.allSentences.length} readable statements examined.\n\nWHAT YOU BROUGHT IN\n${accountSummary(analysis)}\n\nTHE REAL PROBLEM\nThe account points to ${analysis.costs.length ? analysis.costs.join(', ').toLowerCase() : 'a repeated situation without one clearly defined target'}. Choose one problem; do not build a plan for the entire history at once.\n\nWHAT IS IN YOUR CONTROL\n${bulletList(analysis.ownership, 'Your own observable actions are not clearly named. Name one before building the plan.', 4)}\n\nDESIRED OUTCOME\n${bulletList(analysis.needs, 'State what a successful result would look like in observable terms.', 3)}\n\nPROOF OF CHANGE\nChoose one action small enough to complete in the next 24 hours and concrete enough that another person could verify it happened.\n\nFRICTION\nWhat will make you avoid it, delay it, or replace it with another explanation?\n\nSYSTEM\nRemove one obstacle. Add one reminder. Name one consequence if you do not follow through.\n\nNEXT ACTION\nI will [specific action] by [time]. I will prove it by [visible evidence].`;
    }
    if (mode === 'bullshit') {
      const promises = text.match(/\b(i promise|trust me|believe me|next time|soon|someday|i will change|never again|guarantee)\b/gi) || [];
      const urgency = text.match(/\b(now|immediately|last chance|act fast|today only|before it is too late|you have to)\b/gi) || [];
      const reversals = text.match(/\b(you made me|this is your fault|you are too sensitive|that never happened|i was only joking|after all i have done)\b/gi) || [];
      const evidence = text.match(/\b(text|email|photo|video|recording|receipt|statement|date|timestamp|witness|bank)\b/gi) || [];
      return `BULLSHIT DETECTOR

FULL ACCOUNT CHECK
${analysis.wordCount} words / ${analysis.allSentences.length} readable statements / ${analysis.sources.length} uploaded source(s) examined.

ACCOUNT SNAPSHOT
${accountSummary(analysis)}

CLAIMS UNDER TEST
${bulletList(analysis.interpretations.length ? analysis.interpretations : analysis.representative, 'No clear claim was detected.')}

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
    return `MIRROR MODE\n\nFULL ACCOUNT CHECK\n${analysis.wordCount} words / ${analysis.charCount} characters / ${analysis.allSentences.length} readable statements examined.\n${analysis.sources.length ? `${analysis.sources.length} uploaded source(s) included.` : 'Written account examined in full.'}\n\nWHAT YOU BROUGHT IN\n${accountSummary(analysis)}\n\nWHAT THE MATERIAL SUPPORTS\n${bulletList(analysis.evidence, 'The account mainly provides personal description rather than independently checkable evidence.')}\n\nWHAT IS INTERPRETATION\n${bulletList(analysis.interpretations, 'No obvious interpretation language detected. Context can still be incomplete.', 4)}\n\nLANGUAGE FLAGS\n${absolutes.length ? `Absolute language appeared ${absolutes.length} time(s): ${[...new Set(absolutes.map((item) => item.toLowerCase()))].join(', ')}.` : 'No obvious absolute language detected.'}\n\nWHAT YOU SAY YOU NEED\n${bulletList(analysis.needs, 'Your desired outcome is not yet specific.', 4)}\n\nYOUR PART\n${bulletList(analysis.ownership, 'Your account says more about what happened to you than what you chose. Add your exact words and actions.', 4)}\n\nTHE GAP\nCompare the outcome you say you want with the behaviour you repeat when pressure rises. Name one mismatch the submitted material actually supports.\n\nTHE COST\n${analysis.costs.length ? analysis.costs.join(' / ') : 'The cost is not specific enough yet. Name what changed in observable terms.'}\n\nONE MOVE\nChoose one action under your control: repair, enforce a boundary, leave, collect a missing fact, or stop feeding the loop.`;
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
    const totalFiles = queuedFiles.length;
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
      queuedFiles = [];
      renderFiles();
      progressBar.style.width = '100%';
      const words = combined.split(/\s+/).filter(Boolean).length;
      status.textContent = `${blocks.length} OF ${totalFiles} FILES READ / ${words} WORDS EXTRACTED${failures.length ? ` / ${failures.length} NEED REVIEW` : ''}${truncated ? ' / TEXT LIMIT REACHED: CONTENT WAS TRUNCATED' : ''}`;
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

  document.getElementById('analyzeBtn').addEventListener('click', () => {
    const text = input.value.trim().slice(0, MAX_IMPORTED_CHARS);
    if (text.length < 40) {
      status.textContent = 'ADD MORE DETAIL: FACTS, WORDS, ACTIONS, AND WHAT HAPPENED NEXT.';
      return;
    }
    output.textContent = build(text);
    const sourceCount = (text.match(/^--- SOURCE\s+\d+:/gim) || []).length;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    status.textContent = `${modeCopy[mode].title} COMPLETE / ${wordCount} WORDS${sourceCount ? ` / ${sourceCount} SOURCES` : ''} EXAMINED / YOUR CONTENT IS NOT SAVED`;
    output.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    input.value = '';
    output.textContent = 'Your reflection will appear here.\n\nStart with facts. The mirror cannot expose what you deliberately keep outside the frame.';
    queuedFiles = [];
    renderFiles();
    status.textContent = 'CLEARED / NOTHING RETAINED';
  });

  document.getElementById('copyBtn').addEventListener('click', async () => {
    if (!/^.+ MODE/m.test(output.textContent)) {
      status.textContent = 'RUN A REFLECTION BEFORE COPYING A RESULT';
      return;
    }
    try {
      await navigator.clipboard.writeText(output.textContent);
      status.textContent = 'RESULT COPIED / YOUR CONTENT IS NOT SAVED';
    } catch (error) {
      console.error('Could not copy the reflection result.', error);
      status.textContent = 'COPY FAILED / SELECT THE RESULT TEXT AND COPY IT MANUALLY';
    }
  });

  window.addEventListener('beforeunload', revokePreviewUrls);
  try {
    localStorage.removeItem('selfMirrorHistory');
  } catch {
    // Storage can be unavailable in hardened browser modes.
  }
  setMode('mirror');
})();
