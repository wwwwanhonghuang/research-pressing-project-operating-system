// Operations OS: entry point.

import { h } from './core/dom.js';
import { prefs, debug } from './core/store.js';
import { start, onRoute } from './core/router.js';
import { loadSite, loadStage, loadTemplates, currentKey, kindLabel } from './core/data.js';
import { springEasing } from './physics/spring.js';
import { readLight } from './physics/light.js';
import { applyTheme } from './ui/chrome.js';
import { loadFontSheet } from './core/fonts.js';
import { bindSearchKeys } from './ui/palette.js';
import { handbookDoc, objectDoc } from './render/model.js';
import { mountReader } from './reader/reader.js';
import { projectsView } from './views/projects.js';
import { projectView } from './views/project.js';
import { projectStageView } from './views/projstage.js';
import { taskView } from './views/task.js';
import { documentView } from './views/document.js';
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
  addEventListener('beforeunload', () => { try { cleanup?.(); } catch { /* leaving anyway */ } });
  onRoute(show);
  start();
}

const READING = new Set(['handbook', 'stageDoc', 'libraryDoc']);

async function show(route) {
  const id = ++renderId;
  try { await cleanup?.(); } catch { /* a failed flush is reported by the view */ }
  cleanup = null;
  const view = h('div', { class: 'view' });
  app.replaceChildren(view);
  document.body.classList.toggle('is-reading', READING.has(route.name));
  window.scrollTo(0, 0);
  const [a, b, c] = route.params;
  const from = route.query.from && route.query.from.startsWith('/') ? route.query.from : null;
  try {
    let result;
    switch (route.name) {
      case 'projects': result = await projectsView(view); break;
      case 'project': result = await projectView(view, a); break;
      case 'projectStage': result = await projectStageView(view, a, b); break;
      case 'task': result = await taskView(view, a, b, c); break;
      case 'document': result = await documentView(view, a, b); break;
      case 'library': result = await libraryView(view, a || null); break;
      case 'stage': result = await stageView(view, a, from); break;
      case 'handbook': result = await openHandbook(view, a, from); break;
      case 'stageDoc': result = await openStageDoc(view, a, b, from); break;
      case 'libraryDoc': result = await openTemplate(view, a, from); break;
      default: failure(view, 'Nothing is filed here', `There is no page at “${route.path}”.`);
    }
    if (id === renderId && typeof result === 'function') cleanup = result;
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
    h('p', null, h('a', { href: '#/', class: 'button button--quiet' }, 'Back to projects'))));
}

const backTo = (from, fallback) => (from ? { href: from, label: 'Back' } : fallback);

async function openHandbook(view, sid, from) {
  const bundle = await loadStage(sid);
  document.title = `Stage ${sid} handbook · Operations OS`;
  return mountReader(view, {
    makeDoc: ctx => handbookDoc(bundle, ctx),
    ctxBase: { objects: bundle.objects, stage: sid },
    back: backTo(from, { href: `/stage/${sid}`, label: `Stage ${sid}` }),
    kindLabel: 'Handbook',
    storeKey: 'mode.handbook',
    defaultMode: 'book',
  });
}

async function openStageDoc(view, sid, ref, from) {
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
    back: backTo(from, { href: `/stage/${sid}`, label: `Stage ${sid}` }),
    kindLabel: kindLabel(rec),
    storeKey: 'mode.object',
    defaultMode: 'sheet',
    rail: () => provenanceRail(rec, { site, objects, stage: sid }),
  });
}

async function openTemplate(view, ref, from) {
  const [site, store] = await Promise.all([loadSite(), loadTemplates()]);
  const key = currentKey(store.objects, ref);
  const rec = store.objects[key];
  if (!rec) throw new Error(`No form or checklist “${ref}” is in the catalogue.`);
  const entry = site.library.find(x => x.id === rec.id);
  document.title = `${rec.id} · Operations OS`;
  return mountReader(view, {
    makeDoc: ctx => objectDoc(rec, ctx, { id: entry?.stages?.[0] ?? '00' }),
    ctxBase: { objects: store.objects, stage: null },
    back: backTo(from, { href: entry ? `/library/${entry.group}` : '/library', label: 'Library' }),
    kindLabel: kindLabel(rec),
    storeKey: 'mode.object',
    defaultMode: 'sheet',
    rail: () => provenanceRail(rec, { site, objects: store.objects }),
  });
}

boot();
