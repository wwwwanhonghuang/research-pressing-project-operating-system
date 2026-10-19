#!/usr/bin/env python3
"""Validate v6 canonical JSON Schema fixture contracts and references only.
No approval, legal verification, real access-control or scientific verification.
"""
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
MODEL=ROOT/'core/model/v1'; FIX=MODEL/'examples'; SCHEMAS=MODEL/'schemas'

def main():
    try:
        from jsonschema import Draft202012Validator, FormatChecker
    except ImportError:
        print('ERROR: jsonschema dependency required (pip install jsonschema)')
        return 2
    errors=[];objects={}
    files=sorted(FIX.glob('*.json'))
    if not files:errors.append('No test fixtures found')
    for f in files:
        try:
            data=json.loads(f.read_text(encoding='utf-8'))
            kind=f.stem
            sf=SCHEMAS/(kind+'.schema.json')
            schema=json.loads(sf.read_text(encoding='utf-8'))
            Draft202012Validator.check_schema(schema)
            validator=Draft202012Validator(schema,format_checker=FormatChecker())
            for err in validator.iter_errors(data): errors.append(f'{f.name}: {err.message}')
            identity=(kind,data['id'],data['version'])
            if identity in objects:errors.append(f'Duplicate fixture identity {identity}')
            objects[identity]=data
        except Exception as exc:errors.append(f'{f.name}: {exc}')
    for name in SCHEMAS.glob('*.schema.json'):
        try:Draft202012Validator.check_schema(json.loads(name.read_text(encoding='utf-8')))
        except Exception as e:errors.append(f'Schema {name.name}: {e}')
    def refs(value):
        if isinstance(value,dict):
            if all(k in value for k in ('kind','id','version')) and isinstance(value['kind'],str):
                yield (value['kind'],value['id'],value['version'])
            for v in value.values(): yield from refs(v)
        elif isinstance(value,list):
            for v in value:yield from refs(v)
    for key,doc in objects.items():
        for target in refs(doc):
            if target not in objects: errors.append(f'{key[1]} missing pinned ref: {target}')
    catalog=json.loads((ROOT/'templates/catalog.json').read_text(encoding='utf-8'))
    registry={row['template_id']:row for row in catalog['entries']}
    for kind,entry in ((kind,v) for (kind,_,_),v in objects.items()):
        if kind in ('document_template','checklist_definition'):
            key=entry['template_catalog_id']; row=registry.get(key)
            if not row:errors.append(f'{entry["id"]}: missing catalog ID {key}'); continue
            expected='document' if kind=='document_template' else 'checklist'
            if row['kind']!=expected:errors.append(f'{entry["id"]}: wrong catalog kind')
            if row['path']!=entry.get('placeholder_path'):errors.append(f'{entry["id"]}: wrong placeholder mapping')
            if not (ROOT/row['path']).is_file():errors.append(f'{entry["id"]}: missing placeholder')
            if set(entry.get('applicable_stage_ids',[]))-set(row['applicable_pipeline_stages']):
                errors.append(f'{entry["id"]}: fixture stage not in catalog applicability')
    # Field and checklist item IDs must match pinned definition in synthetic cases.
    for kind,entry in ((kind,v) for (kind,_,_),v in objects.items()):
        if kind=='document_instance':
            r=entry['template_ref'];template=objects.get((r['kind'],r['id'],r['version']))
            if template:
                legal={f['id'] for s in template['sections'] for f in s.get('fields',[])}
                unknown=set(entry['field_values'])-legal
                if unknown:errors.append(f'{entry["id"]}: unknown field IDs {unknown}')
        if kind=='checklist_run':
            r=entry['definition_ref'];definition=objects.get((r['kind'],r['id'],r['version']))
            if definition:
                legal={f['id'] for f in definition['items']}
                answers=[a['item_id'] for a in entry['responses']]
                if len(answers)!=len(set(answers)) or set(answers)-legal:
                    errors.append(f'{entry["id"]}: duplicate/unknown item IDs')
    if errors:
        print('FAIL v6 canonical fixture checks:')
        for e in errors:print(' -',e)
        return 1
    print(f'OK v6 canonical model: {len(list(SCHEMAS.glob("*.schema.json")))} schemas, {len(files)} synthetic fixture objects; typed/versioned references resolve; template catalog links pass.')
    print('NOT verified: substantive evidence, normative applicability, institution approval, security, permissions, signatures or real project execution.')
    return 0
if __name__=='__main__':sys.exit(main())
