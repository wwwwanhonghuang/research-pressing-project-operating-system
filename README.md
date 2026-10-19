# Operations OS

**General-purpose structured workflow, document and knowledge infrastructure.**  
Current release: Stage 5 substantive v14 (2026-10-19). Independent, experimental and not institutionally approved.

## What is implemented

Operations OS separates reusable definitions from actual project records and rendered publications. The root includes the `core/` knowledge and workflow model, `content/` structured definitions, `templates/` inventories and TeX print style, `pipeline/` example task workspaces, `projects/` for project instances, `standards/` and `ethics/` for authority-aware knowledge, `script/` for deterministic generators, `docs/` for compiled or contextual handbooks, and `os-site/` for future multimodal presentation and project management.

There are **139 structured draft templates**, organized in `content/templates/`: 94 Japanese document types and 45 checklist types. Their catalog is `templates/catalog.json`. Each has individually selected section and field labels or testable checklist criteria. These are structural *drafts*, not fully authored professional handbooks or approved operational standards.

## Prerequisites

- Python 3.10+ and GNU Make for generation and validation.
- XeLaTeX with `fontspec`, `xeCJK`, and installed Noto Serif CJK JP for PDF compilation.
- Optional `jsonschema` Python package for full JSON Schema checks. Semantic checks run without it.

## Commands

```bash
make help
make validate
make test
make tex                                   # Generate 139 .tex files
make view                                  # Export JSON views for a future client
make pdf IDS="TPL-DOC-030 TPL-CHK-002"    # Generate + compile selected PDFs
make sample                                # Compile eight representative forms
make all-pdf                               # Compile the entire library
make clean
```

The TeX files and PDF files appear under `build/tex/`. This is output, not canonical content. Each TeX build creates a source-hash manifest. The print design is centrally controlled by `templates/tex/operationsform.sty` and uses black and white, Mincho, numbered headings without leading zeros, and no decorative heading borders or boxes.

To render a **synthetic** filled document:

```bash
python script/generate_tex.py --ids TPL-DOC-030 \
  --instance content/examples/synthetic_editorial_proposal.json \
  --output build/example
python script/validate_instance.py content/examples/synthetic_editorial_proposal.json
python script/compile_pdf.py --ids TPL-DOC-030 --tex-dir build/example
```

## Project creation and configurable workflows

```bash
python script/init_project.py example-editorial --title '編集企画例'
python script/init_project.py example-generic --title '一般業務例' --workflow generic_project.json
```

The default eight-stage editorial lifecycle is a preset under `core/workflows/eight_stage.json`. A six-stage general-purpose preset is provided in `core/workflows/generic_project.json`. Stage order is not intended to prohibit parallel work, revision or exception handling. Generated `AGENTS.md` and `CLAUDE.md` are project context, **not authorization**.

## Content lifecycle

1. Identify the task and its versioned template.
2. Create a project-specific document or checklist instance with evidence and authority boundaries.
3. Validate the instance and resolve related standards, SOPs, ethics, source and claim records.
4. Generate TeX using `script/generate_tex.py`, then compile PDF using `script/compile_pdf.py`.
5. Store actual human review/authorization as a separate record and retain the artifact hashes and correction history.

A stage handbook should be an explicit *composition* of relevant procedures, standards, ethics, checklists and explanatory text; the handbook itself is a published view, rather than a competing source of truth.

## Read first

- [`design/GENERAL_PURPOSE_ARCHITECTURE_V9.md`](design/GENERAL_PURPOSE_ARCHITECTURE_V9.md)
- [`content/README.md`](content/README.md)
- [`script/README.md`](script/README.md)
- [`references/PUBLIC_GUIDANCE_REGISTER.md`](references/PUBLIC_GUIDANCE_REGISTER.md)

Current limitations: all 139 templates have draft structures, not completed substantive content or verified legal requirements. Actual access controls, centralized project execution, approvals and website rendering are not implemented.

## Stage 1 substantive development (v10)

The editorial planning stage now includes six substantive task definitions and six procedures; five shared draft standards/ethics entries; three revised Stage 1 checklists; seven revised Stage 1 form definitions; and a version-pinned publication recipe. This content remains an independent proposal awaiting domain and procedural review.

```bash
make stage-01-handbook   # Canonical JSON -> validated, source-hashed TeX -> PDF
```

Results are in `build/handbooks/stage_01/`. The stage's handbooks in `docs/` are compiled, noncanonical copies. See `design/SUBSTANTIVE_STAGE_01_v10.md` for the review state, evidence sources and subsequent stages.

## Stage 2 — substantive first draft (v11)

The editable structured definitions for preliminary research and source collection are under `content/operational/stage_02/`: eight tasks/SOPs, five quality standards, three ethics entries, five research checklists, a 15-chapter handbook recipe and public source register.

- Run `make stage-02-handbook` to regenerate the A4 Japanese Mincho handbook.
- The corresponding generated outputs are stored in `build/handbooks/stage_02/`, with a review copy in the stage `docs/handbooks/` directory.
- Prior versions of revised checklists are preserved in `content/template_versions/`.
- See `design/SUBSTANTIVE_STAGE_02_v11.md` for design choices and unresolved editorial, legal, and technical review.

All substantive guidance remains an independent proposal and requires appropriate verification before professional use.

## Stage 3 reporting and interviews (v12)

The third eight-stage editorial workflow module is authored as structured JSON under `content/operational/stage_03/`, with procedures, ethics/standards, task-linked checklists, and a compiled TeX handbook. Run `make stage-03-handbook`; see `design/STAGE03_REPORTING_AND_INTERVIEW_v12.md` and `RELEASE_NOTES_v12.md` for authority and scope limitations.

## Stage 4 editorial composition and writing (v13)

Stage 4 contains nine structured tasks/procedures, eight standards, four ethics guidance entries and nine task-specific AI-assistance notes. Ten document template definitions and seven checklist definitions are refined to v0.2.0, with previous versions retained. The structured handbook integrates these entries using a pinned recipe, not copies of their canonical sources.

```bash
make stage-04-handbook
make pdf IDS="TPL-DOC-053 TPL-DOC-054 TPL-DOC-055 TPL-DOC-056 TPL-DOC-057 TPL-DOC-058 TPL-DOC-059 TPL-DOC-060 TPL-DOC-061 TPL-DOC-062 TPL-CHK-007 TPL-CHK-010 TPL-CHK-011 TPL-CHK-025 TPL-CHK-026 TPL-CHK-027 TPL-CHK-028"
```

Generated handbook and hashes: `build/handbooks/stage_04/`. Sources and review limitations: `design/STAGE04_WRITING_AND_MULTIMODAL_v13.md` and `content/operational/stage_04/REFERENCES.md`.

## Stage 5 editing, proofreading and fact-checking (v14)

Nine canonical tasks and stepwise procedures, eight draft standards, four ethics entries, nine AI-assistance notes, six revised Stage 5 forms and four refined checklists are available as separately versioned canonical objects. The handbook recipe brings these together with four shared checklists. Previous template and checklist versions are retained for historical project references.

```bash
make stage-05-handbook
python script/generate_tex.py --ids TPL-DOC-063 TPL-CHK-031
python script/compile_pdf.py --ids TPL-DOC-063 TPL-CHK-031
```

The Stage 5 quality gate refers unresolved scientific and rights questions to specialist verification and approval. It **does not grant publication approval**. The proposals require expert, editorial, ethical and case-specific legal review. See `design/STAGE05_EDITING_COPYEDITING_FACTCHECK_v14.md` for details.


## v17 Stage 7 — publication and dissemination

Canonical Stage 7 tasks, procedures, ethics and standards: `content/operational/stage_07/`. Handbook: `make stage-07-handbook`; forms: `make stage-07-forms`; regression suite: `make test`. See `design/STAGE_07_SUBSTANTIVE_v17.md`. Offline preflight inspector is documentary only and never approves publication.
