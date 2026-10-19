// The card catalogue: every form and checklist, filed by drawer.

import { h, icons } from '../core/dom.js';
import { loadSite } from '../core/data.js';
import { topbar, footer } from '../ui/chrome.js';
import { sheetCard } from './cards.js';
import { go } from '../core/router.js';

export async function libraryView(view, group = null) {
  const site = await loadSite();
  let kind = 'all', query = '';
  const drawerKeys = ['shared', ...site.stages.map(s => `stage_${s.id}`)];
  const name = g => g === 'shared' ? 'Shared' : `Stage ${g.slice(-2)}`;

  const grid = h('div', { class: 'cards cards--library' });
  const count = h('p', { class: 'lib-count', 'aria-live': 'polite' });

  function paint() {
    const q = query.trim().toLowerCase();
    const items = site.library.filter(x =>
      (!group || x.group === group) &&
      (kind === 'all' || x.kind === kind) &&
      (!q || x.title.toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || (x.intended_use || '').toLowerCase().includes(q)));
    grid.replaceChildren(...items.map(x => sheetCard(x, `/library/doc/${x.id}`)));
    count.textContent = `${items.length} of ${site.library.length} definitions${group ? ` in the ${name(group).toLowerCase()} drawer` : ''}.`;
    for (const b of drawerBar.querySelectorAll('[data-group]')) b.setAttribute('aria-pressed', String((b.dataset.group || null) === group || (!b.dataset.group && !group)));
    for (const b of kindBar.querySelectorAll('[data-kind]')) b.setAttribute('aria-pressed', String(b.dataset.kind === kind));
  }

  const drawerBar = h('div', { class: 'filter', role: 'group', 'aria-label': 'Drawer' },
    h('button', { type: 'button', class: 'filter__btn', dataset: { group: '' }, on: { click: () => { go('/library', { replace: true }); } } }, 'All drawers'),
    drawerKeys.map(g => h('button', { type: 'button', class: 'filter__btn', dataset: { group: g }, on: { click: () => go(`/library/${g}`, { replace: true }) } }, name(g))));
  const kindBar = h('div', { class: 'filter', role: 'group', 'aria-label': 'Kind' },
    [['all', 'Everything'], ['document_template', 'Forms'], ['checklist_definition', 'Checklists']].map(([k, label]) =>
      h('button', { type: 'button', class: 'filter__btn', dataset: { kind: k }, on: { click: () => { kind = k; paint(); } } }, label)));
  const search = h('input', { class: 'filter__search', id: 'library-filter', type: 'search', placeholder: 'Filter by title, ID or use', 'aria-label': 'Filter forms and checklists', on: { input: e => { query = e.target.value; paint(); } } });

  view.append(topbar('library'),
    h('section', { class: 'lib-head wrap' },
      h('div', { class: 'eyebrow' }, 'Forms and checklists'),
      h('h1', { class: 'lib-head__title' }, 'The card catalogue'),
      h('p', { class: 'lib-head__lead' }, `${site.totals.documents} forms and ${site.totals.checklists} checklists, each a blank, versioned definition. A filled form or a completed checklist is a separate project record, pinned to the version it used.`),
      h('div', { class: 'lib-tools' }, drawerBar, h('div', { class: 'lib-tools__row' }, kindBar, h('label', { class: 'filter__field' }, icons.search(), search))),
      count),
    h('div', { class: 'wrap' }, grid),
    footer(site));
  paint();
  document.title = `Forms and checklists · Operations OS`;
}
