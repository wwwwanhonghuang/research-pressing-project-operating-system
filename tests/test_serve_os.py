"""The local workspace server: project records round-trip through the API into the
layout init_project.py defines, validation holds, and nothing is written outside
the projects directory or without a person's decision."""
import json
import os
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'script'))
os.environ['OPS_QUIET'] = '1'
import serve_os  # noqa: E402


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.dir = Path(cls.tmp.name)
        cls.server = serve_os.serve(0, cls.dir)
        port = cls.server.server_address[1]
        # serve() pins allowed hosts to the requested port; rebuild for the ephemeral one.
        cls.server.RequestHandlerClass = serve_os.make_handler(serve_os.Store(cls.dir), port)
        cls.base = f'http://127.0.0.1:{port}'
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.tmp.cleanup()

    def call(self, method, path, body=None, headers=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(self.base + path, data=data, method=method,
                                     headers={'Content-Type': 'application/json', **(headers or {})})
        try:
            with urllib.request.urlopen(req, timeout=10) as res:
                return res.status, json.loads(res.read() or b'null')
        except urllib.error.HTTPError as err:
            return err.code, json.loads(err.read() or b'null')

    def test_health_and_static(self):
        self.assertEqual(self.call('GET', '/api/health'), (200, {'ok': True, 'store': 'filesystem', 'projects_dir': 'projects/'}))
        with urllib.request.urlopen(self.base + '/index.html', timeout=10) as res:
            self.assertIn(b'Operations OS', res.read())

    def test_definitions_are_served_live(self):
        with urllib.request.urlopen(self.base + '/data/site.json', timeout=30) as res:
            site = json.loads(res.read())
        self.assertEqual(site['schema'], 'operations-os-site/1')
        self.assertEqual(self.call('GET', '/data/nothing.json')[0], 404)

    def test_project_lifecycle(self):
        status, project = self.call('POST', '/api/projects', {'title': '試験企画', 'id': 'trial-one', 'summary': 'synthetic'})
        self.assertEqual(status, 201)
        self.assertEqual(project['id'], 'trial-one')
        self.assertEqual(len(project['stages']), 8)
        folder = self.dir / 'trial-one'
        for name in ('project.json', 'AGENTS.md', 'CLAUDE.md', 'stages/01/stage.json', 'records/decisions'):
            self.assertTrue((folder / name).exists(), name)

        self.assertEqual(self.call('PUT', '/api/projects/trial-one/stages/01', {'status': 'active'})[0], 200)
        self.assertEqual(self.call('PUT', '/api/projects/trial-one/stages/01', {'status': 'approved'})[0], 400)
        self.assertEqual(self.call('PUT', '/api/projects/trial-one/stages/09', {'status': 'active'})[0], 404)

        status, run = self.call('PUT', '/api/projects/trial-one/tasks/01/TSK-PLN-TOPIC',
                                {'status': 'in_progress', 'task_version': '0.1.0', 'steps': {'PRC-PLN-TOPIC-S1': True}})
        self.assertEqual(status, 200)
        self.assertEqual(run['steps'], {'PRC-PLN-TOPIC-S1': True})
        self.assertEqual(json.loads((folder / 'stages/01/stage.json').read_text(encoding='utf-8'))['tasks_instantiated'], 1)

        status, doc = self.call('POST', '/api/projects/trial-one/documents',
                                {'template_id': 'TPL-CHK-016', 'template_version': '0.2.0', 'stage_id': '01', 'task_id': 'TSK-PLN-TOPIC'})
        self.assertEqual(status, 201)
        self.assertEqual(doc['id'], 'DOC-016-001')
        self.assertEqual(doc['status'], 'draft')
        status, doc = self.call('PUT', f'/api/projects/trial-one/documents/{doc["id"]}',
                                {'check_results': {'TPL-CHK-016-I001': {'status': '適合', 'evidence_refs': ['SRC-1']}}, 'status': 'in_review'})
        self.assertEqual(status, 200)
        self.assertEqual(doc['status'], 'in_review')

        status, dec = self.call('POST', '/api/projects/trial-one/decisions',
                                {'outcome': 'approved', 'decided_by': '', 'target': {'kind': 'stage', 'id': '01'}})
        self.assertEqual(status, 400, 'a decision must name a person')
        status, dec = self.call('POST', '/api/projects/trial-one/decisions',
                                {'outcome': 'changes_requested', 'decided_by': 'Editor A', 'target': {'kind': 'document', 'id': 'DOC-016-001'}})
        self.assertEqual(status, 201)
        self.assertIn('not verified', dec['note'])

        status, full = self.call('GET', '/api/projects/trial-one')
        self.assertEqual(status, 200)
        self.assertEqual(full['stages']['01']['status'], 'active')
        self.assertEqual(full['documents'][0]['review_decision_ids'], [dec['id']])
        self.assertEqual(len(full['decisions']), 1)

        status, projects = self.call('GET', '/api/projects')
        self.assertEqual([p['id'] for p in projects], ['trial-one'])
        self.assertEqual(self.call('POST', '/api/projects', {'title': 'x', 'id': 'trial-one'})[0], 409)

    def test_rejects_bad_identifiers_and_unknown_templates(self):
        self.call('POST', '/api/projects', {'title': 'second', 'id': 'trial-two'})
        self.assertEqual(self.call('POST', '/api/projects', {'title': 'bad', 'id': '../escape'})[0], 400)
        self.assertEqual(self.call('GET', '/api/projects/..%2Fetc')[0], 404)
        self.assertEqual(self.call('PUT', '/api/projects/trial-two/tasks/01/..%2F..%2Fx', {'status': 'in_progress'})[0], 404)
        self.assertEqual(self.call('POST', '/api/projects/trial-two/documents', {'template_id': 'TPL-DOC-999', 'template_version': '0.1.0'})[0], 400)
        self.assertFalse((self.dir.parent / 'escape').exists())

    def test_requires_json_and_local_host(self):
        req = urllib.request.Request(self.base + '/api/projects', data=b'title=x', method='POST',
                                     headers={'Content-Type': 'application/x-www-form-urlencoded'})
        with self.assertRaises(urllib.error.HTTPError) as ctx:
            urllib.request.urlopen(req, timeout=10)
        self.assertEqual(ctx.exception.code, 415)
        self.assertEqual(self.call('GET', '/api/projects', headers={'Host': 'evil.example'})[0], 403)

    def test_projects_pass_the_repository_validator(self):
        self.call('POST', '/api/projects', {'title': 'validated', 'id': 'trial-three'})
        record = json.loads((self.dir / 'trial-three/project.json').read_text(encoding='utf-8'))
        self.assertEqual(record['workflow_id'], 'editorial-eight-stage')
        for sid in record['stage_ids']:
            stage = json.loads((self.dir / 'trial-three/stages' / sid / 'stage.json').read_text(encoding='utf-8'))
            self.assertIn(stage['status'], serve_os.STAGE_STATUSES)


if __name__ == '__main__':
    unittest.main()
