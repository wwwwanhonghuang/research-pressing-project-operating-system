#!/usr/bin/env python3
"""Validate every canonical reusable template and its catalog metadata.

Validation covers structural contracts, ID uniqueness, stable reference alignment,
minimum section counts, and absence of unrenderable block types. It cannot
establish legal correctness, editorial truth or organizational authorization.
"""
import json,re,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def main():
    try:
        from jsonschema import Draft202012Validator
    except ImportError:
        Draft202012Validator=None
    catalog=json.loads((ROOT/'templates/catalog.json').read_text(encoding='utf-8'))
    files=sorted((ROOT/'content/templates').glob('TPL-*.json'))
    schema=json.loads((ROOT/'content/schemas/template_definition.schema.json').read_text(encoding='utf-8'))
    errors=[]; ids=set(); all_catalog={e['template_id']:e for e in catalog['entries']}
    for p in files:
        d=json.loads(p.read_text(encoding='utf-8'))
        tid=d['id'];ids.add(tid)
        if p.stem!=tid:errors.append(f'{tid}: wrong filename')
        if Draft202012Validator:
            for err in Draft202012Validator(schema).iter_errors(d):errors.append(f'{tid}: schema: {err.message}')
        if tid not in all_catalog:errors.append(f'{tid}: not in catalog');continue
        e=all_catalog[tid]
        for a,b in [('title_ja','title_ja'),('slug','slug'),('kind','kind')]:
            if d.get(a)!=e.get(b):errors.append(f'{tid}: catalog {a} mismatch')
        if d.get('workflow_id')!=e.get('workflow_id'):errors.append(f'{tid}: workflow mismatch')
        if d.get('applicable_pipeline_stages')!=e.get('applicable_pipeline_stages'):errors.append(f'{tid}: stage mismatch')
        if d.get('authority_status')!='unapproved':errors.append(f'{tid}: review state not supported by records')
        if len(d['sections'])<2:errors.append(f'{tid}: too few sections')
        item_ids=[];count_fields=0;count_checks=0
        for s in d['sections']:
            item_ids.append(s['id'])
            for f in s.get('fields',[]):
                item_ids.append(f['id']); count_fields+=1
                if f['type']=='table' and not f.get('columns'):errors.append(f'{tid}: columns missing')
            for x in s.get('items',[]):
                item_ids.append(x['id']);count_checks+=1
        if len(item_ids)!=len(set(item_ids)):errors.append(f'{tid}: duplicate section/field/item ID')
        if d['kind']=='document' and (len(d['sections'])<4 or count_fields<10):errors.append(f'{tid}: insufficient structured content')
        if d['kind']=='checklist' and count_checks<5:errors.append(f'{tid}: fewer than five substantive checks')
        if (ROOT/e['path']).is_file() is False:errors.append(f'{tid}: catalog placeholder missing')
        if e.get('definition_path')!=str(p.relative_to(ROOT)):errors.append(f'{tid}: definition path mismatch')
    if set(all_catalog)!=ids:errors.append(f'missing/extra canonical templates: {sorted(set(all_catalog)^ids)}')
    if len(ids)!=139:errors.append(f'expected 139 definitions, got {len(ids)}')
    if errors:
        print('FAILED\n'+'\n'.join('  - '+v for v in errors[:60]));return 1
    print(f'OK: {len(ids)} canonical templates (94 documents, 45 checklists), catalog alignment, section and ID checks.')
    print('JSON Schema validation:', 'enabled' if Draft202012Validator else 'not installed (semantic checks only)')
    return 0
if __name__=='__main__':sys.exit(main())
