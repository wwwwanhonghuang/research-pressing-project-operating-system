// Per-reader conveniences (theme, reading mode, type size, content language).
// Storage may be unavailable (private windows, sandboxed previews); every access
// is guarded and the site works without it.

const KEY = 'operations-os.reading-room.v1';
let state = {};
try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch { state = {}; }

export const prefs = {
  get(name, fallback) { return name in state ? state[name] : fallback; },
  set(name, value) {
    state[name] = value;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
  },
};

/** Debug and QA switches, read from the query string (?theme=dark&page=6&peel=0.4). */
export const debug = (() => {
  try { return Object.fromEntries(new URLSearchParams(location.search)); } catch { return {}; }
})();
