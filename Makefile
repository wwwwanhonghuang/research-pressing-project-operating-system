PYTHON ?= python3
# Run `make sample` for representative PDFs or `make all-pdf` for the whole inventory.
# `make pdf IDS="TPL-DOC-030 TPL-CHK-002"` compiles the specified templates.
IDS ?=
SAMPLE_IDS = TPL-DOC-001 TPL-DOC-025 TPL-DOC-030 TPL-DOC-046 TPL-DOC-072 TPL-CHK-002 TPL-CHK-035 TPL-CHK-043

.PHONY: help validate tex pdf sample all-pdf view test clean catalog project stage-01-handbook stage-01-tex
help:
	@echo 'make validate  - validate all reusable template definitions'
	@echo 'make tex       - generate TeX for all 139 templates (IDS=... for a subset)'
	@echo 'make pdf       - generate TeX and compile PDFs (IDS=... for subset)'
	@echo 'make sample    - compile eight representative templates'
	@echo 'make all-pdf   - compile all 139 templates; XeLaTeX required'
	@echo 'make stage-04-handbook - compose Stage 4 canonical sources into TeX/PDF'
	@echo 'make stage-05-handbook - compose Stage 5 canonical sources into TeX/PDF'
	@echo 'make view      - export JSON client-neutral views for all templates'
	@echo 'make test      - run validation and automated regression tests'
	@echo 'make clean     - delete generated intermediate files'
validate:
	$(PYTHON) script/validate_repo.py
	$(PYTHON) script/validate_template_catalog.py
	$(PYTHON) script/validate_templates.py
tex:
	$(PYTHON) script/generate_tex.py --ids $(IDS)
pdf: tex
	$(PYTHON) script/compile_pdf.py --ids $(IDS)
view:
	$(PYTHON) script/export_view.py --ids $(IDS)
sample:
	$(MAKE) pdf IDS='$(SAMPLE_IDS)'
all-pdf:
	$(MAKE) pdf IDS=''
test: validate
	$(PYTHON) -m unittest discover -s tests -v
clean:
	rm -rf build/tex
catalog:
	$(PYTHON) script/validate_template_catalog.py
	$(PYTHON) script/update_catalog_md.py
project:
	@echo "Example: python script/init_project.py example-project --title 'Example Project'"

# The stage handbook is assembled from pinned canonical operational objects.
stage-01-tex:
	$(PYTHON) script/compose_handbook.py
stage-01-handbook: stage-01-tex
	cd build/handbooks/stage_01 && xelatex -halt-on-error -interaction=nonstopmode stage-01-handbook.tex > /dev/null
	cd build/handbooks/stage_01 && xelatex -halt-on-error -interaction=nonstopmode stage-01-handbook.tex > /dev/null

# Stage 2: source-aware canonical content composition and XeLaTeX build.
.PHONY: stage-02-tex stage-02-handbook
stage-02-tex:
	$(PYTHON) script/compose_handbook.py --recipe content/operational/stage_02/recipes/PUB-RES-HANDBOOK.json --output build/handbooks/stage_02 --stem stage-02-handbook
stage-02-handbook: stage-02-tex
	cd build/handbooks/stage_02 && xelatex -halt-on-error -interaction=nonstopmode stage-02-handbook.tex > /dev/null
	cd build/handbooks/stage_02 && xelatex -halt-on-error -interaction=nonstopmode stage-02-handbook.tex > /dev/null

# Stage 3: structured interview/reporting handbook.
.PHONY: stage-03-tex stage-03-handbook
stage-03-tex:
	$(PYTHON) script/compose_handbook.py --recipe content/operational/stage_03/recipes/PUB-INT-HANDBOOK.json --output build/handbooks/stage_03 --stem stage-03-handbook
stage-03-handbook: stage-03-tex
	cd build/handbooks/stage_03 && xelatex -halt-on-error -interaction=nonstopmode stage-03-handbook.tex > /dev/null
	cd build/handbooks/stage_03 && xelatex -halt-on-error -interaction=nonstopmode stage-03-handbook.tex > /dev/null

# Stage 4: structured writing and multimodal-content handbook.
.PHONY: stage-04-tex stage-04-handbook
stage-04-tex:
	$(PYTHON) script/compose_handbook.py --recipe content/operational/stage_04/recipes/PUB-WRT-HANDBOOK.json --output build/handbooks/stage_04 --stem stage-04-handbook
stage-04-handbook: stage-04-tex
	cd build/handbooks/stage_04 && xelatex -halt-on-error -interaction=nonstopmode stage-04-handbook.tex > /dev/null
	cd build/handbooks/stage_04 && xelatex -halt-on-error -interaction=nonstopmode stage-04-handbook.tex > /dev/null

# Stage 5: editorial checking and scientific fact-verification handbook.
.PHONY: stage-05-tex stage-05-handbook
stage-05-tex:
	$(PYTHON) script/compose_handbook.py --recipe content/operational/stage_05/recipes/PUB-EDT-HANDBOOK.json --output build/handbooks/stage_05 --stem stage-05-handbook
stage-05-handbook: stage-05-tex
	cd build/handbooks/stage_05 && xelatex -halt-on-error -interaction=nonstopmode stage-05-handbook.tex > /dev/null
	cd build/handbooks/stage_05 && xelatex -halt-on-error -interaction=nonstopmode stage-05-handbook.tex > /dev/null

.PHONY: stage-06-tex stage-06-handbook
stage-06-tex:
	$(PYTHON) script/compose_handbook.py --recipe content/operational/stage_06/recipes/PUB-REV-HANDBOOK.json --output build/handbooks/stage_06 --stem stage-06-handbook
stage-06-handbook: stage-06-tex
	cd build/handbooks/stage_06 && xelatex -halt-on-error -interaction=nonstopmode stage-06-handbook.tex > /dev/null
	cd build/handbooks/stage_06 && xelatex -halt-on-error -interaction=nonstopmode stage-06-handbook.tex > /dev/null

.PHONY: stage-06-forms stage-06-gate-demo
stage-06-forms:
	$(MAKE) pdf IDS='TPL-DOC-069 TPL-DOC-070 TPL-DOC-071 TPL-DOC-072 TPL-DOC-073 TPL-DOC-074 TPL-DOC-075 TPL-DOC-076 TPL-CHK-033 TPL-CHK-034 TPL-CHK-035 TPL-CHK-036'
stage-06-gate-demo:
	$(PYTHON) script/check_release_gate.py tests/fixtures/release_gate/blocked_SYNTHETIC.json

# Stage 7: structured release and dissemination handbook.
.PHONY: stage-07-tex stage-07-handbook stage-07-forms
stage-07-tex:
	$(PYTHON) script/compose_handbook.py --recipe content/operational/stage_07/recipes/PUB-PUB-HANDBOOK.json --output build/handbooks/stage_07 --stem stage-07-handbook
stage-07-handbook: stage-07-tex
	cd build/handbooks/stage_07 && xelatex -halt-on-error -interaction=nonstopmode stage-07-handbook.tex > /dev/null
	cd build/handbooks/stage_07 && xelatex -halt-on-error -interaction=nonstopmode stage-07-handbook.tex > /dev/null
stage-07-forms:
	$(MAKE) pdf IDS=' TPL-DOC-077 TPL-DOC-078 TPL-DOC-079 TPL-DOC-080 TPL-DOC-081 TPL-DOC-082 TPL-DOC-083 TPL-DOC-084 TPL-DOC-085 TPL-CHK-037 TPL-CHK-038 TPL-CHK-039 TPL-CHK-040 TPL-CHK-041'

# Stage 8: corrections, evaluation, preservation and learning.
.PHONY: stage-08-tex stage-08-handbook stage-08-forms stage-08-inspect-demo
stage-08-tex:
	$(PYTHON) script/compose_handbook.py --recipe content/operational/stage_08/recipes/PUB-ARC-HANDBOOK.json --output build/handbooks/stage_08 --stem stage-08-handbook
stage-08-handbook: stage-08-tex
	cd build/handbooks/stage_08 && xelatex -halt-on-error -interaction=nonstopmode stage-08-handbook.tex > /dev/null
	cd build/handbooks/stage_08 && xelatex -halt-on-error -interaction=nonstopmode stage-08-handbook.tex > /dev/null
stage-08-forms:
	$(MAKE) pdf IDS=' TPL-DOC-086 TPL-DOC-087 TPL-DOC-088 TPL-DOC-089 TPL-DOC-090 TPL-DOC-091 TPL-DOC-092 TPL-DOC-093 TPL-DOC-094 TPL-CHK-042 TPL-CHK-043 TPL-CHK-044 TPL-CHK-045'
stage-08-inspect-demo:
	$(PYTHON) script/inspect_stage8_case.py tests/fixtures/stage8/blocked_SYNTHETIC.json
