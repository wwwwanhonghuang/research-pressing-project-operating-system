#!/usr/bin/env python3
"""Create a lightweight, versioned project workspace. Standard library only."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]

def json_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')

def txt_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(data.strip()+'\n', encoding='utf-8')

def create(project_id, title, workflow_file='eight_stage.json'):
    if not re.fullmatch(r'[a-z0-9][a-z0-9_-]{0,63}', project_id):
        raise ValueError('Project ID must be a 1–64 character lowercase slug')
    if not title.strip():
        raise ValueError('Title must be nonempty')
    if not re.fullmatch(r'[a-zA-Z0-9_-]+\.json', workflow_file):
        raise ValueError('Workflow must be a filename under core/workflows/')
    workflow_path=ROOT/'core/workflows'/workflow_file
    if not workflow_path.is_file():
        raise ValueError(f'Unknown workflow preset: {workflow_file}')
    workflow = json.loads(workflow_path.read_text(encoding='utf-8'))
    stages = workflow['stages']
    for s in stages:
        if s.get('directory') and not (ROOT/'pipeline'/s['directory']).is_dir():
            raise RuntimeError(f'Missing stage source: {s["directory"]}')
    dest = ROOT/'projects'/project_id
    if dest.exists():
        raise FileExistsError(f'Project exists; refusing overwrite: {dest}')
    dest.mkdir(parents=True)
    try:
        json_write(dest/'project.json', {
            'schema_version':'0.1.0','id':project_id,'title':title.strip(),
            'workflow_id':workflow['id'],'workflow_version':workflow['version'],'workflow_file':workflow_file,
            'created_at_utc':datetime.now(timezone.utc).isoformat(timespec='seconds'),
            'authority_status':'independent_prototype',
            'stage_ids':[s['id'] for s in stages]})
        txt_write(dest/'README.md', f'''# {title}

This is an independent Operations OS **project instance**, initialized using workflow `{workflow['id']}` v{workflow['version']}. All stages start `not_started`. No tasks have been completed; no evidence, rights, or human approvals are implied.

- `stages/`: project-specific stage status and task-instance workspace.
- `sources/`: supporting sources, with permissions checked before ingestion.
- `artifacts/`: draft and published outputs, with their versions.
- `records/`: decisions, reviews, approvals and corrections.

This filesystem prototype does not enforce access controls. See `../../core/policies/HUMAN_ACCOUNTABILITY.md`.
''')
        txt_write(dest/'AGENTS.md',f'''# Project AI Context — {project_id}

Read `../../AI_ASSIST/README.md` and `../../core/policies/HUMAN_ACCOUNTABILITY.md`.

Project: {title}. Workflow: `{workflow['id']}` v{workflow['version']}.

Respect source provenance, uncertainty and confidentiality. AI cannot confirm consent, copyright, claims or scientific review, authorize publication, or send sensitive material to external systems without authorization. Require accountable human review. This file confers no permissions.
''')
        txt_write(dest/'CLAUDE.md','# Claude project context\n\nFollow `AGENTS.md` and the linked shared policies; there are no additional authorities.')
        for folder in ('sources','artifacts','records/decisions','records/reviews','records/approvals','records/corrections'):
            (dest/folder).mkdir(parents=True)
        for s in stages:
            sid = s['id']; location=dest/'stages'/sid
            (location/'tasks').mkdir(parents=True)
            json_write(location/'stage.json', {
                'schema_version':'0.1.0', 'stage_id':sid,
                'stage_name_ja':s['name_ja'],'definition_version':workflow['version'],
                'status':'not_started','tasks_instantiated':0,'approval_status':'not_requested'})
            txt_write(location/'README.md',f'''# Stage {sid} — {s['name_ja']}

Reusable definition: `../../../../{('pipeline/'+s['directory']) if s.get('directory') else ('core/workflows/'+workflow_file)}`.

This is a **project execution** workspace. Record completed task checklists, evidence, comments, review events and decisions here as they arise. No task instances are initialized yet.
''')
            txt_write(location/'tasks/README.md','Task instances go here when canonical task definitions exist. Keep definition IDs and versions, completed checks, evidence and reviewer decisions.')
            txt_write(location/'AGENTS.md',f'''# Stage {sid} AI context

Follow `../../AGENTS.md` and `../../../../core/policies/HUMAN_ACCOUNTABILITY.md`.
For stage-specific suggestions see the linked workflow's documentation and reusable task definitions. AI has no independent review or release authority.
''')
            txt_write(location/'CLAUDE.md','# Claude stage context\n\nFollow `AGENTS.md` and `../../CLAUDE.md`.')
    except BaseException:
        shutil.rmtree(dest,ignore_errors=True)
        raise
    return dest

def main():
    p=argparse.ArgumentParser(description='Initialize a Operations OS project scaffold')
    p.add_argument('project_id'); p.add_argument('--title',required=True); p.add_argument('--workflow',default='eight_stage.json',help='Workflow preset filename under core/workflows/')
    a=p.parse_args()
    try:
        dest=create(a.project_id,a.title,a.workflow)
    except (ValueError,FileExistsError,RuntimeError) as e:
        p.error(str(e))
    print(f'Created: {dest.relative_to(ROOT)} (0 completed tasks)')

if __name__=='__main__': main()
