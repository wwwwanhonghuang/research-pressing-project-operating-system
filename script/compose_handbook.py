#!/usr/bin/env python3
"""Resolve a version-pinned stage handbook recipe from canonical v1 objects.

Emits TeX, presentation-neutral JSON and provenance manifest. Never evaluates
user-authored text as TeX. It does not grant any authority or approval.
"""
from __future__ import annotations
import argparse, hashlib,json,sys,re
from pathlib import Path
import jsonschema
from generate_tex import esc
ROOT=Path(__file__).resolve().parents[1]
CAN=ROOT/'content/operational/stage_01'
SCHEMAS=ROOT/'core/model/v1/schemas'
PRINT_STYLE=ROOT/'templates/tex/operationshandbook.sty'
KIND_DIR={'knowledge_entry':'knowledge','task_definition':'tasks','procedure_definition':'procedures'}

def load_validate(kind, p):
 obj=json.loads(p.read_text(encoding='utf-8'))
 schema=json.loads((SCHEMAS/f'{kind}.schema.json').read_text(encoding='utf-8'))
 jsonschema.validate(obj,schema)
 return obj

def resolve(ref,book,base):
 k=ref['kind'];i=ref['id']
 if k not in KIND_DIR and k!='checklist_definition':raise ValueError(f'Unsupported included kind: {k}')
 p=(ROOT/'content/templates'/f'{i}.json') if k=='checklist_definition' else (base/KIND_DIR[k]/f'{i}.json')
 if not p.is_file():raise ValueError(f'Unresolved include: {i}')
 if k=='checklist_definition':
  obj=json.loads(p.read_text(encoding='utf-8'))
  jsonschema.validate(obj,json.loads((ROOT/'content/schemas/template_definition.schema.json').read_text(encoding='utf-8')))
  if obj['kind']!='checklist':raise ValueError('Included template is not a checklist: '+i)
 else:obj=load_validate(k,p)
 if obj['version']!=ref['version'] and k=='checklist_definition':
  historical=ROOT/'content/template_versions'/i/(ref['version']+'.json')
  if historical.is_file():
   p=historical
   obj=json.loads(p.read_text(encoding='utf-8'))
   jsonschema.validate(obj,json.loads((ROOT/'content/schemas/template_definition.schema.json').read_text(encoding='utf-8')))
 if obj['version']!=ref['version']:raise ValueError(f'Version conflict {i}: expected {ref["version"]}, observed {obj["version"]}')
 book.append({'id':i,'version':obj['version'],'kind':k,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'path':str(p.relative_to(ROOT))})
 return obj

def sections(recipe,base):
 source_registry=[];result=[]
 for chap in recipe['chapter_plan']:
  items=[]
  for part in chap['parts']:
   if part['kind']=='editorial_bridge':items.append({'kind':'editorial_bridge','text_ja':part['editorial_text']})
   else:
    obj=resolve(part['ref'],source_registry,base)
    items.append({'kind':part['ref']['kind'],'object':obj,'ref':part['ref']})
  result.append({'id':chap['chapter_id'],'title_ja':chap['heading_ja'],'parts':items})
 return result,source_registry

def paragraph(x):
 # Links are rendered as safe, breakable URLs rather than uninterrupted text.
 parts=re.split(r'(https?://[^\s（）。、；，]+)',x)
 chunks=[]
 for part in parts:
  if part.startswith(('https://','http://')):
   if any(v in part for v in ('{','}','\\','%','#')):raise ValueError('Unsafe URL in handbook text')
   chunks.append(r'\url{'+part+'}')
  else:chunks.append(esc(part))
 return r'\par '+''.join(chunks)+r'\par\medskip'+'\n'

def itemize(items):
 if not items:return ''
 return '\\begin{enumerate}[leftmargin=2em,itemsep=0.35em]\n'+''.join('\\item '+esc(it)+'\n' for it in items)+'\\end{enumerate}\n'

def render_knowledge(obj):
 out=['\\subsection{'+esc(obj['title']['ja'])+'}\n']
 for b in obj['blocks']:
  kind=b['kind'];v=b.get('text','')
  if kind=='heading':out.append('\\subsubsection{'+esc(v)+'}\n')
  elif kind=='list':out.append(itemize(b.get('items',[])))
  elif kind=='paragraph':out.append(paragraph(v))
  elif kind in ('notice','example'):out.append('\\noindent\\textbf{'+esc(b.get('label','留意事項'))+'}\\quad '+esc(v)+'\\par\\medskip\n')
  else:out.append(paragraph(v or b.get('label','関連データ項目。')))
 return ''.join(out)

def render_task(obj):
 out=['\\subsection{'+esc(obj['title']['ja'])+'}\n']
 out.append(paragraph('担当：'+obj.get('responsible_role','未設定')))
 for key,title in [('inputs','入力資料'),('outputs','成果物'),('acceptance_criteria','完了の確認事項')]:
  vals=obj.get(key,[])
  if vals:out.append('\\subsubsection*{'+title+'}\n'+itemize(vals))
 out.append(paragraph('人による判断を要する：'+('はい' if obj.get('requires_human_decision') else '設定なし')))
 return ''.join(out)

def render_procedure(obj):
 out=['\\subsubsection*{実施手順}\n','\\begin{enumerate}[leftmargin=2em,itemsep=0.65em]\n']
 for s in obj['steps']:
  st=s['instruction'];out.append('\\item '+esc(st))
  if s.get('expected_output'):
   out.append('\\par\\noindent\\textit{記録・成果：}'+esc(s['expected_output']))
  out.append('\\nobreak\\smallskip\n')
 out.append('\\end{enumerate}\n')
 out.append('\\subsubsection*{例外・差戻し}\n'+itemize(obj.get('exception_handling',[])))
 return ''.join(out)

def render_checklist(obj):
 out=['\\subsection{'+esc(obj['title_ja'])+'}\n']
 out.append(paragraph('確認用の定義であり、個別案件での実施状況、根拠資料、確認者、レビューの結果は別途保存する。'))
 for group in obj.get('sections',[]):
  if not group.get('items'):continue
  out.append('\\subsubsection*{'+esc(group['heading_ja'])+'}\n')
  out.append('\\begin{enumerate}[leftmargin=2em,itemsep=0.3em]\n')
  for item in group['items']:
   out.append('\\item '+esc(item['criterion_ja'])+'\\par\n')
  out.append('\\end{enumerate}\n')
 return ''.join(out)

def render(recipe,chs):
 pre=r'''\documentclass[a4paper,11pt]{article}
\usepackage{operationshandbook}
\begin{document}
\begin{center}
{\Large\bfseries '''+esc(recipe['title']['ja'])+r'''}\par\medskip
{\small 独立設計・試作・内容確認未了}\par
{\small v'''+esc(recipe['version'])+r'''\quad 2026年10月19日}\par
\end{center}
\vspace{6mm}
\noindent 本書は組織から承認を受けた規程又は公式の業務マニュアルを示すものではありません。実務への適用に際しては、必要な法令、利用許諾及び組織の権限規程を確認してください。\par
\tableofcontents
\clearpage
'''
 out=[pre]
 for c in chs:
  out.append('\\section{'+esc(c['title_ja'])+'}\n')
  for p in c['parts']:
   k=p['kind']
   if k=='editorial_bridge':out.append(paragraph(p['text_ja']))
   elif k=='knowledge_entry':out.append(render_knowledge(p['object']))
   elif k=='task_definition':out.append(render_task(p['object']))
   elif k=='procedure_definition':out.append(render_procedure(p['object']))
   elif k=='checklist_definition':out.append(render_checklist(p['object']))
   else:raise ValueError('unsupported part')
 out.append('\\end{document}\n')
 return ''.join(out)

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--recipe',type=Path,default=CAN/'recipes/PUB-PLN-HANDBOOK.json');ap.add_argument('--output',type=Path,default=ROOT/'build/handbooks/stage_01');ap.add_argument('--stem',default='stage-01-handbook');args=ap.parse_args()
 args.recipe=args.recipe.resolve()
 rec=load_validate('publication_recipe',args.recipe); chapters,inventory=sections(rec,args.recipe.resolve().parent.parent)
 args.output.mkdir(parents=True,exist_ok=True)
 (args.output/PRINT_STYLE.name).write_bytes(PRINT_STYLE.read_bytes())
 tex=render(rec,chapters)
 (args.output/(args.stem+'.tex')).write_text(tex,encoding='utf-8')
 view={'schema_version':'0.1.0','document_id':rec['id'],'version':rec['version'],'title_ja':rec['title']['ja'],'status':'independent_draft','chapters':chapters}
 (args.output/(args.stem+'.view.json')).write_text(json.dumps(view,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 inventory.append({'id':rec['id'],'kind':'publication_recipe','version':rec['version'],'sha256':hashlib.sha256(args.recipe.read_bytes()).hexdigest(),'path':str(args.recipe.relative_to(ROOT))})
 inventory.append({'id':'RENDER-TEX','kind':'renderer','version':'0.1.0','sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'path':'script/compose_handbook.py'})
 manifest={'recipe':rec['id'],'version':rec['version'],'included':inventory,'print_style_sha256':hashlib.sha256(PRINT_STYLE.read_bytes()).hexdigest(),'tex_sha256':hashlib.sha256(tex.encode('utf-8')).hexdigest()}
 (args.output/(args.stem+'.manifest.json')).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
 print(f'Composed {len(chapters)} chapters and {len(inventory)-2} pinned object references at {args.output}')

if __name__=='__main__':
 try:main()
 except (ValueError,jsonschema.ValidationError) as e:print('ERROR:',e,file=sys.stderr);sys.exit(1)
