"""Regression tests for structured form definitions, rendering and safe escaping."""
import hashlib,json,tempfile,unittest
from pathlib import Path
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'script'))
from generate_tex import render,esc,choose_ids

class TemplatePipelineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.entries=json.loads((ROOT/'templates/catalog.json').read_text(encoding='utf-8'))['entries']
    def test_catalog_complete(self):
        self.assertEqual(len(self.entries),139)
        self.assertEqual(len([v for v in self.entries if v['kind']=='document']),94)
        self.assertEqual(len([v for v in self.entries if v['kind']=='checklist']),45)
        self.assertEqual(len(choose_ids([])),139)
    def test_every_template_renders(self):
        for e in self.entries:
            p=ROOT/'content/templates'/(e['template_id']+'.json');d=json.loads(p.read_text(encoding='utf-8'))
            tex=render(d)
            self.assertIn(r'\begin{document}',tex)
            self.assertIn(r'\end{document}',tex)
            self.assertIn(r'\OPSsection{1}',tex)
            self.assertNotIn(r'\OPSsection{01}',tex)
            self.assertNotIn('\\color{',tex)
    def test_special_characters_escaped(self):
        escaped=esc('3% & A_B #2 $10 {x} \\')
        for seq in [r'\%',r'\&',r'\_',r'\#',r'\$',r'\{',r'\}',r'\textbackslash{}']:
            self.assertIn(seq,escaped)
    def test_reject_instance_version_mismatch(self):
        d=json.loads((ROOT/'content/templates/TPL-DOC-030.json').read_text(encoding='utf-8'))
        with self.assertRaises(ValueError):render(d,{'template_id':d['id'],'template_version':'99.0.0','field_values':{}})
    def test_reject_unknown_field(self):
        d=json.loads((ROOT/'content/templates/TPL-DOC-030.json').read_text(encoding='utf-8'))
        with self.assertRaises(ValueError):render(d,{'template_id':d['id'],'template_version':d['version'],'field_values':{'UNDECLARED':'x'}})
    def test_instance_and_block(self):
        instance=json.loads((ROOT/'content/examples/synthetic_editorial_proposal.json').read_text(encoding='utf-8'))
        d=json.loads((ROOT/'content/templates/TPL-DOC-030.json').read_text(encoding='utf-8'))
        tex=render(d,instance)
        self.assertIn('架空',tex)
        self.assertIn('補足内容・本文',tex)
    def test_no_organization_branding(self):
        import re
        for f in ROOT.rglob('*'):
            if not f.is_file() or 'build' in f.parts or f.suffix not in ('.md','.py','.json','.tex','.sty','.yml','.yaml','.txt'):continue
            body=f.read_text(encoding='utf-8')
            for forbidden in ('moon'+'shot','J'+'ST'):
                self.assertNotIn(forbidden.lower(),body.lower(),str(f))

if __name__=='__main__':unittest.main()
