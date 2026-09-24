(() => {
  'use strict';

  function startCountdown() {
    const deadline = Date.parse('2026-11-09T23:59:00+01:00');
    const heading = document.getElementById('countdownTitle');
    const days = document.getElementById('countdownDays');
    const hours = document.getElementById('countdownHours');
    const minutes = document.getElementById('countdownMinutes');
    const seconds = document.getElementById('countdownSeconds');
    if (!heading || !days || !hours || !minutes || !seconds) return;

    function render() {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      days.textContent = String(Math.floor(remaining / 86400));
      hours.textContent = String(Math.floor(remaining / 3600) % 24).padStart(2, '0');
      minutes.textContent = String(Math.floor(remaining / 60) % 60).padStart(2, '0');
      seconds.textContent = String(remaining % 60).padStart(2, '0');
      if (remaining === 0) heading.textContent = 'INDSAMLINGEN ER SLUT';
      return remaining > 0;
    }

    if (render()) {
      const interval = setInterval(() => {
        if (!render()) clearInterval(interval);
      }, 1000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCountdown, { once: true });
  } else {
    startCountdown();
  }

  if (window.parent === window) return;

  let targetOrigin = '*';
  try {
    if (document.referrer) {
      const origin = new URL(document.referrer).origin;
      if (origin !== 'null') targetOrigin = origin;
    }
  } catch {}

  let lastHeight = null;

  function start() {
    const page = document.querySelector('.page');
    if (!page) return;

    function reportHeight() {
      const height = Math.ceil(page.getBoundingClientRect().height);
      if (height === lastHeight) return;
      lastHeight = height;
      window.parent.postMessage({ type: 'charity-mosaic-height', height }, targetOrigin);
    }

    reportHeight();
    window.addEventListener('resize', reportHeight);
    window.addEventListener('load', reportHeight, { once: true });

    if ('ResizeObserver' in window) {
      new ResizeObserver(reportHeight).observe(page);
    }

    for (const image of page.querySelectorAll('img')) {
      if (image.complete) continue;
      image.addEventListener('load', reportHeight, { once: true });
      image.addEventListener('error', reportHeight, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
