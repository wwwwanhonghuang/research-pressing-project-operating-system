// The atrium: the shelf of eight handbooks, the contents, the card catalogue of
// forms and checklists, and the house rules read from the workflow definition.

import { h, inline } from '../core/dom.js';
import { loadSite, dye, dyeInk } from '../core/data.js';
import { topbar, footer } from '../ui/chrome.js';

const RULES = {
  sequential_completion_required: v => v ? 'Stages must be completed in order.' : 'Stages may overlap; completion is not strictly sequential.',
  rework_allowed: v => v ? 'Work may return to an earlier stage.' : 'Work does not return to earlier stages.',
  rework_record_required: v => v ? 'Every return is recorded, with its reason.' : 'Returns need no record.',
  publication_requires_explicit_human_authorization: v => v ? 'Publication requires an explicit human authorization.' : 'Publication needs no explicit authorization.',
  ai_cannot_authorize_publication: v => v ? 'AI cannot authorize publication.' : 'AI may authorize publication.',
  task_dependencies: v => `Task dependencies: ${v}.`,
};

const fmt = n => new Intl.NumberFormat('en').format(n);

export async function atrium(view) {
  const site = await loadSite();
  const t = site.totals;
  const groups = new Map();
  for (const item of site.library) {
    const g = groups.get(item.group) || { forms: 0, checklists: 0 };
    if (item.kind === 'checklist_definition') g.checklists++; else g.forms++;
    groups.set(item.group, g);
  }

  const maxObjects = Math.max(...site.stages.map(s => s.counts.objects));

  const spines = site.stages.map(st => {
    const w = 30 + (st.counts.objects / maxObjects) * 46;
    const el = h('a', {
      class: 'spine', href: `#/stage/${st.id}`, dataset: { stage: st.id },
      style: { '--w': `${w.toFixed(1)}px`, '--dye': dye(st.id), '--dye-ink': dyeInk(st.id) },
      'aria-label': `Stage ${st.id}, ${st.name_en}: ${st.counts.objects} definitions`,
    },
      h('span', { class: 'spine__band spine__band--top', 'aria-hidden': 'true' }),
      h('span', { class: 'spine__n' }, st.id),
      h('span', { class: `spine__title${[...st.name_ja].length > 9 ? ' is-long' : ''}`, lang: 'ja' }, st.name_ja),
      h('span', { class: 'spine__band spine__band--bottom', 'aria-hidden': 'true' }),
      h('span', { class: 'spine__count' }, String(st.counts.objects)));
    return el;
  });

  const rows = site.stages.map(st => h('li', null, h('a', { class: 'crow', href: `#/stage/${st.id}`, dataset: { stage: st.id } },
    h('span', { class: 'crow__n' }, st.id),
    h('span', { class: 'crow__swatch', style: { background: dye(st.id) }, 'aria-hidden': 'true' }),
    h('span', { class: 'crow__names' }, h('span', { class: 'crow__ja', lang: 'ja' }, st.name_ja), h('span', { class: 'crow__en' }, st.name_en)),
    h('span', { class: 'crow__obj' }, st.objective),
    h('span', { class: 'crow__counts' },
      h('span', null, h('b', null, st.counts.tasks), ' tasks'),
      h('span', null, h('b', null, st.counts.standards + st.counts.ethics), ' standards & ethics'),
      h('span', null, h('b', null, st.handbook.chapters), ' chapters')))));

  // Hovering a spine lights its contents row, and the reverse.
  const link = (sid, on) => {
    for (const el of view.querySelectorAll(`[data-stage="${sid}"]`)) el.classList.toggle('is-linked', on);
  };
  for (const el of [...spines, ...rows.map(r => r.firstChild)]) {
    el.addEventListener('pointerenter', () => link(el.dataset.stage, true));
    el.addEventListener('pointerleave', () => link(el.dataset.stage, false));
    el.addEventListener('focus', () => link(el.dataset.stage, true));
    el.addEventListener('blur', () => link(el.dataset.stage, false));
  }

  const drawerOrder = ['shared', ...site.stages.map(s => `stage_${s.id}`)];
  const drawers = drawerOrder.map(g => {
    const c = groups.get(g) || { forms: 0, checklists: 0 };
    const sid = g === 'shared' ? null : g.slice(-2);
    const stage = sid ? site.stages.find(s => s.id === sid) : null;
    return h('a', { class: 'drawer', href: `#/library/${g}` },
      h('span', { class: 'drawer__face' },
        h('span', { class: 'drawer__holder' },
          h('span', { class: 'drawer__card' },
            h('span', { class: 'drawer__name' }, sid ? `Stage ${sid}` : 'Shared'),
            h('span', { class: 'drawer__sub' }, stage ? stage.name_en : 'Used across stages'))),
        h('span', { class: 'drawer__pull', 'aria-hidden': 'true' }),
        h('span', { class: 'drawer__count' }, `${c.forms} forms · ${c.checklists} checklists`)));
  });

  const rules = Object.entries(site.workflow.rules).map(([k, v]) => h('div', { class: 'rule' },
    h('dt', null, `${k}: ${JSON.stringify(v)}`),
    h('dd', null, (RULES[k] || (x => String(x)))(v))));

  view.append(
    topbar('atrium'),
    h('main', { class: 'atrium' },
      h('section', { class: 'hero wrap' },
        h('div', { class: 'hero__text' },
          h('div', { class: 'eyebrow' }, 'Operations OS · Reading Room'),
          h('h1', { class: 'hero__title' }, 'Eight stages,', h('br'), h('em', null, 'one source.')),
          h('p', { class: 'hero__lead' },
            'Research communication work, from the first idea to the last correction, is written once as structured data and read here as books, forms and checklists. ',
            'Every page is set live from that data in the language it was written in. All of it is a first draft, and none of it is institutionally approved.'),
          h('dl', { class: 'hero__stats' },
            stat(fmt(t.operational_objects), 'definitions'),
            stat(fmt(t.templates), 'templates'),
            stat(fmt(t.prompts), 'AI prompts'),
            stat(fmt(t.handbooks), 'handbooks'))),
        h('figure', { class: 'shelf', 'aria-labelledby': 'shelf-h' },
          h('div', { class: 'shelf__scroll' }, h('div', { class: 'shelf__books' }, spines)),
          h('div', { class: 'shelf__ledge', 'aria-hidden': 'true' }),
          h('figcaption', { class: 'shelf__caption' },
            h('span', { class: 'shelf__label', id: 'shelf-h' }, 'The shelf'),
            h('span', null, 'One handbook per stage. A spine is as thick as its stage has definitions; its indigo deepens stage by stage, like cloth taken through successive dye baths.')))),

      h('section', { class: 'wrap contents', 'aria-labelledby': 'contents-h' },
        h('div', { class: 'section-head' }, h('h2', { id: 'contents-h' }, 'Contents')),
        h('ol', { class: 'contents__list' }, rows)),

      h('section', { class: 'wrap catalogue', 'aria-labelledby': 'cat-h' },
        h('div', { class: 'section-head' },
          h('h2', { id: 'cat-h' }, 'Forms and checklists'),
          h('p', null, `${fmt(t.documents)} forms and ${fmt(t.checklists)} checklists, filed in nine drawers: one shared, one for each stage.`)),
        h('div', { class: 'drawers' }, drawers)),

      h('section', { class: 'wrap lower' },
        h('div', { class: 'rules-card' },
          h('div', { class: 'section-head' },
            h('h2', null, 'House rules'),
            h('p', null, 'Read directly from the workflow definition. They hold for every stage.')),
          h('dl', { class: 'rules' }, rules)),
        h('a', { class: 'specimen-card paper lit', href: '#/specimen' },
          h('span', { class: 'specimen-card__glyphs', 'aria-hidden': 'true' },
            h('span', { lang: 'en' }, 'Aa'), h('span', { lang: 'ja' }, '永'), h('span', { lang: 'zh-Hans' }, '书'), h('span', { lang: 'fr' }, '«é»')),
          h('span', { class: 'specimen-card__title' }, 'Typesetting specimen'),
          h('span', { class: 'specimen-card__text' }, 'The same reader sets English, French, Chinese and Japanese: public-domain passages showing hyphenation, French spacing and CJK line breaking.'),
          h('span', { class: 'specimen-card__go' }, 'Open the specimen')))),
    footer(site));

  view.querySelector('.hero__title em')?.setAttribute('lang', 'en');
}

function stat(n, label) {
  return h('div', { class: 'stat' }, h('dt', null, label), h('dd', null, n));
}

export { inline };
