#!/usr/bin/env python3
"""Build a readable catalog from versioned structured template metadata."""
import json
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    entries=json.loads((ROOT/'templates/catalog.json').read_text(encoding='utf-8'))['entries']
    groups=defaultdict(list)
    for e in entries:groups[e['group']].append(e)
    lines=['# Document and Checklist Catalog','',
        'General-purpose Operations OS. All entries are independent **structural drafts**, not approved institutional forms.','',
        f'**{len(entries)} templates: {sum(e["kind"]=="document" for e in entries)} documents and {sum(e["kind"]=="checklist" for e in entries)} checklists.**','',
        'Definitions: `content/templates/TPL-*.json`; print style: `templates/tex/operationsform.sty`.','']
    order=['shared']+[f'stage_{n:02d}' for n in range(1,9)]
    for group in order:
        lines.extend([f'## {group}','','| ID | Kind | Title | Priority | Stages | Sections | Fields / checks |','|---|---|---|---|---|---:|---:|'])
        for e in groups[group]:
            d=json.loads((ROOT/'content/templates'/f'{e["template_id"]}.json').read_text(encoding='utf-8'))
            fcount=sum(len(s.get('fields',[]))+len(s.get('items',[])) for s in d['sections'])
            lines.append(f'| `{e["template_id"]}` | {e["kind"]} | {e["title_ja"]} | {e["priority"]} | {", ".join(e["applicable_pipeline_stages"])} | {len(d["sections"])} | {fcount} |')
        lines.append('')
    lines.extend(['## Scope of completion','',
        'The layout/data model and structured section/checklist fields are implemented for every catalog item. Full substantive text, source-by-source authority review, formal SOP adoption and human sign-off remain future work.',''])
    out=ROOT/'templates/CATALOG.md';out.write_text('\n'.join(lines),encoding='utf-8')
    print('Catalog rebuilt:',out.relative_to(ROOT))
if __name__=='__main__':main()
