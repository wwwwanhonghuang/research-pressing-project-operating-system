// Operations OS Reading Room: entry point.

import { h } from './core/dom.js';
import { prefs, debug } from './core/store.js';
import { start, onRoute } from './core/router.js';
import { loadSite, loadStage, loadTemplates, loadSpecimen, currentKey, kindLabel } from './core/data.js';
import { springEasing } from './physics/spring.js';
import { readLight } from './physics/light.js';
import { applyTheme } from './ui/chrome.js';
import { loadFontSheet } from './core/fonts.js';
import { bindSearchKeys } from './ui/palette.js';
import { handbookDoc, objectDoc, specimenDoc } from './render/model.js';
import { mountReader } from './reader/reader.js';
import { atrium } from './views/atrium.js';
import { stageView } from './views/stage.js';
import { libraryView } from './views/library.js';
import { provenanceRail } from './views/provenance.js';

const app = document.getElementById('app');
let cleanup = null;
let renderId = 0;

function boot() {
  loadFontSheet();
  // A stored or requested theme wins; otherwise keep whatever the host page set (or the system's).
  const theme = debug.theme || prefs.get('theme', null);
  if (theme) applyTheme(theme); else readLight();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => readLight());
  const spring = springEasing({ stiffness: 230, damping: 19 });
  if (spring) document.documentElement.style.setProperty('--ease-spring', spring.easing);
  bindSearchKeys();
  onRoute(show);
  start();
}

async function show(route) {
  const id = ++renderId;
  cleanup?.(); cleanup = null;
  const view = h('div', { class: 'view' });
  app.replaceChildren(view);
  document.body.classList.toggle('is-reading', ['handbook', 'stageDoc', 'libraryDoc', 'specimen'].includes(route.name));
  window.scrollTo(0, 0);
  try {
    switch (route.name) {
      case 'atrium': document.title = 'Operations OS Reading Room'; await atrium(view); break;
      case 'stage': await stageView(view, route.params[0]); break;
      case 'library': await libraryView(view, route.params[0] || null); break;
      case 'handbook': cleanup = await openHandbook(view, route.params[0]); break;
      case 'stageDoc': cleanup = await openStageDoc(view, route.params[0], route.params[1]); break;
      case 'libraryDoc': cleanup = await openTemplate(view, route.params[0]); break;
      case 'specimen': cleanup = await openSpecimen(view); break;
      default: failure(view, 'Nothing is filed here', `There is no page at “${route.path}”.`);
    }
  } catch (err) {
    if (id !== renderId) return;
    console.error(err);
    failure(view, 'This page could not be opened', err.message || String(err));
  }
}

function failure(view, title, message) {
  view.replaceChildren(h('div', { class: 'state' },
    h('p', { class: 'state__title' }, title),
    h('p', null, message),
    h('p', null, h('a', { href: '#/', class: 'button button--quiet' }, 'Back to the shelf'))));
}

async function openHandbook(view, sid) {
  const bundle = await loadStage(sid);
  document.title = `Stage ${sid} handbook · Operations OS`;
  return mountReader(view, {
    makeDoc: ctx => handbookDoc(bundle, ctx),
    ctxBase: { objects: bundle.objects, stage: sid },
    back: { href: `/stage/${sid}`, label: `Stage ${sid}` },
    kindLabel: 'Handbook',
    storeKey: 'mode.handbook',
    defaultMode: 'book',
  });
}

async function openStageDoc(view, sid, ref) {
  const [site, bundle] = await Promise.all([loadSite(), loadStage(sid)]);
  let objects = bundle.objects;
  let key = currentKey(objects, ref);
  if (!key) {
    const templates = (await loadTemplates()).objects;
    key = currentKey(templates, ref);
    objects = { ...templates, ...objects };
  }
  const rec = objects[key];
  if (!rec) throw new Error(`No definition “${ref}” is filed under stage ${sid}.`);
  document.title = `${rec.id} · Operations OS`;
  return mountReader(view, {
    makeDoc: ctx => objectDoc(rec, ctx, bundle.stage),
    ctxBase: { objects, stage: sid },
    back: { href: `/stage/${sid}`, label: `Stage ${sid}` },
    kindLabel: kindLabel(rec),
    storeKey: 'mode.object',
    defaultMode: 'sheet',
    rail: () => provenanceRail(rec, { site, objects, stage: sid }),
  });
}

async function openTemplate(view, ref) {
  const [site, store] = await Promise.all([loadSite(), loadTemplates()]);
  const key = currentKey(store.objects, ref);
  const rec = store.objects[key];
  if (!rec) throw new Error(`No form or checklist “${ref}” is in the catalogue.`);
  const entry = site.library.find(x => x.id === rec.id);
  document.title = `${rec.id} · Operations OS`;
  return mountReader(view, {
    makeDoc: ctx => objectDoc(rec, ctx, { id: entry?.stages?.[0] ?? '00' }),
    ctxBase: { objects: store.objects, stage: null },
    back: { href: entry ? `/library/${entry.group}` : '/library', label: 'Catalogue' },
    kindLabel: kindLabel(rec),
    storeKey: 'mode.object',
    defaultMode: 'sheet',
    rail: () => provenanceRail(rec, { site, objects: store.objects }),
  });
}

async function openSpecimen(view) {
  const spec = await loadSpecimen();
  document.title = 'Typesetting specimen · Operations OS';
  return mountReader(view, {
    makeDoc: ctx => specimenDoc(spec, ctx),
    ctxBase: { objects: {}, stage: null },
    back: { href: '/', label: 'Shelf' },
    kindLabel: 'Specimen',
    storeKey: 'mode.specimen',
    defaultMode: 'book',
  });
}

boot();
