#!/usr/bin/env python3
"""Validate project-specific field and checklist values against a pinned template."""
from __future__ import annotations
import argparse,json,re,sys
from datetime import date
from pathlib import Path
from generate_tex import ROOT

def validate_instance(doc):
    issues=[];tid=doc.get('template_id')
    if not tid or not re.fullmatch(r'TPL-(?:DOC|CHK)-\d{3}',tid):return ['Missing or invalid template_id']
    p=ROOT/'content/templates'/f'{tid}.json'
    if not p.is_file():return ['Template definition not found: '+tid]
    d=json.loads(p.read_text(encoding='utf-8'))
    if doc.get('template_version')!=d['version']:issues.append('Instance template version mismatch')
    if doc.get('status') not in ('draft','in_review','final'):issues.append('Invalid instance lifecycle state')
    fields={f['id']:f for s in d['sections'] for f in s.get('fields',[])}
    vals=doc.get('field_values',{})
    if not isinstance(vals,dict):issues.append('field_values must be an object'); vals={}
    for k,v in vals.items():
        f=fields.get(k)
        if not f:issues.append(f'Unknown field ID: {k}');continue
        t=f['type']
        if v is None:continue
        if t=='table':
            if not isinstance(v,list):issues.append(f'{k}: table must be an array of rows')
            elif any(not isinstance(row,(dict,list)) for row in v):issues.append(f'{k}: row must be array or object')
        elif t=='number' and not isinstance(v,(float,int)):issues.append(f'{k}: expected number')
        elif t=='date' and not isinstance(v,str):issues.append(f'{k}: expected ISO date string')
        elif t=='date' and v:
            try:date.fromisoformat(v)
            except ValueError:issues.append(f'{k}: date must be ISO YYYY-MM-DD')
        elif t!='number' and not isinstance(v,str):issues.append(f'{k}: expected string')
    results=doc.get('check_results',{})
    checks={x['id']:x for s in d['sections'] for x in s.get('items',[])}
    if results and d['kind']!='checklist':issues.append('Non-checklist document has check_results')
    if not isinstance(results,dict):issues.append('check_results must be an object');results={}
    for k,result in results.items():
        x=checks.get(k)
        if not x:issues.append(f'Unknown checklist item: {k}');continue
        if not isinstance(result,dict):issues.append(f'{k}: check result must be object');continue
        state=result.get('status','未確認')
        if state not in x['status_options']:issues.append(f'{k}: unsupported state: {state}');continue
        if state in x['evidence_required_for'] and not result.get('evidence_refs'):
            issues.append(f'{k}: evidence refs required for status {state}')
    return issues

def main():
    pa=argparse.ArgumentParser();pa.add_argument('file',type=Path);args=pa.parse_args()
    instance=json.loads(args.file.read_text(encoding='utf-8'))
    errors=validate_instance(instance)
    if errors:
        for e in errors:print('ERROR:',e,file=sys.stderr)
        return 1
    print(f"OK: instance {instance.get('id')} aligns with {instance.get('template_id')} v{instance.get('template_version')}")
    print('This establishes only structural validity, not the truth of its content or authorization.')
    return 0
if __name__=='__main__':sys.exit(main())
