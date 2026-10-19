// Hash router. Routes are plain paths after '#'. Some embedding frames ignore
// hash changes; navigation then falls back to in-memory state.

const listeners = new Set();
let memoryPath = null;

const ROUTES = [
  ['atrium', /^\/?$/],
  ['stage', /^\/stage\/(\d\d)$/],
  ['handbook', /^\/stage\/(\d\d)\/handbook$/],
  ['stageDoc', /^\/stage\/(\d\d)\/doc\/([A-Za-z0-9._@-]+)$/],
  ['library', /^\/library(?:\/(shared|stage_0[1-8]))?$/],
  ['libraryDoc', /^\/library\/doc\/([A-Za-z0-9._@-]+)$/],
  ['specimen', /^\/specimen$/],
];

export function currentPath() {
  const hash = decodeURIComponent(location.hash.replace(/^#/, ''));
  return hash || memoryPath || '/';
}

export function parse(path) {
  for (const [name, re] of ROUTES) {
    const m = path.match(re);
    if (m) return { name, path, params: m.slice(1) };
  }
  return { name: 'notFound', path, params: [] };
}

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
  // Frames that block hash navigation never fire hashchange; render from memory.
  setTimeout(() => { if (location.hash !== target) emit(); }, 40);
}

export function onRoute(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function start() {
  addEventListener('hashchange', () => { memoryPath = null; emit(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    go(a.getAttribute('href').slice(1));
  });
  emit();
}
