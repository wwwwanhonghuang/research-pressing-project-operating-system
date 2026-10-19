// The project workspace API, served by script/serve_os.py. Project records live
// as files under projects/ on the machine running the server.

let health = null;

/** Resolves to the server's health record, or null when no workspace server is running. */
export function workspace() {
  if (!health) {
    health = fetch('api/health', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return health;
}

async function call(method, path, body) {
  const res = await fetch(`api/${path}`, {
    method,
    cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `The workspace could not complete this (HTTP ${res.status}).`);
  return data;
}

const enc = encodeURIComponent;

export const api = {
  listProjects: () => call('GET', 'projects'),
  createProject: body => call('POST', 'projects', body),
  getProject: pid => call('GET', `projects/${enc(pid)}`),
  updateProject: (pid, body) => call('PUT', `projects/${enc(pid)}`, body),
  updateStage: (pid, sid, body) => call('PUT', `projects/${enc(pid)}/stages/${enc(sid)}`, body),
  putTask: (pid, sid, tid, body) => call('PUT', `projects/${enc(pid)}/tasks/${enc(sid)}/${enc(tid)}`, body),
  createDocument: (pid, body) => call('POST', `projects/${enc(pid)}/documents`, body),
  updateDocument: (pid, did, body) => call('PUT', `projects/${enc(pid)}/documents/${enc(did)}`, body),
  createDecision: (pid, body) => call('POST', `projects/${enc(pid)}/decisions`, body),
};

/** Run `fn` after `ms` of quiet; returns a trigger with .flush() for leaving the page. */
export function debounce(fn, ms = 600) {
  let timer = 0, pending = null;
  const trigger = (...args) => { pending = args; clearTimeout(timer); timer = setTimeout(() => { pending = null; fn(...args); }, ms); };
  trigger.flush = () => { if (pending) { clearTimeout(timer); const args = pending; pending = null; return fn(...args); } return null; };
  return trigger;
}
