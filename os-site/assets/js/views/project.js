// A project: its eight stages, its documents and the decisions people recorded.

import { h } from '../core/dom.js';
import { api, workspace } from '../core/api.js';
import { loadSite, dye } from '../core/data.js';
import { STAGE_STATUS, DOC_STATUS, currentStage, when } from '../core/status.js';
import { topbar } from '../ui/chrome.js';
import { openDialog, field, note } from '../ui/dialog.js';
import { crumbs, chip, guessLang, decisionList, toast, workspaceMissing } from './ws.js';

export async function projectView(view, pid) {
  const main = h('main', { class: 'ws wrap' });
  view.append(topbar('projects'), main);
  if (!(await workspace())) { main.append(workspaceMissing()); return; }
  const [site, data] = await Promise.all([loadSite(), api.getProject(pid)]);
  const p = data.project;
  document.title = `${p.title} · Operations OS`;

  const stageStates = p.stage_ids.map(id => ({ id, status: data.stages[id]?.status ?? 'not_started' }));
  const at = currentStage(stageStates);
  const docsByStage = sid => data.documents.filter(d => d.stage_id === sid).length;

  const titleEl = h('h1', { class: 'ws-title ws-title--ja', lang: guessLang(p.title) }, p.title);
  const summaryEl = h('p', { class: 'ws-summary', lang: guessLang(p.summary) }, p.summary || '');
  summaryEl.hidden = !p.summary;

  const tiles = h('ol', { class: 'stages' }, site.stages.map(st => {
    const status = data.stages[st.id]?.status ?? 'not_started';
    const runs = Object.values(data.tasks[st.id] || {});
    const done = runs.filter(r => r.status === 'completed' || r.status === 'waived').length;
    const total = st.counts.tasks;
    const docs = docsByStage(st.id);
    return h('li', null, h('a', { class: `stile is-${status}${st.id === at.id ? ' is-current' : ''}`, href: `#/p/${pid}/s/${st.id}`, style: { '--dye': dye(st.id) } },
      h('span', { class: 'stile__top' }, h('span', { class: 'stile__n' }, st.id), chip(status, STAGE_STATUS[status] ?? status)),
      h('span', { class: 'stile__ja', lang: 'ja' }, st.name_ja),
      h('span', { class: 'stile__en' }, st.name_en),
      h('span', { class: 'stile__bar', 'aria-hidden': 'true' }, h('span', { style: { width: `${total ? (done / total) * 100 : 0}%` } })),
      h('span', { class: 'stile__foot' }, `${done} of ${total} tasks`, docs ? ` · ${docs} doc${docs > 1 ? 's' : ''}` : '')));
  }));

  const stageName = sid => site.stages.find(s => s.id === sid)?.name_en ?? sid;
  const docRows = data.documents.length
    ? h('ul', { class: 'rows' }, data.documents.slice().sort((a, b) => (b.updated_at_utc || '').localeCompare(a.updated_at_utc || '')).slice(0, 12).map(d =>
      h('li', null, h('a', { class: 'row', href: `#/p/${pid}/d/${d.id}` },
        h('span', { class: 'row__title', lang: guessLang(d.title) }, d.title),
        h('span', { class: 'row__meta' }, `${d.id} · ${d.stage_id ? `stage ${d.stage_id}` : 'project'} · ${when(d.updated_at_utc)}`),
        chip(d.status, DOC_STATUS[d.status] ?? d.status)))))
    : h('p', { class: 'quiet' }, 'No documents yet. Start one from a task.');

  const describe = d => {
    if (d.target.kind === 'stage') return `Stage ${d.target.id} · ${stageName(d.target.id)}`;
    const doc = data.documents.find(x => x.id === d.target.id);
    return doc ? `${doc.id} · ${doc.title}` : `${d.target.kind} ${d.target.id}`;
  };

  main.append(
    crumbs(['Projects', '/'], [p.title, null, guessLang(p.title)]),
    h('header', { class: 'ws-head ws-head--project' },
      h('div', { class: 'ws-head__text' }, titleEl,
        h('p', { class: 'ws-meta' }, `${p.id} · started ${when(p.created_at_utc)} · updated ${when(p.updated_at_utc || p.created_at_utc)}`),
        summaryEl),
      h('button', { class: 'button button--quiet', type: 'button', on: { click: () => editDetails(pid, p, titleEl, summaryEl) } }, 'Edit details')),
    h('section', { class: 'ws-sec', 'aria-labelledby': 'stages-h' }, h('h2', { class: 'ws-h2', id: 'stages-h' }, 'Stages'), tiles),
    h('div', { class: 'ws-cols' },
      h('section', { class: 'ws-sec', 'aria-labelledby': 'docs-h' }, h('h2', { class: 'ws-h2', id: 'docs-h' }, 'Documents'), docRows),
      h('section', { class: 'ws-sec', 'aria-labelledby': 'dec-h' }, h('h2', { class: 'ws-h2', id: 'dec-h' }, 'Decisions'), decisionList(data.decisions, describe))));
}

function editDetails(pid, p, titleEl, summaryEl) {
  const title = h('input', { class: 'inp', id: 'ed-title', value: p.title, maxlength: '200' });
  const summary = h('textarea', { class: 'inp', id: 'ed-summary', rows: '4', maxlength: '4000' }, p.summary || '');
  const msg = h('p', { class: 'fmsg', hidden: true });
  const save = h('button', { class: 'button', type: 'button' }, 'Save');
  const dlg = openDialog({ title: 'Project details', body: h('div', { class: 'form' }, field('Title', title), field('Purpose', summary), msg),
    actions: [h('button', { class: 'button button--quiet', type: 'button', on: { click: () => dlg.close() } }, 'Cancel'), save] });
  save.addEventListener('click', async () => {
    try {
      const rec = await api.updateProject(pid, { title: title.value, summary: summary.value });
      Object.assign(p, rec);
      titleEl.textContent = rec.title; titleEl.lang = guessLang(rec.title);
      summaryEl.textContent = rec.summary || ''; summaryEl.hidden = !rec.summary;
      dlg.close(); toast('Saved');
    } catch (err) { note(msg, err.message); }
  });
}
