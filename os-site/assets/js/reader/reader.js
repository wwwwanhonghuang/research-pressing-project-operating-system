// The reader: one document, two ways to read it.
//   Book   paginated pages turned by hand (reader/book.js)
//   Sheet  one long sheet, for working (reader/flow.js)
// Both render the same block stream, so switching keeps your place.

import { h, icons, inline, fill } from '../core/dom.js';
import { prefs, debug } from '../core/store.js';
import { CONTENT_LANGS } from '../core/i18n.js';
import { makeContext } from '../render/model.js';
import { geometry, buildPages, pageOfBlock, firstBlockOf } from '../render/paginate.js';
import { renderPage } from '../render/page.js';
import { Book } from './book.js';
import { mountFlow } from './flow.js';
import { themeButton, searchButton } from '../ui/chrome.js';
import { loadFontSheet, fontSheetWithin } from '../core/fonts.js';

const FONT_SCALES = [0.9, 1, 1.12, 1.25];

let fontsPromise = null;
export function fontsReady() {
  if (!fontsPromise) {
    const faces = [
      ['400 13px "Shippori Mincho"', '漢字かな'], ['600 13px "Shippori Mincho"', '漢字かな'],
      ['400 13px "EB Garamond"', 'Aa'], ['italic 400 13px "EB Garamond"', 'Aa'],
      ['400 13px "Noto Serif SC"', '汉字'], ['400 11px "IBM Plex Mono"', 'Aa0'],
      ['400 13px "IBM Plex Sans"', 'Aa'], ['300 40px "Cormorant Garamond"', '0123'],
    ];
    const loads = document.fonts ? faces.map(([f, t]) => document.fonts.load(f, t).catch(() => null)) : [];
    fontsPromise = Promise.race([
      Promise.all(loads).then(() => document.fonts?.ready),
      new Promise(resolve => setTimeout(resolve, 3500)),
    ]);
  }
  return fontsPromise;
}

const FACES_BY_LANG = {
  ja: ['400 13px "Shippori Mincho"', '600 13px "Shippori Mincho"'],
  zh: ['400 13px "Noto Serif SC"', '600 13px "Noto Serif SC"'],
  en: ['400 13px "EB Garamond"', 'italic 400 13px "EB Garamond"', '500 13px "Cormorant Garamond"'],
  fr: ['400 13px "EB Garamond"', 'italic 400 13px "EB Garamond"', '500 13px "Cormorant Garamond"'],
};

/**
 * Japanese and Chinese web fonts are served in many unicode-range subsets. Pages
 * are measured once, so every subset a document needs must be present first:
 * request exactly the characters it uses, per language and weight.
 */
export function glyphsReady(doc) {
  if (!document.fonts) return Promise.resolve();
  const chars = {};
  const add = v => { if (v && v.text) (chars[v.lang] ||= new Set()); if (v && v.text) for (const c of v.text) chars[v.lang].add(c); };
  const visit = b => {
    for (const k of ['text', 'title', 'label', 'hint', 'desc', 'output', 'note']) add(b[k]);
    for (const list of [b.states, b.columns, b.options]) (list || []).forEach(add);
    if (b.t === 'meta') b.rows.forEach(([k, v]) => { add(k); add(v); });
  };
  add(doc.title); add(doc.subtitle); add(doc.audience);
  for (const ch of doc.chapters) { add(ch.title); ch.blocks.forEach(visit); }
  (doc.appendix || []).forEach(visit);
  const loads = [];
  for (const [lang, set] of Object.entries(chars)) {
    const text = [...set].join('');
    for (const face of FACES_BY_LANG[lang] || []) loads.push(document.fonts.load(face, text).catch(() => null));
  }
  return Promise.race([Promise.all(loads), new Promise(resolve => setTimeout(resolve, 6000))]);
}

/**
 * opts: {
 *   makeDoc(ctx)      build the document model for a content language
 *   ctxBase           { objects, stage } for reference resolution
 *   back              { href, label }
 *   kindLabel         label shown before the title
 *   storeKey          preference key for the reading mode
 *   defaultMode       'book' | 'sheet'
 *   rail(doc)         optional provenance rail for the sheet
 * }
 */
export function mountReader(view, opts) {
  let lang = debug.lang || prefs.get('contentLang', 'ja');
  let mode = debug.mode || prefs.get(opts.storeKey, opts.defaultMode);
  let fontIdx = Math.max(0, FONT_SCALES.indexOf(prefs.get('fontScale', 1)));
  if (fontIdx < 0) fontIdx = 1;
  let doc, ctx, book = null, flow = null, layoutMode = null, pages = [], outline = [];
  let turned = prefs.get('turnedOnce', false);

  const build = () => { ctx = makeContext({ ...opts.ctxBase, pref: lang }); doc = opts.makeDoc(ctx); };
  build();

  // ---------------------------------------------------------------- toolbar
  const titleEl = h('div', { class: 'rbar__title' });
  const paintTitle = () => fill(titleEl, 
    h('span', { class: 'rbar__kind' }, opts.kindLabel),
    doc.title ? h('span', { class: 'rbar__name', lang: doc.title.lang }, inline(doc.title.text, doc.title.lang)) : null);
  paintTitle();

  const modeBtn = (m, icon, label) => h('button', { type: 'button', class: 'seg__btn', 'aria-pressed': String(mode === m), dataset: { mode: m }, on: { click: () => setMode(m) } }, icon(), h('span', null, label));
  const seg = h('div', { class: 'seg', role: 'group', 'aria-label': 'Reading mode' }, modeBtn('book', icons.book, 'Book'), modeBtn('sheet', icons.sheet, 'Sheet'));

  const langSelect = h('select', { class: 'rbar__select', id: 'content-lang', 'aria-label': 'Text language', on: { change: e => setLang(e.target.value) } });
  const paintLangs = () => {
    // A document with no localizable text (every block already carries its own language) has nothing to switch.
    const base = makeContext({ ...opts.ctxBase, pref: lang });
    opts.makeDoc(base);
    langSelect.closest('label')?.toggleAttribute('hidden', base.texts === 0);
    langSelect.replaceChildren(...CONTENT_LANGS.map(l => {
      const probe = makeContext({ ...opts.ctxBase, pref: l.code });
      opts.makeDoc(probe);
      const full = probe.fallbacks === 0, none = probe.fallbacks >= probe.texts;
      const state = full ? (l.code === 'ja' && probe.langs.size === 1 ? 'source' : 'available') : none ? 'not available' : 'partial';
      return h('option', { value: l.code, selected: l.code === lang ? '' : null }, `${l.name} · ${state}`);
    }));
  };
  // (painted once the toolbar exists, below)

  const sizeBtn = (delta, icon, label) => h('button', { type: 'button', class: 'tool tool--icon', 'aria-label': label, title: label, on: { click: () => setFont(fontIdx + delta) } }, icon());

  const bar = h('header', { class: 'rbar' },
    h('a', { class: 'rbar__back', href: `#${opts.back.href}` }, icons.arrowLeft(), h('span', null, opts.back.label)),
    titleEl,
    h('div', { class: 'rbar__tools' },
      seg,
      h('label', { class: 'rbar__lang' }, h('span', { class: 'rbar__lang-label' }, 'Text'), langSelect),
      h('div', { class: 'rbar__size', role: 'group', 'aria-label': 'Type size' }, sizeBtn(-1, icons.minus, 'Smaller type'), sizeBtn(1, icons.plus, 'Larger type')),
      searchButton(), themeButton()));
  paintLangs();

  const notice = h('div', { class: 'rnotice', role: 'status' });
  const body = h('main', { class: 'reader__body', id: 'reader-body' });
  const caption = h('div', { class: 'rfoot__caption', 'aria-live': 'polite' });
  const scrub = makeScrubber(p => book?.goToPage(p));
  const foot = h('footer', { class: 'rfoot' }, scrub.el, caption);
  const root = h('div', { class: 'reader' }, bar, notice, body, foot);
  view.append(root);

  function paintNotice() {
    const missing = lang !== 'ja' && ctx.fallbacks > 0;
    const name = CONTENT_LANGS.find(l => l.code === lang)?.name;
    notice.hidden = !missing;
    notice.textContent = missing
      ? (ctx.fallbacks >= ctx.texts
        ? `No ${name} text exists for this document yet. Showing the Japanese source; nothing is machine-translated.`
        : `Part of this document has no ${name} text yet. Those passages are shown in their source language.`)
      : '';
  }

  // ---------------------------------------------------------------- layout
  const hostSize = () => body.getBoundingClientRect();
  const wantSpread = () => { const r = hostSize(); return r.width >= 900 && r.width / Math.max(1, r.height) > 1.05; };

  function currentBid() {
    if (flow) return flow.currentBid();
    if (book) return firstBlockOf(pages[book.page]) ?? firstBlockOf(pages[book.page + 1]);
    return null;
  }

  let renderToken = 0;
  async function render(startBid = null) {
    const token = ++renderToken;
    if (debug.qa) window.__renders = (window.__renders || 0) + 1;
    root.className = `reader reader--${mode}`;
    seg.querySelectorAll('.seg__btn').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    paintNotice();
    book?.destroy(); book = null;
    flow?.destroy(); flow = null;
    body.replaceChildren();
    if (mode === 'sheet') {
      foot.hidden = true;
      flow = mountFlow(body, doc, { rail: opts.rail ? opts.rail(doc) : null, startBid });
      return;
    }
    foot.hidden = false;
    body.append(h('div', { class: 'desk-wait' }, 'Setting type…'));
    const sheetArrived = await fontSheetWithin(3000);
    await fontsReady();
    await glyphsReady(doc);
    if (!root.isConnected || token !== renderToken) return;
    if (!sheetArrived) {
      // Set with local fallback faces; if the web fonts arrive later, re-set once at rest.
      loadFontSheet().then(ok => ok && whenAtRest(token, async () => { await glyphsReady(doc); render(currentBid()); }));
    }
    body.replaceChildren();
    layoutMode = wantSpread() ? 'spread' : 'single';
    const r = hostSize();
    const geo = geometry(layoutMode, { fontScale: FONT_SCALES[fontIdx], viewport: { w: r.width, h: r.height + 100 } });
    ({ pages, outline } = buildPages(doc, geo));
    const start = startBid != null ? pageOfBlock(pages, startBid) : Math.min(pages.length - 1, Number(debug.page) || 0);
    book = new Book(body, {
      pages, geo, start,
      renderPage: p => renderPage(p, { doc, geo }),
      onTurn: pos => { scrub.update(pages, outline, book ?? { visiblePages: () => [start], mode: layoutMode }, layoutMode); if (book && pos !== book.__last) { if (book.__last != null && !turned) { turned = true; prefs.set('turnedOnce', true); } book.__last = pos; } paintCaption(null); },
      onDragState: t => paintCaption(t),
    });
    book.__last = book.pos;
    scrub.update(pages, outline, book, layoutMode);
    paintCaption(null);
    if (debug.peel) book.freeze(Number(debug.peel));
    if (debug.qa) window.__book = book;
    // QA: perform real turns through the engine (?turns=3 or ?turns=-2), one per second.
    if (debug.turns) {
      const n = Number(debug.turns);
      for (let i = 0; i < Math.abs(n); i++) setTimeout(() => (n > 0 ? book?.next() : book?.prev()), 900 * (i + 1));
    }
  }

  function whenAtRest(token, fn, tries = 0) {
    if (token !== renderToken || !root.isConnected || mode !== 'book') return;
    if (book && !book.turn && !document.querySelector('.palette')) fn();
    else if (tries < 60) setTimeout(() => whenAtRest(token, fn, tries + 1), 500);
  }

  function paintCaption(t) {
    if (t && t.geo) {
      const a = Math.abs(t.geo.angle);
      const axis = Math.round(Math.min(a, 180 - a));
      caption.replaceChildren(h('span', null, `fold axis ${axis}°`), h('span', null, `lift ${Math.sin(Math.PI * Math.min(1, t.geo.progress)).toFixed(2)}`), h('span', null, 'release to let it settle'));
    } else {
      caption.replaceChildren(h('span', null, turned ? '← → to turn' : 'Drag a page edge: the fold follows your hand'),
        h('span', null, layoutMode === 'spread' ? 'click an edge to turn · 0.85 s sine' : 'swipe or tap an edge'));
    }
  }

  function setMode(m) {
    if (m === mode) return;
    const bid = currentBid();
    mode = m; prefs.set(opts.storeKey, m);
    render(bid);
  }
  function setLang(code) {
    const bid = currentBid();
    lang = code; prefs.set('contentLang', code);
    build(); paintTitle(); render(bid);
  }
  function setFont(i) {
    const next = Math.max(0, Math.min(FONT_SCALES.length - 1, i));
    if (next === fontIdx) return;
    const bid = currentBid();
    fontIdx = next; prefs.set('fontScale', FONT_SCALES[next]);
    root.style.setProperty('--flow-scale', FONT_SCALES[next]);
    if (mode === 'book') render(bid);
  }
  root.style.setProperty('--flow-scale', FONT_SCALES[fontIdx]);

  // Re-paginate only when the layout itself changes (spread ↔ single, or the
  // single page's proportions); otherwise the book simply rescales.
  let resizeTimer = 0, lastH = innerHeight;
  const onResize = () => {
    if (debug.qa) window.__resizes = (window.__resizes || []).concat(`${innerWidth}x${innerHeight}`).slice(-8);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (mode !== 'book' || !book) return;
      const want = wantSpread() ? 'spread' : 'single';
      const tall = Math.abs(innerHeight - lastH) > 160 && want === 'single';
      if (want !== layoutMode || tall) { lastH = innerHeight; render(currentBid()); }
    }, 180);
  };
  addEventListener('resize', onResize);


  const onKey = e => {
    if (!book || mode !== 'book') return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.querySelector('.palette')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); book.next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); book.prev(); }
    else if (e.key === 'Home') { e.preventDefault(); book.turnTo(0); }
    else if (e.key === 'End') { e.preventDefault(); book.turnTo(book.last); }
  };
  document.addEventListener('keydown', onKey);
  body.addEventListener('click', e => {
    const toc = e.target.closest('.b--toc');
    if (toc && book && toc.dataset.page !== '') { e.preventDefault(); book.goToPage(Number(toc.dataset.page)); }
  });

  render(null);

  return () => {
    removeEventListener('resize', onResize);
    document.removeEventListener('keydown', onKey);
    book?.destroy(); flow?.destroy();
  };
}

// ---------------------------------------------------------------- scrubber

function makeScrubber(onGo) {
  const track = h('div', { class: 'scrub__track' });
  const bar = h('div', { class: 'scrub__fill' });
  const thumb = h('div', { class: 'scrub__thumb' });
  const ticks = h('div', { class: 'scrub__ticks', 'aria-hidden': 'true' });
  const tip = h('div', { class: 'scrub__tip', hidden: true });
  const label = h('div', { class: 'scrub__label' });
  const el = h('div', { class: 'scrub', role: 'slider', tabindex: '0', 'aria-label': 'Position in book' }, label, h('div', { class: 'scrub__rail' }, track, bar, ticks, thumb, tip));
  let pages = [], outline = [], total = 1, current = 0;

  const chapterAt = i => { let c = null; for (const o of outline) if (o.page != null && o.page <= i) c = o; return c; };
  const folioOf = i => pages[i]?.folio || '';
  const indexAt = clientX => {
    const r = track.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (clientX - r.left) / r.width)) * (total - 1));
  };
  function showTip(i, clientX) {
    const c = chapterAt(i);
    const r = track.getBoundingClientRect();
    tip.hidden = false;
    tip.style.left = `${Math.max(0, Math.min(r.width, clientX - r.left))}px`;
    fill(tip, 
      c ? h('span', { class: 'scrub__tip-n' }, c.n != null ? `Chapter ${c.n}` : 'Appendix') : h('span', { class: 'scrub__tip-n' }, 'Front matter'),
      c?.title ? h('span', { class: 'scrub__tip-t', lang: c.title.lang }, c.title.text) : null,
      folioOf(i) ? h('span', { class: 'scrub__tip-p' }, `p. ${folioOf(i)}`) : null);
  }

  let dragging = false;
  el.addEventListener('pointerdown', e => { dragging = true; el.setPointerCapture(e.pointerId); showTip(indexAt(e.clientX), e.clientX); });
  el.addEventListener('pointermove', e => { const i = indexAt(e.clientX); showTip(i, e.clientX); if (dragging) setFill(i); });
  el.addEventListener('pointerup', e => { if (!dragging) return; dragging = false; onGo(indexAt(e.clientX)); });
  el.addEventListener('pointerleave', () => { if (!dragging) tip.hidden = true; });
  el.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); onGo(Math.max(0, Math.min(total - 1, current + (e.key === 'ArrowRight' ? 2 : -2)))); }
  });

  function setFill(i) {
    const f = total > 1 ? i / (total - 1) : 0;
    bar.style.transform = `scaleX(${f})`;
    thumb.style.left = `${f * 100}%`;
  }

  return {
    el,
    update(p, o, book, layoutMode) {
      pages = p; outline = o; total = Math.max(1, p.length);
      const vis = book.visiblePages();
      current = vis[0] ?? 0;
      setFill(vis[vis.length - 1] ?? 0);
      ticks.replaceChildren(...outline.filter(c => c.page != null).map(c => h('span', { class: 'scrub__tick', style: { left: `${(c.page / Math.max(1, total - 1)) * 100}%` } })));
      const c = chapterAt(current);
      const folios = vis.map(folioOf).filter(Boolean);
      fill(label, 
        h('span', { class: 'scrub__where' }, c ? (c.n != null ? `Chapter ${c.n} of ${outline.filter(x => x.n != null).length}` : 'Appendix') : (current === 0 ? 'Cover' : 'Front matter')),
        c?.title ? h('span', { class: 'scrub__chapter', lang: c.title.lang }, c.title.text) : null,
        h('span', { class: 'scrub__pages' }, folios.length ? `p. ${folios.join('–')}` : layoutMode === 'spread' ? '' : '', ` · ${total} pages`));
      el.setAttribute('aria-valuemin', '1'); el.setAttribute('aria-valuemax', String(total));
      el.setAttribute('aria-valuenow', String(current + 1));
      el.setAttribute('aria-valuetext', `Page ${folios[0] || current + 1} of ${total}`);
    },
  };
}
