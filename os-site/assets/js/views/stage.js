// A stage room: its handbook, its tasks in order, and the documents it uses.

import { h, icons, inline } from '../core/dom.js';
import { loadSite, loadStage, dye, dyeInk, kindLabel } from '../core/data.js';
import { topbar, footer } from '../ui/chrome.js';
import { sheetCard } from './cards.js';

export async function stageView(view, sid) {
  const [site, bundle] = await Promise.all([loadSite(), loadStage(sid)]);
  const st = bundle.stage;
  const summary = site.stages.find(s => s.id === sid);
  const obj = key => bundle.objects[key];
  const libById = new Map(site.library.map(x => [x.id, x]));
  const idx = site.stages.findIndex(s => s.id === sid);
  const prev = site.stages[idx - 1], next = site.stages[idx + 1];
  const promptFor = id => Object.values(bundle.objects).find(o => o.kind === 'ai_assist' && o.data.task_id === id);
  const c = bundle.collection;

  // ---------------------------------------------------------------- header
  const pager = h('nav', { class: 'pager', 'aria-label': 'Stages' },
    prev ? h('a', { class: 'pager__step', href: `#/stage/${prev.id}`, 'aria-label': `Previous stage: ${prev.name_en}` }, icons.arrowLeft()) : h('span', { class: 'pager__step is-off' }, icons.arrowLeft()),
    h('ol', { class: 'pager__dots' }, site.stages.map(s => h('li', null, h('a', {
      href: `#/stage/${s.id}`, class: `pager__dot${s.id === sid ? ' is-current' : ''}`, style: { '--dye': dye(s.id) },
      'aria-label': `Stage ${s.id}: ${s.name_en}`, 'aria-current': s.id === sid ? 'page' : null, title: `${s.id} · ${s.name_en}`,
    })))),
    next ? h('a', { class: 'pager__step', href: `#/stage/${next.id}`, 'aria-label': `Next stage: ${next.name_en}` }, icons.arrowRight()) : h('span', { class: 'pager__step is-off' }, icons.arrowRight()));

  const head = h('section', { class: 'stage-head wrap', style: { '--dye': dye(sid) } },
    h('div', { class: 'stage-head__n', 'aria-hidden': 'true' }, sid),
    h('div', { class: 'stage-head__text' },
      h('div', { class: 'eyebrow' }, `Stage ${sid} of ${site.stages.length}`),
      h('h1', { class: 'stage-head__ja', lang: 'ja' }, st.name_ja),
      h('p', { class: 'stage-head__en' }, st.name_en),
      h('p', { class: 'stage-head__obj' }, st.objective)),
    pager);

  // ---------------------------------------------------------------- side
  const hb = bundle.handbook;
  const tome = h('a', { class: 'tome', href: `#/stage/${sid}/handbook`, style: { '--dye': dye(sid), '--dye-ink': dyeInk(sid) }, 'aria-label': 'Open the handbook' },
    h('span', { class: 'tome__pages', 'aria-hidden': 'true' }),
    h('span', { class: 'tome__cover' },
      h('span', { class: 'tome__series' }, 'Operations OS'),
      h('span', { class: 'tome__n' }, sid),
      h('span', { class: 'tome__title', lang: 'ja' }, hb.title),
      h('span', { class: 'tome__foot' }, `${hb.id} · v${hb.version}`)));

  const gate = st.review_gate || {};
  const gateList = gate.handoff_requires || gate.criteria || [];
  const gateCard = h('section', { class: 'gate paper lit', 'aria-labelledby': 'gate-h' },
    h('div', { class: 'gate__head' }, h('h2', { id: 'gate-h' }, 'Review gate'), h('span', { class: 'gate__status' }, (gate.definition_status || 'draft').replace(/_/g, ' '))),
    h('dl', { class: 'gate__list' },
      gate.reviewer_role ? h('div', null, h('dt', null, 'Decided by'), h('dd', { lang: 'ja' }, gate.reviewer_role)) : null,
      h('div', null, h('dt', null, 'Human sign-off to publish'), h('dd', null, gate.human_signoff_required_for_publication ? 'Required' : 'Not at this stage')),
      'human_signoff_required_for_correction_or_removal' in gate ? h('div', null, h('dt', null, 'Human sign-off to correct or remove'), h('dd', null, gate.human_signoff_required_for_correction_or_removal ? 'Required' : 'Not required')) : null,
      'automated_publication' in gate ? h('div', null, h('dt', null, 'Automated publication'), h('dd', null, gate.automated_publication ? 'Allowed' : 'Never')) : null,
      'automated_correction' in gate ? h('div', null, h('dt', null, 'Automated correction'), h('dd', null, gate.automated_correction ? 'Allowed' : 'Never')) : null),
    gateList.length ? h('div', { class: 'gate__label' }, gate.handoff_requires ? 'Hand-off requires' : 'Criteria') : null,
    gateList.length ? h('ul', { class: 'gate__items', lang: 'ja' }, gateList.map(x => h('li', null, inline(x, 'ja')))) : null,
    gate.note ? h('p', { class: 'gate__note', lang: 'ja' }, inline(gate.note, 'ja')) : null);

  const side = h('aside', { class: 'stage-side' },
    h('div', { class: 'stage-side__tome' }, tome,
      h('div', { class: 'tome-meta' },
        h('div', { class: 'tome-meta__title', lang: 'ja' }, hb.title),
        h('div', { class: 'tome-meta__line' }, `${hb.chapters.length} chapters · ${hb.includes} pinned definitions`),
        h('div', { class: 'tome-meta__line mono' }, `${hb.id} · v${hb.version}`)),
      h('a', { class: 'button', href: `#/stage/${sid}/handbook` }, icons.book(), 'Open the handbook')),
    gateCard);

  // ---------------------------------------------------------------- sections
  const tasks = h('ol', { class: 'procession' }, c.tasks.map((key, i) => {
    const t = obj(key); const d = t.data;
    const n = k => (d[k] || []).length;
    const prompt = promptFor(t.id);
    return h('li', { class: 'proc' }, h('a', { href: `#/stage/${sid}/doc/${t.id}` },
      h('span', { class: 'proc__n' }, String(i + 1)),
      h('span', { class: 'proc__main' },
        h('span', { class: 'proc__title', lang: 'ja' }, d.title.ja),
        h('span', { class: 'proc__meta' },
          h('span', null, 'Responsible '), h('span', { lang: 'ja' }, d.responsible_role),
          d.requires_human_decision ? h('span', { class: 'proc__human' }, 'human decision') : null),
        d.outputs?.length ? h('span', { class: 'proc__out', lang: 'ja' }, d.outputs.join('、')) : null),
      h('span', { class: 'proc__links' },
        h('span', null, t.id),
        h('span', null, [`1 procedure`, n('document_template_refs') && `${n('document_template_refs')} form${n('document_template_refs') > 1 ? 's' : ''}`,
          n('checklist_refs') && `${n('checklist_refs')} checklist${n('checklist_refs') > 1 ? 's' : ''}`,
          `${n('standard_refs') + n('ethics_refs')} standards & ethics`, prompt && 'AI prompt'].filter(Boolean).join(' · ')))));
  }));

  const grid = (keys, opts = {}) => h('div', { class: 'cards' }, keys.map(k => obj(k)).filter(Boolean).map(rec =>
    sheetCard({ ...rec, ...(libById.get(rec.id) || {}), kind: rec.kind, stage: sid, title: titleOf(rec), excerpt: excerptOf(rec) },
      `/stage/${sid}/doc/${rec.id}`, opts)));

  const groupOf = key => libById.get(obj(key)?.id)?.group;
  const own = keys => keys.filter(k => groupOf(k) === `stage_${sid}`);
  const shared = keys => keys.filter(k => groupOf(k) !== `stage_${sid}`);

  const sections = [
    ['tasks', 'Tasks', c.tasks.length, 'In the order the stage descriptor lists them. Each task links its procedure, forms, checklists, standards, ethics guidance and AI prompt.', tasks],
    ['standards', 'Standards', c.standards.length, 'Reusable practice for this stage, with the public sources each one consulted.', grid(c.standards)],
    ['ethics', 'Ethics guidance', c.ethics.length, 'The judgments that need care, and why.', grid(c.ethics)],
    ['forms', 'Forms', c.forms.length, null, h('div', null,
      own(c.forms).length ? h('h3', { class: 'subhead' }, `Specific to stage ${sid}`) : null, own(c.forms).length ? grid(own(c.forms)) : null,
      h('h3', { class: 'subhead' }, 'Shared with other stages'), grid(shared(c.forms)))],
    ['checklists', 'Checklists', c.checklists.length, 'Definitions only. A completed checklist records an observation and never stands in for an approval.', h('div', null,
      own(c.checklists).length ? h('h3', { class: 'subhead' }, `Specific to stage ${sid}`) : null, own(c.checklists).length ? grid(own(c.checklists)) : null,
      shared(c.checklists).length ? h('h3', { class: 'subhead' }, 'Shared with other stages') : null, shared(c.checklists).length ? grid(shared(c.checklists)) : null)],
    ['ai', 'AI assistance', c.prompts.length, 'One prompt per task, for drafting support. A named person checks every output.', grid(c.prompts, { index: true })],
  ];

  const tabs = h('nav', { class: 'stage-tabs', 'aria-label': 'On this page' }, sections.map(([id, label, n]) =>
    h('a', { href: `#${id}`, on: { click: e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } } },
      label, h('span', null, String(n)))));

  const main = h('div', { class: 'stage-main' }, tabs, sections.map(([id, label, n, lead, content]) =>
    h('section', { class: 'stage-sec', id, 'aria-labelledby': `${id}-h` },
      h('div', { class: 'section-head' }, h('h2', { id: `${id}-h` }, label, h('span', { class: 'section-head__n' }, String(n))), lead ? h('p', null, lead) : null),
      content)));

  view.append(topbar('stage'), head, h('div', { class: 'stage-body wrap' }, side, main), footer(site));
  document.title = `Stage ${sid} · ${st.name_en} · Operations OS`;
  return summary;
}

export function titleOf(rec) {
  const d = rec.data || {};
  if (rec.kind === 'ai_assist') return d.title;
  return d.title?.ja ?? d.title_ja ?? (typeof d.title === 'string' ? d.title : rec.id);
}

export function excerptOf(rec) {
  const d = rec.data || {};
  if (rec.kind === 'knowledge_entry') return d.blocks?.find(b => b.kind === 'paragraph')?.text ?? '';
  if (rec.kind === 'ai_assist') return d.blocks?.find(b => ['paragraph', 'quote', 'labelled'].includes(b.kind))?.text ?? '';
  return '';
}

export { kindLabel };
