#!/usr/bin/env python3
"""Validate current structured-content pilot; no substantive/legal approval checks."""
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def read(p): return json.loads(p.read_text(encoding='utf-8'))

def main():
    errors=[]
    try: import jsonschema
    except ImportError: jsonschema=None
    sources={}
    checks=[
      ('core/schemas/knowledge_entry.schema.json',list(ROOT.glob('standards/*/entry.json'))+list(ROOT.glob('ethics/*/entry.json'))),
      ('core/schemas/task_definition.schema.json',list(ROOT.glob('pipeline/*/tasks/*/task.json'))),
      ('core/schemas/document_recipe.schema.json',list(ROOT.glob('publications/*.json'))),
    ]
    for schema_path,paths in checks:
        schema=read(ROOT/schema_path)
        if jsonschema:
            try:jsonschema.Draft202012Validator.check_schema(schema)
            except Exception as e:errors.append(f'{schema_path}: {e}')
        for p in paths:
            try:
                entry=read(p); key=entry['id']
                if key in sources:errors.append(f'duplicate ID: {key}')
                sources[key]=p
                if jsonschema:jsonschema.validate(entry,schema)
                if p.name=='task.json':
                    for child in (entry['procedure'],entry['checklist']):
                        if not (p.parent/child).is_file():errors.append(f'missing task dependency: {p.parent/child}')
                    for k in ('standard_refs','ethics_refs'):
                        for v in entry.get(k,[]):
                            # resolved below
                            pass
                elif p.name=='entry.json':
                    if entry['status']=='approved' and entry['authority']=='independent_proposal':
                        # approved as a draft policy could be possible, but the pilot does not support this claim
                        errors.append(f'pilot must not claim independent proposal approved: {key}')
            except Exception as e:errors.append(f'{p.relative_to(ROOT)}: {e}')
    for p in ROOT.glob('pipeline/*/tasks/*/task.json'):
        task=read(p)
        for category in ('standard_refs','ethics_refs'):
            for ref in task.get(category,[]):
                if ref not in sources:errors.append(f'{task["id"]}: missing {category}: {ref}')
    for p in ROOT.glob('publications/*.json'):
        recipe=read(p)
        for ch in recipe.get('chapters',[]):
            for sec in ch.get('sections',[]):
                for item in sec.get('items',[]):
                    if item['kind']=='include' and item['ref'] not in sources:
                        errors.append(f'{p.name}: missing include: {item["ref"]}')
    if errors:
        print('FAILED structured content checks:')
        for e in errors:print(' -',e)
        return 1
    print('OK structured content:',len(sources),'entries,',len(list(ROOT.glob('publications/*.json'))),'recipe(s).')
    if not jsonschema:print('NOTE: optional jsonschema package unavailable; full JSON-schema validation skipped.')
    print('No scientific, legal, rights, accessibility, institutional or approval validation performed.')
    return 0
if __name__=='__main__':sys.exit(main())
