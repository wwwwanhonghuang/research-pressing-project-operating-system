#!/usr/bin/env python3
"""Export a website-neutral canonical JSON view; no site dependency or network."""
import argparse,json,hashlib
from pathlib import Path
from generate_tex import ROOT,choose_ids

def main():
    pa=argparse.ArgumentParser();pa.add_argument('--ids',nargs='*',default=[]);pa.add_argument('--output',type=Path,default=ROOT/'build/view');args=pa.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    for tid in choose_ids(args.ids):
        content=(ROOT/'content/templates'/f'{tid}.json').read_bytes();d=json.loads(content)
        view={'type':'template','id':d['id'],'kind':d['kind'],'version':d['version'],'status':d['status'],'workflow_id':d['workflow_id'],'stages':d['applicable_pipeline_stages'],'title_ja':d['title_ja'],'sections':d['sections'],'composition_slots':d.get('composition_slots',[]),'review_status':d['authority_status'],'semantic_sha256':hashlib.sha256(content).hexdigest()}
        (args.output/f'{tid}.json').write_text(json.dumps(view,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Exported {len(choose_ids(args.ids))} website-neutral view JSON records.')
if __name__=='__main__':main()
