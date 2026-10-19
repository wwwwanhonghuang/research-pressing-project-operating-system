"""Reading-room data bundles: complete, resolvable, deterministic, current, and free
of approval claims. These test invariants against the source tree, not frozen counts."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'script'))
import build_site_data as site_build  # noqa: E402


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


class SiteDataTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.out = Path(cls.tmp.name)
        site_build.build(cls.out)
        cls.site = read(cls.out / 'site.json')
        cls.workflow = read(ROOT / 'core/workflows/eight_stage.json')
        cls.bundles = {s['id']: read(cls.out / f'stage-{s["id"]}.json') for s in cls.workflow['stages']}

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    def test_one_bundle_per_stage_plus_site_and_templates(self):
        expected = {'site.json', 'templates.json'} | {f'stage-{s["id"]}.json' for s in self.workflow['stages']}
        self.assertEqual({p.name for p in self.out.iterdir()}, expected)

    def test_totals_match_the_source_tree(self):
        totals = self.site['totals']
        op = ROOT / 'content/operational'
        self.assertEqual(totals['tasks'], len(list(op.glob('stage_*/tasks/*.json'))))
        self.assertEqual(totals['procedures'], len(list(op.glob('stage_*/procedures/*.json'))))
        self.assertEqual(totals['knowledge'], len(list(op.glob('stage_*/knowledge/*.json'))))
        self.assertEqual(totals['templates'], len(list((ROOT / 'content/templates').glob('TPL-*.json'))))
        self.assertEqual(totals['handbooks'], len(self.workflow['stages']))
        prompts = sum(len(list((ROOT / 'pipeline' / s['directory'] / 'AI_ASSIST/common_prompts').glob('*.md'))) for s in self.workflow['stages'])
        self.assertEqual(totals['prompts'], prompts)

    def test_every_reference_resolves_inside_its_bundle(self):
        for sid, bundle in self.bundles.items():
            objects = bundle['objects']
            for chapter in bundle['handbook']['chapters']:
                for part in chapter['parts']:
                    if part['t'] == 'include':
                        self.assertIn(part['key'], objects, f'stage {sid}: handbook include')
            for name, keys in bundle['collection'].items():
                for key in keys:
                    self.assertIn(key, objects, f'stage {sid}: collection {name}')
            for rec in objects.values():
                if rec['kind'] == 'task_definition':
                    d = rec['data']
                    for ref in [d['procedure_ref'], *d['document_template_refs'], *d['checklist_refs'], *d['standard_refs'], *d['ethics_refs']]:
                        self.assertIn(f'{ref["id"]}@{ref["version"]}', objects, f'{rec["id"]} pins {ref["id"]}')

    def test_every_prompt_supports_a_task_of_its_stage(self):
        for sid, bundle in self.bundles.items():
            tasks = {bundle['objects'][k]['id'] for k in bundle['collection']['tasks']}
            for key in bundle['collection']['prompts']:
                self.assertIn(bundle['objects'][key]['data']['task_id'], tasks, key)

    def test_nothing_claims_approval(self):
        for bundle in [*self.bundles.values(), read(self.out / 'templates.json')]:
            for rec in bundle['objects'].values():
                d = rec['data']
                self.assertNotEqual((d.get('authority') or {}).get('institutional_approval'), 'approved', rec['key'])
                self.assertNotEqual(d.get('authority_status'), 'approved', rec['key'])

    def test_hashes_match_source_bytes(self):
        import hashlib
        for bundle in self.bundles.values():
            for rec in list(bundle['objects'].values())[:40]:
                self.assertEqual(hashlib.sha256((ROOT / rec['path']).read_bytes()).hexdigest(), rec['sha256'], rec['path'])

    def test_build_is_deterministic(self):
        with tempfile.TemporaryDirectory() as other:
            site_build.build(Path(other))
            for path in self.out.iterdir():
                self.assertEqual(path.read_bytes(), (Path(other) / path.name).read_bytes(), path.name)

    def test_committed_bundles_are_current(self):
        committed = ROOT / 'os-site/data'
        for path in self.out.iterdir():
            self.assertTrue((committed / path.name).is_file(), f'missing os-site/data/{path.name}: run make site')
            self.assertEqual(path.read_bytes(), (committed / path.name).read_bytes(),
                             f'os-site/data/{path.name} is stale: run make site and commit the result')

    def test_prompt_markdown_parsing(self):
        title, blocks = site_build.parse_markdown('# Title\n\n## Use\n\nText one\ncontinues.\n\n- a\n- b\n\n> quoted\n\n目的：確認する。\n')
        self.assertEqual(title, 'Title')
        self.assertEqual([b['kind'] for b in blocks], ['heading', 'paragraph', 'list', 'quote', 'labelled'])
        self.assertEqual(blocks[1]['text'], 'Text one continues.')
        self.assertEqual(blocks[2]['items'], ['a', 'b'])
        self.assertEqual(blocks[4]['label'], '目的')
        self.assertEqual(site_build.parse_markdown('前の行\n次の行')[1][0]['text'], '前の行次の行')


if __name__ == '__main__':
    unittest.main()
