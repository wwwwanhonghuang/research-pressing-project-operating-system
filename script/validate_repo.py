#!/usr/bin/env python3
"""Lightweight consistency checks; no full schema, substantive or legal validation."""
import json
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
CATEGORIES=('standards','ethics','sops','handbooks')

def main():
    issues=[]
    def check(ok, description):
        if not ok: issues.append(description)
    def read_json(path):
        try: return json.loads(path.read_text(encoding='utf-8'))
        except (OSError,ValueError) as e:
            issues.append(f'{path.relative_to(ROOT)}: {e}'); return {}
    wf=read_json(ROOT/'core/workflows/eight_stage.json')
    stages=wf.get('stages',[]); ids=[s.get('id') for s in stages]
    check(ids==[f'{n:02}' for n in range(1,9)],'Eight ordered stage IDs 01–08 required')
    for name in ('standards','ethics','competencies','AI_ASSIST','script','core/schemas','core/policies'):
        check((ROOT/name).is_dir(),f'Missing root: {name}/')
    for category in CATEGORIES:
        check((ROOT/'docs'/category).is_dir(),f'Missing docs/{category}/')
    for stage in stages:
        folder=ROOT/'pipeline'/stage.get('directory','UNKNOWN')
        check(folder.is_dir(),f'Missing stage {folder.name}')
        if not folder.is_dir(): continue
        meta=read_json(folder/'stage.json')
        check(meta.get('id')==stage['id'],f'{folder.name}: stage ID mismatch')
        check(meta.get('workflow_version')==wf.get('version'),f'{folder.name}: workflow version mismatch')
        for cat in CATEGORIES:
            check((folder/'docs'/cat).is_dir(),f'{folder.name}: missing docs/{cat}')
        for name in ('tasks','AI_ASSIST'):
            check((folder/name).is_dir(),f'{folder.name}: missing {name}')
    projects=ROOT/'projects'; check(projects.is_dir(),'Missing projects/')
    proj=[p for p in projects.iterdir() if p.is_dir()] if projects.is_dir() else []
    for folder in proj:
        record=read_json(folder/'project.json')
        check(record.get('id')==folder.name,f'{folder.name}: ID mismatch')
        wf_file=record.get('workflow_file','eight_stage.json')
        if not __import__('re').fullmatch(r'[a-zA-Z0-9_-]+\.json',wf_file):
            issues.append(f'{folder.name}: unsafe workflow file');continue
        project_wf=read_json(ROOT/'core/workflows'/wf_file)
        project_ids=[s.get('id') for s in project_wf.get('stages',[])]
        check(record.get('workflow_id')==project_wf.get('id'),f'{folder.name}: workflow mismatch')
        check(record.get('stage_ids')==project_ids,f'{folder.name}: stage IDs mismatch')
        for fn in ('AGENTS.md','CLAUDE.md'):
            check((folder/fn).is_file(),f'{folder.name}: missing {fn}')
        for sid in project_ids:
            sf=folder/'stages'/sid; state=read_json(sf/'stage.json')
            check(state.get('stage_id')==sid,f'{folder.name}/{sid}: ID mismatch')
            check(state.get('definition_version')==record.get('workflow_version'),f'{folder.name}/{sid}: version mismatch')
            check(state.get('status') in ('not_started','active','in_review','blocked','completed','reopened','skipped'),f'{folder.name}/{sid}: invalid status')
            for fn in ('AGENTS.md','CLAUDE.md'):
                check((sf/fn).is_file(),f'{folder.name}/{sid}: missing {fn}')
    if issues:
        print('FAILED:'); print('\n'.join(' - '+x for x in issues)); return 1
    print(f'OK: {len(stages)} stages; {len(proj)} project(s); structural checks passed.')
    print('Not an editorial, legal, security, approval, or full JSON Schema validation.')
    return 0

if __name__=='__main__': sys.exit(main())
