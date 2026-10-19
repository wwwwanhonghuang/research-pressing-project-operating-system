"""Stage 8 canonical source, version, provenance and documentary checks."""
import sys,json,copy,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/'script'))
from compose_handbook import load_validate, sections, resolve, render
from inspect_stage8_case import assess
CAN=R/'content/operational/stage_08'
STAGE=R/'pipeline/8_Correction_Evaluation_And_Archieve'
class Stage8Tests(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.recipe=load_validate('publication_recipe',CAN/'recipes/PUB-ARC-HANDBOOK.json')
  cls.chapters,cls.inventory=sections(cls.recipe,CAN)
 def test_complete_inclusion(self):
  kinds=[p['kind'] for c in self.chapters for p in c['parts']]
  self.assertEqual(len(self.chapters),17)
  self.assertEqual(kinds.count('task_definition'),12)
  self.assertEqual(kinds.count('procedure_definition'),12)
  self.assertEqual(kinds.count('knowledge_entry'),19)
  self.assertEqual(kinds.count('checklist_definition'),4)
  self.assertEqual(len(list((CAN/'tasks').glob('*.json'))),12)
 def test_task_references_and_human_boundary(self):
  for path in (CAN/'tasks').glob('*.json'):
   t=load_validate('task_definition',path)
   self.assertEqual(t['stage_ids'],['08'])
   self.assertTrue(t['requires_human_decision'])
   refs=[t['procedure_ref']]+t['standard_refs']+t['ethics_refs']+t['checklist_refs']+t['document_template_refs']
   for ref in refs:
    if ref['kind']=='document_template':
     target=json.loads((R/'content/templates'/f'{ref["id"]}.json').read_text())
     self.assertEqual(ref['version'],target['version'])
    else:self.assertEqual(resolve(ref,[],CAN)['version'],ref['version'])
 def test_knowledge_reference_scopes(self):
  for p in (CAN/'knowledge').glob('*.json'):
   o=load_validate('knowledge_entry',p)
   self.assertIn(o['category'],('standard','ethics'))
   self.assertEqual(o['scope']['stages'],['08'])
   self.assertTrue(o['sources'])
   self.assertEqual(o['authority']['institutional_approval'],'none')
 def test_historical_versions_and_evidence_criteria(self):
  for type_,ns in [('DOC',range(86,95)),('CHK',range(42,46))]:
   for n in ns:
    id=f'TPL-{type_}-{n:03d}'
    old=json.loads((R/'content/template_versions'/id/'0.1.0.json').read_text())
    new=json.loads((R/'content/templates'/f'{id}.json').read_text())
    self.assertEqual(old['version'],'0.1.0')
    self.assertEqual(new['version'],'0.2.0')
    if type_=='CHK':
     self.assertEqual(len(new['sections'][0]['items']),7)
     self.assertTrue(all('識別子' in i['evidence_hint_ja'] for i in new['sections'][0]['items']))
     self.assertEqual(resolve({'kind':'checklist_definition','id':id,'version':'0.1.0'},[],CAN)['version'],'0.1.0')
 def test_gate_and_ai_limits(self):
  st=json.loads((STAGE/'stage.json').read_text())
  self.assertEqual(len(st['task_definitions']),12)
  self.assertTrue(st['review_gate']['human_signoff_required_for_correction_or_removal'])
  self.assertFalse(st['review_gate']['automated_correction'])
  files=list((STAGE/'AI_ASSIST/common_prompts').glob('PRC-ARC-*.md'))
  self.assertEqual(len(files),12)
  for p in files:
   s=p.read_text()
   self.assertIn('外部AI',s)
   self.assertIn('人による最終確認',s)
   self.assertIn('自動実行しない',s)
 def test_rendering(self):
  tex=render(self.recipe,self.chapters)
  for x in ['訂正','撤回','理解','評価','保存','改訂','人による']:
   self.assertIn(x,tex)
  self.assertNotIn('\\colorbox',tex)
 def test_synthetic_pending_is_blocked(self):
  o=json.loads((R/'tests/fixtures/stage8/blocked_SYNTHETIC.json').read_text())
  a=assess(o)
  self.assertEqual(a['state'],'BLOCKED')
  self.assertFalse(a['can_correct'])
 def test_even_document_complete_is_not_approval(self):
  o=json.loads((R/'tests/fixtures/stage8/blocked_SYNTHETIC.json').read_text())
  o.update(decision_status='approved_correction',notice_url='https://example.invalid/notice',updated_version='1.0.1',updated_sha256='sha256-new-placeholder',preservation_manifest_id='SYNTHETIC-ARCHIVE-01',unresolved_major_issues=[])
  o['affected_channels'][0].update(status='verified',verified_at='2026-10-19T12:00:00Z')
  a=assess(o)
  self.assertEqual(a['state'],'DOCUMENTARY_CHECK_PASSED_AUTHORITY_UNVERIFIED')
  self.assertFalse(a['can_correct'])
  self.assertFalse(a['can_remove'])
  self.assertFalse(a['human_authority_verified'])
 def test_pinned_version_fail_closed(self):
  with self.assertRaises(ValueError):resolve({'kind':'knowledge_entry','id':'KNW-ARC-FIXITY','version':'99.0.0'},[],CAN)
 def test_all_eight_stages_mapped(self):
  self.assertEqual(len(list((R/'content/operational').glob('stage_0[1-8]/recipes/*.json'))),8)
if __name__=='__main__':unittest.main()
