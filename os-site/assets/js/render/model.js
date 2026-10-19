// Document models. Every kind of canonical object becomes one stream of typed
// blocks, the single input to both renderings (paginated book and flowing sheet).
// Interface words are English; content keeps the language it was written in and
// each text carries that language.

import { readField, localize } from '../core/i18n.js';
import { KIND, kindLabel, currentKey, routeFor } from '../core/data.js';

/** Operational content in this repository is authored in Japanese. */
export const SOURCE_LANG = 'ja';

export function makeContext({ pref = SOURCE_LANG, base = SOURCE_LANG, objects = {}, stage = null } = {}) {
  return { pref, base, objects, stage, langs: new Set(), fallbacks: 0, texts: 0 };
}

/** Localize a value and record which language was actually used. */
export function T(ctx, value) {
  const r = localize(value, ctx);
  if (r) { ctx.texts++; ctx.langs.add(r.lang); if (r.fallback) ctx.fallbacks++; }
  return r;
}

const ui = text => ({ text, lang: 'en', ui: true });
const joinList = (ctx, arr) => T(ctx, (arr || []).join('、'));

const AUTH_WORDS = {
  independent_proposal: 'Independent proposal', external_source: 'External source', institutional_adopted: 'Institutionally adopted',
  adopted_with_provenance: 'Adopted with provenance',
  law: 'Law', regulation: 'Regulation', institutional_policy: 'Institutional policy', professional_guidance: 'Professional guidance',
  operational_proposal: 'Operational proposal', informational: 'Informational',
  none: 'Not approved', unverified: 'Unverified', pending: 'Approval pending', approved: 'Approved', rejected: 'Rejected',
  unapproved: 'Not approved', review_pending: 'Review pending',
};
export const authWord = v => AUTH_WORDS[v] ?? String(v ?? '').replace(/_/g, ' ');

/** Authority as stated by the object (never inferred from its form). */
export function authorityOf(rec) {
  const d = rec.data || {};
  if (d.authority) {
    return { origin: d.authority.origin, normative: d.authority.normative_class, approval: d.authority.institutional_approval,
      note: d.authority.applicability_note ?? null };
  }
  if (d.authority_status) return { origin: d.origin, normative: null, approval: d.authority_status, note: null };
  return { origin: 'independent_proposal', normative: null, approval: 'none', note: null };
}

function objhead(rec, ctx, opts = {}) {
  const title = T(ctx, rec.kind === 'ai_assist' ? rec.data.title : readField(rec.data, 'title'));
  const auth = authorityOf(rec);
  return {
    t: 'objhead', kind: rec.kind, label: kindLabel(rec), id: rec.id, version: rec.version, current: rec.current,
    title, compact: !!(opts.chapterTitle && title && title.text === opts.chapterTitle),
    top: !!opts.top, auth, lifecycle: rec.data.lifecycle ?? null,
  };
}

function listBlocks(label, items, ctx, style = 'bullet', listId) {
  if (!items || !items.length) return [];
  const out = [{ t: 'listhead', label: ui(label), count: items.length }];
  items.forEach((item, i) => out.push({
    t: 'li', list: listId, style, n: i + 1, text: T(ctx, item), first: i === 0, last: i === items.length - 1,
  }));
  return out;
}

function refBlocks(groups, ctx, owner) {
  const rows = [];
  for (const [label, refs] of groups) {
    for (const ref of refs || []) {
      const key = ref.key ?? `${ref.id}@${ref.version}`;
      const rec = ctx.objects[key] ?? ctx.objects[currentKey(ctx.objects, ref.id)];
      const exact = !!ctx.objects[key];
      rows.push({
        t: 'ref', label: ui(label), kind: ref.kind ?? rec?.kind, id: ref.id, version: ref.version ?? rec?.version,
        title: rec ? T(ctx, rec.kind === 'ai_assist' ? rec.data.title : readField(rec.data, 'title')) : null,
        route: rec ? routeFor({ ...rec, stage: ctx.stage }) : null, resolved: exact,
      });
    }
  }
  if (!rows.length) return [];
  rows[0].first = true; rows[rows.length - 1].last = true;
  return [{ t: 'listhead', label: ui('Linked definitions'), count: rows.length }, ...rows.map(r => ({ ...r, owner }))];
}

// ---------------------------------------------------------------- by kind

function taskBlocks(rec, ctx, opts) {
  const d = rec.data;
  const prompt = Object.values(ctx.objects).find(o => o.kind === 'ai_assist' && o.data.task_id === rec.id);
  return [
    objhead(rec, ctx, opts),
    { t: 'meta', rows: [
      [ui('Responsible'), T(ctx, d.responsible_role)],
      [ui('Reviewed by'), joinList(ctx, d.review_roles)],
      [ui('Human decision'), ui(d.requires_human_decision ? 'Required' : 'Not specified')],
    ] },
    ...listBlocks('Inputs', d.inputs, ctx, 'bullet', `${rec.key}:in`),
    ...listBlocks('Outputs', d.outputs, ctx, 'bullet', `${rec.key}:out`),
    ...listBlocks('Acceptance criteria', d.acceptance_criteria, ctx, 'check', `${rec.key}:ac`),
    ...refBlocks([
      ['Procedure', [d.procedure_ref]],
      ['Form', d.document_template_refs],
      ['Checklist', d.checklist_refs],
      ['Standard', d.standard_refs],
      ['Ethics', d.ethics_refs],
      ['AI assistance', prompt ? [{ kind: 'ai_assist', id: prompt.id, version: prompt.version, key: prompt.key }] : []],
    ], ctx, rec.key),
  ];
}

function procedureBlocks(rec, ctx, opts) {
  const d = rec.data;
  const overall = new Set(d.outputs || []);
  const steps = (d.steps || []).map((step, i, all) => ({
    t: 'step', n: i + 1, text: T(ctx, readField(step, 'instruction')),
    // Most steps repeat the procedure's overall record; show a step's record only when it says something new.
    output: step.expected_output && !overall.has(step.expected_output) ? T(ctx, step.expected_output) : null,
    evidence: !!step.evidence_needed, first: i === 0, last: i === all.length - 1,
  }));
  return [
    objhead(rec, ctx, opts),
    { t: 'meta', rows: [
      [ui('Performed by'), joinList(ctx, d.required_roles)],
      [ui('Records produced'), joinList(ctx, d.outputs)],
    ] },
    { t: 'listhead', label: ui('Steps'), count: steps.length },
    ...steps,
    ...listBlocks('Exceptions and escalation', d.exception_handling, ctx, 'dash', `${rec.key}:ex`),
  ];
}

function knowledgeBlocks(rec, ctx, opts) {
  const d = rec.data;
  const out = [objhead(rec, ctx, opts)];
  if (d.scope?.audiences?.length) out.push({ t: 'meta', rows: [[ui('Written for'), joinList(ctx, d.scope.audiences)]] });
  for (const b of d.blocks || []) {
    const text = T(ctx, readField(b, 'text'));
    if (b.kind === 'heading') out.push({ t: 'h', level: Math.min(4, (b.level || 2) + 1), text });
    else if (b.kind === 'list') (b.items || []).forEach((it, i, all) => out.push({ t: 'li', list: `${rec.key}:${b.id}`, style: 'bullet', n: i + 1, text: T(ctx, it), first: i === 0, last: i === all.length - 1 }));
    else out.push({ t: 'p', text });
  }
  const sources = d.sources || [];
  if (sources.length) {
    out.push({ t: 'listhead', label: ui('Sources'), count: sources.length });
    sources.forEach((src, i) => out.push({
      t: 'source', n: i + 1, id: src.source_id, locator: src.locator, accessed: src.accessed_on ?? null,
      note: src.verification_note ? T(ctx, src.verification_note) : null, first: i === 0, last: i === sources.length - 1,
    }));
  }
  return out;
}

function templateBlocks(rec, ctx, opts) {
  const d = rec.data;
  const checklist = rec.kind === 'checklist_definition';
  const out = [objhead(rec, ctx, opts)];
  if (!opts.inHandbook) {
    out.push({ t: 'note', text: ui(checklist
      ? 'Checklist definition. Each project records its own results, evidence and reviewer; a completed checklist is an observation, not an approval.'
      : 'Blank form definition. A filled form is a separate project record pinned to this version.') });
  }
  d.sections.forEach((section, si) => {
    const heading = T(ctx, readField(section, 'heading'));
    if (!checklist || d.sections.length > 1) out.push({ t: 'fsection', n: si + 1, title: heading });
    (section.fields || []).forEach((f, fi) => out.push({
      t: 'field', n: fi + 1, label: T(ctx, readField(f, 'label')), type: f.type, required: !!f.required,
      desc: readField(f, 'description') ? T(ctx, readField(f, 'description')) : null,
      columns: (f.columns || []).map(c => T(ctx, c)), rows: f.min_rows ?? 2,
      options: (f.options || []).map(o => T(ctx, o)),
    }));
    (section.items || []).forEach((item, ii, all) => out.push({
      t: 'check', n: ii + 1, text: T(ctx, readField(item, 'criterion')),
      hint: readField(item, 'evidence_hint') ? T(ctx, readField(item, 'evidence_hint')) : null,
      states: (item.status_options || []).map(o => T(ctx, o)),
      evidenceFor: item.evidence_required_for || [], human: !!item.human_review, compact: !!opts.inHandbook,
      first: ii === 0, last: ii === all.length - 1,
    }));
  });
  return out;
}

function promptBlocks(rec, ctx, opts) {
  const d = rec.data;
  const out = [objhead(rec, ctx, opts)];
  if (d.task_id) out.push(...refBlocks([['Supports task', [{ kind: 'task_definition', id: d.task_id }]]], ctx, rec.key).slice(1));
  out.push({ t: 'note', text: ui('Drafting support only. A named person checks every output; AI does not verify, consent, approve or publish.') });
  for (const [bi, b] of (d.blocks || []).entries()) {
    if (b.kind === 'heading') out.push({ t: 'h', level: 4, text: T(ctx, b.text) });
    else if (b.kind === 'labelled') out.push({ t: 'labelled', label: T(ctx, b.label), text: T(ctx, b.text) });
    else if (b.kind === 'quote') out.push({ t: 'p', voice: 'prompt', text: T(ctx, b.text) });
    else if (b.kind === 'list') b.items.forEach((it, i, all) => out.push({ t: 'li', list: `${rec.key}:l${bi}`, style: b.ordered ? 'num' : 'bullet', n: i + 1, text: T(ctx, it), first: i === 0, last: i === all.length - 1 }));
    else out.push({ t: 'p', text: T(ctx, b.text) });
  }
  return out;
}

const BUILDERS = {
  task_definition: taskBlocks,
  procedure_definition: procedureBlocks,
  knowledge_entry: knowledgeBlocks,
  document_template: templateBlocks,
  checklist_definition: templateBlocks,
  ai_assist: promptBlocks,
};

export function objectBlocks(rec, ctx, opts = {}) {
  const build = BUILDERS[rec.kind];
  if (!build) return [{ t: 'note', text: ui(`No renderer for ${rec.kind}.`) }];
  return build(rec, ctx, opts);
}

// ---------------------------------------------------------------- documents

/** A stage handbook: the recipe resolved into chapters, plus front and back matter data. */
export function handbookDoc(bundle, ctx) {
  const hb = bundle.handbook;
  const seen = new Map();
  const chapters = hb.chapters.map((ch, i) => {
    const title = T(ctx, ch.title);
    const blocks = [{ t: 'chapter', n: i + 1, id: ch.id, title }];
    for (const part of ch.parts) {
      if (part.t === 'bridge') { blocks.push({ t: 'p', voice: 'bridge', text: T(ctx, part.text) }); continue; }
      const rec = bundle.objects[part.key];
      if (!rec) { blocks.push({ t: 'note', text: ui(`Unresolved include ${part.key}.`) }); continue; }
      seen.set(rec.key, rec);
      blocks.push(...objectBlocks(rec, ctx, { inHandbook: true, chapterTitle: ch.title }));
    }
    return { id: ch.id, title, blocks };
  });
  const appendix = [{ t: 'chapter', n: null, id: 'APPENDIX', title: ui('Pinned sources') },
    { t: 'note', text: ui('Every definition composed into this handbook, at the exact version the recipe pins, with the SHA-256 of its source file.') },
    ...[...seen.values()].map((rec, i, all) => ({
      t: 'prov', label: ui(kindLabel(rec)), id: rec.id, version: rec.version, sha: rec.sha256, path: rec.path,
      title: T(ctx, readField(rec.data, 'title')), first: i === 0, last: i === all.length - 1,
    }))];
  return {
    kind: 'handbook', key: hb.key, id: hb.id, version: hb.version, title: T(ctx, hb.title),
    subtitle: ui(bundle.stage.name_en), stage: bundle.stage, authority: authorityOf({ data: { authority: hb.authority } }),
    audience: hb.audience?.length ? joinList(ctx, hb.audience) : null,
    path: hb.path, sha: hb.sha256, digest: bundle.source_digest, chapters, appendix, front: true,
  };
}

/** A single definition, read on its own. */
export function objectDoc(rec, ctx, stage) {
  const blocks = objectBlocks(rec, ctx, { top: true });
  return {
    kind: rec.kind, key: rec.key, id: rec.id, version: rec.version, rec, stage,
    title: blocks[0]?.title ?? ui(rec.id), authority: authorityOf(rec),
    chapters: [{ id: rec.id, title: blocks[0]?.title ?? ui(rec.id), blocks }], appendix: [], front: false,
  };
}

export { KIND };
