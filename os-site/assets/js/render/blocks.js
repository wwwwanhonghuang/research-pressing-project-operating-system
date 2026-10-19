// Block → element. One renderer for every surface: the same element is measured
// for pagination, placed on a book page and flowed into a sheet.

import { h, inline } from '../core/dom.js';
import { authWord } from './model.js';
import { KIND } from '../core/data.js';

/** Semantic versions read "v1.2.0"; labels such as "draft" stay as they are. */
export const ver = v => (/^\d/.test(String(v)) ? `v${v}` : String(v));

const FIELD_TYPE = { short_text: 'Short text', long_text: 'Long text', date: 'Date', table: 'Table', choice: 'Choice', number: 'Number', rich_text: 'Text', reference: 'Reference' };

function txt(tag, value, cls) {
  if (!value) return h(tag, { class: cls });
  return h(tag, { class: cls, lang: value.lang }, inline(value.text, value.lang));
}

const R = {
  chapter(b) {
    return h('header', { class: 'b b--chapter', id: b.anchor },
      b.n != null ? h('div', { class: 'chapter__n', 'aria-hidden': 'true' }, String(b.n)) : h('div', { class: 'chapter__n chapter__n--mark', 'aria-hidden': 'true' }, '§'),
      txt('h2', b.title, 'chapter__title'),
      b.id ? h('div', { class: 'chapter__id', translate: 'no' }, b.id) : null);
  },

  pagetitle(b) {
    return h('header', { class: 'b b--pagetitle' }, txt('h2', b.text, 'pagetitle__text'));
  },

  objhead(b) {
    return h('header', { class: `b b--objhead${b.compact ? ' is-compact' : ''}${b.top ? ' is-top' : ''}`, id: b.anchor },
      h('div', { class: 'objhead__kind' },
        h('span', { class: 'objhead__label' }, b.label),
        h('span', { class: 'objhead__id', translate: 'no' }, `${b.id} · ${ver(b.version)}${b.current === false ? ' (archived)' : ''}`)),
      b.compact ? null : txt(b.top ? 'h1' : 'h3', b.title, 'objhead__title'),
      b.top ? h('div', { class: 'objhead__auth' },
        stamp(b.auth),
        h('span', null, [authWord(b.auth.origin), b.auth.normative ? authWord(b.auth.normative) : null, b.lifecycle ? `lifecycle: ${b.lifecycle}` : null].filter(Boolean).join(' · '))) : null);
  },

  h(b) { return txt(`h${Math.min(6, b.level || 3)}`, b.text, `b b--h b--h${b.level || 3}`); },

  p(b) {
    const cls = ['b', 'b--p'];
    if (b.voice) cls.push(`is-${b.voice}`);
    if (b.cont) cls.push('is-cont');
    if (b.split) cls.push('is-split');
    if (b.split && b.mid) cls.push('is-mid');
    return txt('p', b.text, cls.join(' '));
  },

  note(b) { return h('p', { class: 'b b--note', lang: 'en' }, b.text.text); },

  labelled(b) {
    return h('p', { class: 'b b--labelled' }, txt('span', b.label, 'labelled__label'), txt('span', b.text, 'labelled__text'));
  },

  listhead(b) {
    return h('div', { class: 'b b--listhead', lang: 'en' }, b.label.text, h('span', { class: 'listhead__count' }, String(b.count)));
  },

  li(b) {
    return h('li', { class: `b b--li is-${b.style}${b.last ? ' is-last' : ''}`, lang: b.text?.lang, value: b.style === 'num' ? b.n : null },
      b.style === 'check' ? h('span', { class: 'li__box', 'aria-hidden': 'true' }) : null,
      b.text ? inline(b.text.text, b.text.lang) : null);
  },

  meta(b) {
    return h('dl', { class: 'b b--meta' }, b.rows.filter(([, v]) => v && v.text).map(([k, v]) =>
      h('div', { class: 'meta__row' }, h('dt', { lang: 'en' }, k.text), txt('dd', v))));
  },

  step(b) {
    return h('div', { class: `b b--step${b.last ? ' is-last' : ''}` },
      h('span', { class: 'step__n', 'aria-hidden': 'true' }, String(b.n)),
      h('div', { class: 'step__body' },
        txt('p', b.text, 'step__text'),
        b.output ? h('p', { class: 'step__out' }, h('span', { class: 'step__tag', lang: 'en' }, 'Record'), txt('span', b.output)) : null),
      b.evidence ? h('span', { class: 'step__ev', lang: 'en', title: 'Evidence must be recorded for this step' }, 'evidence') : null);
  },

  check(b) {
    return h('div', { class: `b b--check${b.compact ? ' is-compact' : ''}${b.last ? ' is-last' : ''}` },
      h('span', { class: 'check__n', 'aria-hidden': 'true' }, String(b.n)),
      h('div', { class: 'check__body' },
        txt('p', b.text, 'check__text'),
        b.hint && !b.compact ? txt('p', b.hint, 'check__hint') : null,
        b.compact ? null : h('div', { class: 'check__states' },
          b.states.map(st => h('span', { class: `check__state${b.evidenceFor.includes(st.text) ? ' needs-evidence' : ''}`, lang: st.lang },
            h('span', { class: 'check__box', 'aria-hidden': 'true' }), st.text)),
          b.human ? h('span', { class: 'check__human', lang: 'en' }, 'human review') : null)));
  },

  fsection(b) {
    return h('h3', { class: 'b b--fsection' }, h('span', { class: 'fsection__n' }, `${b.n}.`), txt('span', b.title));
  },

  field(b) {
    const head = h('div', { class: 'field__head' },
      txt('span', b.label, 'field__label'),
      h('span', { class: 'field__type', lang: 'en' }, FIELD_TYPE[b.type] ?? b.type, b.required ? h('span', { class: 'field__req' }, ' · required') : null));
    let space;
    if (b.type === 'table') {
      const cols = b.columns.length ? b.columns : [{ text: '', lang: 'en' }];
      space = h('div', { class: 'field__table', style: { '--cols': cols.length } },
        cols.map(c => txt('span', c, 'field__th')),
        Array.from({ length: Math.max(1, b.rows) * cols.length }, () => h('span', { class: 'field__td' })));
    } else if (b.type === 'choice' && b.options.length) {
      space = h('div', { class: 'field__choices' }, b.options.map(o => h('span', { class: 'field__choice', lang: o.lang }, h('span', { class: 'check__box' }), o.text)));
    } else {
      space = h('div', { class: `field__lines is-${b.type}` });
    }
    return h('div', { class: `b b--field is-${b.type}` }, head, b.desc ? txt('p', b.desc, 'field__desc') : null, space);
  },

  source(b) {
    return h('div', { class: `b b--source${b.last ? ' is-last' : ''}` },
      h('span', { class: 'source__n' }, String(b.n)),
      h('div', { class: 'source__body' },
        h('div', { class: 'source__loc' }, inline(b.locator, 'en')),
        h('div', { class: 'source__meta', translate: 'no' }, [b.id, b.accessed ? `accessed ${b.accessed}` : null].filter(Boolean).join(' · ')),
        b.note ? txt('p', b.note, 'source__note') : null));
  },

  ref(b) {
    const inner = [
      h('span', { class: 'ref__kind', lang: 'en' }, b.label.text),
      b.title ? txt('span', b.title, 'ref__title') : h('span', { class: 'ref__title is-missing', lang: 'en' }, 'Not in this bundle'),
      h('span', { class: 'ref__id', translate: 'no' }, `${b.id}${b.version ? ` · ${ver(b.version)}` : ''}`),
    ];
    const cls = `b b--ref${b.last ? ' is-last' : ''}`;
    return b.route ? h('a', { class: cls, href: `#${b.route}` }, inner) : h('div', { class: cls }, inner);
  },

  toc(b) {
    return h('button', { class: `b b--toc${b.level ? ` is-l${b.level}` : ''}`, type: 'button', dataset: { page: b.page } },
      h('span', { class: 'toc__n' }, b.n != null ? String(b.n) : ''),
      txt('span', b.title, 'toc__title'),
      h('span', { class: 'toc__leader', 'aria-hidden': 'true' }),
      h('span', { class: 'toc__page' }, b.folio ?? ''));
  },

  prov(b) {
    return h('div', { class: `b b--prov${b.last ? ' is-last' : ''}` },
      h('span', { class: 'prov__kind', lang: 'en' }, b.label.text),
      h('span', { class: 'prov__id', translate: 'no' }, `${b.id} · v${b.version}`),
      txt('span', b.title, 'prov__title'),
      h('span', { class: 'prov__sha', translate: 'no', title: b.path }, b.sha ? `sha256 ${b.sha.slice(0, 12)}` : ''));
  },
};

/** The authority stamp: a small seal stating what the document is, never more. */
export function stamp(auth) {
  const approved = auth?.approval === 'approved';
  return h('span', { class: `stamp${approved ? ' is-approved' : ''}`, lang: 'en', title: 'Status stated by the source data' },
    h('span', { class: 'stamp__a' }, approved ? 'Approved' : 'Draft'),
    h('span', { class: 'stamp__b' }, approved ? 'record on file' : authWord(auth?.approval ?? 'none')));
}

export function renderBlock(b) {
  const fn = R[b.t];
  if (!fn) return h('p', { class: 'b b--note', lang: 'en' }, `Unknown block ${b.t}`);
  const el = fn(b);
  if (b.bid != null) el.dataset.bid = b.bid;
  return el;
}

/** Render a run of blocks, gathering consecutive list items into real lists. */
export function renderRun(blocks, target) {
  let list = null, listId = null;
  for (const b of blocks) {
    if (b.t === 'li') {
      if (!list || listId !== b.list) {
        list = h(b.style === 'num' ? 'ol' : 'ul', { class: `blist is-${b.style}`, start: b.style === 'num' && b.n > 1 ? b.n : null });
        listId = b.list;
        target.append(list);
      }
      list.append(renderBlock(b));
      continue;
    }
    list = null; listId = null;
    target.append(renderBlock(b));
  }
  return target;
}

export const KEEP_WITH_NEXT = new Set(['chapter', 'objhead', 'h', 'listhead', 'fsection', 'pagetitle']);
export { KIND };
