#!/usr/bin/env python3
"""Check all registered template placeholders and links to canonical definitions."""
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
def main():
    items=json.loads((ROOT/'templates/catalog.json').read_text(encoding='utf-8'))['entries']
    ids=set();paths=set();errors=[]
    for e in items:
        tid=e['template_id'];path=e['path']
        if tid in ids:errors.append(f'duplicate ID: {tid}')
        if path in paths:errors.append(f'duplicate path: {path}')
        ids.add(tid);paths.add(path)
        if not (ROOT/path).is_file():errors.append(f'missing template placeholder: {path}')
        if not (ROOT/e['definition_path']).is_file():errors.append(f'missing structured definition: {tid}')
        if e['kind'] not in ('document','checklist'):errors.append(f'unsupported kind: {tid}')
        if e['priority'] not in ('P0','P1','P2'):errors.append(f'unsupported priority: {tid}')
        if e['status']!='implemented_structural_draft':errors.append(f'inconsistent status: {tid}')
    if len(items)!=139:errors.append(f'expected 139 templates; found {len(items)}')
    if errors:print('\n'.join(errors),file=sys.stderr);return 1
    print(f'OK: {len(items)} template catalog entries and structured draft definitions.')
    return 0
if __name__=='__main__':sys.exit(main())
