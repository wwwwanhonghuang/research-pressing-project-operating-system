// A filled form or a checklist run, edited on paper. It records work; marking it
// final is the author's statement. Approval is a separate decision by a person.

import { h, inline } from '../core/dom.js';
import { api, workspace, debounce } from '../core/api.js';
import { loadStage, loadTemplates, kindLabel } from '../core/data.js';
import { DOC_STATUS } from '../core/status.js';
import { topbar } from '../ui/chrome.js';
import { crumbs, guessLang, recordDecision, decisionList, saveState, toast, workspaceMissing } from './ws.js';

export async function documentView(view, pid, did) {
  const main = h('main', { class: 'ws wrap ws--doc' });
  view.append(topbar('projects'), main);
  if (!(await workspace())) { main.append(workspaceMissing()); return; }
  const data = await api.getProject(pid);
  const doc = data.documents.find(x => x.id === did);
  if (!doc) throw new Error(`No document ${did} in this project.`);
  const key = `${doc.template_id}@${doc.template_version}`;
  let tpl = doc.stage_id ? (await loadStage(doc.stage_id)).objects[key] : null;
  if (!tpl) tpl = (await loadTemplates()).objects[key];
  if (!tpl) throw new Error(`The definition ${key} is not available.`);
  const t = tpl.data;
  const checklist = tpl.kind === 'checklist_definition';
  const p = data.project;
  document.title = `${did} · ${p.title} · Operations OS`;

  doc.field_values ||= {}; doc.check_results ||= {};

  // ---------------------------------------------------------------- saving
  const saver = saveState();
  const issuesEl = h('span', { class: 'docbar__issues' });
  const persist = async extra => {
    saver.saving();
    try {
      const saved = await api.updateDocument(pid, did, { field_values: doc.field_values, check_results: doc.check_results, title: doc.title, ...extra });
      Object.assign(doc, saved);
      saver.saved();
    } catch (err) { saver.failed(err.message); }
  };
  const save = debounce(() => persist(), 700);
  const changed = () => { paintIssues(); save(); };

  const fields = t.sections.flatMap(s => s.fields || []);
  const items = t.sections.flatMap(s => s.items || []);
  function issues() {
    const out = [];
    for (const f of fields) {
      const v = doc.field_values[f.id];
      const empty = v == null || v === '' || (Array.isArray(v) && !v.some(row => (Array.isArray(row) ? row.some(Boolean) : row)));
      if (f.required && empty) out.push(`“${f.label_ja}” is required`);
    }
    for (const it of items) {
      const r = doc.check_results[it.id];
      if (r && (it.evidence_required_for || []).includes(r.status) && !(r.evidence_refs || []).length) out.push(`item ${it.id.slice(-3)} needs evidence for “${r.status}”`);
    }
    return out;
  }
  function paintIssues() {
    const list = issues();
    issuesEl.textContent = list.length ? `${list.length} to resolve` : 'Complete';
    issuesEl.title = list.join('\n');
    issuesEl.dataset.ok = String(!list.length);
  }

  // ---------------------------------------------------------------- status and title
  const title = h('input', { class: 'docbar__title', id: 'doc-title', value: doc.title, lang: guessLang(doc.title), 'aria-label': 'Document title', maxlength: '200' });
  title.addEventListener('input', () => { doc.title = title.value; title.lang = guessLang(title.value); save(); });
  const seg = h('div', { class: 'seg seg--status', role: 'radiogroup', 'aria-label': 'Document status' },
    Object.entries(DOC_STATUS).map(([k, label]) => h('button', { type: 'button', class: 'seg__btn', role: 'radio', 'aria-checked': String(doc.status === k), dataset: { status: k }, on: {
      click: async () => {
        if (doc.status === k) return;
        await save.flush();
        await persist({ status: k });
        seg.querySelectorAll('.seg__btn').forEach(b => b.setAttribute('aria-checked', String(b.dataset.status === doc.status)));
        toast(`Marked ${DOC_STATUS[doc.status].toLowerCase()}`);
      },
    } }, label)));

  // ---------------------------------------------------------------- the sheet
  const sheet = h('article', { class: 'sheet paper lit fsheet' },
    h('header', { class: 'fsheet__head' },
      h('div', { class: 'fsheet__kind' }, kindLabel(tpl), ' · ', `${t.id} · v${t.version}`, ' · ', did),
      h('h1', { class: 'fsheet__title', lang: 'ja' }, t.title_ja),
      h('p', { class: 'fsheet__note' }, checklist
        ? 'Record each criterion with its evidence. A completed checklist is an observation, not an approval.'
        : 'Marking this document final is your own statement. Approval is a separate decision by the person with that authority.')));
  t.sections.forEach((section, si) => {
    const sec = h('section', { class: 'fsec' }, h('h2', { class: 'fsec__title' }, h('span', { class: 'fsec__n' }, `${si + 1}.`), h('span', { lang: 'ja' }, section.heading_ja)));
    (section.fields || []).forEach(f => sec.append(fieldEditor(f, doc, changed)));
    (section.items || []).forEach((it, i) => sec.append(itemEditor(it, i, doc, changed)));
    sheet.append(sec);
  });

  const docDecisions = data.decisions.filter(x => x.target.kind === 'document' && x.target.id === did);
  const decBox = h('div', null, decisionList(docDecisions, () => did));
  const taskLink = doc.task_id && doc.stage_id ? [doc.task_id, `/p/${pid}/s/${doc.stage_id}/t/${doc.task_id}`] : null;

  main.append(
    crumbs(['Projects', '/'], [p.title, `/p/${pid}`, guessLang(p.title)],
      doc.stage_id ? [`Stage ${doc.stage_id}`, `/p/${pid}/s/${doc.stage_id}`] : null, taskLink, [did, null]),
    h('div', { class: 'docbar' }, title, h('div', { class: 'docbar__right' }, issuesEl, saver.el, seg,
      h('button', { class: 'button button--quiet button--small', type: 'button', on: { click: () => recordDecision({
        pid, target: { kind: 'document', id: did }, targetLabel: `${did} · ${doc.title}`,
        onDone: rec => { docDecisions.push(rec); decBox.replaceChildren(decisionList(docDecisions, () => did)); },
      }) } }, 'Record a decision'))),
    sheet,
    h('section', { class: 'ws-sec ws-sec--narrow' }, h('h2', { class: 'ws-h2' }, 'Decisions on this document'), decBox));
  paintIssues();
  return () => save.flush();
}

// ---------------------------------------------------------------- editors

function autoGrow(area) {
  const fit = () => { area.style.height = 'auto'; area.style.height = `${area.scrollHeight + 2}px`; };
  area.addEventListener('input', fit);
  requestAnimationFrame(fit);
  return area;
}

function fieldEditor(f, doc, changed) {
  const id = `f-${f.id}`;
  const value = doc.field_values[f.id];
  const set = v => { doc.field_values[f.id] = v; changed(); };
  let control;
  if (f.type === 'table') {
    control = tableEditor(f, Array.isArray(value) ? value : null, set);
  } else if (f.type === 'choice' && f.options?.length) {
    control = h('div', { class: 'fchoices', role: 'radiogroup', 'aria-labelledby': `${id}-l` }, f.options.map(opt => h('label', { class: 'radio' },
      h('input', { type: 'radio', name: id, value: opt, checked: value === opt ? '' : null, on: { change: () => set(opt) } }), h('span', { lang: 'ja' }, opt))));
  } else if (f.type === 'long_text' || f.type === 'rich_text') {
    control = autoGrow(h('textarea', { class: 'fin fin--long', id, rows: '3', lang: 'ja', on: { input: e => set(e.target.value) } }, value ?? ''));
  } else {
    const type = f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text';
    control = h('input', { class: `fin fin--${f.type}`, id, type, value: value ?? '', lang: 'ja', on: { input: e => set(type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value) } });
  }
  return h('div', { class: `ffield is-${f.type}` },
    h('label', { class: 'ffield__label', for: f.type === 'table' || f.type === 'choice' ? null : id, id: `${id}-l` },
      h('span', { lang: 'ja' }, f.label_ja), f.required ? h('span', { class: 'ffield__req' }, 'required') : null),
    f.description_ja ? h('p', { class: 'ffield__desc', lang: 'ja' }, f.description_ja) : null,
    control);
}

function tableEditor(f, rows, set) {
  const cols = f.columns?.length ? f.columns : ['内容'];
  let data = rows && rows.length ? rows.map(r => (Array.isArray(r) ? [...r] : cols.map(c => r?.[c] ?? ''))) : Array.from({ length: Math.max(1, f.min_rows || 1) }, () => cols.map(() => ''));
  const body = h('tbody');
  const emit = () => set(data.map(r => [...r]));
  function paint() {
    body.replaceChildren(...data.map((row, ri) => h('tr', null,
      cols.map((c, ci) => h('td', null, h('input', { class: 'fin fin--cell', value: row[ci] ?? '', lang: 'ja', 'aria-label': `${c}, row ${ri + 1}`, on: { input: e => { data[ri][ci] = e.target.value; emit(); } } }))),
      h('td', { class: 'ftable__x' }, data.length > 1 ? h('button', { class: 'xbtn', type: 'button', 'aria-label': `Remove row ${ri + 1}`, on: { click: () => { data.splice(ri, 1); paint(); emit(); } } }, '×') : null))));
  }
  paint();
  return h('div', { class: 'ftable' },
    h('div', { class: 'ftable__scroll' }, h('table', null, h('thead', null, h('tr', null, cols.map(c => h('th', { lang: 'ja' }, c)), h('th', { class: 'ftable__x' }))), body)),
    h('button', { class: 'addrow', type: 'button', on: { click: () => { data.push(cols.map(() => '')); paint(); emit(); } } }, '+ Add row'));
}

function itemEditor(it, i, doc, changed) {
  const result = doc.check_results[it.id] || { status: it.status_options?.[0] ?? '未確認', evidence_refs: [], note: '' };
  const commit = () => { doc.check_results[it.id] = { ...result }; paint(); changed(); };
  const warn = h('span', { class: 'fitem__warn', 'aria-live': 'polite' });
  const paint = () => {
    const needs = (it.evidence_required_for || []).includes(result.status) && !(result.evidence_refs || []).length;
    warn.textContent = needs ? 'Evidence is required for this state' : '';
  };
  const states = h('div', { class: 'fstates', role: 'radiogroup', 'aria-label': `State of item ${i + 1}` },
    (it.status_options || []).map(s => h('label', { class: `fstate${(it.evidence_required_for || []).includes(s) ? ' needs-evidence' : ''}` },
      h('input', { type: 'radio', name: `st-${it.id}`, value: s, checked: result.status === s ? '' : null, on: { change: () => { result.status = s; commit(); } } }),
      h('span', { lang: 'ja' }, s))));
  const evidence = h('input', { class: 'fin fin--small', value: (result.evidence_refs || []).join(', '), placeholder: 'Evidence: source IDs, record IDs or links', 'aria-label': `Evidence for item ${i + 1}`,
    on: { input: e => { result.evidence_refs = e.target.value.split(',').map(x => x.trim()).filter(Boolean); commit(); } } });
  const noteIn = h('input', { class: 'fin fin--small', value: result.note || '', placeholder: 'Note', lang: 'ja', 'aria-label': `Note for item ${i + 1}`,
    on: { input: e => { result.note = e.target.value; commit(); } } });
  paint();
  return h('div', { class: 'fitem' },
    h('span', { class: 'fitem__n' }, String(i + 1)),
    h('div', { class: 'fitem__body' },
      h('p', { class: 'fitem__text', lang: 'ja' }, inline(it.criterion_ja, 'ja')),
      it.evidence_hint_ja ? h('p', { class: 'fitem__hint', lang: 'ja' }, it.evidence_hint_ja) : null,
      states,
      h('div', { class: 'fitem__more' }, evidence, noteIn),
      warn));
}
