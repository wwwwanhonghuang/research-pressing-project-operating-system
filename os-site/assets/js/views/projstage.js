// One stage of one project: its tasks and their progress, its documents, and the
// review gate, with the stage's handbook a click away.

import { h, icons, inline } from '../core/dom.js';
import { api, workspace, debounce } from '../core/api.js';
import { loadSite, loadStage, dye } from '../core/data.js';
import { STAGE_STATUS, TASK_STATUS, DOC_STATUS, when } from '../core/status.js';
import { withFrom } from '../core/router.js';
import { topbar } from '../ui/chrome.js';
import { crumbs, chip, statusSelect, guessLang, recordDecision, decisionList, saveState, workspaceMissing } from './ws.js';

export async function projectStageView(view, pid, sid) {
  const main = h('main', { class: 'ws wrap' });
  view.append(topbar('projects'), main);
  if (!(await workspace())) { main.append(workspaceMissing()); return; }
  const [site, data, bundle] = await Promise.all([loadSite(), api.getProject(pid), loadStage(sid)]);
  const p = data.project;
  const st = bundle.stage;
  const meta = data.stages[sid] ?? { status: 'not_started' };
  const runs = data.tasks[sid] ?? {};
  const here = `/p/${pid}/s/${sid}`;
  document.title = `Stage ${sid} · ${p.title} · Operations OS`;

  const status = statusSelect('stage-status', STAGE_STATUS, meta.status, value => api.updateStage(pid, sid, { status: value }));

  const tasks = h('ol', { class: 'tasks' }, bundle.collection.tasks.map((key, i) => {
    const t = bundle.objects[key];
    const run = runs[t.id];
    const proc = bundle.objects[`${t.data.procedure_ref.id}@${t.data.procedure_ref.version}`];
    const steps = proc?.data.steps ?? [];
    const ticked = steps.filter(s => run?.steps?.[s.id]).length;
    const docs = data.documents.filter(d => d.task_id === t.id);
    const s = run?.status ?? 'not_started';
    return h('li', null, h('a', { class: `trow is-${s}`, href: `#${here}/t/${t.id}` },
      h('span', { class: 'trow__n' }, String(i + 1)),
      h('span', { class: 'trow__main' },
        h('span', { class: 'trow__title', lang: 'ja' }, t.data.title.ja),
        h('span', { class: 'trow__meta' },
          h('span', { lang: 'ja' }, t.data.responsible_role),
          steps.length ? ` · ${ticked} of ${steps.length} steps` : '',
          docs.length ? ` · ${docs.length} document${docs.length > 1 ? 's' : ''}` : '')),
      chip(s, TASK_STATUS[s] ?? s)));
  }));

  // Stage note, saved as you type.
  const saver = saveState();
  const noteBox = h('textarea', { class: 'inp note', id: 'stage-note', rows: '4', placeholder: 'Notes for this stage' }, meta.note || '');
  const saveNote = debounce(async () => {
    saver.saving();
    try { await api.updateStage(pid, sid, { note: noteBox.value }); saver.saved(); } catch (err) { saver.failed(err.message); }
  });
  noteBox.addEventListener('input', saveNote);

  const gate = st.review_gate || {};
  const gateItems = gate.handoff_requires || gate.criteria || [];
  const stageDecisions = data.decisions.filter(d => d.target.kind === 'stage' && d.target.id === sid);
  const decList = h('div', null, decisionList(stageDecisions, () => `Stage ${sid}`));
  const docs = data.documents.filter(d => d.stage_id === sid);

  main.append(
    crumbs(['Projects', '/'], [p.title, `/p/${pid}`, guessLang(p.title)], [`Stage ${sid}`, null]),
    h('header', { class: 'ws-head ws-head--stage', style: { '--dye': dye(sid) } },
      h('div', { class: 'ws-head__text' },
        h('div', { class: 'ws-eyebrow' }, h('span', { class: 'ws-dye', 'aria-hidden': 'true' }), `Stage ${sid} of ${site.stages.length}`),
        h('h1', { class: 'ws-title ws-title--ja', lang: 'ja' }, st.name_ja),
        h('p', { class: 'ws-en' }, st.name_en),
        h('div', { class: 'ws-links' },
          h('a', { class: 'link', href: `#${withFrom(`/stage/${sid}/handbook`, here)}` }, icons.book(), 'Read the handbook'),
          h('a', { class: 'link', href: `#${withFrom(`/stage/${sid}`, here)}` }, icons.sheet(), 'Stage definitions'))),
      h('label', { class: 'ws-status' }, h('span', null, 'Stage status'), status)),
    h('div', { class: 'ws-grid' },
      h('div', { class: 'ws-grid__main' },
        h('section', { class: 'ws-sec', 'aria-labelledby': 't-h' }, h('h2', { class: 'ws-h2', id: 't-h' }, 'Tasks'), tasks),
        h('section', { class: 'ws-sec', 'aria-labelledby': 'd-h' }, h('h2', { class: 'ws-h2', id: 'd-h' }, 'Documents'),
          docs.length ? h('ul', { class: 'rows' }, docs.map(d => h('li', null, h('a', { class: 'row', href: `#/p/${pid}/d/${d.id}` },
            h('span', { class: 'row__title', lang: guessLang(d.title) }, d.title),
            h('span', { class: 'row__meta' }, `${d.id} · ${d.template_id} · ${when(d.updated_at_utc)}`),
            chip(d.status, DOC_STATUS[d.status] ?? d.status)))))
            : h('p', { class: 'quiet' }, 'Documents are started from a task.'))),
      h('aside', { class: 'ws-grid__side' },
        h('section', { class: 'panel paper' },
          h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title' }, 'Review gate'), gate.reviewer_role ? h('span', { class: 'panel__meta', lang: 'ja' }, gate.reviewer_role) : null),
          gateItems.length ? h('ul', { class: 'gatelist', lang: 'ja' }, gateItems.map(x => h('li', null, inline(x, 'ja')))) : null,
          gate.note ? h('p', { class: 'panel__note', lang: 'ja' }, gate.note) : null,
          h('button', { class: 'button button--quiet button--small', type: 'button', on: { click: () => recordDecision({
            pid, target: { kind: 'stage', id: sid }, targetLabel: `Stage ${sid} · ${st.name_en}`,
            onDone: rec => { stageDecisions.push(rec); decList.replaceChildren(decisionList(stageDecisions, () => `Stage ${sid}`)); },
          }) } }, 'Record a decision'),
          decList),
        h('section', { class: 'panel' },
          h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title' }, 'Stage notes'), saver.el),
          noteBox))));

  return () => saveNote.flush();
}
