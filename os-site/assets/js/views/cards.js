// A document as a small sheet of paper on the desk. The thumbnail is drawn from
// the definition itself: a form shows its real sections and writing lines, a
// checklist its boxes, a standard its opening words.

import { h } from '../core/dom.js';
import { kindLabel } from '../core/data.js';

function preview(item) {
  if (!item.preview?.length) return null;
  return h('span', { class: 'thumb', 'aria-hidden': 'true' }, item.preview.slice(0, 8).map(p => {
    if (p.t === 'section') return h('span', { class: 'thumb__sec', lang: 'ja' }, p.text);
    if (p.t === 'check') return h('span', { class: 'thumb__check' }, h('span', { class: 'thumb__box' }), h('span', { lang: 'ja' }, p.text));
    if (p.t === 'table') return h('span', { class: 'thumb__table' }, h('span', { class: 'thumb__label', lang: 'ja' }, p.text), h('span', { class: 'thumb__grid' }));
    return h('span', { class: `thumb__field is-${p.t}` }, h('span', { class: 'thumb__label', lang: 'ja' }, p.text), h('span', { class: 'thumb__line' }));
  }));
}

export function sheetCard(item, route, { index = false } = {}) {
  const isForm = item.kind === 'document_template' || item.kind === 'checklist_definition';
  const label = kindLabel(item);
  const count = item.kind === 'checklist_definition' ? `${item.items ?? ''} checks`
    : item.kind === 'document_template' ? `${item.fields ?? ''} fields`
    : item.kind === 'knowledge_entry' && item.sources ? `${item.sources} source${item.sources > 1 ? 's' : ''}` : null;
  return h('a', { class: `sheetcard${index ? ' sheetcard--index' : ''}${isForm ? ' sheetcard--form' : ''}`, href: `#${route}` },
    h('span', { class: `sheetcard__paper paper lit${index ? ' is-index' : ''}` },
      h('span', { class: 'sheetcard__kind' }, h('span', null, label), count ? h('span', null, count) : null),
      h('span', { class: 'sheetcard__title', lang: 'ja' }, item.title),
      isForm ? preview(item) : (item.excerpt ? h('span', { class: 'sheetcard__excerpt', lang: 'ja' }, item.excerpt) : null),
      h('span', { class: 'sheetcard__id' }, `${item.id} · v${item.version}`)));
}
