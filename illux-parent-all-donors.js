/* Insert this script once in the Illux/Twig page that embeds the mosaic iframe. */
(() => {
  'use strict';

  const PAGE_SIZE = 10;
  const money = new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 });
  const integer = new Intl.NumberFormat('da-DK');
  let dialog, list, search, pagination, count, total;
  let donors = [], page = 1, frame = null, frameOrigin = '', scrollState = null, restoreFocusOnClose = true;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function fieldsText(donor) {
    return donor.fields === null ? 'Felter beregnes…' : integer.format(donor.fields) + ' felter';
  }

  function lockScroll() {
    if (scrollState) return;
    const html = document.documentElement, body = document.body;
    scrollState = {
      y: window.scrollY,
      htmlOverflow: html.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyOverflow: body.style.overflow
    };
    html.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = -scrollState.y + 'px';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }

  function unlockScroll() {
    if (!scrollState) return;
    const old = scrollState;
    scrollState = null;
    document.documentElement.style.overflow = old.htmlOverflow;
    document.body.style.position = old.bodyPosition;
    document.body.style.top = old.bodyTop;
    document.body.style.width = old.bodyWidth;
    document.body.style.overflow = old.bodyOverflow;
    window.scrollTo(0, old.y);
  }

  function closeDialog(restoreFocus = true) {
    restoreFocusOnClose = restoreFocus;
    if (dialog?.open) dialog.close();
    unlockScroll();
  }

  function makeButton(label, destination, disabled = false, current = false) {
    const button = element('button', '', label);
    button.type = 'button';
    button.disabled = disabled;
    if (current) button.setAttribute('aria-current', 'page');
    else if (!disabled) button.addEventListener('click', () => {
      page = destination;
      render();
      list.scrollTop = 0;
    });
    pagination.append(button);
  }

  function render() {
    const query = search.value.trim().toLocaleLowerCase('da-DK');
    const filtered = donors.filter(donor => donor.name.toLocaleLowerCase('da-DK').includes(query));
    const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    page = Math.min(page, pages);
    list.replaceChildren();
    pagination.replaceChildren();

    if (!filtered.length) {
      list.append(element('p', 'cm-all-empty', 'Ingen bidragsydere fundet.'));
      return;
    }

    for (const donor of filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)) {
      const button = element('button', 'cm-all-donor');
      button.type = 'button';
      button.setAttribute('aria-label', donor.name + ', ' + money.format(donor.amount) + ', ' + fieldsText(donor) + '. Vis billede');
      const thumb = element('span', 'cm-all-thumb');
      const initials = donor.name.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toLocaleUpperCase('da-DK') || '•';
      thumb.append(element('span', 'cm-all-initials', initials));
      if (donor.photo) {
        const image = element('img');
        image.src = donor.photo;
        image.alt = '';
        image.loading = 'lazy';
        image.decoding = 'async';
        image.addEventListener('error', () => { image.hidden = true; });
        thumb.append(image);
      }
      const info = element('span', 'cm-all-info');
      const meta = element('span', 'cm-all-meta');
      meta.append(element('span', '', money.format(donor.amount)), element('span', '', fieldsText(donor)));
      info.append(element('strong', '', donor.name), meta);
      button.append(thumb, info);
      button.addEventListener('click', () => {
        const target = frame?.contentWindow, origin = frameOrigin;
        closeDialog(false);
        // The iframe emits its existing charity-mosaic-open-donor event.
        // The current Illux donor-popup handler opens the selected donor.
        target?.postMessage({ type: 'charity-mosaic-select-donor', id: donor.id, index: donor.index }, origin);
      });
      list.append(button);
    }

    if (filtered.length <= PAGE_SIZE) return;
    makeButton('← Forrige', page - 1, page === 1);
    const visible = new Set([1, pages, page - 1, page, page + 1]);
    let previous = 0;
    for (const number of [...visible].filter(number => number >= 1 && number <= pages).sort((a, b) => a - b)) {
      if (number > previous + 1) pagination.append(element('span', '', '…'));
      makeButton(String(number), number, false, number === page);
      previous = number;
    }
    makeButton('Næste →', page + 1, page === pages);
  }

  function ensureDialog() {
    if (dialog) return;
    const style = element('style');
    style.textContent = `
      .cm-all-dialog{box-sizing:border-box;inset:0;margin:auto;width:min(720px,calc(100vw - 24px));max-width:720px;max-height:calc(100dvh - 24px);padding:20px;border:1px solid #e4e4e4;border-radius:16px;background:#fff;color:#181818;box-shadow:0 18px 60px #0003;font:14px/1.5 "Open Sans",Arial,sans-serif;overflow:hidden}
      .cm-all-dialog[open]{display:flex;flex-direction:column}.cm-all-dialog::backdrop{background:rgba(0,0,0,.55)}
      .cm-all-dialog *{box-sizing:border-box}.cm-all-dialog button,.cm-all-dialog input{font:inherit}
      .cm-all-dialog button{cursor:pointer}.cm-all-dialog button:disabled{opacity:.45;cursor:default}
      .cm-all-dialog button:focus-visible,.cm-all-dialog input:focus-visible{outline:3px solid #b49645;outline-offset:2px}
      .cm-all-head{display:flex;flex:none;justify-content:space-between;align-items:start;gap:16px;margin-bottom:12px}
      .cm-all-head h2{margin:0;font-size:22px;line-height:1.25}.cm-all-head p{margin:4px 0 0;color:#6b6b6b;font-size:13px}
      .cm-all-close{min-height:40px;padding:7px 12px;border:1px solid #e4e4e4;border-radius:8px;background:#fff;color:#181818}
      .cm-all-summary{display:flex;flex:none;flex-direction:column;gap:2px;margin-bottom:14px}.cm-all-summary span{font-size:12px;color:#6b6b6b}.cm-all-summary strong{font-size:23px;line-height:1.25}
      .cm-all-search{flex:none;width:100%;min-height:42px;margin-bottom:12px;padding:9px 11px;border:1px solid #e4e4e4;border-radius:8px;background:#fff;color:#181818}
      .cm-all-list{display:flex;flex:1 1 auto;min-height:0;flex-direction:column;overflow-y:auto;overscroll-behavior:contain}
      .cm-all-empty{padding:20px 2px;color:#6b6b6b}.cm-all-donor{display:grid;grid-template-columns:54px minmax(0,1fr);align-items:center;gap:12px;width:100%;min-height:74px;padding:10px 2px;border:0;border-top:1px solid #e4e4e4;background:#fff;color:#181818;text-align:left;font-size:13px}
      .cm-all-donor:hover{background:#f7f7f5}.cm-all-thumb{position:relative;display:grid;place-items:center;width:54px;height:54px;overflow:hidden;border:1px solid #e4e4e4;border-radius:8px;background:#f7f7f5}
      .cm-all-thumb img{position:relative;display:block;width:100%;height:100%;object-fit:contain}.cm-all-initials{position:absolute;color:#6b6b6b;font-size:16px;font-weight:700}
      .cm-all-info{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:16px;min-width:0}.cm-all-info strong{min-width:0;overflow-wrap:anywhere}.cm-all-meta{display:grid;grid-template-columns:110px 90px;gap:12px;color:#6b6b6b;text-align:right}.cm-all-meta span{white-space:nowrap}
      .cm-all-pagination{display:flex;flex:none;align-items:center;justify-content:center;flex-wrap:wrap;gap:5px;padding-top:12px}.cm-all-pagination button{min-width:34px;min-height:36px;padding:5px 9px;border:1px solid #e4e4e4;border-radius:7px;background:#fff;color:#181818}
      .cm-all-pagination button[aria-current="page"]{border-color:#181818;background:#181818;color:#fff}.cm-all-pagination span{padding:0 3px;color:#6b6b6b}
      @media(max-width:600px){.cm-all-dialog{padding:14px}.cm-all-head h2{font-size:19px}.cm-all-donor{gap:10px;font-size:12px}.cm-all-info{display:flex;flex-direction:column;align-items:flex-start;gap:3px}.cm-all-meta{display:flex;flex-wrap:wrap;gap:2px 14px;text-align:left}.cm-all-pagination button{min-height:40px}}
    `;
    document.head.append(style);

    dialog = element('dialog', 'cm-all-dialog');
    dialog.setAttribute('aria-labelledby', 'cm-all-title');
    const head = element('div', 'cm-all-head');
    const heading = element('div');
    const title = element('h2', '', 'Alle bidragsydere');
    title.id = 'cm-all-title';
    count = element('p');
    heading.append(title, count);
    const close = element('button', 'cm-all-close', 'Luk');
    close.type = 'button';
    close.addEventListener('click', () => closeDialog());
    head.append(heading, close);
    const summary = element('div', 'cm-all-summary');
    summary.append(element('span', '', 'Samlet doneret'));
    total = element('strong');
    summary.append(total);
    search = element('input', 'cm-all-search');
    search.type = 'search';
    search.placeholder = 'Søg efter navn…';
    search.autocomplete = 'off';
    search.setAttribute('aria-label', 'Søg efter bidragsyder');
    search.addEventListener('input', () => { page = 1; render(); list.scrollTop = 0; });
    list = element('div', 'cm-all-list');
    pagination = element('nav', 'cm-all-pagination');
    pagination.setAttribute('aria-label', 'Sider med bidragsydere');
    dialog.append(head, summary, search, list, pagination);
    dialog.addEventListener('keydown', event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeDialog(); }
    }, true);
    dialog.addEventListener('click', event => {
      const bounds = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) closeDialog();
    });
    dialog.addEventListener('close', () => { unlockScroll(); if (restoreFocusOnClose) frame?.focus(); restoreFocusOnClose = true; });
    document.body.append(dialog);
  }

  window.addEventListener('message', event => {
    const opening = event.data?.type === 'charity-mosaic-open-all-donors';
    if (!opening && event.data?.type !== 'charity-mosaic-update-all-donors') return;
    const sourceFrame = [...document.querySelectorAll('iframe')].find(item => item.contentWindow === event.source);
    if (!sourceFrame) return;
    let origin;
    try { origin = new URL(sourceFrame.src, document.baseURI).origin; } catch { return; }
    if (origin === 'null' || event.origin !== origin || !Array.isArray(event.data.donors)) return;
    if (!opening && (!dialog?.open || frame !== sourceFrame)) return;

    frame = sourceFrame;
    frameOrigin = origin;
    donors = event.data.donors.filter(item => item && Number.isInteger(item.index) && item.index >= 0).map(item => {
      let photo = '';
      try { const url = new URL(String(item.photo || '')); if (url.protocol === 'https:' || url.protocol === 'http:') photo = url.href; } catch {}
      return { id: String(item.id || ''), index: item.index, name: String(item.name || 'Anonym'), amount: Number(item.amount) || 0, fields: item.fields === null ? null : Number(item.fields) || 0, photo };
    });
    donors.sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, 'da') || a.index - b.index);
    ensureDialog();
    count.textContent = integer.format(donors.length) + ' bidrag';
    total.textContent = money.format(Number(event.data.total) || 0);
    if (opening) { search.value = ''; page = 1; }
    render();
    if (opening) {
      list.scrollTop = 0;
      lockScroll();
      if (!dialog.open) dialog.showModal();
      search.focus();
    }
  });
})();
