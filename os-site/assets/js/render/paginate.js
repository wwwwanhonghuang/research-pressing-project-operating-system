// Pagination. Blocks are rendered once into a hidden page body of the exact page
// width, measured, and packed into pages. Pages are a fixed virtual size and the
// whole book is scaled to the window, so page numbers do not change on resize.

import { h } from '../core/dom.js';
import { sentences } from '../core/i18n.js';
import { renderBlock, KEEP_WITH_NEXT } from './blocks.js';

const ROMAN = ['', 'i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];
const ui = text => ({ text, lang: 'en', ui: true });

/** Page geometry, in virtual CSS pixels. */
export function geometry(mode, { fontScale = 1, viewport = { w: 1280, h: 800 } } = {}) {
  if (mode === 'spread') {
    const W = 480, H = 680;
    const m = { top: 58, bottom: 60, inner: 52, outer: 44 };
    return { mode, W, H, m, contentW: W - m.inner - m.outer, contentH: H - m.top - m.bottom, fontPx: 12.5 * fontScale };
  }
  const W = 360;
  const ratio = Math.min(1.66, Math.max(1.32, (viewport.h - 150) / Math.max(320, viewport.w - 24)));
  const H = Math.round(W * ratio);
  const m = { top: 50, bottom: 52, inner: 30, outer: 28 };
  return { mode, W, H, m, contentW: W - m.inner - m.outer, contentH: H - m.top - m.bottom, fontPx: 12.75 * fontScale };
}

function createMeasurer(geo) {
  const root = h('div', { class: 'measure', 'aria-hidden': 'true' });
  const body = h('div', { class: 'pg-body doc doc--page', style: { width: `${geo.contentW}px`, fontSize: `${geo.fontPx}px` } });
  root.append(body);
  document.body.append(root);
  return body;
}

function wrap(b) {
  const el = renderBlock(b);
  if (b.t !== 'li') return { outer: el, el };
  const list = h(b.style === 'num' ? 'ol' : 'ul', { class: `blist is-${b.style}` }, el);
  return { outer: list, el };
}

function heightOf(el) {
  const cs = getComputedStyle(el);
  return el.getBoundingClientRect().height + (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
}

function measureAll(blocks, measurer) {
  const parts = blocks.map(wrap);
  measurer.replaceChildren(...parts.map(p => p.outer));
  const heights = parts.map(p => heightOf(p.el));
  measurer.replaceChildren();
  return heights;
}

function measureOne(b, measurer) {
  const p = wrap(b);
  measurer.replaceChildren(p.outer);
  const hgt = heightOf(p.el);
  measurer.replaceChildren();
  return hgt;
}

const LATIN = new Set(['en', 'fr']);

/** Units a paragraph may break between: sentences, else words (Latin) or characters (CJK). */
function unitsOf(text, lang, fine) {
  if (!fine) {
    const s = sentences(text, lang);
    if (s.length > 1) return s;
  }
  return LATIN.has(lang) ? (text.match(/\S+\s*/g) || [text]) : Array.from(text);
}

/**
 * Split a paragraph so its first part fits `room`. Sentence boundaries are
 * preferred; a widow (a lone last line carried to the next page) is avoided by
 * moving units back until at least two lines travel together.
 */
function splitParagraph(b, room, measurer, line) {
  const { text, lang } = b.text;
  const attempt = units => {
    let lo = 0, hi = units.length - 1;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const trial = { ...b, text: { text: units.slice(0, mid).join(''), lang }, split: true };
      if (measureOne(trial, measurer) <= room) lo = mid; else hi = mid - 1;
    }
    return lo;
  };
  let units = unitsOf(text, lang, false);
  let fine = false;
  let lo = attempt(units);
  const restOf = k => ({ ...b, text: { text: units.slice(k).join('').replace(/^\s+/, ''), lang }, cont: true, split: false });
  const widow = k => line && measureOne(restOf(k), measurer) < line * 1.6;
  if (lo === 0 || widow(lo)) { units = unitsOf(text, lang, true); fine = true; lo = attempt(units); }
  if (lo === 0) return null;
  // Widow control at word or character granularity: carry at least two lines over.
  let guard = 0;
  while (lo > 1 && guard++ < 60 && widow(lo)) lo--;
  // A break inside a sentence keeps its last line justified; a break between sentences does not.
  return [{ ...b, text: { text: units.slice(0, lo).join(''), lang }, split: true, mid: fine }, restOf(lo)];
}

/** Pack a block stream into flow pages. */
function pack(blocks, geo, measurer, startHead = null) {
  const H = geo.contentH - 1;
  const line = geo.fontPx * 1.9;
  const heights = measureAll(blocks, measurer);
  const pages = [];
  let cur = [], used = 0, head = startHead;
  let pageHead = head;
  const flush = () => {
    if (cur.length) pages.push({ kind: 'flow', blocks: cur, head: pageHead });
    cur = []; used = 0; pageHead = head;
  };

  for (let i = 0; i < blocks.length; i++) {
    let b = blocks[i];
    let hgt = heights[i];
    if (b.t === 'chapter') { flush(); head = b.title; pageHead = head; }
    if (b.t === 'pagetitle' && cur.length) flush();

    if (used + hgt <= H) {
      if (KEEP_WITH_NEXT.has(b.t) && i + 1 < blocks.length && cur.length) {
        const need = Math.min(heights[i + 1], line * 2.4);
        if (used + hgt + need > H && blocks[i + 1].t !== 'chapter') { flush(); }
      }
      cur.push(b); used += hgt;
      continue;
    }

    // Does not fit: split paragraphs across the page, move everything else.
    while (b) {
      const room = H - used;
      if (b.t === 'p' && room > line * 1.6) {
        const parts = splitParagraph(b, room, measurer, line);
        if (parts) {
          cur.push(parts[0]); flush();
          b = parts[1]; hgt = measureOne(b, measurer);
          if (hgt <= H) { cur.push(b); used = hgt; b = null; }
          continue;
        }
      }
      if (cur.length) { flush(); if (hgt <= H) { cur.push(b); used = hgt; b = null; continue; } }
      if (b.t === 'p' && hgt > H) {
        const parts = splitParagraph(b, H, measurer, line);
        if (parts) { cur.push(parts[0]); flush(); b = parts[1]; hgt = measureOne(b, measurer); continue; }
      }
      cur.push({ ...b, oversize: true }); used = H; flush(); b = null;
    }
  }
  flush();
  return pages;
}

/**
 * Lay out a document as pages.
 * Books (handbooks) get front matter, contents, appendix, colophon and
 * covers; a single definition is just its pages. Spread-only pages (endpapers,
 * blank versos) are omitted in single-page mode.
 */
export function buildPages(doc, geo) {
  const measurer = createMeasurer(geo);
  try {
    let bid = 0;
    const body = [];
    for (const ch of doc.chapters) for (const b of ch.blocks) body.push({ ...b, bid: bid++ });
    for (const b of doc.appendix) body.push({ ...b, bid: bid++ });
    const bodyPages = pack(body, geo, measurer);

    if (!doc.front) {
      bodyPages.forEach((p, i) => { p.folio = String(i + 1); p.side = side(i, geo, false); });
      return finish(bodyPages, doc, []);
    }

    const spread = geo.mode === 'spread';
    const chapterEntries = doc.chapters.map((ch, i) => ({ t: 'toc', n: i + 1, title: ch.title, chapter: ch.id, level: 1 }));
    if (doc.appendix.length) chapterEntries.push({ t: 'toc', n: null, title: doc.appendix[0].title, chapter: 'APPENDIX', level: 2 });
    const tocPages = pack([{ t: 'pagetitle', text: ui('Contents') }, ...chapterEntries], geo, measurer);

    const front = [{ kind: 'cover' }];
    if (spread) front.push({ kind: 'endpaper', spreadOnly: true });
    front.push({ kind: 'title' }, { kind: 'edition' });
    tocPages.forEach(p => { p.kind = 'flow'; p.head = ui('Contents'); front.push(p); });

    const firstBody = front.length;
    const pages = [...front, ...bodyPages];
    const chapterPage = new Map();
    pages.forEach((p, i) => {
      if (p.kind !== 'flow' || i < firstBody) return;
      for (const b of p.blocks) if (b.t === 'chapter' && !chapterPage.has(b.id)) chapterPage.set(b.id, i);
    });

    // Folios: roman for front matter, arabic from the first chapter.
    let roman = 0;
    pages.forEach((p, i) => {
      p.side = side(i, geo, true);
      if (i < firstBody) { roman++; p.folio = p.kind === 'flow' ? ROMAN[roman] ?? '' : null; }
      else p.folio = String(i - firstBody + 1);
    });
    for (const p of tocPages) for (const b of p.blocks) {
      if (b.t !== 'toc') continue;
      b.page = chapterPage.get(b.chapter) ?? null;
      b.folio = b.page != null ? pages[b.page].folio : '';
    }

    pages.push({ kind: 'colophon' });
    if (spread) {
      // Close the book: the inside back cover falls on a right page, the back cover on a left.
      if (pages.length % 2 === 1) pages.push({ kind: 'blank', spreadOnly: true });
      pages.push({ kind: 'endpaper', spreadOnly: true, back: true });
    }
    pages.push({ kind: 'backcover' });
    pages.forEach((p, i) => { p.side = side(i, geo, true); });

    const outline = doc.chapters.map((ch, i) => ({ n: i + 1, title: ch.title, page: chapterPage.get(ch.id) }));
    if (doc.appendix.length) outline.push({ n: null, title: doc.appendix[0].title, page: chapterPage.get('APPENDIX') });
    return finish(pages, doc, outline);
  } finally {
    measurer.parentElement.remove();
  }
}

function side(i, geo, book) {
  if (geo.mode !== 'spread') return 'right';
  return (book ? i % 2 === 0 : i % 2 === 0) ? 'right' : 'left';
}

function finish(pages, doc, outline) {
  pages.forEach((p, i) => { p.index = i; });
  if (!outline.length) {
    pages.forEach((p, i) => { if (p.kind === 'flow' && p.blocks[0]?.t === 'chapter') outline.push({ n: outline.length + 1, title: p.blocks[0].title, page: i }); });
  }
  return { pages, outline };
}

/** The page holding a given block (for keeping one's place across re-layouts). */
export function pageOfBlock(pages, bid) {
  if (bid == null) return 0;
  let best = 0;
  for (const p of pages) {
    if (p.kind !== 'flow') continue;
    const first = p.blocks.find(b => b.bid != null)?.bid;
    if (first != null && first <= bid) best = p.index;
  }
  return best;
}
export const firstBlockOf = page => page?.blocks?.find(b => b.bid != null)?.bid ?? null;
