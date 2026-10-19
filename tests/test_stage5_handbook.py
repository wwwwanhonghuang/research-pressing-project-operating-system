"""Stage 5 content/reference integrity, stage handoff, privacy and print regression."""
import json,sys,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'script'))
from compose_handbook import load_validate, sections, resolve, render
CAN=R/'content/operational/stage_05'

class Stage5Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.recipe=load_validate('publication_recipe',CAN/'recipes/PUB-EDT-HANDBOOK.json')
  cls.chapters,cls.inventory=sections(cls.recipe,CAN)
 def test_counts_and_distinct_roles(self):
  kinds=[i['kind'] for c in self.chapters for i in c['parts']]
  self.assertEqual(len(self.chapters),15)
  self.assertEqual(kinds.count('task_definition'),9)
  self.assertEqual(kinds.count('procedure_definition'),9)
  self.assertEqual(kinds.count('knowledge_entry'),12)
  self.assertEqual(kinds.count('checklist_definition'),8)
 def test_task_refs_and_version_pins(self):
  for p in (CAN/'tasks').glob('*.json'):
   o=load_validate('task_definition',p)
   self.assertEqual(o['stage_ids'],['05'])
   self.assertTrue(o['requires_human_decision'])
   self.assertGreaterEqual(len(o['acceptance_criteria']),2)
   for ref in [o['procedure_ref']]+o['standard_refs']+o['ethics_refs']+o['checklist_refs']+o['document_template_refs']:
    if ref['kind']=='document_template':
     x=json.loads((R/'content/templates'/f'{ref["id"]}.json').read_text())
     self.assertEqual(x['version'],ref['version'])
    else:self.assertEqual(resolve(ref,[],CAN)['version'],ref['version'])
 def test_history_is_preserved(self):
  for n in range(63,69):
   id=f'TPL-DOC-{n:03d}'
   self.assertEqual(json.loads((R/'content/template_versions'/id/'0.1.0.json').read_text())['version'],'0.1.0')
   self.assertEqual(json.loads((R/'content/templates'/f'{id}.json').read_text())['version'],'0.2.0')
  for n in range(29,33):
   id=f'TPL-CHK-{n:03d}'
   old=resolve({'kind':'checklist_definition','id':id,'version':'0.1.0'},[],CAN)
   new=resolve({'kind':'checklist_definition','id':id,'version':'0.2.0'},[],CAN)
   self.assertNotEqual(old['sections'][0]['items'][0]['criterion_ja'],new['sections'][0]['items'][0]['criterion_ja'])
 def test_source_attribution(self):
  for p in (CAN/'knowledge').glob('*.json'):
   o=load_validate('knowledge_entry',p)
   self.assertEqual(o['authority']['institutional_approval'],'none')
   self.assertTrue(o['sources'])
   self.assertTrue(all(s.get('locator') and s.get('accessed_on') for s in o['sources']))
 def test_review_separation(self):
  x=json.loads((R/'pipeline/5_Edit_Proofreading_And_Corrections/stage.json').read_text())
  self.assertEqual(len(x['task_definitions']),9)
  self.assertFalse(x['review_gate']['human_signoff_required_for_publication'])
  self.assertIn('公開承認',x['review_gate']['note'])
  t=render(self.recipe,self.chapters)
  self.assertIn('科学的',t)
  self.assertIn('引用',t)
  self.assertNotIn(r'\colorbox',t)
 def test_ai_guides(self):
  ps=list((R/'pipeline/5_Edit_Proofreading_And_Corrections/AI_ASSIST/common_prompts').glob('PRC-EDT-*.md'))
  self.assertEqual(len(ps),9)
  self.assertTrue(all('外部AI' in p.read_text() and '人による最終確認' in p.read_text() for p in ps))
 def test_corrupt_version_ref_rejected(self):
  with self.assertRaises(ValueError):
   resolve({'kind':'knowledge_entry','id':'KNW-EDT-FACT','version':'99.0.0'},[],CAN)

if __name__=='__main__':unittest.main()
