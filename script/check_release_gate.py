#!/usr/bin/env python3
"""Structural assessment of review documentation. NEVER grants publication permission."""
import json,sys,argparse
from pathlib import Path
import jsonschema
ROOT=Path(__file__).resolve().parents[1]
DOMAINS={'scientific','editorial','rights','privacy','ethics'}
def assess(record):
 schema=json.loads((ROOT/'core/policies/release_gate/review_gate.schema.json').read_text())
 jsonschema.validate(record,schema)
 blockers=[]
 domains=[d['domain'] for d in record['review_domains']]
 if set(domains)!=DOMAINS or len(domains)!=5:blockers.append('Five unique review domains required')
 for d in record['review_domains']:
  if d['status'] in ('pending','blocked'):blockers.append(d['domain']+': review incomplete')
  if not d['reviewer'] or not d['record_ref']:blockers.append(d['domain']+': missing human review evidence')
  if d['status']=='not_applicable' and not d.get('not_applicable_reason'):blockers.append(d['domain']+': N/A requires rationale')
 for issue in record['outstanding_issues']:
  if issue['status']=='open' and issue['severity'] in ('critical','major'):blockers.append(issue['id']+': unresolved major issue')
 if record['decision']['target_sha256']!=record['target']['sha256']:blockers.append('Decision/target hash mismatch')
 dec=record['decision']
 if dec['status']!='approved':blockers.append('Decision is not unconditional approval')
 if not all(dec.get(s) for s in ['decision_maker','authority_basis','decision_record_ref']):blockers.append('Missing explicit decision authority record')
 # A semantically complete object can only be inspected; no role or signature authenticity verification.
 return {'state':'BLOCKED' if blockers else 'STRUCTURALLY_RECORDED_HUMAN_AUTHORIZATION_UNVERIFIED','blockers':blockers,'automatic_publication_allowed':False,'note':'This script does not verify real-world authority, legal compliance, signatures or release permission.'}
def main():
 a=argparse.ArgumentParser();a.add_argument('record',type=Path);ns=a.parse_args()
 rec=json.loads(ns.record.read_text());print(json.dumps(assess(rec),ensure_ascii=False,indent=2))
if __name__=='__main__':main()
