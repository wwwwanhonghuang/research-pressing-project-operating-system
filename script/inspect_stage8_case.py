#!/usr/bin/env python3
"""Documentary-only inspector for post-publication correction and preservation.

No automatic corrections, deletion, publication, or legal authorization. The
content may be synthetic/untrusted; authority cannot be proven by an assertion.
"""
from __future__ import annotations
import json,sys,argparse
from pathlib import Path
REQUIRED=['publication_id','original_version','original_sha256','publication_url','finding_id','finding_description','evidence_refs','decision_status','decision_record_id','responsible_role','notice_url','updated_version','updated_sha256','affected_channels','preservation_manifest_id']
STATUSES={'pending','approved_correction','approved_clarification','approved_withdrawal','approved_removal','maintain_original','investigate'}

def assess(o:dict)->dict:
    issues=[]
    if not isinstance(o,dict):return {'state':'BLOCKED','blockers':['case object is not a dictionary'],'can_correct':False,'can_remove':False,'human_authority_verified':False}
    for k in REQUIRED:
        v=o.get(k)
        if v is None or (isinstance(v,(str,list,dict)) and not v):issues.append('missing or empty: '+k)
    status=o.get('decision_status')
    if status not in STATUSES:issues.append('invalid decision status')
    if status in {'pending','investigate'}:issues.append('correction decision pending')
    if o.get('original_sha256')==o.get('updated_sha256') and status in {'approved_correction','approved_clarification'}:
        issues.append('unchanged asset hash despite reported content update')
    if not isinstance(o.get('evidence_refs'),list) or not all(isinstance(x,str) and x.strip() for x in o.get('evidence_refs',[]) if isinstance(o.get('evidence_refs'),list)):
        issues.append('invalid evidence references')
    channels=o.get('affected_channels')
    if not isinstance(channels,list) or not all(isinstance(c,dict) and all(c.get(k) for k in ('channel_id','original_asset_id','status','verified_at')) for c in channels):
        issues.append('affected channels lack per-channel documentary verification')
    if o.get('unresolved_major_issues'):issues.append('unresolved major issues')
    if o.get('publication_id')==o.get('finding_id'):issues.append('record identifiers collided')
    return {'state':'BLOCKED' if issues else 'DOCUMENTARY_CHECK_PASSED_AUTHORITY_UNVERIFIED','blockers':issues,'can_correct':False,'can_remove':False,'can_publish':False,'human_authority_verified':False,'note':'A structured record cannot confirm the existence, identity, and real-world authority of a decision-maker.'}

def main():
    pa=argparse.ArgumentParser();pa.add_argument('file',type=Path);a=pa.parse_args()
    print(json.dumps(assess(json.loads(a.file.read_text(encoding='utf-8'))),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
