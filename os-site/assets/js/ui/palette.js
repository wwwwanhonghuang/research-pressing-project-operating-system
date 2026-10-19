// Search across every definition, form, checklist, prompt and handbook.

import { h, icons } from '../core/dom.js';
import { loadSite, kindLabel, routeFor, dye } from '../core/data.js';
import { go } from '../core/router.js';

let open = null;

function score(item, q) {
  const title = item.title.toLowerCase(), id = item.id.toLowerCase();
  if (!q) return 1;
  let s = 0;
  if (id === q) s += 100;
  if (id.startsWith(q)) s += 40;
  if (id.includes(q)) s += 20;
  const ti = title.indexOf(q);
  if (ti === 0) s += 35; else if (ti > 0) s += 25;
  if (item.excerpt && item.excerpt.toLowerCase().includes(q)) s += 6;
  if (kindLabel(item).toLowerCase().includes(q)) s += 4;
  return s;
}

export async function openPalette() {
  if (open) { open.input.focus(); return; }
  const site = await loadSite();
  const input = h('input', { class: 'palette__input', id: 'palette-input', type: 'search', placeholder: 'Search by title, ID or kind', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Search', 'aria-controls': 'palette-results' });
  const list = h('ul', { class: 'palette__results', id: 'palette-results', role: 'listbox' });
  const panel = h('div', { class: 'palette__panel paper lit', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Search' },
    h('div', { class: 'palette__field' }, icons.search(), input),
    list,
    h('div', { class: 'palette__foot' }, h('span', null, '↑ ↓ to move'), h('span', null, '↵ to open'), h('span', null, 'esc to close')));
  const overlay = h('div', { class: 'palette', on: { click: e => { if (e.target === overlay) close(); } } }, panel);
  let results = [], sel = 0;

  function render() {
    const q = input.value.trim().toLowerCase();
    results = site.search.map(item => ({ item, s: score(item, q) })).filter(r => r.s > 0)
      .sort((a, b) => b.s - a.s || a.item.id.localeCompare(b.item.id)).slice(0, 40).map(r => r.item);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    list.replaceChildren();
    if (!results.length) { list.append(h('li', { class: 'palette__empty' }, `Nothing matches “${input.value}”.`)); return; }
    let group = null;
    results.forEach((item, i) => {
      const label = kindLabel(item);
      if (!q && label !== group) { group = label; list.append(h('li', { class: 'palette__group', role: 'presentation' }, label)); }
      list.append(h('li', { class: 'palette__item', role: 'presentation' },
        h('a', { href: `#${routeFor(item)}`, role: 'option', 'aria-selected': i === sel ? 'true' : 'false', on: { click: close, mousemove: () => { if (sel !== i) { sel = i; mark(); } } } },
          h('span', { class: 'palette__dot', style: { background: item.stage ? dye(item.stage) : 'var(--paper-ink-3)' } }),
          h('span', { class: 'palette__title', lang: 'ja' }, item.title),
          h('span', { class: 'palette__id' }, `${label} · ${item.id}`))));
    });
  }
  function mark() {
    list.querySelectorAll('[role="option"]').forEach((a, i) => a.setAttribute('aria-selected', i === sel ? 'true' : 'false'));
    list.querySelectorAll('[role="option"]')[sel]?.scrollIntoView({ block: 'nearest' });
  }
  function close() {
    overlay.remove(); open = null;
    document.removeEventListener('keydown', onKey, true);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); mark(); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); const r = results[sel]; close(); go(routeFor(r)); }
  }
  input.addEventListener('input', () => { sel = 0; render(); });
  document.addEventListener('keydown', onKey, true);
  document.body.append(overlay);
  open = { input };
  render();
  input.focus();
}

export function bindSearchKeys() {
  document.addEventListener('keydown', e => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      openPalette();
    }
  });
}
