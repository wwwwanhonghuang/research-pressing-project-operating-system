"""Stage 1 composition, referential integrity and consistent publication tests."""
import json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'script'))
from compose_handbook import load_validate,sections,resolve,render,CAN
from generate_tex import choose_ids

class Stage1CompositionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.recipe=load_validate('publication_recipe',CAN/'recipes/PUB-PLN-HANDBOOK.json')
        cls.chapters,cls.inventory=sections(cls.recipe,CAN)
    def test_six_tasks_and_six_procedures(self):
        kinds=[p['kind'] for c in self.chapters for p in c['parts']]
        self.assertEqual(kinds.count('task_definition'),6)
        self.assertEqual(kinds.count('procedure_definition'),6)
        self.assertEqual(kinds.count('knowledge_entry'),5)
    def test_three_stage_checklists(self):
        ids={x['id'] for x in self.inventory}
        for i in ['015','016','017']:self.assertIn('TPL-CHK-'+i,ids)
    def test_every_ref_is_pinned(self):
        ids={x['id'] for x in self.inventory}
        self.assertEqual(len(ids),len(self.inventory))
        self.assertTrue(all(x.get('sha256') and x.get('version') for x in self.inventory))
    def test_render_style_and_content(self):
        tex=render(self.recipe,self.chapters)
        self.assertIn('\\usepackage{operationshandbook}',tex)
        style=(ROOT/'templates/tex/operationshandbook.sty').read_text(encoding='utf-8')
        self.assertIn('Noto Serif CJK JP',style)
        self.assertIn('\\renewcommand{\\contentsname}{目次}',style)
        self.assertIn('\\section{判断と引継ぎの最終確認}',tex)
        self.assertNotIn('\\colorbox',tex)
    def test_bad_version_is_rejected(self):
        with self.assertRaises(ValueError):resolve({'kind':'task_definition','id':'TSK-PLN-INTAKE','version':'99.0.0'},[],CAN)
    def test_six_ai_guides_exist(self):
        p=ROOT/'pipeline/1_Project_Design_and_Edtorial_Principles/AI_ASSIST/common_prompts'
        self.assertEqual(len(list(p.glob('*.md'))),6)

if __name__=='__main__':unittest.main()
