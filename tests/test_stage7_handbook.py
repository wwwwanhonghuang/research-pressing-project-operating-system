"""Stage 7 source/recipe/provenance and stage 6->7 traceability regression."""
import sys,json,copy,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'script'))
from compose_handbook import load_validate, sections, resolve, render
from inspect_stage7_preflight import assess as preflight
CAN=R/'content/operational/stage_07'; STAGE=R/'pipeline/7_Publication_And_Dissemination'
class Stage7Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.recipe=load_validate('publication_recipe',CAN/'recipes/PUB-PUB-HANDBOOK.json')
  cls.chapters,cls.inventory=sections(cls.recipe,CAN)
 def test_composition_and_complete_inventory(self):
  self.assertEqual(len(self.chapters),17)
  kinds=[p['kind'] for c in self.chapters for p in c['parts']]
  self.assertEqual(kinds.count('task_definition'),12)
  self.assertEqual(kinds.count('procedure_definition'),12)
  self.assertEqual(kinds.count('knowledge_entry'),16)
  self.assertEqual(kinds.count('checklist_definition'),5)
  self.assertEqual(len(list((CAN/'tasks').glob('*.json'))),12)
  self.assertEqual(len(list((CAN/'procedures').glob('*.json'))),12)
 def test_task_procedures_standards_and_ethics(self):
  for p in (CAN/'tasks').glob('*.json'):
   d=load_validate('task_definition',p)
   self.assertEqual(d['stage_ids'],['07']);self.assertTrue(d['requires_human_decision'])
   refs=[d['procedure_ref']]+d['standard_refs']+d['ethics_refs']+d['checklist_refs']+d['document_template_refs']
   for ref in refs:
    if ref['kind']=='document_template':
     obj=json.loads((R/'content/templates'/f'{ref["id"]}.json').read_text())
     self.assertEqual(obj['version'],ref['version'])
    else:self.assertEqual(resolve(ref,[],CAN)['version'],ref['version'])
  for p in (CAN/'knowledge').glob('*.json'):
   d=load_validate('knowledge_entry',p)
   self.assertIn(d['category'],('standard','ethics'))
   self.assertEqual(d['authority']['institutional_approval'],'none')
   self.assertTrue(d['sources'])
 def test_historical_form_versions(self):
  for n in range(77,86):
   id=f'TPL-DOC-{n:03d}'
   self.assertEqual(json.loads((R/'content/template_versions'/id/'0.1.0.json').read_text())['version'],'0.1.0')
   self.assertEqual(json.loads((R/'content/templates'/f'{id}.json').read_text())['version'],'0.2.0')
  for n in range(37,42):
   id=f'TPL-CHK-{n:03d}'
   self.assertEqual(resolve({'kind':'checklist_definition','id':id,'version':'0.1.0'},[],CAN)['version'],'0.1.0')
   self.assertEqual(resolve({'kind':'checklist_definition','id':id,'version':'0.2.0'},[],CAN)['version'],'0.2.0')
 def test_gates_require_human_authority(self):
  stage=json.loads((STAGE/'stage.json').read_text())
  self.assertEqual(len(stage['task_definitions']),12)
  self.assertTrue(stage['review_gate']['human_signoff_required_for_publication'])
  self.assertFalse(stage['review_gate']['automated_publication'])
  self.assertTrue(any('第6段階' in x for x in stage['review_gate']['handoff_requires']))
 def test_stage7_ai_assist_never_claims_approval(self):
  prompts=list((STAGE/'AI_ASSIST/common_prompts').glob('PRC-PUB-*.md'))
  self.assertEqual(len(prompts),12)
  for p in prompts:
   s=p.read_text();self.assertIn('外部AI',s);self.assertIn('人による最終確認',s);self.assertIn('自動実行しない',s)
 def test_render_stays_monochrome_and_authority_distinct(self):
  tex=render(self.recipe,self.chapters)
  for term in ['公開','配信','承認','字幕','出典','訂正','アクセシビリティ']:
   self.assertIn(term,tex)
  self.assertNotIn('\\colorbox',tex)
 def test_blocked_stage6_and_hash_mismatch(self):
  review=json.loads((R/'tests/fixtures/release_gate/blocked_SYNTHETIC.json').read_text())
  pkg=json.loads((R/'tests/fixtures/stage7/blocked_package_SYNTHETIC.json').read_text())
  result=preflight(review,pkg)
  self.assertEqual(result['state'],'BLOCKED')
  self.assertFalse(result['can_publish'])
  self.assertTrue(any('hash' in msg.lower() for msg in result['blockers']))
 def test_fabricated_all_green_record_is_never_an_authorization(self):
  review=json.loads((R/'tests/fixtures/release_gate/blocked_SYNTHETIC.json').read_text())
  pkg=json.loads((R/'tests/fixtures/stage7/blocked_package_SYNTHETIC.json').read_text())
  for d in review['review_domains']:d['status']='complete'
  review['outstanding_issues']=[];review['decision']['status']='approved';review['decision']['conditions']=[]
  pkg['target']['sha256']=review['target']['sha256'];pkg['channels'][0]['asset_sha256']=review['target']['sha256']
  result=preflight(review,pkg)
  self.assertEqual(result['state'],'DOCUMENTARY_CHECK_PASSED_HUMAN_AUTHORITY_UNVERIFIED')
  self.assertFalse(result['can_publish'])
 def test_channel_scope_does_not_equate_to_real_world_permission(self):
  review=json.loads((R/'tests/fixtures/release_gate/blocked_SYNTHETIC.json').read_text())
  pkg=json.loads((R/'tests/fixtures/stage7/blocked_package_SYNTHETIC.json').read_text())
  pkg['channels'][0]['asset_sha256']='wrong'
  result=preflight(review,pkg)
  self.assertTrue(any('sha256' in x or 'hash' in x for x in result['blockers']))
 def test_recipe_pins_reject_mismatch(self):
  with self.assertRaises(ValueError):resolve({'kind':'knowledge_entry','id':'KNW-PUB-TRACE','version':'99.0.0'},[],CAN)
if __name__=='__main__':unittest.main()
