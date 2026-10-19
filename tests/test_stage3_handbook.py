"""Stage 3: canonical references, ethics, versioning and publication boundaries."""
import json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'script'))
from compose_handbook import load_validate, sections, resolve, render
CAN=ROOT/'content/operational/stage_03'

class Stage3Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.recipe=load_validate('publication_recipe',CAN/'recipes/PUB-INT-HANDBOOK.json')
        cls.chapters,cls.inventory=sections(cls.recipe,CAN)
    def test_objects_and_recipe(self):
        kinds=[p['kind'] for c in self.chapters for p in c['parts']]
        self.assertEqual(kinds.count('task_definition'),9)
        self.assertEqual(kinds.count('procedure_definition'),9)
        self.assertEqual(kinds.count('knowledge_entry'),10)
        self.assertEqual(kinds.count('checklist_definition'),6)
        self.assertEqual(len(self.chapters),15)
    def test_every_task_has_valid_links(self):
        for p in (CAN/'tasks').glob('*.json'):
            obj=load_validate('task_definition',p)
            refs=[obj['procedure_ref']]+obj['standard_refs']+obj['ethics_refs']+obj['checklist_refs']+obj['document_template_refs']
            for item in refs:
                if item['kind']=='document_template':
                    data=json.loads((ROOT/'content/templates'/(item['id']+'.json')).read_text(encoding='utf8'))
                    self.assertEqual(data['version'],item['version'])
                else:
                    self.assertEqual(resolve(item,[],CAN)['version'],item['version'])
    def test_revised_checklists_and_old_versions(self):
        for cid in ('TPL-CHK-004','TPL-CHK-006','TPL-CHK-021','TPL-CHK-022','TPL-CHK-023','TPL-CHK-024'):
            old=resolve({'kind':'checklist_definition','id':cid,'version':'0.1.0'},[],CAN)
            new=resolve({'kind':'checklist_definition','id':cid,'version':'0.2.0'},[],CAN)
            self.assertNotEqual(old['sections'][0]['items'][0]['criterion_ja'],new['sections'][0]['items'][0]['criterion_ja'])
    def test_template_history(self):
        for i in range(44,53):
            tid=f'TPL-DOC-{i:03d}'
            now=json.loads((ROOT/'content/templates'/(tid+'.json')).read_text(encoding='utf8'))
            prev=json.loads((ROOT/'content/template_versions'/tid/'0.1.0.json').read_text(encoding='utf8'))
            self.assertEqual(now['version'],'0.2.0')
            self.assertEqual(prev['version'],'0.1.0')
    def test_review_gate_not_publication_approval(self):
        stage=json.loads((ROOT/'pipeline/3_Interview_And_Additional_Confirmation/stage.json').read_text(encoding='utf8'))
        self.assertEqual(len(stage['task_definitions']),9)
        self.assertFalse(stage['review_gate']['human_signoff_required_for_publication'])
        self.assertIn('公開承認',stage['review_gate']['note'])
    def test_source_provenance_and_status(self):
        for p in (CAN/'knowledge').glob('*.json'):
            data=load_validate('knowledge_entry',p)
            self.assertEqual(data['authority']['institutional_approval'],'none')
            self.assertEqual(data['lifecycle'],'draft')
            self.assertTrue(all(a.get('locator') and a.get('accessed_on') for a in data['sources']))
    def test_ai_and_confidentiality(self):
        prompts=list((ROOT/'pipeline/3_Interview_And_Additional_Confirmation/AI_ASSIST/common_prompts').glob('PRC-INT-*.md'))
        self.assertEqual(len(prompts),9)
        self.assertTrue(all('外部AI' in p.read_text(encoding='utf8') for p in prompts))
    def test_layout_and_independent_status(self):
        t=render(self.recipe,self.chapters)
        for term in ('収録・公表条件と同意','引用候補・帰属','科学的妥当性'):
            self.assertIn(term,t)
        self.assertNotIn('\\colorbox',t)
        self.assertIn('独立設計・試作',t)
    def test_version_mismatch_rejected(self):
        with self.assertRaises(ValueError):
            resolve({'kind':'knowledge_entry','id':'KNW-INT-TRACE','version':'99.0.0'},[],CAN)

if __name__=='__main__':unittest.main()
