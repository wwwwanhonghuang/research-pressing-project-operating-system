// The task assistant: everything needed to do one task of one project, in one place.
// The procedure as steps to tick, the documents to produce, the criteria to check,
// the standards and ethics that apply, and the AI prompt to start from.

import { h, icons, inline } from '../core/dom.js';
import { api, workspace, debounce } from '../core/api.js';
import { loadStage, kindLabel } from '../core/data.js';
import { TASK_STATUS, DOC_STATUS } from '../core/status.js';
import { go, withFrom } from '../core/router.js';
import { topbar } from '../ui/chrome.js';
import { crumbs, chip, statusSelect, guessLang, saveState, toast, workspaceMissing } from './ws.js';

export async function taskView(view, pid, sid, tid) {
  const main = h('main', { class: 'ws wrap' });
  view.append(topbar('projects'), main);
  if (!(await workspace())) { main.append(workspaceMissing()); return; }
  const [data, bundle] = await Promise.all([api.getProject(pid), loadStage(sid)]);
  const key = bundle.collection.tasks.find(k => k.startsWith(`${tid}@`));
  if (!key) throw new Error(`Stage ${sid} has no task ${tid}.`);
  const task = bundle.objects[key];
  const d = task.data;
  const proc = bundle.objects[`${d.procedure_ref.id}@${d.procedure_ref.version}`];
  const prompt = Object.values(bundle.objects).find(o => o.kind === 'ai_assist' && o.data.task_id === tid);
  const p = data.project;
  const here = `/p/${pid}/s/${sid}/t/${tid}`;
  document.title = `${tid} · ${p.title} · Operations OS`;

  const run = data.tasks[sid]?.[tid] ?? { status: 'not_started', steps: {}, criteria: {}, notes: '' };
  run.steps ||= {}; run.criteria ||= {};

  // ---------------------------------------------------------------- saving
  const saver = saveState();
  const persist = async () => {
    saver.saving();
    try {
      const saved = await api.putTask(pid, sid, tid, { task_version: task.version, status: run.status, steps: run.steps, criteria: run.criteria, notes: run.notes });
      Object.assign(run, saved);
      saver.saved();
    } catch (err) { saver.failed(err.message); }
  };
  const save = debounce(persist, 500);

  const status = statusSelect('task-status', TASK_STATUS, run.status, async value => { run.status = value; await persist(); });
  const startWork = () => {
    if (run.status !== 'not_started') return;
    run.status = 'in_progress';
    status.value = 'in_progress'; status.className = 'st-select is-in_progress';
  };

  // ---------------------------------------------------------------- procedure
  const steps = proc?.data.steps ?? [];
  const overall = new Set(proc?.data.outputs ?? []);
  const progress = h('span', { class: 'panel__meta' });
  const paintProgress = () => { progress.textContent = `${steps.filter(s => run.steps[s.id]).length} of ${steps.length} done`; };
  paintProgress();
  const stepList = h('ol', { class: 'steps' }, steps.map((s, i) => {
    const box = tick(!!run.steps[s.id], `Step ${i + 1}`, on => {
      run.steps[s.id] = on; if (on) startWork(); paintProgress(); save();
    });
    return h('li', { class: 'stp' },
      box,
      h('span', { class: 'stp__n' }, String(i + 1)),
      h('span', { class: 'stp__body' },
        h('span', { class: 'stp__text', lang: 'ja' }, inline(s.instruction, 'ja')),
        s.expected_output && !overall.has(s.expected_output) ? h('span', { class: 'stp__out', lang: 'ja' }, s.expected_output) : null),
      s.evidence_needed ? h('span', { class: 'stp__ev', title: 'Record evidence for this step' }, 'evidence') : null);
  }));

  // ---------------------------------------------------------------- documents to produce
  const docsFor = tplId => data.documents.filter(x => x.template_id === tplId && x.task_id === tid);
  const produceRow = ref => {
    const tpl = bundle.objects[`${ref.id}@${ref.version}`];
    const existing = docsFor(ref.id);
    const start = h('button', { class: 'button button--quiet button--small', type: 'button' }, existing.length ? 'Start another' : 'Start');
    start.addEventListener('click', async () => {
      start.disabled = true;
      try {
        const doc = await api.createDocument(pid, { template_id: ref.id, template_version: ref.version, stage_id: sid, task_id: tid });
        startWork(); await persist();
        go(`/p/${pid}/d/${doc.id}`);
      } catch (err) { toast(err.message, 'error'); start.disabled = false; }
    });
    return h('li', { class: 'prod' },
      h('span', { class: 'prod__kind' }, tpl ? kindLabel(tpl) : ref.kind),
      h('span', { class: 'prod__main' },
        h('a', { class: 'prod__title', lang: 'ja', href: `#${withFrom(`/stage/${sid}/doc/${ref.id}`, here)}`, title: 'Read the blank definition' }, tpl?.data.title_ja ?? ref.id),
        h('span', { class: 'prod__id' }, `${ref.id} · v${ref.version}`),
        existing.length ? h('span', { class: 'prod__docs' }, existing.map(x => h('a', { href: `#/p/${pid}/d/${x.id}`, class: 'prod__doc' }, x.id, ' ', chip(x.status, DOC_STATUS[x.status])))) : null),
      start);
  };
  const forms = [...d.document_template_refs, ...d.checklist_refs];

  // ---------------------------------------------------------------- criteria and notes
  const criteria = h('ul', { class: 'crit' }, (d.acceptance_criteria || []).map((c, i) => {
    const id = `C${i + 1}`;
    return h('li', null, tick(!!run.criteria[id], `Criterion ${i + 1}`, on => { run.criteria[id] = on; save(); }), h('span', { lang: 'ja' }, c));
  }));
  const notes = h('textarea', { class: 'inp note', id: 'task-notes', rows: '6', placeholder: 'Working notes, open questions, links to sources' }, run.notes || '');
  notes.addEventListener('input', () => { run.notes = notes.value; save(); });

  // ---------------------------------------------------------------- guidance and AI
  const link = (ref, label) => {
    const rec = bundle.objects[`${ref.id}@${ref.version}`];
    return h('li', null, h('a', { class: 'glink', href: `#${withFrom(`/stage/${sid}/doc/${ref.id}`, here)}` },
      h('span', { class: 'glink__kind' }, label), h('span', { lang: 'ja' }, rec?.data.title?.ja ?? ref.id)));
  };
  const promptPanel = prompt ? aiPanel(prompt, task, proc) : null;

  main.append(
    crumbs(['Projects', '/'], [p.title, `/p/${pid}`, guessLang(p.title)], [`Stage ${sid}`, `/p/${pid}/s/${sid}`], [tid, null]),
    h('header', { class: 'ws-head' },
      h('div', { class: 'ws-head__text' },
        h('div', { class: 'ws-eyebrow' }, `Task · ${tid} · `, h('span', { class: 'ws-ver' }, `v${task.version}`)),
        h('h1', { class: 'ws-title ws-title--ja', lang: 'ja' }, d.title.ja),
        h('p', { class: 'ws-meta' }, 'Responsible ', h('span', { lang: 'ja' }, d.responsible_role),
          d.review_roles?.length ? [' · Reviewed by ', h('span', { lang: 'ja' }, d.review_roles.join('、'))] : null,
          d.requires_human_decision ? ' · needs a human decision' : null)),
      h('div', { class: 'ws-status-group' }, h('label', { class: 'ws-status' }, h('span', null, 'Task status'), status), saver.el)),
    h('div', { class: 'ws-grid' },
      h('div', { class: 'ws-grid__main' },
        h('section', { class: 'panel paper' },
          h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title' }, 'Procedure'), progress),
          steps.length ? stepList : h('p', { class: 'quiet' }, 'No procedure steps are defined.'),
          proc?.data.exception_handling?.length ? h('details', { class: 'exc' }, h('summary', null, 'Exceptions and escalation'),
            h('ul', { lang: 'ja' }, proc.data.exception_handling.map(x => h('li', null, x)))) : null),
        forms.length ? h('section', { class: 'panel paper' },
          h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title' }, 'Documents to produce')),
          h('ul', { class: 'prods' }, forms.map(produceRow))) : null,
        d.acceptance_criteria?.length ? h('section', { class: 'panel paper' },
          h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title' }, 'Acceptance criteria'), h('span', { class: 'panel__meta' }, 'a self-check, not an approval')),
          criteria) : null,
        h('section', { class: 'panel' }, h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title' }, 'Notes')), notes)),
      h('aside', { class: 'ws-grid__side' },
        h('section', { class: 'panel' },
          h('h2', { class: 'panel__title' }, 'Inputs'), h('ul', { class: 'plain', lang: 'ja' }, (d.inputs || []).map(x => h('li', null, x))),
          h('h2', { class: 'panel__title panel__title--next' }, 'Outputs'), h('ul', { class: 'plain', lang: 'ja' }, (d.outputs || []).map(x => h('li', null, x)))),
        promptPanel,
        h('section', { class: 'panel' },
          h('h2', { class: 'panel__title' }, 'Guidance'),
          h('ul', { class: 'glinks' },
            d.standard_refs.map(r => link(r, 'Standard')),
            d.ethics_refs.map(r => link(r, 'Ethics')),
            link(d.procedure_ref, 'Procedure'),
            h('li', null, h('a', { class: 'glink', href: `#${withFrom(`/stage/${sid}/doc/${tid}`, here)}` }, h('span', { class: 'glink__kind' }, 'Task'), 'Full definition')),
            h('li', null, h('a', { class: 'glink', href: `#${withFrom(`/stage/${sid}/handbook`, here)}` }, h('span', { class: 'glink__kind' }, 'Handbook'), `Stage ${sid}`)))))));

  return () => save.flush();
}

/** A square tick box with a real checkbox role. */
function tick(on, label, onChange) {
  const box = h('button', { class: 'tick', type: 'button', role: 'checkbox', 'aria-checked': String(on), 'aria-label': label });
  box.addEventListener('click', () => {
    const next = box.getAttribute('aria-checked') !== 'true';
    box.setAttribute('aria-checked', String(next));
    onChange(next);
  });
  return box;
}

function promptText(rec) {
  const lines = [rec.data.title, ''];
  for (const b of rec.data.blocks) {
    if (b.kind === 'heading') lines.push('', b.text);
    else if (b.kind === 'list') lines.push(...b.items.map((x, i) => (b.ordered ? `${i + 1}. ${x}` : `- ${x}`)));
    else if (b.kind === 'labelled') lines.push(`${b.label}：${b.text}`);
    else lines.push(b.text);
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function contextText(task, proc) {
  const d = task.data;
  const out = [`Task: ${d.title.ja} (${task.id} v${task.version})`];
  if (d.inputs?.length) out.push(`Inputs: ${d.inputs.join(' / ')}`);
  if (d.outputs?.length) out.push(`Outputs: ${d.outputs.join(' / ')}`);
  if (d.acceptance_criteria?.length) out.push('Acceptance criteria:', ...d.acceptance_criteria.map(x => `- ${x}`));
  if (proc?.data.steps?.length) out.push('Procedure:', ...proc.data.steps.map((s, i) => `${i + 1}. ${s.instruction}`));
  return out.join('\n');
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copied'); }
  catch {
    const area = h('textarea', { class: 'copybuf', 'aria-hidden': 'true' }, text);
    document.body.append(area); area.select();
    try { document.execCommand('copy'); toast('Copied'); } catch { toast('Select the text to copy it', 'error'); }
    area.remove();
  }
}

function aiPanel(rec, task, proc) {
  const body = h('div', { class: 'ai__body', lang: 'ja', tabindex: '0' }, promptText(rec));
  return h('section', { class: 'panel paper ai' },
    h('div', { class: 'panel__head' }, h('h2', { class: 'panel__title' }, 'AI assistance'), h('span', { class: 'panel__meta' }, rec.id)),
    h('p', { class: 'ai__title', lang: 'ja' }, rec.data.title),
    body,
    h('div', { class: 'ai__actions' },
      h('button', { class: 'button button--quiet button--small', type: 'button', on: { click: () => copy(promptText(rec)) } }, 'Copy prompt'),
      h('button', { class: 'button button--quiet button--small', type: 'button', on: { click: () => copy(`${promptText(rec)}\n\n---\n${contextText(task, proc)}`) } }, 'Copy with task context')),
    h('p', { class: 'ai__note' }, 'Drafting support only. Share only material you are permitted to send, and check every output yourself.'));
}
