// Hash router. Routes are plain paths after '#', with an optional query
// (#/stage/01/handbook?from=/p/demo/s/01). Some embedding frames ignore hash
// changes; navigation then falls back to in-memory state.

const listeners = new Set();
let memoryPath = null;

const ROUTES = [
  ['projects', /^\/?$/],
  ['project', /^\/p\/([a-z0-9][a-z0-9_-]{0,63})$/],
  ['projectStage', /^\/p\/([a-z0-9][a-z0-9_-]{0,63})\/s\/(\d\d)$/],
  ['task', /^\/p\/([a-z0-9][a-z0-9_-]{0,63})\/s\/(\d\d)\/t\/(TSK-[A-Z0-9-]+)$/],
  ['document', /^\/p\/([a-z0-9][a-z0-9_-]{0,63})\/d\/(DOC-\d{3}-\d{3})$/],
  ['library', /^\/library(?:\/(shared|stage_0[1-8]))?$/],
  ['libraryDoc', /^\/library\/doc\/([A-Za-z0-9._@-]+)$/],
  ['stage', /^\/stage\/(\d\d)$/],
  ['handbook', /^\/stage\/(\d\d)\/handbook$/],
  ['stageDoc', /^\/stage\/(\d\d)\/doc\/([A-Za-z0-9._@-]+)$/],
];

export function currentPath() {
  const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  return hash || memoryPath || '/';
}

export function parse(full) {
  const [path, qs = ''] = full.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  for (const [name, re] of ROUTES) {
    const m = path.match(re);
    if (m) return { name, path, full, query, params: m.slice(1) };
  }
  return { name: 'notFound', path, full, query, params: [] };
}

/** A path with a return address, for pages opened from inside a project. */
export const withFrom = (path, from) => (from ? `${path}?from=${encodeURIComponent(from)}` : path);

function emit() {
  const route = parse(currentPath());
  for (const fn of listeners) fn(route);
}

export function go(path, { replace = false } = {}) {
  memoryPath = path;
  const target = `#${path}`;
  if (location.hash === target) { emit(); return; }
  try {
    if (replace) history.replaceState(null, '', target); else location.hash = target;
    if (replace) emit();
  } catch { emit(); }
  setTimeout(() => { if (location.hash !== target) emit(); }, 40);
}

export function onRoute(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function start() {
  addEventListener('hashchange', () => { memoryPath = null; emit(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(decodeURIComponent(a.getAttribute('href').slice(1)));
  });
  emit();
}
