// The library: the eight stage handbooks on a shelf, and the catalogue of every
// form and checklist, filed by drawer.

import { h, icons } from '../core/dom.js';
import { loadSite, dye, dyeInk } from '../core/data.js';
import { topbar } from '../ui/chrome.js';
import { sheetCard } from './cards.js';
import { go } from '../core/router.js';

function shelf(site) {
  const max = Math.max(...site.stages.map(s => s.counts.objects));
  return h('div', { class: 'shelf' },
    h('div', { class: 'shelf__scroll' }, h('div', { class: 'shelf__books' }, site.stages.map(st => h('a', {
      class: 'spine', href: `#/stage/${st.id}`,
      style: { '--w': `${(30 + (st.counts.objects / max) * 46).toFixed(1)}px`, '--dye': dye(st.id), '--dye-ink': dyeInk(st.id) },
      'aria-label': `Stage ${st.id}, ${st.name_en}`, title: st.name_en,
    },
      h('span', { class: 'spine__band spine__band--top', 'aria-hidden': 'true' }),
      h('span', { class: 'spine__n' }, st.id),
      h('span', { class: `spine__title${[...st.name_ja].length > 9 ? ' is-long' : ''}`, lang: 'ja' }, st.name_ja),
      h('span', { class: 'spine__band spine__band--bottom', 'aria-hidden': 'true' }))))),
    h('div', { class: 'shelf__ledge', 'aria-hidden': 'true' }));
}

export async function libraryView(view, group = null) {
  const site = await loadSite();
  let kind = 'all', query = '';
  const drawerKeys = ['shared', ...site.stages.map(s => `stage_${s.id}`)];
  const name = g => (g === 'shared' ? 'Shared' : `Stage ${g.slice(-2)}`);

  const grid = h('div', { class: 'cards cards--library' });
  const count = h('p', { class: 'lib-count', 'aria-live': 'polite' });

  function paint() {
    const q = query.trim().toLowerCase();
    const items = site.library.filter(x =>
      (!group || x.group === group) &&
      (kind === 'all' || x.kind === kind) &&
      (!q || x.title.toLowerCase().includes(q) || x.id.toLowerCase().includes(q) || (x.intended_use || '').toLowerCase().includes(q)));
    grid.replaceChildren(...items.map(x => sheetCard(x, `/library/doc/${x.id}`)));
    count.textContent = `${items.length} of ${site.library.length}`;
    for (const b of drawerBar.querySelectorAll('[data-group]')) b.setAttribute('aria-pressed', String((b.dataset.group || null) === group));
    for (const b of kindBar.querySelectorAll('[data-kind]')) b.setAttribute('aria-pressed', String(b.dataset.kind === kind));
  }

  const drawerBar = h('div', { class: 'filter', role: 'group', 'aria-label': 'Drawer' },
    h('button', { type: 'button', class: 'filter__btn', dataset: { group: '' }, on: { click: () => go('/library', { replace: true }) } }, 'All'),
    drawerKeys.map(g => h('button', { type: 'button', class: 'filter__btn', dataset: { group: g }, on: { click: () => go(`/library/${g}`, { replace: true }) } }, name(g))));
  const kindBar = h('div', { class: 'filter', role: 'group', 'aria-label': 'Kind' },
    [['all', 'Forms and checklists'], ['document_template', 'Forms'], ['checklist_definition', 'Checklists']].map(([k, label]) =>
      h('button', { type: 'button', class: 'filter__btn', dataset: { kind: k }, on: { click: () => { kind = k; paint(); } } }, label)));
  const search = h('input', { class: 'filter__search', id: 'library-filter', type: 'search', placeholder: 'Filter', 'aria-label': 'Filter forms and checklists', on: { input: e => { query = e.target.value; paint(); } } });

  view.append(topbar('library'),
    h('main', { class: 'lib wrap' },
      h('section', { class: 'lib-sec', 'aria-labelledby': 'hb-h' }, h('h1', { class: 'ws-title', id: 'hb-h' }, 'Handbooks'), shelf(site)),
      h('section', { class: 'lib-sec', 'aria-labelledby': 'fc-h' },
        h('h2', { class: 'ws-title ws-title--small', id: 'fc-h' }, 'Forms and checklists'),
        h('div', { class: 'lib-tools' }, drawerBar, h('div', { class: 'lib-tools__row' }, kindBar, h('label', { class: 'filter__field' }, icons.search(), search), count)),
        grid)));
  paint();
  document.title = 'Library · Operations OS';
}
