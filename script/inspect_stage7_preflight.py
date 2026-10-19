#!/usr/bin/env python3
"""Offline Stage 6 -> Stage 7 consistency inspector.

Never grants publishing authority, uses no credentials and never contacts a platform.
It compares the proposed release target to a Stage 6 review record, and produces
information for an actual human with delegated decision-making authority.
"""
from __future__ import annotations
import argparse,hashlib,json,sys
from pathlib import Path
from check_release_gate import assess as assess_stage6

def assess(review:dict, package:dict)->dict:
    stage6=assess_stage6(review)
    blockers=list(stage6['blockers'])
    require={'package_id','target','channels','review_record_ref','operator','independent_verifier'}
    missing=require-set(package)
    if missing: blockers.append('Missing package keys: '+', '.join(sorted(missing)))
    if package.get('review_record_ref') != review['record_id']:
        blockers.append('Review record ID does not match')
    target=package.get('target') or {}
    if any(target.get(k)!=review['target'].get(k) for k in ('artifact_id','version','sha256')):
        blockers.append('Proposed target identity/version/hash differs from Stage 6 target')
    if not package.get('operator') or not package.get('independent_verifier'):
        blockers.append('Actual operator and independent verification role must be assigned')
    if package.get('operator') and package.get('operator')==package.get('independent_verifier'):
        blockers.append('Independent verification role must be distinct from operator')
    channels=package.get('channels',[])
    if not isinstance(channels,list) or not channels: blockers.append('At least one channel must be specified')
    else:
        for i,ch in enumerate(channels):
            if not isinstance(ch,dict): blockers.append(f'Channel {i}: invalid record');continue
            for k in ('channel_id','asset_id','asset_sha256','destination','planned_at','timezone','review_scope_reference'):
                if not ch.get(k): blockers.append(f'Channel {i}: missing {k}')
            h=ch.get('asset_sha256','')
            if len(h)!=64 or any(c not in '0123456789abcdef' for c in h):blockers.append(f'Channel {i}: invalid asset sha256')
            # A channel containing the primary asset must refer to its exact approved hash.
            if ch.get('asset_id')==review['target']['artifact_id'] and h!=review['target']['sha256']:
                blockers.append(f'Channel {i}: primary asset hash mismatch')
    if not any(isinstance(ch,dict) and ch.get('asset_id')==review['target']['artifact_id'] for ch in (channels if isinstance(channels,list) else [])):
        blockers.append('Reviewed primary artifact missing from package')
    # No machine can validate the scope and authenticity of a human's release delegation.
    return {'state':'BLOCKED' if blockers else 'DOCUMENTARY_CHECK_PASSED_HUMAN_AUTHORITY_UNVERIFIED',
            'blockers':blockers,'can_publish':False,'review_record':review['record_id'],
            'note':'Only documentary consistency is assessed. No credentials or publication authorization are verified; human signoff and channel-specific rights/scope verification remain necessary.'}

def main():
    p=argparse.ArgumentParser();p.add_argument('stage6_review',type=Path);p.add_argument('stage7_package',type=Path);a=p.parse_args()
    print(json.dumps(assess(json.loads(a.stage6_review.read_text()),json.loads(a.stage7_package.read_text())),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
