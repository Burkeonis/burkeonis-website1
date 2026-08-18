(() => {
  'use strict';

  const DAILY_LIMIT = 3;
  const STORAGE_KEY = 'burkeonisSelfMirrorPreviewUsageV1';
  const analyzeButton = document.getElementById('analyzeBtn');
  const status = document.getElementById('status');
  const hero = document.querySelector('.page-hero');

  if (!analyzeButton || !status || !hero) return;

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function readUsage() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (parsed.date !== todayKey()) return { date: todayKey(), count: 0 };
      return { date: parsed.date, count: Number.isFinite(parsed.count) ? parsed.count : 0 };
    } catch {
      return { date: todayKey(), count: 0 };
    }
  }

  function writeUsage(usage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
    } catch {
      // Hardened browsers may deny storage. The reflection tool still works.
    }
  }

  function remainingText() {
    const usage = readUsage();
    return Math.max(0, DAILY_LIMIT - usage.count);
  }

  const notice = document.createElement('section');
  notice.setAttribute('aria-label', 'Self Mirror preview access');
  notice.style.cssText = 'margin:22px 0 0;padding:18px;border:1px solid #6b625d;background:#17191a;color:#d8d2c9;line-height:1.6';

  const heading = document.createElement('strong');
  heading.textContent = 'SELF MIRROR PUBLIC PREVIEW';
  heading.style.cssText = 'display:block;color:#f1ede5;letter-spacing:.12em;font:700 12px Courier New,monospace;margin-bottom:8px';

  const copy = document.createElement('p');
  copy.style.margin = '0';

  const link = document.createElement('a');
  link.href = '/pricing';
  link.textContent = 'COMPARE SELF MIRROR PLANS →';
  link.style.cssText = 'display:inline-block;margin-top:12px;color:#e19876;font:700 11px Courier New,monospace;letter-spacing:.1em';

  notice.append(heading, copy, link);
  hero.appendChild(notice);

  function refreshNotice() {
    const remaining = remainingText();
    copy.textContent = remaining > 0
      ? `${remaining} of ${DAILY_LIMIT} browser-only reflections remain today. Only this use counter is stored locally in your browser; your conversation and results are not saved. Self Mirror plans include expanded access, memory, advanced analysis and connected progress.`
      : 'Today’s public preview is complete. Only the use counter is stored locally; your conversation and results are not saved. Compare Self Mirror plans for expanded access, memory, advanced analysis and connected progress.';

    if (remaining === 0) {
      analyzeButton.disabled = true;
      analyzeButton.setAttribute('aria-disabled', 'true');
      analyzeButton.textContent = 'PREVIEW LIMIT REACHED';
      status.textContent = 'PUBLIC PREVIEW COMPLETE / YOUR TEXT REMAINS ON THIS DEVICE';
    }
  }

  analyzeButton.addEventListener('click', (event) => {
    const usage = readUsage();
    if (usage.count >= DAILY_LIMIT) {
      event.preventDefault();
      event.stopImmediatePropagation();
      refreshNotice();
      return;
    }

    const input = document.getElementById('mirrorInput');
    if (!input || input.value.trim().length < 40) return;

    usage.count += 1;
    writeUsage(usage);
    window.setTimeout(refreshNotice, 0);
  }, true);

  window.addEventListener('selfmirror:modechange', refreshNotice);
  refreshNotice();
})();
