// A page as an element. Geometry comes from CSS variables set here, typography
// from doc.css, and the paper's light from the shared light tokens.

import { h, s, inline, icons } from '../core/dom.js';
import { renderRun, stamp } from './blocks.js';
import { authWord } from './model.js';
import { dye, dyeInk } from '../core/data.js';

let patternId = 0;

/** Seigaiha (青海波): rows of concentric waves, each row overlapping the one above. */
function seigaiha() {
  const id = `seigaiha-${++patternId}`;
  const waves = [];
  for (const [cx, cy] of [[0, 0], [40, 0], [20, 10], [0, 20], [40, 20], [20, 30]]) {
    for (const r of [19, 15, 11, 7, 3]) waves.push(s('circle', { class: 'ep-ring', cx, cy, r }));
  }
  return s('svg', { class: 'endpaper__art', 'aria-hidden': 'true' },
    s('defs', null, s('pattern', { id, patternUnits: 'userSpaceOnUse', width: '40', height: '20', patternTransform: 'scale(0.82)' }, ...waves)),
    s('rect', { width: '100%', height: '100%', fill: `url(#${id})` }));
}

function txt(tag, value, cls) {
  return value ? h(tag, { class: cls, lang: value.lang }, inline(value.text, value.lang)) : null;
}

function frame(page, geo, extraClass = '') {
  return h('article', {
    class: `pg paper pg--${page.kind} pg--${page.side}${extraClass}`,
    style: {
      '--pw': `${geo.W}px`, '--ph': `${geo.H}px`, '--mt': `${geo.m.top}px`, '--mb': `${geo.m.bottom}px`,
      '--mi': `${geo.m.inner}px`, '--mo': `${geo.m.outer}px`, '--fs': `${geo.fontPx}px`,
    },
    'aria-label': page.folio ? `Page ${page.folio}` : null,
  });
}

const light = () => h('div', { class: 'pg__light', 'aria-hidden': 'true' });

export function renderPage(page, ctx) {
  const { doc, geo } = ctx;
  const sid = doc.stage?.id ?? '00';
  const k = page.kind;

  if (k === 'cover' || k === 'backcover') {
    const el = frame(page, geo, ' board');
    el.style.setProperty('--board-dye', sid === '00' ? 'var(--board)' : dye(sid));
    el.style.setProperty('--board-dye-ink', sid === '00' ? 'var(--board-ink)' : dyeInk(sid));
    if (k === 'cover') {
      el.append(
        h('div', { class: 'cover__cloth', 'aria-hidden': 'true' }),
        h('div', { class: 'cover__frame' },
          h('div', { class: 'cover__top' },
            h('span', { class: 'cover__series' }, 'Operations OS'),
            h('span', { class: 'cover__series' }, sid === '00' ? 'Library' : `Stage ${sid} of 8`)),
          h('div', { class: 'cover__n' }, sid === '00' ? 'Aa' : sid),
          txt('h1', doc.title, 'cover__title'),
          txt('div', doc.subtitle, 'cover__sub'),
          h('div', { class: 'cover__foot' }, `${doc.id} · v${doc.version}`)),
        light());
    } else {
      el.append(h('div', { class: 'cover__cloth', 'aria-hidden': 'true' }),
        h('div', { class: 'back__mark' }, icons.mark(), h('div', null, 'Operations OS'), h('div', { class: 'back__room' }, 'Reading Room'),
          doc.digest ? h('div', { class: 'back__digest' }, `source digest ${doc.digest.slice(0, 16)}`) : null), light());
    }
    return el;
  }

  if (k === 'endpaper' || k === 'blank') {
    const el = frame(page, geo, k === 'endpaper' ? ' endpaper' : '');
    el.style.setProperty('--board-dye', sid === '00' ? 'var(--board)' : dye(sid));
    if (k === 'endpaper') el.append(seigaiha());
    el.append(light());
    return el;
  }

  if (k === 'title') {
    const el = frame(page, geo);
    el.append(h('div', { class: 'tp' },
      h('div', { class: 'tp__eyebrow' }, `Operations OS · Stage ${sid}`),
      txt('h1', doc.title, 'tp__title'),
      txt('div', doc.subtitle, 'tp__sub'),
      h('div', { class: 'tp__rule', 'aria-hidden': 'true' }),
      doc.authority?.approval !== null ? stamp(doc.authority) : null,
      h('div', { class: 'tp__foot' }, `${doc.id} · version ${doc.version}`)), light());
    return el;
  }

  if (k === 'edition') {
    const el = frame(page, geo);
    const a = doc.authority || {};
    el.append(h('div', { class: 'ed' },
      h('h2', { class: 'ed__title' }, 'About this edition'),
      h('dl', { class: 'ed__list' },
        row('Origin', authWord(a.origin)),
        a.normative ? row('Normative class', authWord(a.normative)) : null,
        a.approval != null ? row('Institutional approval', authWord(a.approval)) : null,
        doc.audience ? h('div', null, h('dt', null, 'Written for'), txt('dd', doc.audience)) : null),
      a.note ? h('div', { class: 'ed__note' }, h('div', { class: 'ed__label' }, 'Applicability, as stated by the source'), txt('p', { text: a.note, lang: 'ja' })) : null,
      doc.note ? h('p', { class: 'ed__p' }, doc.note.text) : null,
      h('p', { class: 'ed__p' }, 'This edition is composed in your browser from the structured source each time it is opened. Its pages are not a PDF and its numbering follows the reading layout.'),
      doc.path ? h('div', { class: 'ed__src' }, h('div', null, doc.path), doc.sha ? h('div', null, `sha256 ${doc.sha}`) : null) : null), light());
    return el;
  }

  if (k === 'colophon') {
    const el = frame(page, geo);
    el.append(h('div', { class: 'colophon' },
      h('div', { class: 'colophon__mark' }, icons.mark()),
      h('h2', null, 'Colophon'),
      h('p', null, 'Set in Shippori Mincho for Japanese, Noto Serif SC for Chinese and EB Garamond for English and French, with IBM Plex Mono for identifiers. Display numerals in Cormorant Garamond.'),
      h('p', null, 'Composed from version-pinned definitions; every source is listed with its SHA-256. Page turns are computed from the geometry of a fold and lit by the same light as the room.'),
      doc.digest ? h('p', { class: 'colophon__digest' }, `source digest ${doc.digest}`) : null), light());
    return el;
  }

  // A flow page.
  const el = frame(page, geo);
  const head = h('header', { class: 'pg-head' });
  const firstObj = page.blocks.find(b => b.t === 'objhead');
  if (page.side === 'left') head.append(txt('span', doc.title, 'pg-head__title'), h('span', { class: 'pg-head__id' }, firstObj ? firstObj.id : ''));
  else head.append(h('span', { class: 'pg-head__id' }, firstObj ? firstObj.id : ''), txt('span', page.head, 'pg-head__title'));
  const body = h('div', { class: 'pg-body doc doc--page' });
  renderRun(page.blocks, body);
  const foot = h('footer', { class: 'pg-foot' },
    h('span', { class: 'pg-foot__folio' }, page.folio ?? ''),
    h('span', { class: 'pg-foot__meta' }, page.side === 'left' ? `${doc.id} · v${doc.version}` : ''));
  el.append(head, body, foot, light());
  return el;
}

function row(label, value) {
  return h('div', null, h('dt', null, label), h('dd', null, value));
}
