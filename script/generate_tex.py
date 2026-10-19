#!/usr/bin/env python3
"""Render safe, standalone XeLaTeX sources from canonical structured templates.

No raw TeX or user content is executed as code: instance values are escaped.
TeX is a generated source artifact; operationsform.sty is the editable print
layout authority. The JSON is the editable semantic/content authority.
"""
from __future__ import annotations
import argparse,hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SCHEMA_DIR=ROOT/'content/templates'
STYLE=ROOT/'templates/tex/operationsform.sty'
OUT=ROOT/'build/tex'
SPECIAL={"\\":r'\textbackslash{}',"&":r'\&',"%":r'\%',"$":r'\$',"#":r'\#',"_":r'\_',"{":r'\{',"}":r'\}',"~":r'\textasciitilde{}',"^":r'\textasciicircum{}'}

def esc(x):
    return ''.join(SPECIAL.get(c,c) for c in str(x))

def choose_ids(raw):
    allids={p.stem for p in SCHEMA_DIR.glob('TPL-*.json')}
    ids=set(raw) if raw else allids
    bad=ids-allids
    if bad:raise ValueError(f'Unknown template IDs: {sorted(bad)}')
    return sorted(ids)

def rendered_table(field,value):
    # Borderless columns. Actual values are table data, never HTML or TeX.
    title=esc(field['label_ja']);cols=field.get('columns',['対象','内容','担当','備考'])
    if isinstance(value,list) and value:
        rows=value
    else:rows=[['']*len(cols) for _ in range(field.get('min_rows',2))]
    n=len(cols)
    # Equal columns; four-column structure fits A4 with small typography.
    colspec='@{}' + ('X'*n) + '@{}'
    lines=[r'\par\Needspace{4\baselineskip}\noindent\textbf{'+title+r'}\par\vspace{1mm}',r'{\fontsize{8.5}{13}\selectfont',r'\begin{tabularx}{\linewidth}{'+colspec+r'}', ' & '.join(r'\textbf{'+esc(c)+'}' for c in cols)+r'\\[2mm]']
    for row in rows:
        if isinstance(row,dict): cells=[row.get(c,'') for c in cols]
        elif isinstance(row,list):cells=(row+['']*n)[:n]
        else:cells=[str(row)]+['']*(n-1)
        lines.append(' & '.join(esc(v) or r'\strut' for v in cells)+r'\\[5mm]')
    lines.extend([r'\end{tabularx}',r'}\vspace{2mm}\par'])
    return '\n'.join(lines)

def render_blocks(blocks):
    out=[]
    for b in blocks:
        kind=b['kind']
        if kind=='heading':out.append(r'\par\Needspace{3\baselineskip}\vspace{2mm}\textbf{' + esc(b.get('text_ja','')) + r'}\par')
        elif kind in ('paragraph','quotation','normative_clause','procedure_step','case'):
            text=esc(b.get('text_ja',''))
            if kind=='quotation':text=r'\quad '+text
            out.append(r'\par\noindent '+text+r'\par\vspace{2mm}')
        elif kind=='list':
            out.append(r'\begin{itemize}')
            for child in b.get('children',[]):out.append(r'\item '+esc(child.get('text_ja','')))
            out.append(r'\end{itemize}')
        elif kind=='reference':out.append(r'\OPSnote{' + esc(b.get('text_ja','')+' '+', '.join(r.get('locator','') for r in b.get('references',[]))) + '}')
        elif kind in ('figure','table','media_link','equation'):
            out.append(r'\OPSnote{' + esc(b.get('text_ja','') or f'{kind}: metadata and asset reference pending') + '}')
        else:raise ValueError('Unknown or unsafe content block kind: '+kind)
    return out

def render(d, instance=None):
    if instance:
        if instance.get('template_id')!=d['id'] or instance.get('template_version')!=d['version']:
            raise ValueError('Instance references wrong template ID/version')
    values=(instance or {}).get('field_values',{})
    all_ids={f['id'] for s in d['sections'] for f in s.get('fields',[])}
    unknown=set(values)-all_ids
    if unknown:raise ValueError(f'{d["id"]}: instance contains unknown field IDs: {unknown}')
    lines=[r'\documentclass[11pt,a4paper]{article}',r'\usepackage{operationsform}',r'\begin{document}',r'\OPStitle{'+esc(d['title_ja'])+'}{'+esc(d['id'])+'}{'+esc(d['version'])+'}']
    for sidx,s in enumerate(d['sections'],1):
        lines.append(r'\OPSsection{'+str(sidx)+'}{'+esc(s['heading_ja'])+'}')
        for f in s.get('fields',[]):
            value=values.get(f['id'])
            if f['type']=='table':lines.append(rendered_table(f,value));continue
            if value is None or value=='':
                lines.append(r'\OPSblankshort{' + esc(f['label_ja']) + '}' if f['type'] in ('short_text','date','choice','number') else r'\OPSblanklong{' + esc(f['label_ja']) + '}')
            else:
                text = '、'.join(map(str,value)) if isinstance(value,list) else str(value)
                lines.append(r'\OPSfilled{' + esc(f['label_ja']) + '}{' + esc(text) + '}')
        for n,x in enumerate(s.get('items',[]),1):lines.append(r'\OPScheck{'+str(n)+'}{'+esc(x['criterion_ja'])+'}')
    if instance and instance.get('content_blocks'):
        blocks=instance['content_blocks']
        slots=d.get('composition_slots',[])
        used=set();next_index=len(d['sections'])+1
        for slot in slots:
            contents=[b for b in blocks if b.get('slot_id')==slot['id']]
            if contents:
                lines.append(r'\OPSsection{'+str(next_index)+'}{'+esc(slot['title_ja'])+'}')
                next_index+=1
                lines.extend(render_blocks(contents))
                used.update(b['id'] for b in contents)
        additional=[b for b in blocks if b['id'] not in used]
        if additional:
            lines.append(r'\OPSsection{'+str(next_index)+'}{補足内容・本文}')
            lines.extend(render_blocks(additional))
    lines.append(r'\end{document}')
    return '\n'.join(lines)+'\n'

def main():
    pa=argparse.ArgumentParser();pa.add_argument('--ids',nargs='*',default=[]);pa.add_argument('--output',type=Path,default=OUT);pa.add_argument('--instance',type=Path,default=None);args=pa.parse_args()
    ids=choose_ids(args.ids)
    instance=json.loads(args.instance.read_text(encoding='utf-8')) if args.instance else None
    if instance and len(ids)!=1:pa.error('--instance requires exactly one --ids value')
    args.output.mkdir(parents=True,exist_ok=True)
    (args.output/STYLE.name).write_bytes(STYLE.read_bytes())
    manifests=[]
    for tid in ids:
        p=SCHEMA_DIR/f'{tid}.json'; data=p.read_bytes();d=json.loads(data)
        tex=render(d,instance)
        (args.output/f'{tid}.tex').write_text(tex,encoding='utf-8')
        manifests.append({'template_id':tid,'template_version':d['version'],'canonical_sha256':hashlib.sha256(data).hexdigest(),'print_style_sha256':hashlib.sha256(STYLE.read_bytes()).hexdigest(),'tex_sha256':hashlib.sha256(tex.encode()).hexdigest()})
    (args.output/'manifest.json').write_text(json.dumps(manifests,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Generated {len(ids)} TeX sources in {args.output}')
if __name__=='__main__':
    try:main()
    except (ValueError,FileNotFoundError) as e: print('ERROR:',e,file=sys.stderr);sys.exit(1)
