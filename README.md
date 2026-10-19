# Operations OS

**A structured, version-pinned operating manual and document system for research-communication work.**

Operations OS stores workflows, tasks, procedures, standards, ethics guidance, document and checklist templates, and AI-assistance rules as structured JSON. From that single source it compiles print-ready Japanese handbooks and forms (XeLaTeX → PDF), and presentation-neutral JSON for a future interactive, multimodal website.

> **Status: experimental prototype (v18, 2026-10-19).** All eight stages of the default workflow exist as *first drafts*. Nothing here is institutionally approved, legally reviewed or ready for operational use. The design is being revised: see [design/DESIGN_REVIEW_v18.md](design/DESIGN_REVIEW_v18.md) for the current understanding, known gaps and proposed changes.

## 概要

研究広報・科学コミュニケーション業務のための業務OSの試作である。業務工程（既定は8段階）、タスク、手順、業務標準、倫理指針、様式・チェックリスト及びAI支援の範囲を、構造化データ（JSON）として一元的に管理する。その正本からハンドブックや様式のPDF（XeLaTeX）と、将来のWeb表示用データを生成する。TeXとPDFは生成物であり、正本ではない。AIは各段階・各タスクを補助するが、事実の確認、同意、承認及び公開の判断は行わない。

## Core ideas

- **Structured data is the source of truth.** TeX, PDF and JSON views are generated. Never edit them by hand.
- **Definitions, records and renditions are different things.** A checklist *definition* is reusable. A *completed* checklist belongs to one project. A PDF is a rendering of either.
- **Everything is versioned and pinned.** References take the form `{kind, id, version}`. A build fails on an unresolved or mismatched pin, and writes a SHA-256 manifest of every input, the print style and the renderer.
- **Authority is explicit.** Every object states its origin, normative class and institutional approval. Formatting, such as legal-style article numbering, never implies legal force.
- **Humans decide.** A completed checklist is an observation, not an approval. Inspector scripts can report that a record is *documentarily complete*, but they can never authorize publication. AI may draft and flag; it cannot verify, consent, approve or publish.
- **Multimodal by choice.** The same content should be readable as print, web or other media, with accessible alternatives. No reader is forced into one medium.

## The default workflow: eight editorial stages

| ID | Stage | Focus | Tasks |
|---|---|---|---:|
| 01 | 企画・編集方針 — Planning and editorial direction | Topic, audience, editorial purpose | 6 |
| 02 | 事前調査・資料収集 — Preliminary research and source collection | Primary sources, context, evidence | 8 |
| 03 | 取材・追加確認 — Interviews and reporting | Interviews, verification of statements | 9 |
| 04 | 構成・執筆 — Structure and writing | Story architecture, drafts, figures, multimodal plans | 9 |
| 05 | 編集・校正・校閲 — Editing, proofreading and fact-checking | Structural edit, copyedit, claim audit | 9 |
| 06 | 専門確認・公開承認 — Expert review and release approval | Scientific review, rights, privacy, accountable authorization | 13 |
| 07 | 公開・配信 — Publication and distribution | Release, accessibility, channels, post-release checks | 12 |
| 08 | 訂正・評価・アーカイブ — Corrections, evaluation and archive | Corrections, evaluation, fixity, learning | 12 |

Stages may overlap, repeat or loop back, and any rework is recorded. Publication always requires an explicit human authorization. The pipeline is a *preset* (`core/workflows/eight_stage.json`). A six-stage generic preset (`core/workflows/generic_project.json`) shows the engine is not tied to editorial work.

## What is in the repository

| Item | Count | Location |
|---|---:|---|
| Document templates / checklist templates | 94 / 45 | `content/templates/TPL-{DOC,CHK}-*.json` |
| Task definitions / procedures | 78 / 78 | `content/operational/stage_0N/{tasks,procedures}/` |
| Standards and ethics entries | 94 | `content/operational/stage_0N/knowledge/` |
| Handbook recipes (one per stage) | 8 | `content/operational/stage_0N/recipes/` |
| AI-assistance prompts (one per task) | 78 | `pipeline/<stage>/AI_ASSIST/common_prompts/` |
| Generated handbooks and forms | 8 + 139 | `build/handbooks/`, `build/tex/` |
| Automated tests | 77 | `tests/` |

## Repository layout

```text
core/
  workflows/          Workflow presets: stage IDs, names, ordering rules
  model/v1/           Canonical object schemas (used by the handbook composer) + synthetic fixtures
  policies/           Human-accountability rules; Stage 6 review-gate schema
  schemas/            v4 pilot schemas (legacy)
content/
  templates/          139 document/checklist definitions (canonical)
  operational/        Per-stage tasks, procedures, knowledge entries, handbook recipes (canonical)
  schemas/            Template, instance and content-block schemas
  template_versions/  Archived earlier template versions (pinned references stay resolvable)
  operational_versions/  Archived earlier operational objects (Stage 6)
  examples/           Synthetic filled-form and SOP examples
pipeline/<stage>/     Stage descriptor (stage.json), AI_ASSIST prompts, compiled doc copies
templates/
  catalog.json        Inventory of all 139 templates (CATALOG.md is generated from it)
  tex/                Print styles: operationsform.sty (forms), operationshandbook.sty (handbooks)
script/               Validators, renderers, compiler, project initializer, documentary inspectors
tests/                Regression tests and synthetic fixtures
build/                Generated TeX, PDF, JSON views and provenance manifests — never edit
design/               Design notes and decisions (start with DESIGN_REVIEW_v18.md)
docs/                 Compiled shared documents (standards/, ethics/, sops/, handbooks/)
projects/             Project instances (git-ignored; may contain confidential material)
os-site/              Scope note for the future website (not implemented)
AI_ASSIST/            Shared AI-assistance policy and prompt template
standards/ ethics/ publications/ competencies/   v4 pilot and planned libraries (legacy)
```

## Getting started

**Requirements:**
- Python 3.10+ with `jsonschema`. It is required by the handbook composer, the gate inspectors and full schema validation.
- GNU Make.
- For PDFs only: XeLaTeX with `fontspec`, `xeCJK`, `geometry`, `tabularx`, `needspace`, `fancyhdr`, `enumitem`, `titlesec` and `hyperref`, plus the fonts Noto Serif and Noto Serif CJK JP.

```bash
pip install jsonschema
make help
make test                                  # validators + 77 regression tests
make stage-01-handbook                     # … through stage-08-handbook: JSON → TeX → PDF
make tex                                   # TeX for all 139 templates (IDS="…" for a subset)
make pdf IDS="TPL-DOC-030 TPL-CHK-002"     # generate and compile selected forms
make sample                                # eight representative forms
make view                                  # presentation-neutral JSON views
```

**Windows:** Run the toolchain inside WSL. If the `python3` on your WSL `PATH` lacks `jsonschema`, pass an interpreter that has it, e.g. `make test PYTHON=/usr/bin/python3` (Ubuntu package `python3-jsonschema`). Native Windows Python currently needs `PYTHONUTF8=1`, and `script/validate_templates.py` reports false path mismatches there. Both are known issues.

Render a **synthetic** filled document:

```bash
python3 script/generate_tex.py --ids TPL-DOC-030 \
  --instance content/examples/synthetic_editorial_proposal.json --output build/example
python3 script/validate_instance.py content/examples/synthetic_editorial_proposal.json
python3 script/compile_pdf.py --ids TPL-DOC-030 --tex-dir build/example
```

Create a project workspace (stages start `not_started`; nothing is completed or approved):

```bash
python3 script/init_project.py example-editorial --title '編集企画例'
python3 script/init_project.py example-generic --title '一般業務例' --workflow generic_project.json
```

## How content becomes a document

```text
JSON definitions ─► validation ─► recipe / template resolution (pinned versions)
                 ─► escaped TeX + SHA-256 manifest + JSON view ─► XeLaTeX ─► PDF
```

- To change **meaning or structure**, edit the JSON. If the change is semantic, bump the version and archive the old one.
- To change **print appearance**, edit `templates/tex/*.sty`.
- Never edit anything under `build/`. Regenerate it.

All text passes through an escaping function, so content can never execute as TeX. A stage handbook is an editorial *composition* (a recipe of version-pinned includes plus bridge text), not a second source of truth.

## Status and limitations

- All content is a first draft: structurally complete, substantively unreviewed. It needs domain, editorial, ethical and case-specific legal review before any real use.
- The project execution layer is a scaffold. Task runs, completed checklists and review decisions are specified as schemas but not yet implemented.
- Access control, identity, signatures and secure storage do not exist. Do not put real personal, unpublished, interview or embargoed material in this repository.
- The website, HTML rendering and audio/video renditions are deferred.

## Release history

| Version | Milestone |
|---|---|
| v3–v8 | Scaffold, structured-first pilot, template inventory, canonical model v6, monochrome Mincho print prototypes |
| v9 | General-purpose, organization-neutral identity; 139 structured templates; TeX/PDF pipeline |
| v10–v13 | Stages 1–4: first substantive drafts ([v10](RELEASE_NOTES_v10.md), [v11](RELEASE_NOTES_v11.md), [v12](RELEASE_NOTES_v12.md), [v13](RELEASE_NOTES_v13.md)) |
| v14 | Stage 5: editing, proofreading and fact-checking |
| v15–v16 | Stage 6: specialist review and documentary release gate ([v16](RELEASE_NOTES_v16.md)) |
| v17 | Stage 7: publication and distribution ([v17](RELEASE_NOTES_v17.md)) |
| v18 | Stage 8: corrections, evaluation and archive; all eight stages at first draft ([v18](RELEASE_NOTES_v18.md)) |

Per-version design notes are in `design/`.

## For AI agents and contributors

Read [CLAUDE.md](CLAUDE.md) before changing anything. It lists the source-of-truth rules, the invariants the tests enforce, and the change workflow.

## License

This repository is dual-licensed by content type:

- **Code: [MIT](LICENSE).** Covers `script/`, `tests/` (including fixtures), `Makefile`, `templates/tex/*.sty`, and every `*.schema.json` file.
- **Documents and content: [CC BY-NC 4.0](LICENSE-CC-BY-NC-4.0.txt).** Covers everything else, including `content/`, `pipeline/`, `core/workflows/`, `design/`, `docs/`, `templates/catalog.json`, the AI-assistance prompts, and the generated TeX, PDF and JSON under `build/`.

External works cited by URL in the content are not redistributed here and remain under their owners' terms.

## Disclaimer

This is an independent design prototype. It implies no affiliation with, or endorsement by, any organization. It is not legal advice. A valid schema, a compiled PDF or a fully checked checklist never establishes that content is accurate, lawful, rights-cleared or approved for publication.
