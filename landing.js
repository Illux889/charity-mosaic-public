(() => {
  'use strict';

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
