// Shared pieces of the project workspace.

import { h } from '../core/dom.js';
import { api } from '../core/api.js';
import { dye } from '../core/data.js';
import { OUTCOME, STAGE_STATUS, when } from '../core/status.js';
import { openDialog, field, note } from '../ui/dialog.js';

/** Japanese and Chinese titles get their own typeface; anything else is set as English. */
export const guessLang = text => (/[぀-ヿ㐀-鿿]/.test(text || '') ? 'ja' : 'en');

export function crumbs(...items) {
  return h('nav', { class: 'crumbs', 'aria-label': 'Breadcrumb' },
    items.filter(Boolean).map(([label, href, lang]) => href
      ? h('a', { href: `#${href}`, lang }, label)
      : h('span', { 'aria-current': 'page', lang }, label)));
}

/** Eight small swatches, one per stage, that take the stage's dye as work completes. */
export function swatches(stageStates, names = {}) {
  return h('span', { class: 'swatches', role: 'img', 'aria-label': stageStates.map(s => `Stage ${s.id} ${STAGE_STATUS[s.status] ?? s.status}`).join(', ') },
    stageStates.map(s => h('span', { class: `sw is-${s.status}`, style: { '--dye': dye(s.id) }, title: `${s.id} ${names[s.id] ?? ''} · ${STAGE_STATUS[s.status] ?? s.status}` })));
}

export function chip(status, label) {
  return h('span', { class: `st is-${status}` }, h('span', { class: 'st__dot', 'aria-hidden': 'true' }), label);
}

/** A status control: a native select styled as a quiet pill. */
export function statusSelect(id, labels, value, onChange) {
  const select = h('select', { class: `st-select is-${value}`, id, 'aria-label': 'Status' },
    Object.entries(labels).map(([key, label]) => h('option', { value: key, selected: key === value ? '' : null }, label)));
  select.addEventListener('change', async () => {
    const previous = value;
    select.className = `st-select is-${select.value}`;
    try { await onChange(select.value); value = select.value; } catch (err) {
      select.value = previous; select.className = `st-select is-${previous}`;
      toast(err.message, 'error');
    }
  });
  return select;
}

let toastTimer = 0;
export function toast(message, kind = 'ok') {
  let el = document.querySelector('.toast');
  if (!el) { el = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(el); }
  el.textContent = message;
  el.dataset.kind = kind;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), kind === 'error' ? 5000 : 2200);
}

/** The saved / saving indicator used by autosaving forms. */
export function saveState() {
  const el = h('span', { class: 'savestate', 'aria-live': 'polite' }, '');
  return {
    el,
    saving() { el.textContent = 'Saving…'; el.dataset.state = 'saving'; },
    saved() { el.textContent = 'Saved'; el.dataset.state = 'saved'; },
    failed(msg) { el.textContent = msg || 'Not saved'; el.dataset.state = 'error'; },
  };
}

/** Record a decision a person has made. The tool records it; it does not verify it. */
export function recordDecision({ pid, target, targetLabel, onDone }) {
  const outcome = h('div', { class: 'radios', role: 'radiogroup', 'aria-label': 'Outcome' },
    Object.entries(OUTCOME).map(([key, label], i) => h('label', { class: 'radio' },
      h('input', { type: 'radio', name: 'outcome', value: key, checked: i === 3 ? '' : null }), h('span', null, label))));
  const by = h('input', { class: 'inp', id: 'dec-by', autocomplete: 'name', required: '' });
  const role = h('input', { class: 'inp', id: 'dec-role' });
  const on = h('input', { class: 'inp', id: 'dec-date', type: 'date', value: new Date().toISOString().slice(0, 10) });
  const conditions = h('textarea', { class: 'inp', id: 'dec-conditions', rows: '3' });
  const msg = h('p', { class: 'fmsg', hidden: true });
  const save = h('button', { class: 'button', type: 'submit' }, 'Record decision');
  const form = h('form', { class: 'form' },
    h('p', { class: 'dialog__lead' }, 'For ', h('span', { lang: guessLang(targetLabel) }, targetLabel), '. This records a decision a person has made; it does not verify their identity or authority.'),
    h('fieldset', { class: 'fld' }, h('legend', { class: 'fld__label' }, 'Outcome'), outcome),
    h('div', { class: 'form__row' }, field('Decided by', by), field('Role', role)),
    field('Date', on),
    field('Conditions and notes', conditions),
    msg);
  const dlg = openDialog({ title: 'Record a decision', body: form, actions: [h('button', { class: 'button button--quiet', type: 'button', on: { click: () => dlg.close() } }, 'Cancel'), save] });
  save.addEventListener('click', () => form.requestSubmit());
  form.addEventListener('submit', async e => {
    e.preventDefault();
    save.disabled = true;
    try {
      const rec = await api.createDecision(pid, {
        outcome: form.querySelector('input[name="outcome"]:checked')?.value,
        decided_by: by.value, role: role.value, date: on.value, conditions: conditions.value, target,
      });
      dlg.close();
      toast('Decision recorded');
      onDone?.(rec);
    } catch (err) { note(msg, err.message); save.disabled = false; }
  });
}

export function decisionList(decisions, describe) {
  if (!decisions.length) return h('p', { class: 'quiet' }, 'No decisions recorded.');
  return h('ul', { class: 'declist' }, decisions.slice().reverse().map(d => h('li', { class: 'dec' },
    h('span', { class: `dec__outcome is-${d.outcome}` }, OUTCOME[d.outcome] ?? d.outcome),
    h('span', { class: 'dec__what' }, describe ? describe(d) : `${d.target.kind} ${d.target.id}`),
    h('span', { class: 'dec__who' }, [d.decided_by, d.role].filter(Boolean).join(', '), ' · ', when(d.date)),
    d.conditions ? h('span', { class: 'dec__cond' }, d.conditions) : null)));
}

/** Shown when the site is opened without the workspace server. */
export function workspaceMissing() {
  return h('div', { class: 'missing paper lit' },
    h('h1', { class: 'missing__title' }, 'Start the workspace to manage projects'),
    h('p', null, 'Projects are kept as files in ', h('code', null, 'projects/'), ' by the local workspace server. From the repository, run:'),
    h('pre', { class: 'missing__cmd' }, 'make os'),
    h('p', null, 'then open ', h('code', null, 'http://127.0.0.1:8765/'), '. Handbooks, forms and checklists can be read without it.'),
    h('a', { class: 'button button--quiet', href: '#/library' }, 'Open the library'));
}
