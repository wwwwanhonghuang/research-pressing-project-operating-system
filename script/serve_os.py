#!/usr/bin/env python3
"""Serve the Operations OS workspace locally: the os-site client plus a small JSON
API that keeps project records as files under projects/.

Definitions (content/, pipeline/) are never written. Records of what actually
happened in a project are: stage status, task runs, filled documents, checklist
runs and human decisions. projects/ is git-ignored because records may hold
confidential material. The API writes a decision only as submitted by a person;
nothing here infers or grants an approval.

Definitions are served live: /data/*.json is composed from the canonical JSON
and recomposed whenever a source file changes, so the workspace never shows a
stale bundle (the committed os-site/data/ copy is for static hosting only).

Standard library only. Binds to 127.0.0.1 and rejects foreign Host headers.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import tempfile
import threading
import time
from datetime import date, datetime, timezone
from functools import partial
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'script'))
import init_project  # noqa: E402
import build_site_data  # noqa: E402

SITE = ROOT / 'os-site'
STAGE_STATUSES = ('not_started', 'active', 'in_review', 'blocked', 'completed', 'reopened', 'skipped')
TASK_STATUSES = ('not_started', 'in_progress', 'blocked', 'ready_for_review', 'changes_requested', 'completed', 'waived')
DOC_STATUSES = ('draft', 'in_review', 'final')
OUTCOMES = ('approved', 'changes_requested', 'rejected', 'noted')

PROJECT_ID = re.compile(r'[a-z0-9][a-z0-9_-]{0,63}')
STAGE_ID = re.compile(r'\d\d')
TASK_ID = re.compile(r'TSK-[A-Z0-9]+(?:-[A-Z0-9]+)*')
TEMPLATE_ID = re.compile(r'TPL-(?:DOC|CHK)-\d{3}')
VERSION = re.compile(r'\d+\.\d+\.\d+')
DOC_ID = re.compile(r'DOC-\d{3}-\d{3}')
MAX_BODY = 2 * 1024 * 1024


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def text(value, limit, field):
    if value is None:
        return None
    if not isinstance(value, str) or len(value) > limit:
        raise ApiError(400, f'{field} must be text of at most {limit} characters')
    return value


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def write_json(path, data):
    """Atomic, LF-only write."""
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix='.tmp-', dir=path.parent)
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write((json.dumps(data, ensure_ascii=False, indent=2) + '\n').encode('utf-8'))
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise


class Store:
    """Project records on disk, in the layout init_project.py creates."""

    def __init__(self, projects_dir: Path):
        self.dir = Path(projects_dir)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.lock = threading.Lock()

    # ------------------------------------------------------------ helpers
    def project_dir(self, pid):
        if not PROJECT_ID.fullmatch(pid or ''):
            raise ApiError(404, 'Unknown project')
        path = self.dir / pid
        if not (path / 'project.json').is_file():
            raise ApiError(404, f'No project “{pid}”')
        return path

    def stage_dir(self, pid, sid):
        base = self.project_dir(pid)
        if not STAGE_ID.fullmatch(sid or '') or sid not in read_json(base / 'project.json')['stage_ids']:
            raise ApiError(404, f'No stage {sid} in this project')
        return base / 'stages' / sid

    def touch(self, base):
        record = read_json(base / 'project.json')
        record['updated_at_utc'] = now()
        write_json(base / 'project.json', record)

    # ------------------------------------------------------------ reads
    def summary(self, base):
        record = read_json(base / 'project.json')
        stages = []
        for sid in record['stage_ids']:
            st = base / 'stages' / sid
            meta = read_json(st / 'stage.json') if (st / 'stage.json').is_file() else {}
            runs = [read_json(p) for p in sorted((st / 'tasks').glob('TSK-*.json'))]
            stages.append({'id': sid, 'status': meta.get('status', 'not_started'),
                           'tasks_completed': sum(1 for r in runs if r.get('status') in ('completed', 'waived'))})
        documents = len(list((base / 'artifacts').glob('DOC-*.json')))
        return {**record, 'stages': stages, 'documents': documents}

    def list_projects(self):
        self.dir.mkdir(parents=True, exist_ok=True)   # the folder may have been removed while serving
        out = []
        for path in sorted(self.dir.iterdir()):
            if path.is_dir() and PROJECT_ID.fullmatch(path.name) and (path / 'project.json').is_file():
                try:
                    out.append(self.summary(path))
                except (OSError, ValueError, KeyError):
                    continue
        out.sort(key=lambda p: p.get('updated_at_utc') or p.get('created_at_utc') or '', reverse=True)
        return out

    def get_project(self, pid):
        base = self.project_dir(pid)
        record = read_json(base / 'project.json')
        stages, tasks = {}, {}
        for sid in record['stage_ids']:
            st = base / 'stages' / sid
            stages[sid] = read_json(st / 'stage.json') if (st / 'stage.json').is_file() else {'stage_id': sid, 'status': 'not_started'}
            tasks[sid] = {p.stem: read_json(p) for p in sorted((st / 'tasks').glob('TSK-*.json'))}
        documents = [read_json(p) for p in sorted((base / 'artifacts').glob('DOC-*.json'))]
        decisions = [read_json(p) for p in sorted((base / 'records/decisions').glob('DEC-*.json'))]
        return {'project': record, 'stages': stages, 'tasks': tasks, 'documents': documents, 'decisions': decisions}

    # ------------------------------------------------------------ writes
    def create_project(self, body):
        title = (text(body.get('title'), 200, 'title') or '').strip()
        if not title:
            raise ApiError(400, 'A project needs a title')
        pid = (body.get('id') or '').strip()
        if not PROJECT_ID.fullmatch(pid):
            raise ApiError(400, 'The identifier must be 1–64 lowercase letters, digits, hyphens or underscores, starting with a letter or digit')
        summary = text(body.get('summary'), 4000, 'summary')
        with self.lock:
            try:
                init_project.create(pid, title, 'eight_stage.json', projects_dir=self.dir)
            except FileExistsError:
                raise ApiError(409, f'A project “{pid}” already exists')
            except (ValueError, RuntimeError) as exc:
                raise ApiError(400, str(exc))
            base = self.dir / pid
            record = read_json(base / 'project.json')
            record.update({'summary': summary or '', 'updated_at_utc': now()})
            write_json(base / 'project.json', record)
        return self.summary(base)

    def update_project(self, pid, body):
        base = self.project_dir(pid)
        with self.lock:
            record = read_json(base / 'project.json')
            if 'title' in body:
                title = (text(body['title'], 200, 'title') or '').strip()
                if not title:
                    raise ApiError(400, 'A project needs a title')
                record['title'] = title
            if 'summary' in body:
                record['summary'] = text(body['summary'], 4000, 'summary') or ''
            record['updated_at_utc'] = now()
            write_json(base / 'project.json', record)
        return record

    def update_stage(self, pid, sid, body):
        st = self.stage_dir(pid, sid)
        with self.lock:
            meta = read_json(st / 'stage.json')
            if 'status' in body:
                if body['status'] not in STAGE_STATUSES:
                    raise ApiError(400, f'Stage status must be one of {", ".join(STAGE_STATUSES)}')
                meta['status'] = body['status']
            if 'note' in body:
                meta['note'] = text(body['note'], 8000, 'note') or ''
            meta['updated_at_utc'] = now()
            write_json(st / 'stage.json', meta)
            self.touch(self.project_dir(pid))
        return meta

    def put_task(self, pid, sid, tid, body):
        st = self.stage_dir(pid, sid)
        if not TASK_ID.fullmatch(tid or ''):
            raise ApiError(404, 'Unknown task')
        path = st / 'tasks' / f'{tid}.json'
        with self.lock:
            run = read_json(path) if path.is_file() else {
                'schema_version': '0.1.0', 'task_id': tid, 'stage_id': sid, 'status': 'not_started',
                'steps': {}, 'criteria': {}, 'notes': '', 'assignee': '', 'created_at_utc': now()}
            if 'task_version' in body:
                if not VERSION.fullmatch(str(body['task_version'])):
                    raise ApiError(400, 'task_version must be a semantic version')
                run['task_version'] = body['task_version']
            if 'status' in body:
                if body['status'] not in TASK_STATUSES:
                    raise ApiError(400, f'Task status must be one of {", ".join(TASK_STATUSES)}')
                run['status'] = body['status']
            for key in ('steps', 'criteria'):
                if key in body:
                    value = body[key]
                    if not isinstance(value, dict) or not all(isinstance(k, str) and len(k) < 80 and isinstance(v, bool) for k, v in value.items()):
                        raise ApiError(400, f'{key} must map identifiers to true or false')
                    run[key] = value
            if 'notes' in body:
                run['notes'] = text(body['notes'], 40000, 'notes') or ''
            if 'assignee' in body:
                run['assignee'] = text(body['assignee'], 200, 'assignee') or ''
            run['updated_at_utc'] = now()
            write_json(path, run)
            meta = read_json(st / 'stage.json')
            meta['tasks_instantiated'] = len(list((st / 'tasks').glob('TSK-*.json')))
            write_json(st / 'stage.json', meta)
            self.touch(self.project_dir(pid))
        return run

    def template_exists(self, tid, version):
        current = ROOT / 'content/templates' / f'{tid}.json'
        if current.is_file() and read_json(current)['version'] == version:
            return read_json(current)
        archived = ROOT / 'content/template_versions' / tid / f'{version}.json'
        return read_json(archived) if archived.is_file() else None

    def create_document(self, pid, body):
        base = self.project_dir(pid)
        tid, version = body.get('template_id', ''), str(body.get('template_version', ''))
        if not TEMPLATE_ID.fullmatch(tid) or not VERSION.fullmatch(version):
            raise ApiError(400, 'A document needs a template ID and version')
        template = self.template_exists(tid, version)
        if not template:
            raise ApiError(400, f'No template {tid} v{version}')
        stage_id = body.get('stage_id')
        if stage_id is not None:
            self.stage_dir(pid, stage_id)
        task_id = body.get('task_id')
        if task_id is not None and not TASK_ID.fullmatch(task_id):
            raise ApiError(400, 'Unknown task')
        with self.lock:
            prefix = f'DOC-{tid[-3:]}-'
            used = [int(p.stem[-3:]) for p in (base / 'artifacts').glob(f'{prefix}*.json')]
            doc_id = f'{prefix}{(max(used) + 1 if used else 1):03d}'
            doc = {
                'id': doc_id, 'template_id': tid, 'template_version': version, 'project_id': pid,
                'kind': template['kind'], 'title': text(body.get('title'), 200, 'title') or template['title_ja'],
                'stage_id': stage_id, 'task_id': task_id, 'status': 'draft',
                'field_values': {}, 'check_results': {}, 'evidence_refs': [], 'review_decision_ids': [],
                'created_at_utc': now(), 'updated_at_utc': now(),
            }
            write_json(base / 'artifacts' / f'{doc_id}.json', doc)
            self.touch(base)
        return doc

    def update_document(self, pid, did, body):
        base = self.project_dir(pid)
        if not DOC_ID.fullmatch(did or ''):
            raise ApiError(404, 'Unknown document')
        path = base / 'artifacts' / f'{did}.json'
        if not path.is_file():
            raise ApiError(404, f'No document {did}')
        with self.lock:
            doc = read_json(path)
            if 'status' in body:
                if body['status'] not in DOC_STATUSES:
                    raise ApiError(400, f'Document status must be one of {", ".join(DOC_STATUSES)}')
                doc['status'] = body['status']
            if 'title' in body:
                doc['title'] = text(body['title'], 200, 'title') or doc['title']
            for key in ('field_values', 'check_results'):
                if key in body:
                    if not isinstance(body[key], dict):
                        raise ApiError(400, f'{key} must be an object')
                    doc[key] = body[key]
            if len(json.dumps(doc, ensure_ascii=False)) > MAX_BODY:
                raise ApiError(400, 'Document too large')
            doc['updated_at_utc'] = now()
            write_json(path, doc)
            self.touch(base)
        return doc

    def create_decision(self, pid, body):
        base = self.project_dir(pid)
        outcome = body.get('outcome')
        if outcome not in OUTCOMES:
            raise ApiError(400, f'Outcome must be one of {", ".join(OUTCOMES)}')
        decided_by = (text(body.get('decided_by'), 200, 'decided_by') or '').strip()
        if not decided_by:
            raise ApiError(400, 'A decision records the person who made it')
        target = body.get('target') or {}
        if target.get('kind') not in ('stage', 'task', 'document') or not isinstance(target.get('id'), str) or len(target['id']) > 80:
            raise ApiError(400, 'A decision needs a target: a stage, task or document')
        on = body.get('date') or date.today().isoformat()
        try:
            date.fromisoformat(on)
        except ValueError:
            raise ApiError(400, 'date must be YYYY-MM-DD')
        with self.lock:
            folder = base / 'records/decisions'
            used = [int(p.stem[4:]) for p in folder.glob('DEC-*.json') if p.stem[4:].isdigit()]
            dec_id = f'DEC-{(max(used) + 1 if used else 1):04d}'
            record = {
                'id': dec_id, 'project_id': pid, 'target': {'kind': target['kind'], 'id': target['id']},
                'outcome': outcome, 'decided_by': decided_by, 'role': text(body.get('role'), 200, 'role') or '',
                'date': on, 'conditions': text(body.get('conditions'), 8000, 'conditions') or '',
                'recorded_at_utc': now(),
                'note': 'Recorded as submitted by a person. Identity and authority are not verified by this tool.',
            }
            write_json(folder / f'{dec_id}.json', record)
            if target['kind'] == 'document' and DOC_ID.fullmatch(target['id']):
                doc_path = base / 'artifacts' / f'{target["id"]}.json'
                if doc_path.is_file():
                    doc = read_json(doc_path)
                    doc.setdefault('review_decision_ids', []).append(dec_id)
                    write_json(doc_path, doc)
            self.touch(base)
        return record


class LiveData:
    """Definition bundles composed from the canonical JSON, recomposed on change."""

    def __init__(self):
        self.lock = threading.Lock()
        self.signature = None
        self.files = None
        self.checked = 0.0

    def get(self, name):
        with self.lock:
            if self.files is None or time.monotonic() - self.checked > 1.0:
                signature = build_site_data.source_signature()
                self.checked = time.monotonic()
                if signature != self.signature:
                    self.files = build_site_data.compose()['files']
                    self.signature = signature
            return self.files.get(name)


def make_handler(store: Store, port: int, live: LiveData | None = None):
    live = live or LiveData()
    allowed_hosts = {f'127.0.0.1:{port}', f'localhost:{port}'}

    class Handler(SimpleHTTPRequestHandler):
        server_version = 'OperationsOS/1'

        def log_message(self, fmt, *args):
            if os.environ.get('OPS_QUIET'):
                return
            super().log_message(fmt, *args)

        def end_headers(self):
            self.send_header('Cache-Control', 'no-cache')
            self.send_header('X-Content-Type-Options', 'nosniff')
            super().end_headers()

        # ------------------------------------------------------------ plumbing
        def reply(self, status, payload):
            body = json.dumps(payload, ensure_ascii=False).encode('utf-8')
            self.send_response(status)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.send_header('Cache-Control', 'no-store')
            self.send_header('X-Content-Type-Options', 'nosniff')
            super().end_headers()
            self.wfile.write(body)

        def body(self):
            if not self.headers.get('Content-Type', '').startswith('application/json'):
                raise ApiError(415, 'Send JSON (Content-Type: application/json)')
            length = int(self.headers.get('Content-Length') or 0)
            if length > MAX_BODY:
                raise ApiError(413, 'Request too large')
            try:
                data = json.loads(self.rfile.read(length) or b'{}')
            except ValueError:
                raise ApiError(400, 'Malformed JSON')
            if not isinstance(data, dict):
                raise ApiError(400, 'Send a JSON object')
            return data

        def api(self, method):
            if self.headers.get('Host') not in allowed_hosts:
                raise ApiError(403, 'Unexpected host')
            parts = [unquote(p) for p in urlsplit(self.path).path.split('/')[2:] if p]
            if parts == ['health'] and method == 'GET':
                return 200, {'ok': True, 'store': 'filesystem', 'projects_dir': 'projects/'}
            if not parts or parts[0] != 'projects':
                raise ApiError(404, 'Unknown endpoint')
            rest = parts[1:]
            if not rest:
                if method == 'GET':
                    return 200, store.list_projects()
                if method == 'POST':
                    return 201, store.create_project(self.body())
            elif len(rest) == 1:
                if method == 'GET':
                    return 200, store.get_project(rest[0])
                if method == 'PUT':
                    return 200, store.update_project(rest[0], self.body())
            elif len(rest) == 3 and rest[1] == 'stages' and method == 'PUT':
                return 200, store.update_stage(rest[0], rest[2], self.body())
            elif len(rest) == 4 and rest[1] == 'tasks' and method == 'PUT':
                return 200, store.put_task(rest[0], rest[2], rest[3], self.body())
            elif len(rest) == 2 and rest[1] == 'documents' and method == 'POST':
                return 201, store.create_document(rest[0], self.body())
            elif len(rest) == 3 and rest[1] == 'documents' and method == 'PUT':
                return 200, store.update_document(rest[0], rest[2], self.body())
            elif len(rest) == 2 and rest[1] == 'decisions' and method == 'POST':
                return 201, store.create_decision(rest[0], self.body())
            raise ApiError(405 if method != 'GET' else 404, 'Unsupported request')

        def dispatch(self, method):
            try:
                status, payload = self.api(method)
                self.reply(status, payload)
            except ApiError as exc:
                self.reply(exc.status, {'error': str(exc)})
            except Exception as exc:  # keep the server alive; report without internals
                self.log_error('API failure: %r', exc)
                self.reply(500, {'error': 'The server could not complete this request'})

        def do_GET(self):
            if self.path.startswith('/api/'):
                return self.dispatch('GET')
            path = urlsplit(self.path).path
            if path.startswith('/data/') and path.endswith('.json'):
                try:
                    data = live.get(path[len('/data/'):])
                except build_site_data.BuildError as exc:
                    return self.reply(500, {'error': f'Definitions could not be composed: {exc}'})
                if data is None:
                    return self.reply(404, {'error': 'No such bundle'})
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return None
            return super().do_GET()

        def do_POST(self):
            if self.path.startswith('/api/'):
                return self.dispatch('POST')
            self.reply(405, {'error': 'Unsupported request'})

        def do_PUT(self):
            if self.path.startswith('/api/'):
                return self.dispatch('PUT')
            self.reply(405, {'error': 'Unsupported request'})

    return partial(Handler, directory=str(SITE))


def serve(port=8765, projects_dir=None):
    store = Store(projects_dir or ROOT / 'projects')
    server = ThreadingHTTPServer(('127.0.0.1', port), make_handler(store, port))
    return server


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument('--port', type=int, default=8765)
    ap.add_argument('--projects-dir', type=Path, default=ROOT / 'projects')
    args = ap.parse_args()
    server = serve(args.port, args.projects_dir)
    print(f'Operations OS: http://127.0.0.1:{args.port}/  (projects saved under {args.projects_dir})')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
