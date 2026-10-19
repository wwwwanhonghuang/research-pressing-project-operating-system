#!/usr/bin/env python3
"""Compile generated TeX to PDFs; optional subset, parallel-free and deterministic commands."""
import argparse,shutil,subprocess,sys
from pathlib import Path
from generate_tex import ROOT,OUT,choose_ids

def main():
    pa=argparse.ArgumentParser();pa.add_argument('--ids',nargs='*',default=[]);pa.add_argument('--tex-dir',type=Path,default=OUT);pa.add_argument('--passes',type=int,default=1);args=pa.parse_args()
    if not shutil.which('xelatex'):pa.error('xelatex is required')
    ids=choose_ids(args.ids)
    for tid in ids:
        if not (args.tex_dir/f'{tid}.tex').exists():pa.error(f'Missing {tid}.tex. Run make tex first.')
        for _ in range(args.passes):
            cmd=['xelatex','-halt-on-error','-file-line-error','-interaction=nonstopmode',f'{tid}.tex']
            proc=subprocess.run(cmd,cwd=args.tex_dir,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,timeout=120)
            if proc.returncode:
                print(proc.stdout[-4500:],file=sys.stderr)
                raise SystemExit(f'{tid} failed XeLaTeX compilation')
        print(f'Compiled {tid}.pdf')
if __name__=='__main__':main()
