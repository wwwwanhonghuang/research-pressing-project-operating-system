import json,sys,unittest
from pathlib import Path
R=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(R/"script"))

class Stage6GateTests(unittest.TestCase):
 def test_gate_never_auto_approves(self):
  from check_release_gate import assess
  f=R/'tests/fixtures/release_gate'
  r=json.loads((f/'structurally_complete_SYNTHETIC.json').read_text())
  result=assess(r)
  self.assertEqual(result['state'],'STRUCTURALLY_RECORDED_HUMAN_AUTHORIZATION_UNVERIFIED')
  self.assertFalse(result['automatic_publication_allowed'])
  r=json.loads((f/'blocked_SYNTHETIC.json').read_text())
  self.assertEqual(assess(r)['state'],'BLOCKED')
 def test_target_hash_change_blocks(self):
  from check_release_gate import assess
  rec=json.loads((R/'tests/fixtures/release_gate/structurally_complete_SYNTHETIC.json').read_text())
  rec['target']['sha256']='b'*64
  self.assertEqual(assess(rec)['state'],'BLOCKED')
 def test_duplicate_domain_blocks(self):
  from check_release_gate import assess
  rec=json.loads((R/'tests/fixtures/release_gate/structurally_complete_SYNTHETIC.json').read_text())
  rec['review_domains'][4]['domain']='scientific'
  self.assertEqual(assess(rec)['state'],'BLOCKED')

if __name__=="__main__": unittest.main()
