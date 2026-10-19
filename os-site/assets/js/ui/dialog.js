// A quiet modal: a sheet of paper over a dimmed desk. Esc or the backdrop closes
// it; focus moves in on open and returns on close.

import { h } from '../core/dom.js';

export function openDialog({ title, body, actions, onClose, wide = false }) {
  const previous = document.activeElement;
  const panel = h('div', { class: `dialog__panel paper lit${wide ? ' is-wide' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('h2', { class: 'dialog__title' }, title),
    h('div', { class: 'dialog__body' }, body),
    actions ? h('div', { class: 'dialog__actions' }, actions) : null);
  const overlay = h('div', { class: 'dialog', on: { mousedown: e => { if (e.target === overlay) close(); } } }, panel);
  function close() {
    overlay.remove();
    document.removeEventListener('keydown', onKey, true);
    onClose?.();
    previous?.focus?.();
  }
  function onKey(e) { if (e.key === 'Escape') { e.preventDefault(); close(); } }
  document.addEventListener('keydown', onKey, true);
  document.body.append(overlay);
  requestAnimationFrame(() => panel.querySelector('input, textarea, select, button')?.focus());
  return { close, panel };
}

/** A labelled form control. */
export function field(label, control, hint) {
  return h('label', { class: 'fld' }, h('span', { class: 'fld__label' }, label), control, hint ? h('span', { class: 'fld__hint' }, hint) : null);
}

/** A small inline message for errors and confirmations. */
export function note(el, message, kind = 'error') {
  el.textContent = message || '';
  el.dataset.kind = kind;
  el.hidden = !message;
}
