// Data access. The site never parses TeX or PDF: it reads the presentation-neutral
// bundles written by script/build_site_data.py from the canonical JSON.

const cache = new Map();

function getJSON(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then(res => {
      if (!res.ok) throw new Error(`Could not load ${url} (HTTP ${res.status}).`);
      return res.json();
    }).catch(err => { cache.delete(url); throw err; }));
  }
  return cache.get(url);
}

export const loadSite = () => getJSON('data/site.json');
export const loadStage = sid => getJSON(`data/stage-${sid}.json`);
export const loadTemplates = () => getJSON('data/templates.json');

/** The key of the current version of an object ID inside an objects map. */
export function currentKey(objects, id) {
  if (objects[id]) return id;
  let best = null;
  for (const rec of Object.values(objects)) {
    if (rec.id !== id) continue;
    if (rec.current) return rec.key;
    if (!best || compareVersions(rec.version, best.version) > 0) best = rec;
  }
  return best?.key ?? null;
}

export function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

export const KIND = {
  task_definition: { label: 'Task', plural: 'Tasks', code: 'TSK' },
  procedure_definition: { label: 'Procedure', plural: 'Procedures', code: 'PRC' },
  knowledge_entry: { label: 'Standard', plural: 'Standards', code: 'KNW' },
  document_template: { label: 'Form', plural: 'Forms', code: 'DOC' },
  checklist_definition: { label: 'Checklist', plural: 'Checklists', code: 'CHK' },
  ai_assist: { label: 'AI assistance', plural: 'AI assistance', code: 'AIA' },
  publication_recipe: { label: 'Handbook', plural: 'Handbooks', code: 'PUB' },
};

/** Human label for an object's kind (knowledge entries split into standards and ethics). */
export function kindLabel(rec) {
  const category = rec.category ?? rec.data?.category;
  if (rec.kind === 'knowledge_entry') return category === 'ethics' ? 'Ethics guidance' : 'Standard';
  return KIND[rec.kind]?.label ?? rec.kind;
}

/** Route to an object from a summary or record. Templates open in the library. */
export function routeFor(item) {
  if (item.kind === 'publication_recipe') return `/stage/${item.stage}/handbook`;
  if (item.kind === 'document_template' || item.kind === 'checklist_definition') {
    return item.stage ? `/stage/${item.stage}/doc/${item.id}` : `/library/doc/${item.id}`;
  }
  return `/stage/${item.stage}/doc/${item.id}`;
}

export const dye = sid => `var(--dye-${Number(sid)})`;
export const dyeInk = sid => `var(--dye-${Number(sid)}-ink)`;

export function shortHash(hex, n = 12) { return hex ? hex.slice(0, n) : ''; }
