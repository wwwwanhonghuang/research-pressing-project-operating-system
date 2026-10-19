// The interface chrome: top bar, theme (daylight / lamplight) and search trigger.

import { h, icons } from '../core/dom.js';
import { prefs } from '../core/store.js';
import { readLight } from '../physics/light.js';
import { openPalette } from './palette.js';

export function currentTheme() {
  const explicit = document.documentElement.dataset.theme;
  if (explicit) return explicit;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
  readLight();
  for (const btn of document.querySelectorAll('[data-theme-toggle]')) paintThemeButton(btn);
}

function paintThemeButton(btn) {
  const dark = currentTheme() === 'dark';
  btn.replaceChildren(dark ? icons.sun() : icons.lamp());
  btn.setAttribute('aria-label', dark ? 'Switch to daylight' : 'Switch to lamplight');
  btn.title = dark ? 'Daylight' : 'Lamplight';
}

export function themeButton() {
  const btn = h('button', { class: 'tool tool--icon', type: 'button', 'data-theme-toggle': '', on: {
    click: () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      prefs.set('theme', next);
      document.documentElement.classList.add('theme-shift');
      applyTheme(next);
      setTimeout(() => document.documentElement.classList.remove('theme-shift'), 700);
    },
  } });
  paintThemeButton(btn);
  return btn;
}

export function searchButton() {
  return h('button', { class: 'tool', type: 'button', 'aria-label': 'Search', on: { click: () => openPalette() } },
    icons.search(), h('span', { class: 'tool__label' }, 'Search'), h('kbd', null, '/'));
}

export function topbar(active) {
  const link = (href, label, key) => h('a', { href, 'aria-current': active === key ? 'page' : null }, label);
  return h('header', { class: 'topbar' },
    h('div', { class: 'wrap topbar__inner' },
      h('a', { class: 'brand', href: '#/', 'aria-label': 'Operations OS, Reading Room: home' },
        h('span', { class: 'brand__mark' }, icons.mark()),
        h('span', { class: 'brand__name' }, 'Operations OS'),
        h('span', { class: 'brand__room' }, 'Reading Room')),
      h('nav', { class: 'topnav', 'aria-label': 'Sections' },
        link('#/', 'Shelf', 'atrium'),
        link('#/library', 'Forms & checklists', 'library'),
        link('#/specimen', 'Specimen', 'specimen')),
      h('div', { class: 'topbar__spacer' }),
      searchButton(),
      themeButton()));
}

export function footer(site) {
  return h('footer', { class: 'footer' },
    h('div', { class: 'wrap footer__inner' },
      h('span', null, 'Operations OS · an independent prototype. Every document here is a first draft; none is institutionally approved.'),
      h('span', { class: 'mono' }, site ? `workflow ${site.workflow.id} v${site.workflow.version} · source digest ${site.source_digest.slice(0, 12)}` : '')));
}
