#!/usr/bin/env python3
"""Build the presentation-neutral data bundles read by os-site/.

Reads the canonical JSON definitions (and each stage's AI-assistance Markdown),
resolves every version-pinned reference, and writes deterministic JSON bundles:

  os-site/data/site.json         workflow, stage summaries, library, search index
  os-site/data/stage-NN.json     one bundle per stage: objects, handbook, collection
  os-site/data/templates.json    every current form and checklist definition

Resolution fails closed: an unresolved or mismatched pin is an error, exactly as
in script/compose_handbook.py. Standard library only. This script does not run
JSON Schema validation (use `make validate`) and never asserts any approval.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / 'os-site/data'

OPERATIONAL_DIRS = {
    'tasks': 'task_definition',
    'procedures': 'procedure_definition',
    'knowledge': 'knowledge_entry',
    'recipes': 'publication_recipe',
}
PREFIX_KIND = {
    'TSK': 'task_definition',
    'PRC': 'procedure_definition',
    'KNW': 'knowledge_entry',
    'PUB': 'publication_recipe',
}


class BuildError(Exception):
    pass


def read_json(path: Path):
    return json.loads(path.read_text(encoding='utf-8'))


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def key(obj_id: str, version: str) -> str:
    return f'{obj_id}@{version}'


def record(kind: str, path: Path, data: dict, current: bool) -> dict:
    return {
        'key': key(data['id'], data['version']),
        'kind': kind,
        'id': data['id'],
        'version': data['version'],
        'current': current,
        'path': rel(path),
        'sha256': sha256(path),
        'data': data,
    }


def template_kind(data: dict) -> str:
    return 'checklist_definition' if data['kind'] == 'checklist' else 'document_template'


# ---------------------------------------------------------------- registry

def load_registry() -> dict:
    """All canonical objects, current and archived, keyed by (kind, id, version)."""
    reg: dict = {}

    def add(rec):
        ident = (rec['kind'], rec['id'], rec['version'])
        if ident in reg:
            # Some archives hold a byte-identical copy of the current version; that is
            # the same object. Different bytes under one identity is a real conflict.
            if reg[ident]['sha256'] == rec['sha256']:
                return
            raise BuildError(f'conflicting object identity {ident}: {reg[ident]["path"]} vs {rec["path"]}')
        reg[ident] = rec

    for stage_dir in sorted((ROOT / 'content/operational').glob('stage_*')):
        for folder, kind in OPERATIONAL_DIRS.items():
            for path in sorted((stage_dir / folder).glob('*.json')):
                add(record(kind, path, read_json(path), True))
    for path in sorted((ROOT / 'content/operational_versions').glob('stage_*/*/*.json')):
        data = read_json(path)
        kind = PREFIX_KIND.get(data['id'].split('-')[0])
        if not kind:
            raise BuildError(f'unknown archived object kind: {rel(path)}')
        add(record(kind, path, data, False))
    for path in sorted((ROOT / 'content/templates').glob('TPL-*.json')):
        data = read_json(path)
        add(record(template_kind(data), path, data, True))
    for path in sorted((ROOT / 'content/template_versions').glob('TPL-*/*.json')):
        data = read_json(path)
        add(record(template_kind(data), path, data, False))
    return reg


def resolve(reg: dict, ref: dict, where: str) -> dict:
    kind = ref['kind']
    if kind in ('document_template', 'checklist_definition'):
        # A template's kind is decided by its definition; accept either label.
        for k in ('document_template', 'checklist_definition'):
            rec = reg.get((k, ref['id'], ref['version']))
            if rec:
                if rec['kind'] != kind:
                    raise BuildError(f'{where}: {ref["id"]} is a {rec["kind"]}, referenced as {kind}')
                return rec
    else:
        rec = reg.get((kind, ref['id'], ref['version']))
        if rec:
            return rec
    raise BuildError(f'{where}: unresolved pin {kind} {ref["id"]} v{ref["version"]}')


def task_refs(task: dict) -> list:
    return ([task['procedure_ref']] + task.get('document_template_refs', []) + task.get('checklist_refs', [])
            + task.get('standard_refs', []) + task.get('ethics_refs', []))


# ---------------------------------------------------------------- markdown prompts

INLINE_LABEL = re.compile(r'^([^\s：:。、「」]{1,12})[：:]\s*(.+)$')


def parse_markdown(text: str) -> tuple[str, list]:
    """A deliberately small Markdown reader for the AI-assistance prompts.

    Produces the same block vocabulary as knowledge entries (heading, paragraph)
    plus list, quote and labelled paragraph. Inline marks stay as text; the client
    renders `code` spans safely.
    """
    title = ''
    blocks: list = []
    para: list = []
    items: list = []
    ordered = False

    def flush_para():
        if para:
            # CJK lines join directly; Latin lines join with a space.
            text = para[0]
            for line in para[1:]:
                latin = text[-1:].isascii() and text[-1:].isalnum() and line[:1].isascii() and line[:1].isalnum()
                text += (' ' if latin or text.endswith((',', '.', ';', ':')) and line[:1].isascii() else '') + line
            text = text.strip()
            m = INLINE_LABEL.match(text)
            if m and len(text) > len(m.group(1)) + 2:
                blocks.append({'kind': 'labelled', 'label': m.group(1), 'text': m.group(2).strip()})
            else:
                blocks.append({'kind': 'paragraph', 'text': text})
            para.clear()

    def flush_list():
        nonlocal ordered
        if items:
            blocks.append({'kind': 'list', 'ordered': ordered, 'items': list(items)})
            items.clear()
            ordered = False

    for raw in text.splitlines():
        line = raw.rstrip()
        stripped = line.strip()
        if not stripped:
            flush_para()
            flush_list()
            continue
        if stripped.startswith('#'):
            flush_para()
            flush_list()
            level = len(stripped) - len(stripped.lstrip('#'))
            content = stripped[level:].strip()
            if level == 1 and not title:
                title = content
            else:
                blocks.append({'kind': 'heading', 'level': max(2, level), 'text': content})
            continue
        if stripped.startswith('>'):
            flush_para()
            flush_list()
            quote = stripped.lstrip('>').strip()
            if blocks and blocks[-1]['kind'] == 'quote':
                blocks[-1]['text'] += quote
            else:
                blocks.append({'kind': 'quote', 'text': quote})
            continue
        m_bullet = re.match(r'^[-*・]\s+(.*)$', stripped)
        m_number = re.match(r'^(\d+)[.)．]\s+(.*)$', stripped)
        if m_bullet or m_number:
            flush_para()
            is_ordered = bool(m_number)
            if items and is_ordered != ordered:
                flush_list()
            ordered = is_ordered
            items.append((m_number.group(2) if m_number else m_bullet.group(1)).strip())
            continue
        flush_list()
        para.append(stripped)
    flush_para()
    flush_list()
    return title, blocks


def load_prompts(stage: dict, task_ids: list) -> list:
    folder = ROOT / 'pipeline' / stage['directory'] / 'AI_ASSIST/common_prompts'
    prompts = []
    for path in sorted(folder.glob('*.md')):
        stem = path.stem
        suffix = stem.split('-', 2)[2] if stem.startswith('PRC-') else stem
        matches = [t for t in task_ids if t.endswith('-' + suffix.upper())]
        task_id = matches[0] if len(matches) == 1 else None
        prompt_id = 'AIA-' + (task_id[4:] if task_id else f'{stage["id"]}-{suffix.upper()}')
        title, blocks = parse_markdown(path.read_text(encoding='utf-8'))
        prompts.append({
            'key': key(prompt_id, 'draft'),
            'kind': 'ai_assist',
            'id': prompt_id,
            'version': 'draft',
            'current': True,
            'path': rel(path),
            'sha256': sha256(path),
            'data': {'id': prompt_id, 'title': title or stem, 'task_id': task_id, 'blocks': blocks},
        })
    return prompts


# ---------------------------------------------------------------- summaries

def title_of(rec: dict) -> str:
    data = rec['data']
    if 'title_ja' in data:
        return data['title_ja']
    title = data.get('title')
    return title['ja'] if isinstance(title, dict) else (title or rec['id'])


def excerpt_of(rec: dict, limit: int = 150) -> str:
    data = rec['data']
    kind = rec['kind']
    text = ''
    if kind == 'knowledge_entry':
        text = next((b['text'] for b in data['blocks'] if b['kind'] == 'paragraph'), '')
    elif kind == 'task_definition':
        text = '　'.join(data.get('outputs', []))
    elif kind == 'procedure_definition':
        text = data['steps'][0]['instruction'] if data['steps'] else ''
    elif kind == 'ai_assist':
        text = next((b.get('text', '') for b in data['blocks'] if b['kind'] in ('paragraph', 'labelled', 'quote')), '')
    elif kind in ('document_template', 'checklist_definition'):
        text = data.get('notes_ja', '')
    return text[:limit]


def template_preview(data: dict) -> list:
    """First few structural lines of a form or checklist, for paper thumbnails."""
    out = []
    for section in data['sections']:
        out.append({'t': 'section', 'text': section['heading_ja']})
        for field in section.get('fields', []):
            out.append({'t': field['type'], 'text': field['label_ja']})
        for item in section.get('items', []):
            out.append({'t': 'check', 'text': item['criterion_ja']})
        if len(out) >= 9:
            break
    return out[:9]


def summary(rec: dict, stage_id: str | None) -> dict:
    data = rec['data']
    out = {
        'key': rec['key'], 'id': rec['id'], 'version': rec['version'], 'kind': rec['kind'],
        'title': title_of(rec), 'stage': stage_id, 'excerpt': excerpt_of(rec),
    }
    if rec['kind'] == 'knowledge_entry':
        out['category'] = data['category']
        out['sources'] = len(data.get('sources', []))
    if rec['kind'] in ('document_template', 'checklist_definition'):
        out['preview'] = template_preview(data)
        out['fields'] = sum(len(s.get('fields', [])) for s in data['sections'])
        out['items'] = sum(len(s.get('items', [])) for s in data['sections'])
    if rec['kind'] == 'ai_assist':
        out['task_id'] = data['task_id']
    return out


# ---------------------------------------------------------------- build

def build(out_dir: Path) -> dict:
    workflow = read_json(ROOT / 'core/workflows/eight_stage.json')
    catalog = read_json(ROOT / 'templates/catalog.json')
    reg = load_registry()
    by_id_current = {}
    for rec in reg.values():
        if rec['current']:
            by_id_current[rec['id']] = rec

    referenced_by: dict = {}

    def note_ref(src_key: str, target: dict):
        referenced_by.setdefault(target['key'], [])
        if src_key not in referenced_by[target['key']]:
            referenced_by[target['key']].append(src_key)

    # Reverse references over every current task and recipe (all stages).
    for rec in sorted(reg.values(), key=lambda r: r['key']):
        if not rec['current']:
            continue
        if rec['kind'] == 'task_definition':
            for ref in task_refs(rec['data']):
                note_ref(rec['key'], resolve(reg, ref, rec['path']))
        if rec['kind'] == 'publication_recipe':
            for chapter in rec['data']['chapter_plan']:
                for part in chapter['parts']:
                    if part['kind'] == 'include':
                        note_ref(rec['key'], resolve(reg, part['ref'], rec['path']))

    stages_summary = []
    search = []
    inputs_digest = hashlib.sha256()
    bundles = {}

    for stage in workflow['stages']:
        sid = stage['id']
        descriptor = read_json(ROOT / 'pipeline' / stage['directory'] / 'stage.json')
        op_dir = ROOT / 'content/operational' / f'stage_{sid}'
        objects: dict = {}

        def include(rec):
            objects[rec['key']] = rec

        # Tasks in the stage descriptor's order (entries are IDs or {id, version}).
        task_keys = []
        for entry in descriptor.get('task_definitions', []):
            tid, version = (entry['id'], entry['version']) if isinstance(entry, dict) else (entry, None)
            rec = (resolve(reg, {'kind': 'task_definition', 'id': tid, 'version': version}, rel(op_dir))
                   if version else by_id_current.get(tid))
            if not rec:
                raise BuildError(f'stage {sid}: task {tid} not found')
            include(rec)
            task_keys.append(rec['key'])
            for ref in task_refs(rec['data']):
                include(resolve(reg, ref, rec['path']))

        # Every current object authored for this stage.
        for folder in OPERATIONAL_DIRS:
            for path in sorted((op_dir / folder).glob('*.json')):
                data = read_json(path)
                include(reg[(OPERATIONAL_DIRS[folder], data['id'], data['version'])])

        # The handbook recipe, resolved chapter by chapter.
        recipes = sorted((op_dir / 'recipes').glob('*.json'))
        if len(recipes) != 1:
            raise BuildError(f'stage {sid}: expected one recipe, found {len(recipes)}')
        recipe_data = read_json(recipes[0])
        recipe = reg[('publication_recipe', recipe_data['id'], recipe_data['version'])]
        chapters = []
        for chapter in recipe_data['chapter_plan']:
            parts = []
            for part in chapter['parts']:
                if part['kind'] == 'editorial_bridge':
                    parts.append({'t': 'bridge', 'text': part['editorial_text']})
                elif part['kind'] == 'include':
                    target = resolve(reg, part['ref'], recipe['path'])
                    include(target)
                    parts.append({'t': 'include', 'key': target['key']})
                else:
                    raise BuildError(f'{recipe["path"]}: unsupported part kind {part["kind"]}')
            chapters.append({'id': chapter['chapter_id'], 'title': chapter['heading_ja'], 'parts': parts})

        # Forms and checklists the catalog assigns to this stage (current versions).
        stage_templates = []
        for entry in catalog['entries']:
            if sid in entry['applicable_pipeline_stages']:
                rec = by_id_current[entry['template_id']]
                include(rec)
                stage_templates.append(rec)

        prompts = load_prompts(stage, [reg_key.split('@')[0] for reg_key in task_keys])
        for rec in prompts:
            include(rec)
        ai_note_path = ROOT / 'pipeline' / stage['directory'] / 'AI_ASSIST/README.md'
        ai_note = parse_markdown(ai_note_path.read_text(encoding='utf-8'))[1] if ai_note_path.is_file() else []

        knowledge = [r for r in objects.values()
                     if r['kind'] == 'knowledge_entry' and r['current'] and sid in r['data']['scope']['stages']]
        collection = {
            'tasks': task_keys,
            'standards': sorted(r['key'] for r in knowledge if r['data']['category'] == 'standard'),
            'ethics': sorted(r['key'] for r in knowledge if r['data']['category'] == 'ethics'),
            'forms': [r['key'] for r in stage_templates if r['kind'] == 'document_template'],
            'checklists': [r['key'] for r in stage_templates if r['kind'] == 'checklist_definition'],
            'prompts': [r['key'] for r in prompts],
        }

        bundle_objects = {}
        for k in sorted(objects):
            rec = objects[k]
            bundle_objects[k] = {
                'key': rec['key'], 'kind': rec['kind'], 'id': rec['id'], 'version': rec['version'],
                'current': rec['current'], 'path': rec['path'], 'sha256': rec['sha256'],
                'referenced_by': referenced_by.get(k, []), 'data': rec['data'],
            }
            inputs_digest.update(f'{rec["path"]}:{rec["sha256"]}\n'.encode())

        includes = sum(1 for c in chapters for p in c['parts'] if p['t'] == 'include')
        handbook = {
            'key': recipe['key'], 'id': recipe['id'], 'version': recipe['version'],
            'title': title_of(recipe), 'path': recipe['path'], 'sha256': recipe['sha256'],
            'authority': recipe_data['authority'], 'audience': recipe_data.get('audience', []),
            'chapters': chapters, 'includes': includes,
        }
        bundles[sid] = {
            'schema': 'operations-os-site-stage/1',
            'stage': {
                'id': sid, 'name_ja': stage['name_ja'], 'name_en': stage['name_en'],
                'objective': stage['objective'], 'directory': stage['directory'],
                'review_gate': descriptor.get('review_gate', {}),
            },
            'handbook': handbook,
            'collection': collection,
            'ai_note': ai_note,
            'objects': bundle_objects,
        }

        counts = {name: len(keys) for name, keys in collection.items()}
        counts['objects'] = len([r for r in objects.values() if r['current'] and r['kind'] in OPERATIONAL_DIRS.values()])
        counts['procedures'] = len([r for r in objects.values()
                                    if r['kind'] == 'procedure_definition' and r['current'] and rel(op_dir) in r['path']])
        stages_summary.append({
            'id': sid, 'name_ja': stage['name_ja'], 'name_en': stage['name_en'], 'objective': stage['objective'],
            'counts': counts,
            'handbook': {'id': recipe['id'], 'version': recipe['version'], 'title': title_of(recipe),
                         'chapters': len(chapters), 'includes': includes},
            'gate': {
                'human_signoff_required_for_publication': descriptor.get('review_gate', {}).get(
                    'human_signoff_required_for_publication'),
                'reviewer_role': descriptor.get('review_gate', {}).get('reviewer_role'),
            },
        })

        stage_kinds = {'task_definition', 'procedure_definition', 'knowledge_entry', 'ai_assist'}
        for rec in sorted(objects.values(), key=lambda r: r['key']):
            if rec['current'] and rec['kind'] in stage_kinds and (
                    rec['kind'] == 'ai_assist' or rel(op_dir) in rec['path']):
                search.append(summary(rec, sid))
        search.append({'key': recipe['key'], 'id': recipe['id'], 'version': recipe['version'],
                       'kind': 'publication_recipe', 'title': title_of(recipe), 'stage': sid, 'excerpt': ''})

    # The template library (all current definitions).
    library = []
    templates = {}
    for entry in catalog['entries']:
        rec = by_id_current[entry['template_id']]
        item = summary(rec, None)
        item.update({'group': entry['group'], 'stages': entry['applicable_pipeline_stages'],
                     'priority': entry['priority'], 'intended_use': entry.get('intended_use', '')})
        library.append(item)
        search.append(item)
        templates[rec['key']] = {
            'key': rec['key'], 'kind': rec['kind'], 'id': rec['id'], 'version': rec['version'],
            'current': True, 'path': rec['path'], 'sha256': rec['sha256'],
            'referenced_by': referenced_by.get(rec['key'], []), 'data': rec['data'],
        }

    digest = inputs_digest.hexdigest()
    site = {
        'schema': 'operations-os-site/1',
        'source_digest': digest,
        'workflow': {k: workflow[k] for k in ('id', 'version', 'status', 'description', 'rules')},
        'stages': stages_summary,
        'totals': {
            'operational_objects': sum(1 for r in reg.values() if r['current'] and r['kind'] in OPERATIONAL_DIRS.values()),
            'tasks': sum(1 for r in reg.values() if r['current'] and r['kind'] == 'task_definition'),
            'procedures': sum(1 for r in reg.values() if r['current'] and r['kind'] == 'procedure_definition'),
            'knowledge': sum(1 for r in reg.values() if r['current'] and r['kind'] == 'knowledge_entry'),
            'templates': len(library),
            'documents': sum(1 for x in library if x['kind'] == 'document_template'),
            'checklists': sum(1 for x in library if x['kind'] == 'checklist_definition'),
            'handbooks': len(stages_summary),
            'prompts': sum(s['counts']['prompts'] for s in stages_summary),
        },
        'library': library,
        'search': search,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    written = []

    def write(name, payload):
        path = out_dir / name
        # Bytes, not text mode: identical LF output on every platform.
        path.write_bytes((json.dumps(payload, ensure_ascii=False, separators=(',', ':')) + '\n').encode('utf-8'))
        written.append(path)

    write('site.json', site)
    for sid, bundle in bundles.items():
        bundle['source_digest'] = digest
        write(f'stage-{sid}.json', bundle)
    write('templates.json', {'schema': 'operations-os-site-templates/1', 'source_digest': digest, 'objects': templates})
    return {'written': written, 'digest': digest, 'site': site}


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--output', type=Path, default=DEFAULT_OUT)
    args = ap.parse_args()
    try:
        result = build(args.output.resolve())
    except (BuildError, KeyError, ValueError) as exc:
        print('ERROR:', exc, file=sys.stderr)
        return 1
    total = sum(p.stat().st_size for p in result['written'])
    print(f'Wrote {len(result["written"])} bundles ({total / 1024:.0f} KiB) to {args.output}; '
          f'source digest {result["digest"][:12]}.')
    print('Presentation data only: no schema, legal, editorial or approval validation is implied.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
