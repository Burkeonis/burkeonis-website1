(() => {
  'use strict';

  const STORAGE_KEY = 'burkeonisSelfMirrorProfileV2';
  const MAX_SESSIONS = 100;
  const profileName = document.getElementById('profileName');
  const providerSelect = document.getElementById('providerSelect');
  const ollamaModel = document.getElementById('ollamaModel');
  const memoryEnabled = document.getElementById('memoryEnabled');
  const memoryState = document.getElementById('memoryState');
  const drawer = document.getElementById('profileDrawer');
  const input = document.getElementById('mirrorInput');
  const output = document.getElementById('mirrorOutput');
  const status = document.getElementById('status');
  const protocolPrompts = {
    core: 'Separate what happened, what you assumed, what you felt, the repeating pattern, the contradiction, ownership, available choice, and one action.',
    bullshit: 'Treat the submitted material as answers or evidence for The Bullshit Detector. Separate evidence, story, pattern, contradiction, missing information, disconfirming evidence, reality check, and next action. Signals are not proof.',
    relationship: 'Treat the submitted material as answers from the Relationship Worksheet. Reflect those answers, compare them with earlier conflicts involving this person, and check whether how each person gives and receives care actually matches.',
    betrayal: 'Treat betrayal as a fact pattern. Separate what they did from what it meant, name warning signs previously dismissed, and keep ownership focused on the user’s choices around the betrayal.',
    parenting: 'Judge the event by what the child experienced, not only the parent’s intention. Check whether the user’s behaviour matches what they want their child to learn.',
    addiction: 'Name the trigger, the emotion in the ten minutes before, the relief being pursued, the cost, and the choice still available. Do not shame or diagnose.',
    creative: 'Find the fear wearing a creative excuse. Compare this stall with earlier unfinished work and end with one concrete creative action.',
    shadow: 'Look for projection, the disowned trait, where it was made unsafe, its distorted gift, and a supervised way to integrate it.',
    attachment: 'Do not diagnose adult RAD. Examine the learned closeness template, the body alarm, testing or withdrawal, and whether the present person is being treated like the original source.',
    misophonia: 'Separate the sound from the story attached to it. Track the body-first response, trigger history, avoidance cost, protective boundary, and regulation without excusing harm.',
    grief: 'Separate fact from guilt and fear. Locate grief in the body, unfinished words, identity change, cost, what remains, and what can still be said to the living.',
  };

  const blankProfile = () => ({
    version: 2,
    name: '',
    memoryEnabled: false,
    provider: 'browser',
    ollamaModel: 'llama3.1:8b',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sessions: [],
    patterns: [],
    contradictions: [],
    progress: [],
    corrections: [],
    relationships: {},
    relationshipEvents: [],
  });

  function load() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return value && value.version === 2 ? { ...blankProfile(), ...value } : blankProfile();
    } catch {
      return blankProfile();
    }
  }

  let profile = load();

  function save() {
    profile.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    syncControls();
  }

  function syncControls() {
    profileName.value = profile.name;
    providerSelect.value = profile.provider;
    ollamaModel.value = profile.ollamaModel;
    memoryEnabled.checked = profile.memoryEnabled;
    memoryState.textContent = profile.memoryEnabled
      ? `${profile.sessions.length} SESSION${profile.sessions.length === 1 ? '' : 'S'} REMEMBERED`
      : 'MEMORY OFF';
    memoryState.classList.toggle('on', profile.memoryEnabled);
  }

  function repeatedTerms(text) {
    const ignored = new Set(['that', 'this', 'with', 'from', 'have', 'they', 'them', 'were', 'what', 'when', 'then', 'because', 'just', 'about', 'your', 'their', 'there', 'would', 'could', 'should']);
    const counts = {};
    (text.toLowerCase().match(/[a-z']{4,}/g) || []).forEach((word) => {
      if (!ignored.has(word)) counts[word] = (counts[word] || 0) + 1;
    });
    return Object.entries(counts).filter(([, count]) => count >= 3).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([term, count]) => ({ term, count }));
  }

  function evidenceType(text) {
    if (/\b(i saw|i heard|they said|message says|at \d|on monday|on tuesday|on wednesday|on thursday|on friday|on saturday|on sunday)\b/i.test(text)) return 'USER-STATED FACT';
    if (/\b(maybe|probably|i think|i guess|must be|seems)\b/i.test(text)) return 'UNVERIFIED INTERPRETATION';
    return 'USER ACCOUNT / MIXED EVIDENCE';
  }

  function remember(text, result) {
    if (!profile.memoryEnabled) return;
    const modeButton = document.querySelector('.mode-btn.active');
    const person = document.getElementById('relationshipPerson').value.trim();
    const eventType = document.getElementById('relationshipEvent').value;
    const protocol = document.getElementById('protocolLens').value;
    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : `session_${Date.now()}`,
      date: new Date().toISOString(),
      mode: modeButton?.dataset.mode || 'mirror',
      protocol,
      relationshipPerson: person,
      relationshipEvent: eventType,
      evidenceType: evidenceType(text),
      sourceExcerpt: text.slice(0, 800),
      result: result.slice(0, 3000),
      terms: repeatedTerms(text),
    };
    profile.sessions.unshift(record);
    profile.sessions = profile.sessions.slice(0, MAX_SESSIONS);
    if (person) {
      profile.relationships[person] = {
        name: person,
        myGiveLanguage: document.getElementById('giveLanguage').value,
        myReceiveLanguage: document.getElementById('receiveLanguage').value,
        theirGiveLanguage: document.getElementById('theirGiveLanguage').value,
        theirReceiveLanguage: document.getElementById('theirReceiveLanguage').value,
        updatedAt: new Date().toISOString(),
      };
      if (eventType) {
        profile.relationshipEvents.unshift({
          id: record.id,
          person,
          type: eventType,
          protocol,
          date: record.date,
          evidenceType: record.evidenceType,
          sourceExcerpt: record.sourceExcerpt,
        });
        profile.relationshipEvents = profile.relationshipEvents.slice(0, 200);
      }
    }

    const totals = {};
    profile.sessions.forEach((session) => session.terms.forEach(({ term, count }) => {
      totals[term] = (totals[term] || 0) + count;
    }));
    profile.patterns = Object.entries(totals)
      .filter(([, count]) => count >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([label, count]) => ({
        label,
        count,
        confidence: count >= 12 ? 'HIGH' : count >= 8 ? 'MEDIUM' : 'LOW',
        basis: 'REPEATED LANGUAGE ACROSS SAVED SESSIONS',
      }));
    save();
  }

  function profileContext() {
    if (!profile.memoryEnabled || !profile.sessions.length) return 'No saved history is available. Do not invent a profile.';
    return [
      `Profile name: ${profile.name || 'not provided'}`,
      `Saved sessions: ${profile.sessions.length}`,
      `Repeated language patterns: ${profile.patterns.map((item) => `${item.label} (${item.confidence})`).join(', ') || 'none yet'}`,
      `Relationship profiles: ${Object.values(profile.relationships).map((person) => `${person.name}: user gives ${person.myGiveLanguage || 'unknown'}, user receives ${person.myReceiveLanguage || 'unknown'}, they give ${person.theirGiveLanguage || 'unknown'}, they receive ${person.theirReceiveLanguage || 'unknown'}`).join('; ') || 'none'}`,
      `Recent relationship events: ${profile.relationshipEvents.slice(0, 10).map((event) => `${event.date.slice(0, 10)} ${event.person} ${event.type}`).join('; ') || 'none'}`,
      `Recent user-stated evidence: ${profile.sessions.slice(0, 5).map((item) => `[${item.evidenceType}] ${item.sourceExcerpt.slice(0, 220)}`).join('\n')}`,
      'Treat these as clues, not diagnoses. Separate facts from inference and explain the basis for every insight.',
    ].join('\n');
  }

  async function runOllama(text) {
    const mode = document.querySelector('.mode-btn.active')?.dataset.mode || 'mirror';
    const lens = document.getElementById('protocolLens').value;
    const abyssInstruction = mode === 'abyss'
      ? 'ABYSS RULE: Go beneath the surface account. Test the identity being protected, the private contract, the payoff of repetition, the familiar role, the contradiction between stated desire and repeated choice, and the evidence-backed cost. Do not insult, shame, diagnose, invent trauma, or manufacture certainty. The force must come from precise evidence and the question the user cannot easily escape.'
      : '';
    const detectorInstruction = mode === 'bullshit'
      ? 'BULLSHIT DETECTOR RULE: Test both the external claim and the user’s preferred interpretation. Separate evidence, story, pattern, contradiction, missing information, disconfirming evidence, and reality check. Manipulation language is a signal, never automatic proof. End with only SUPPORTED, PARTLY SUPPORTED, UNPROVEN, CONTRADICTED, or NOT ENOUGH INFORMATION.'
      : '';
    const prompt = `You are Self Mirror by Burkeonis. You do not flatter, comfort, diagnose, moralize, or pretend certainty. Reflect the user accurately. Separate FACTS, PATTERNS, POSSIBILITIES, BLIND SPOTS, CONTRADICTIONS, and NEXT STEP. Mark confidence LOW, MEDIUM, or HIGH and state the evidence for each inference. Mode: ${mode.toUpperCase()}. Submitted worksheet context: ${lens.toUpperCase()}.\n\n${abyssInstruction}\n${detectorInstruction}\n\nWORKSHEET HANDLING:\n${protocolPrompts[lens]}\nDo not replace, rewrite, or claim to complete the worksheet. Analyze only the answers the user actually supplied.\n\nPRIVATE PROFILE CONTEXT:\n${profileContext()}\n\nCURRENT ACCOUNT OR COMPLETED WORKSHEET ANSWERS:\n${text}`;
    const response = await fetch('http://127.0.0.1:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: profile.ollamaModel,
        stream: false,
        messages: [{ role: 'user', content: prompt }],
        options: { temperature: 0.35 },
      }),
    });
    if (!response.ok) throw new Error(`Ollama returned ${response.status}`);
    const data = await response.json();
    return data.message?.content?.trim() || '';
  }

  document.getElementById('saveProfile').addEventListener('click', () => {
    profile.name = profileName.value.trim();
    profile.provider = providerSelect.value;
    profile.ollamaModel = ollamaModel.value.trim() || 'llama3.1:8b';
    profile.memoryEnabled = memoryEnabled.checked;
    const person = document.getElementById('relationshipPerson').value.trim();
    if (person) {
      profile.relationships[person] = {
        name: person,
        myGiveLanguage: document.getElementById('giveLanguage').value,
        myReceiveLanguage: document.getElementById('receiveLanguage').value,
        theirGiveLanguage: document.getElementById('theirGiveLanguage').value,
        theirReceiveLanguage: document.getElementById('theirReceiveLanguage').value,
        updatedAt: new Date().toISOString(),
      };
    }
    save();
    status.textContent = profile.memoryEnabled ? 'PROFILE SAVED / LOCAL MEMORY ENABLED' : 'PROFILE SAVED / MEMORY DISABLED';
  });

  document.getElementById('detectModels').addEventListener('click', async () => {
    status.textContent = 'CHECKING OLLAMA ON THIS DEVICE';
    try {
      const response = await fetch('http://127.0.0.1:11434/api/tags');
      if (!response.ok) throw new Error('Ollama unavailable');
      const data = await response.json();
      const models = (data.models || []).map((item) => item.name).filter(Boolean);
      const list = document.getElementById('ollamaModels');
      list.replaceChildren(...models.map((name) => {
        const option = document.createElement('option');
        option.value = name;
        return option;
      }));
      if (models.length && !models.includes(ollamaModel.value)) ollamaModel.value = models[0];
      status.textContent = `${models.length} OLLAMA MODEL${models.length === 1 ? '' : 'S'} FOUND / LOCAL DEVICE`;
    } catch {
      status.textContent = 'OLLAMA NOT REACHABLE / START OLLAMA AND ALLOW THIS SITE AS A LOCAL ORIGIN';
    }
  });

  document.getElementById('viewProfile').addEventListener('click', () => {
    drawer.hidden = !drawer.hidden;
    if (drawer.hidden) return;
    drawer.textContent = [
      `PROFILE: ${profile.name || 'UNNAMED'}`,
      `MEMORY: ${profile.memoryEnabled ? 'ON' : 'OFF'}`,
      `SESSIONS: ${profile.sessions.length}`,
      `RELATIONSHIP EVENTS: ${profile.relationshipEvents.length}`,
      '',
      'PATTERNS CURRENTLY DETECTED',
      ...(profile.patterns.length ? profile.patterns.map((item) => `- ${item.label} / ${item.confidence} CONFIDENCE / ${item.basis}`) : ['- Not enough saved evidence yet.']),
      '',
      'RELATIONSHIPS',
      ...(Object.values(profile.relationships).length ? Object.values(profile.relationships).map((person) => `- ${person.name}: I give ${person.myGiveLanguage || 'unknown'} / I receive ${person.myReceiveLanguage || 'unknown'} / they give ${person.theirGiveLanguage || 'unknown'} / they receive ${person.theirReceiveLanguage || 'unknown'}`) : ['- None saved.']),
      '',
      'CONTROL',
      'These are machine-generated pattern clues, not facts or diagnoses. Export, correct, disable, or erase them at any time.',
    ].join('\n');
  });

  document.getElementById('exportProfile').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `self-mirror-profile-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('clearMemory').addEventListener('click', () => {
    if (!confirm('Erase the entire Self Mirror profile and every remembered session from this browser?')) return;
    localStorage.removeItem(STORAGE_KEY);
    profile = blankProfile();
    drawer.hidden = true;
    syncControls();
    status.textContent = 'SELF MIRROR MEMORY ERASED FROM THIS BROWSER';
  });

  document.getElementById('analyzeBtn').addEventListener('click', async () => {
    const text = input.value.trim();
    if (text.length < 40) return;
    window.setTimeout(async () => {
      let result = output.textContent;
      const lens = document.getElementById('protocolLens').value;
      if (lens !== 'core') {
        result = `${result}\n\n${lens.toUpperCase()} WORKSHEET COMPANION\n${protocolPrompts[lens]}`;
        output.textContent = result;
      }
      if (profile.provider === 'ollama') {
        status.textContent = `OLLAMA / ${profile.ollamaModel} / REFLECTING LOCALLY`;
        try {
          const ollamaResult = await runOllama(text);
          if (ollamaResult) {
            output.textContent = ollamaResult;
            result = ollamaResult;
          }
          status.textContent = 'OLLAMA REFLECTION COMPLETE / LOCAL DEVICE';
        } catch {
          output.textContent = `${result}\n\nOLLAMA CONNECTION\nOllama could not be reached at 127.0.0.1:11434. The built-in local mirror completed the reflection instead. Start Ollama, confirm the selected model is installed, and allow this site as a local origin.`;
          result = output.textContent;
          status.textContent = 'BUILT-IN REFLECTION COMPLETE / OLLAMA UNAVAILABLE';
        }
      }
      remember(text, result);
    }, 0);
  });

  syncControls();
})();
