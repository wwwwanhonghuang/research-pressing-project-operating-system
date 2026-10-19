"""Stage 4: content integrity, version history, rights and source-to-output consistency."""
import json,sys,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'script'))
from compose_handbook import load_validate,sections,resolve,render
CAN=R/'content/operational/stage_04'
class Stage4Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.recipe=load_validate('publication_recipe',CAN/'recipes/PUB-WRT-HANDBOOK.json')
  cls.chapters,cls.inventory=sections(cls.recipe,CAN)
 def test_composition(self):
  kinds=[p['kind'] for c in self.chapters for p in c['parts']]
  self.assertEqual(kinds.count('task_definition'),9)
  self.assertEqual(kinds.count('procedure_definition'),9)
  self.assertEqual(kinds.count('knowledge_entry'),12)
  self.assertEqual(kinds.count('checklist_definition'),7)
  self.assertEqual(len(self.chapters),15)
 def test_task_refs_pinned_and_resolve(self):
  for p in sorted((CAN/'tasks').glob('*.json')):
   o=load_validate('task_definition',p)
   self.assertEqual(o['stage_ids'],['04'])
   self.assertTrue(o['requires_human_decision'])
   refs=[o['procedure_ref']]+o['standard_refs']+o['ethics_refs']+o['checklist_refs']+o['document_template_refs']
   for v in refs:
    if v['kind']=='document_template':
     d=json.loads((R/'content/templates'/f'{v["id"]}.json').read_text())
     self.assertEqual(d['version'],v['version'])
    else:self.assertEqual(resolve(v,[],CAN)['version'],v['version'])
 def test_prior_revisions_unchanged(self):
  for tid in ('TPL-CHK-007','TPL-CHK-010','TPL-CHK-011','TPL-CHK-025','TPL-CHK-026','TPL-CHK-027','TPL-CHK-028'):
   old=resolve({'kind':'checklist_definition','id':tid,'version':'0.1.0'},[],CAN)
   latest=resolve({'kind':'checklist_definition','id':tid,'version':'0.2.0'},[],CAN)
   self.assertNotEqual(old['sections'][0]['items'][0]['criterion_ja'],latest['sections'][0]['items'][0]['criterion_ja'])
  for i in range(53,63):
   tid=f'TPL-DOC-{i:03d}'
   self.assertEqual(json.loads((R/'content/template_versions'/tid/'0.1.0.json').read_text())['version'],'0.1.0')
   self.assertEqual(json.loads((R/'content/templates'/f'{tid}.json').read_text())['version'],'0.2.0')
 def test_source_and_status(self):
  for p in (CAN/'knowledge').glob('*.json'):
   o=load_validate('knowledge_entry',p)
   self.assertEqual(o['authority']['institutional_approval'],'none')
   self.assertTrue(o['sources'])
   self.assertTrue(all(a.get('source_id') and a.get('locator') for a in o['sources']))
 def test_human_control_and_ai_boundaries(self):
  prompts=list((R/'pipeline/4_Structuring_And_Writing/AI_ASSIST/common_prompts').glob('PRC-WRT-*.md'))
  self.assertEqual(len(prompts),9)
  self.assertTrue(all('外部AI' in p.read_text() and '人' in p.read_text() for p in prompts))
  gate=json.loads((R/'pipeline/4_Structuring_And_Writing/stage.json').read_text())['review_gate']
  self.assertFalse(gate['human_signoff_required_for_publication'])
  self.assertIn('公開承認',gate['note'])
 def test_print_and_rendered_semantics(self):
  tex=render(self.recipe,self.chapters)
  for term in ('専門表現・日本語','因果','図表','マルチモーダル','独立設計・試作'):
   self.assertIn(term,tex)
  self.assertNotIn('\\colorbox',tex)
  self.assertNotIn('\\fcolorbox',tex)
 def test_invalid_version_rejected(self):
  with self.assertRaises(ValueError):
   resolve({'kind':'knowledge_entry','id':'KNW-WRT-ARCH','version':'9.0.0'},[],CAN)
 def test_workflow_is_generalized(self):
  for p in (CAN).rglob('*.json'):
   raw=p.read_text(encoding='utf8').lower()
   self.assertNotIn('institutional_approval\": \"approved\"',raw)
if __name__=='__main__':unittest.main()
