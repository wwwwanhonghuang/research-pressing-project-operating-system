"""Stage 2 scope, schema validity, pinned composition and canonical checklist consistency."""
import json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'script'))
from compose_handbook import load_validate,sections,resolve,render
CAN=ROOT/'content/operational/stage_02'

class Stage2CompositionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.recipe=load_validate('publication_recipe',CAN/'recipes/PUB-RES-HANDBOOK.json')
        cls.chapters,cls.inventory=sections(cls.recipe,CAN)
    def test_exact_task_and_procedure_counts(self):
        kinds=[p['kind'] for c in self.chapters for p in c['parts']]
        self.assertEqual(kinds.count('task_definition'),8)
        self.assertEqual(kinds.count('procedure_definition'),8)
        self.assertEqual(kinds.count('knowledge_entry'),8)
    def test_five_revised_checklists(self):
        cs=[x for x in self.inventory if x['kind']=='checklist_definition']
        self.assertEqual(len(cs),5)
        self.assertEqual({x['version'] for x in cs},{'0.2.0'})
        self.assertEqual(len(set(x['id'] for x in cs)),5)
    def test_references_and_sops(self):
        for task_path in (CAN/'tasks').glob('*.json'):
            task=load_validate('task_definition',task_path)
            refs=[task['procedure_ref']]+task['standard_refs']+task['ethics_refs']+task['checklist_refs']
            for ref in refs:
                self.assertEqual(resolve(ref,[],CAN)['version'],ref['version'])
        self.assertEqual(len(list((CAN/'tasks').glob('*.json'))),8)
    def test_research_sources_are_attributable(self):
        for p in (CAN/'knowledge').glob('*.json'):
            ob=load_validate('knowledge_entry',p)
            self.assertTrue(all(s.get('locator') and s.get('accessed_on') for s in ob['sources']))
            self.assertEqual(ob['authority']['institutional_approval'],'none')
    def test_tex_style_and_binding(self):
        tx=render(self.recipe,self.chapters)
        self.assertIn('資料の同一性・版・来歴の確認',tx)
        self.assertIn('科学的主張・根拠対応表',tx)
        self.assertNotIn('\\colorbox',tx)
        self.assertIn('\\usepackage{operationshandbook}',tx)
    def test_handoff_is_not_publication_approval(self):
        stage=json.loads((ROOT/'pipeline/2_Presurvery_And_Precollection_Of_Data/stage.json').read_text())
        self.assertFalse(stage['review_gate']['human_signoff_required_for_publication'])
        self.assertEqual(len(stage['task_definitions']),8)
        self.assertIn('公開承認を意味しない',stage['review_gate']['note'])
    def test_ai_guides(self):
        prompt_dir=ROOT/'pipeline/2_Presurvery_And_Precollection_Of_Data/AI_ASSIST/common_prompts'
        self.assertEqual(len(list(prompt_dir.glob('*.md'))),8)
    def test_historical_checklist_revision_is_resolvable(self):
        from compose_handbook import resolve
        older=resolve({'kind':'checklist_definition','id':'TPL-CHK-002','version':'0.1.0'},[],CAN)
        current=resolve({'kind':'checklist_definition','id':'TPL-CHK-002','version':'0.2.0'},[],CAN)
        self.assertNotEqual(older['sections'][0]['items'][0]['criterion_ja'],current['sections'][0]['items'][0]['criterion_ja'])
    def test_version_mismatch_rejected(self):
        with self.assertRaises(ValueError):resolve({'kind':'knowledge_entry','id':'KNW-RES-PROVENANCE','version':'9.0.0'},[],CAN)

if __name__=='__main__':unittest.main()
