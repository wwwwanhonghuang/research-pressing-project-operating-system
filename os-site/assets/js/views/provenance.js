// The provenance rail beside a definition: where it comes from, what it claims,
// and what points at it. Every value is read from the data; nothing is inferred.

import { h } from '../core/dom.js';
import { kindLabel, routeFor } from '../core/data.js';
import { authWord, authorityOf } from '../render/model.js';

function row(label, value, cls = '') {
  if (value == null || value === '') return null;
  return h('div', { class: `rail__row ${cls}` }, h('dt', null, label), h('dd', null, value));
}

export function provenanceRail(rec, { site, objects = {}, stage = null }) {
  const a = authorityOf(rec);
  const d = rec.data || {};
  const lookup = key => {
    const id = key.split('@')[0];
    const local = objects[key];
    if (local) return { id, title: local.kind === 'ai_assist' ? local.data.title : (local.data.title?.ja ?? local.data.title_ja ?? id), kind: local.kind, stage };
    const hit = site?.search.find(s => s.key === key || s.id === id);
    return hit ? { id, title: hit.title, kind: hit.kind, stage: hit.stage } : { id, title: id, kind: null, stage: null };
  };
  const refs = (rec.referenced_by || []).map(lookup);

  return h('div', { class: 'rail' },
    h('section', { class: 'rail__block' },
      h('h2', { class: 'rail__title' }, 'Provenance'),
      h('dl', { class: 'rail__list' },
        row('Kind', kindLabel(rec)),
        row('Identifier', h('span', { class: 'mono' }, rec.id)),
        row('Version', `${rec.version}${rec.current === false ? ' · archived' : rec.version === 'draft' ? '' : ' · current'}`),
        row('Source file', h('span', { class: 'mono rail__wrap' }, rec.path)),
        row('SHA-256', h('span', { class: 'mono rail__wrap rail__hash' }, rec.sha256)),
        row('Lifecycle', d.lifecycle ?? (rec.kind === 'ai_assist' ? 'draft prompt' : null)))),
    h('section', { class: 'rail__block' },
      h('h2', { class: 'rail__title' }, 'Authority, as declared'),
      h('dl', { class: 'rail__list' },
        row('Origin', authWord(a.origin)),
        row('Normative class', a.normative ? authWord(a.normative) : null),
        row('Institutional approval', a.approval ? authWord(a.approval) : null),
        d.access ? row('Classification', d.access.classification) : null,
        d.access ? row('External AI', d.access.may_share_with_external_ai ? 'may be shared (declared)' : 'not to be shared (declared)') : null),
      h('p', { class: 'rail__note' }, 'These labels describe what the source states about itself. They are not verified by this site, and a completed checklist is never an approval.')),
    refs.length ? h('section', { class: 'rail__block' },
      h('h2', { class: 'rail__title' }, `Referenced by · ${refs.length}`),
      h('ul', { class: 'rail__refs' }, refs.map(r => h('li', null,
        r.kind ? h('a', { href: `#${routeFor({ ...r, stage: r.stage ?? stage })}` },
          h('span', { class: 'rail__ref-kind' }, kindLabel(r)), h('span', { class: 'rail__ref-title', lang: 'ja' }, r.title), h('span', { class: 'mono rail__ref-id' }, r.id))
          : h('span', { class: 'mono' }, r.id))))) : null);
}
