"""Stage 6 integrity: science/release authority split, rights and review gates."""
import json,sys,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'script'))
from compose_handbook import load_validate, sections, resolve, render
CAN=R/'content/operational/stage_06'
STAGE=R/'pipeline/6_Fact_And_Scientific_Review_And_Approval_For_Publication'
class Stage6Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.recipe=load_validate('publication_recipe',CAN/'recipes/PUB-REV-HANDBOOK.json')
  cls.chapters,cls.inventory=sections(cls.recipe,CAN)
 def test_composition_and_counts(self):
  self.assertEqual(len(self.chapters),22)
  kinds=[p['kind'] for c in self.chapters for p in c['parts']]
  self.assertEqual(kinds.count('task_definition'),13)
  self.assertEqual(kinds.count('procedure_definition'),13)
  self.assertEqual(kinds.count('knowledge_entry'),12)
  self.assertEqual(kinds.count('checklist_definition'),4)
 def test_task_references_resolve(self):
  for p in (CAN/'tasks').glob('*.json'):
   d=load_validate('task_definition',p)
   self.assertEqual(d['stage_ids'],['06'])
   self.assertTrue(d['requires_human_decision'])
   self.assertGreaterEqual(len(d['acceptance_criteria']),2)
   refs=[d['procedure_ref']]+d['standard_refs']+d['ethics_refs']+d['checklist_refs']+d['document_template_refs']
   for ref in refs:
    if ref['kind']=='document_template':
     document=json.loads((R/'content/templates'/f'{ref["id"]}.json').read_text(encoding='utf-8'))
     self.assertEqual(document['version'],ref['version'])
    else:self.assertEqual(resolve(ref,[],CAN)['version'],ref['version'])
 def test_historical_versions_retained(self):
  for n in range(69,77):
   id=f'TPL-DOC-{n:03d}'
   self.assertEqual(json.loads((R/'content/template_versions'/id/'0.1.0.json').read_text())['version'],'0.1.0')
   self.assertEqual(json.loads((R/'content/templates'/f'{id}.json').read_text())['version'],'0.2.0')
  for n in range(33,37):
   id=f'TPL-CHK-{n:03d}'
   old=resolve({'kind':'checklist_definition','id':id,'version':'0.1.0'},[],CAN)
   new=resolve({'kind':'checklist_definition','id':id,'version':'0.2.0'},[],CAN)
   self.assertNotEqual(old['sections'][0]['items'][0]['criterion_ja'],new['sections'][0]['items'][0]['criterion_ja'])
 def test_external_sources_scoped_and_status(self):
  for p in (CAN/'knowledge').glob('*.json'):
   d=load_validate('knowledge_entry',p)
   self.assertEqual(d['authority']['origin'],'independent_proposal')
   self.assertEqual(d['authority']['institutional_approval'],'none')
   self.assertTrue(d['sources'])
   self.assertTrue(all(s.get('locator') and s.get('accessed_on') for s in d['sources']))
 def test_gate_is_explicit_human_review_and_never_automatic(self):
  stage=json.loads((STAGE/'stage.json').read_text())
  self.assertEqual(len(stage['task_definitions']),13)
  gate=stage['review_gate']
  self.assertTrue(gate['human_signoff_required_for_publication'])
  self.assertIn('権限',gate['reviewer_role'])
  self.assertIn('代替ではない',gate['note'])
  self.assertIn('公開可否の判断記録', ''.join(gate['handoff_requires']))
 def test_ai_guides_keep_sensitive_content_outside_default(self):
  prompts=list((STAGE/'AI_ASSIST/common_prompts').glob('PRC-REV-*.md'))
  self.assertEqual(len(prompts),13)
  for p in prompts:
   body=p.read_text()
   self.assertIn('外部AI',body)
   self.assertIn('人による最終確認',body)
   self.assertIn('実際の許可',body)
 def test_print_format_and_authority_distinction(self):
  tex=render(self.recipe,self.chapters)
  for term in ['公開承認','科学的','個人情報','権利','差戻し','禁輸','独立設計・試作']:
   self.assertIn(term,tex)
  self.assertNotIn('\\colorbox',tex)
  self.assertNotIn('\\fcolorbox',tex)
 def test_bad_pin_rejected(self):
  with self.assertRaises(ValueError):
   resolve({'kind':'knowledge_entry','id':'KNW-REV-DECISION','version':'99.0.0'},[],CAN)
if __name__=='__main__':unittest.main()
