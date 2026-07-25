(() => {
  'use strict';
  const plans = {
    anger: ['LOWER THE TEMPERATURE', 'Put the phone down. Unclench your hands. Name the exact action you want to take, then wait before taking it.'],
    panic: ['RETURN TO THE ROOM', 'Press both feet into the floor. Find five hard edges around you. Urgency is a body signal, not proof that immediate action is required.'],
    numb: ['MAKE ONE CONTACT', 'Do not solve everything. Name one physical sensation and one person, place, or routine that reconnects you to the present.'],
    impulse: ['BUILD A BARRIER', 'Move away from the message, substance, person, vehicle, purchase, or decision for ninety seconds. Distance first. Analysis second.'],
  };

  const label = document.getElementById('stepLabel');
  const text = document.getElementById('stepText');
  const input = document.getElementById('pauseInput');
  const timerStatus = document.getElementById('timerStatus');
  let timer = null;

  document.querySelectorAll('.state-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      document.querySelectorAll('.state-btn').forEach((x) => x.classList.toggle('active', x === btn));
      const plan = plans[btn.dataset.state];
      label.textContent = plan[0];
      text.textContent = plan[1];
    })
  );

  document.getElementById('openMirror').addEventListener('click', () => {
    const value = input.value.trim();
    if (value) sessionStorage.setItem('selfMirrorDraft', value);
    location.href = 'self-mirror?source=pause';
  });

  document.getElementById('delayBtn').addEventListener('click', () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
      timerStatus.textContent = 'DELAY CANCELLED';
      return;
    }
    let remaining = 90;
    timerStatus.textContent = '90 SECONDS / DO NOT ACT YET';
    timer = setInterval(() => {
      remaining--;
      timerStatus.textContent = `${remaining} SECONDS / STAY HERE`;
      if (remaining <= 0) {
        clearInterval(timer);
        timer = null;
        timerStatus.textContent = 'DELAY COMPLETE / CHOOSE THE NEXT ACTION DELIBERATELY';
      }
    }, 1000);
  });

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installStatus').textContent = 'INSTALLATION READY';
  });

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;

  document.getElementById('installBtn').addEventListener('click', async () => {
    if (standalone) {
      document.getElementById('installStatus').textContent = 'PAUSE IS ALREADY OPEN AS AN INSTALLED APP';
      return;
    }
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      document.getElementById('installStatus').textContent =
        choice.outcome === 'accepted' ? 'INSTALLATION STARTED' : 'INSTALLATION DISMISSED';
      deferredPrompt = null;
      return;
    }
    if (isIOS) {
      document.getElementById('iosSteps').hidden = false;
      document.getElementById('installStatus').textContent = 'FOLLOW THE SAFARI STEPS ABOVE';
      return;
    }
    document.getElementById('installStatus').textContent =
      'OPEN YOUR BROWSER MENU AND CHOOSE INSTALL APP OR ADD TO HOME SCREEN';
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
})();
