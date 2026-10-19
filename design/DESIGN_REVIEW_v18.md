# Design Review of the v18 Snapshot: Interpretation and Revision Proposals

**Date:** 2026-10-19
**Status:** Reviewer's memo. **Nothing proposed here has been implemented.** The v18 code and content are unchanged (baseline commit `79b791f`).
**Basis:** A full read of the repository: design notes, schemas, scripts, tests and samples of every content type. Validators and the 77 tests were run on Linux (WSL) and Windows.

This memo has two jobs:

1. Record how the idea, philosophy and implementation of Operations OS read *as they stand*, so that later revisions start from an explicit baseline (sections 1–3).
2. List where the implementation drifts from its own stated principles, and propose revisions for discussion (sections 4–6).

Each proposal needs a decision before anyone acts on it. Section 6 lists the open questions that decide most of them.

---

## 1. Concept Summary

Operations OS is a file-based, version-controlled operating manual for research-communication and press work (研究広報). It holds three kinds of thing:

- **Definitions** of how work is done. These are a workflow of stages, tasks, step-by-step procedures, standards and ethics guidance, document and checklist templates, and AI-assistance prompts.
- **Records** of what was actually done on a specific project: filled forms, checklist results and human decisions.
- **Publications** compiled from the definitions: stage handbooks, blank or filled forms as PDF, and JSON views for a future interactive, multimodal website.

Definitions are structured JSON. TeX and PDF are generated outputs, never the source. The default workflow is an eight-stage editorial pipeline running from planning to correction and archiving. AI may assist every task, but it never verifies, consents, approves or publishes.

## 2. Inferred Design Philosophy

| # | Principle | How it shows up | Where |
|---|---|---|---|
| P1 | **Structured data is the source of truth; every rendering is a view** | "PDF files are never canonical data"; renderers only read JSON | `GENERAL_PURPOSE_ARCHITECTURE_V9.md` §2; `script/generate_tex.py`, `script/compose_handbook.py` |
| P2 | **Definition ≠ record ≠ rendition** | Three object families (shared definitions / operational records / outputs) | `CANONICAL_CONTENT_MODEL_v6.md` §2; `script/init_project.py` |
| P3 | **Immutable versions, pinned references, hashed builds, fail-closed resolution** | Refs are `{kind, id, version}`; the composer raises on mismatch; manifests store SHA-256 of every input, the print style and the renderer itself | `compose_handbook.py::resolve`; `build/handbooks/*/…manifest.json`; `content/template_versions/` |
| P4 | **Authority is an explicit axis, never inferred from form** | `authority {origin, normative_class, institutional_approval}`; legal-style numbering ≠ legal force | `core/model/v1/README.md`; `JAPANESE_DOCUMENT_FORM_AND_AUTHORITY.md` |
| P5 | **Human accountability is structural** | A checklist is an observation; `ReviewDecision` is separate; inspectors return only `BLOCKED` or `…_HUMAN_AUTHORITY_UNVERIFIED`; `can_publish` is always `false`, and tests assert it | `core/policies/HUMAN_ACCOUNTABILITY.md`; `script/check_release_gate.py`, `inspect_stage7_preflight.py`, `inspect_stage8_case.py` |
| P6 | **Epistemic care is domain content** | Observed fact / inference / causal interpretation / hypothesis / outlook kept apart; uncertainty is handed forward | e.g. `content/operational/stage_01/knowledge/KNW-CLAIM-BOUNDARY.json` |
| P7 | **Generality and organization neutrality** | The eight-stage pipeline is a preset; there is a six-stage generic preset; a test forbids institution names in sources | `core/workflows/`; `tests/test_content_pipeline.py::test_no_organization_branding` |
| P8 | **Composition, not concatenation** | Handbooks are recipes: ordered includes plus editorial bridge text | `content/operational/stage_0N/recipes/PUB-*.json` |
| P9 | **Multimodality is optional and accessible** | No reader is forced into one medium; media keep links to claims and sources | `os-site/README.md`; `PENDING_WORKS_AFTER_V18.md` |
| P10 | **Japanese formal print aesthetic** | Monochrome Mincho, A4, no decoration, unpadded section numbers; 法令-like hierarchy where it adds precision | `templates/tex/*.sty`; `JAPANESE_PRINT_FORM_STYLE_v8.md` |
| P11 | **Additive evolution** | History kept, legacy layers marked rather than deleted, old versions archived rather than overwritten | `content/*_versions/`; "Historical design note" banners |
| P12 | **Light tooling** | Python and Make, no services, no network; `jsonschema` is the only dependency | `script/`, `Makefile` |

P3, P4 and P5 are the distinctive, high-value core. Any revision should keep them intact.

## 3. Implementation State (v18)

### 3.1 Inventory

| Layer | Location | Contents |
|---|---|---|
| Workflow presets | `core/workflows/` | `editorial-eight-stage` v0.1.0; `generic-project-lifecycle` (6 stages) |
| Stage descriptors | `pipeline/<stage>/stage.json` | Task ID list and review-gate notes (the gate keys differ from stage to stage) |
| Operational definitions | `content/operational/stage_0N/{tasks,procedures,knowledge,recipes}/` | 78 tasks, 78 procedures, 94 knowledge entries (standards and ethics), 8 recipes: **258 objects**, no duplicate IDs |
| Templates | `content/templates/` | **139** (94 document, 45 checklist), schema `content/schemas/template_definition.schema.json` |
| Version archives | `content/template_versions/`, `content/operational_versions/stage_06/` | Copies of superseded `0.1.0` definitions |
| AI assistance | `pipeline/<stage>/AI_ASSIST/common_prompts/*.md` | **78** Markdown prompts, one per task; root `AI_ASSIST/` holds shared policy |
| Renderers | `script/generate_tex.py`, `compose_handbook.py`, `export_view.py` | Forms → TeX; recipes → TeX + `view.json` + manifest |
| Print styles | `templates/tex/operationsform.sty`, `operationshandbook.sty` | One style for forms, one for handbooks |
| Inspectors | `script/check_release_gate.py`, `inspect_stage7_preflight.py`, `inspect_stage8_case.py` | Documentary consistency checks only |
| Projects | `script/init_project.py` → `projects/<id>/` | Directory scaffold, per-stage status, generated `AGENTS.md`/`CLAUDE.md`; no task instances |
| Outputs | `build/` | 139 form TeX/PDF, 139 views, 8 handbooks (TeX, PDF, view, manifest) |
| Tests | `tests/`, `script/validate_*.py` | 77 unittest cases and 5 validators, all passing on Linux |

### 3.2 Data Flow

```text
core/workflows/eight_stage.json ──► pipeline/<stage>/stage.json   (task IDs, gate notes)

content/operational/stage_0N/recipes/PUB-*.json
  │  include {kind, id, version}
  ├─► tasks/TSK-*        ─► procedure_ref, standard_refs, ethics_refs,
  │                         checklist_refs, document_template_refs
  ├─► procedures/PRC-*   ┐
  ├─► knowledge/KNW-*    ┘  validated against core/model/v1/schemas/
  └─► content/templates/TPL-CHK-*   validated against content/schemas/
         │
         │  script/compose_handbook.py
         ▼
  build/handbooks/stage_0N/  *.tex  *.view.json  *.manifest.json  ──xelatex×2──►  *.pdf

content/templates/TPL-*.json  (+ optional instance JSON)
  ├─ script/generate_tex.py ──► build/tex/*.tex ── script/compile_pdf.py ──► *.pdf
  └─ script/export_view.py  ──► build/view/*.json
```

### 3.3 Legacy and Placeholder Layers

- **v4 pilot.** `core/schemas/`, `standards/STD-SOURCE-TRACEABILITY/`, `ethics/ETH-REPRESENTATION/`, `publications/stage-02-handbook.json` and `pipeline/2_*/tasks/source_claim_register/`, still checked by `script/validate_content.py`. Its builder, `script/build_documents.py`, is referenced by `publications/README.md` but no longer exists.
- **v1 fixtures.** `core/model/v1/examples/` are synthetic fixtures for `validate_canonical_model.py`. The v1 schemas for `task_run`, `checklist_run`, `review_decision`, `document_instance`, `media_asset` and `rendered_artifact` are used by nothing else.
- **Template placeholders.** `templates/documents|checklists/**` holds 139 empty `.md` placeholders, kept for traceability.
- **Competency placeholders.** 37 empty competency-named files sit directly in `pipeline/<stage>/` (e.g. `Editorial stylebook`, `Evidence checking`).
- **Hand-copied handbooks.** `docs/` and `pipeline/<stage>/docs/handbooks/` hold PDFs for stages 1, 2, 5 and 6 only, under inconsistent names.
- **Website.** `os-site/` contains a scope memo only.

## 4. Divergences Between Principles and Implementation

**4.1 Three schema families describe overlapping things.**
`content/schemas/` covers templates and instances. `core/model/v1/schemas/` covers the operational objects the composer validates. `core/schemas/` belongs to the v4 pilot.
- The same checklist is a `TPL-CHK-*` template in one model and would be a `CLD-*` `checklist_definition` in the other.
- Templates carry flat `origin`/`authority_status` strings, while operational objects carry a structured `authority` object.
- No single validator sees the whole object graph.

**4.2 "One canonical source, referenced by many stages" is stated but not implemented.**
- `compose_handbook.py` resolves an include only inside the recipe's own stage folder (`base/KIND_DIR[kind]/<id>.json`).
- All 94 knowledge entries carry exactly one stage in `scope.stages`, and `tests/test_stage8_handbook.py` asserts it.
- The intended canonical homes, root `standards/` and `ethics/`, hold only the two v4 pilot entries.
- Competencies 1.1–1.8 exist only as empty files and a table in `COMPETENCY_STAGE_MAP.md`.

As a result, quotation integrity, privacy, accessibility and AI use are each re-authored per stage, and the copies will drift.

**4.3 Resolution works by path convention, not by registry.**
Historical-version lookup works only for checklists (`content/template_versions/`). `content/operational_versions/` exists only for Stage 6, and the composer cannot read it. Pinning an older task or knowledge version therefore fails, even though version pinning is the central reproducibility promise (P3).

**4.4 Tasks do not form a graph.**
- `inputs` and `outputs` are free-text strings. There is no `consumes`, `produces` or `depends_on`.
- `core/workflows/eight_stage.json` says dependencies are "defined by future task contracts".

Hand-offs between stages exist only as prose. The site cannot draw the pipeline, and a project engine cannot know what a task needs.

**4.5 Seed-generated filler is still present.**
- 213 of 452 procedure steps have an `expected_output` identical to the whole procedure's output.
- All 258 operational objects carry the same authority triple (`independent_proposal` / `operational_proposal` / `none`) and the same applicability note.

The content is structurally complete but semantically thin in places. That is consistent with its own "first draft" label, and it is worth knowing before revising.

**4.6 The AI layer is outside the data model.**
- The 78 prompts are Markdown, linked to tasks only by filename.
- Tests check them by grepping for phrases (`外部AI`, `人による最終確認`, `自動実行しない`).
- Prompt version, permitted inputs and sensitivity live in prose.
- No stage-level `AGENTS.md`/`CLAUDE.md` exist under `pipeline/`. They are generated only inside project instances.

The goal of AI instructions for every stage is therefore not yet met.

**4.7 Two document ASTs and two renderers.**
- `content_block.schema.json` uses kinds such as `normative_clause` and `procedure_step` with a `text_ja` field. Knowledge entries use `heading`/`paragraph`/`list`/`notice`/`example` with a `text` field.
- Forms and handbooks have separate code paths, and URLs are found by regex inside paragraphs.
- There is no inline markup (emphasis, links, cross-references, footnotes).

The deferred P0 rewrite into 法令 article form (`PENDING_WORKS_AFTER_V18.md`) needs 編・章・節・条・項・号 nodes with stable IDs. Neither AST has them.

**4.8 HTML is not yet a target.**
`*.view.json` is the resolved object dump, not a designed presentation model. Even a minimal static HTML renderer would be the cheapest test of the "multimodal from one source" claim (P1, P9).

*Update, 2026-10-20:* the read-only reading room (`os-site/`) now renders every handbook and definition in the browser from the same JSON, through presentation-neutral bundles (`script/build_site_data.py`) and a shared block model. It supports Japanese, Chinese, English and French typesetting. Project records and editing remain unimplemented.

**4.9 Tests freeze content rather than invariants.**
Many assertions are counts (17 chapters, 12 tasks, 19 knowledge entries, 7 items per checklist) or specific Japanese strings. Any substantive revision will break them even when nothing is wrong. The invariants are what should be tested: references resolve, no approval states, every task has a procedure and a human decision, and so on.

**4.10 Generated output is copied by hand.**
`build/` is tracked, which is reasonable for now. Partial copies also live in `docs/` and in stage `docs/handbooks/`, under different naming schemes: a Japanese title, `Stage_05_Editing_Handbook_v14.pdf`, `…-v16.pdf`. These go stale silently.

**4.11 The environment is fragile (all verified).**
- `jsonschema` is *required* by `compose_handbook.py` and the inspectors, although the README called it optional.
- On native Windows, `Path.read_text()` without `encoding` fails 18 tests under cp1252.
- `validate_templates.py` reports 139 false "definition path mismatch" errors on Windows, because it compares backslash paths.
- The WSL login-shell `python3` may lack `jsonschema`.
- There is no `make` on Windows, and there is no CI.

**4.12 Documentation drifts.**
- The README still said "Current release: Stage 5 v14" at v18.
- `design/` holds about 25 notes, most bannered "historical". `GENERAL_PURPOSE_ARCHITECTURE_V9.md` is named as current, although it predates the v10–v18 operational model.

It is hard to tell what is true *now*.

**4.13 Stage material lives in two trees.**
- `pipeline/<stage>/` holds the stage descriptor, AI prompts and doc copies.
- `content/operational/stage_0N/` holds tasks, procedures, knowledge and recipes.

The same stage appears as `"01"`, `stage_01` and `1_Project_Design_and_Edtorial_Principles`, and the folder names carry typos (`Edtorial`, `Presurvery`, `Archieve`).

**4.14 The execution layer is a stub.**
`init_project.py` creates folders and `stage.json`. Nothing instantiates a TaskRun, ChecklistRun or ReviewDecision, although v1 schemas exist for them. For day-to-day use, the layer that matters most is the thinnest.

**4.15 Language is hard-wired.**
Field names such as `title.ja`, `title_ja`, `label_ja` and `criterion_ja` mean that parallel English (or other) renditions would need schema changes.

## 5. Revision Proposals (for Discussion; Not Implemented)

They are ordered so that early items are cheap and unblock later ones.

**R1. Hygiene (low risk; do first).**
- Add `requirements.txt` (or `pyproject.toml`) with `jsonschema`, use `encoding='utf-8'` everywhere, use `Path.as_posix()` in path comparisons, and add a `make doctor` target.
- Add CI (GitHub Actions on Ubuntu): validators and tests on every push. An optional TeX Live + Noto CJK job would build PDFs as release artifacts.
- Keep one living architecture document, `design/ARCHITECTURE.md`, plus numbered decision records (`design/decisions/NNNN-*.md`). Move per-version notes to `design/history/` and fold `RELEASE_NOTES_v*.md` into a `CHANGELOG.md`.
- Fix stale references, such as `script/build_documents.py`.

**R2. One object model (v2) with a registry.**
- Use a single schema family for definitions, records and renditions, with shared `$defs` for `ref`, `authority`, `access`, `lifecycle` and multilingual text.
- Add an `index` step that writes a registry (`kind, id, version, path, sha256`) of every object. One resolver serves all kinds and all historical versions, and includes can cross stages. This fixes 4.1–4.3.
- Keep the authority, access and lifecycle semantics as they are. They are the strongest part of the design.
- Migrate with a script and prove it by regression: the TeX of all 8 handbooks and 139 forms should be byte-identical before and after (or any diff reviewed).

**R3. Store definitions by kind; present them by stage.**
- For example, `definitions/{workflows,tasks,procedures,knowledge,templates,ai_assist,recipes}/`, with stage membership as metadata (`stage_ids`). Per-stage folders, READMEs and agent files are *generated* views. This gives cross-stage knowledge one home (4.2, 4.13).
- If stage folders are preferred for browsing, keep them but resolve through the registry, so that location stops mattering.
- Fix the directory-name typos in the same, single migration.

**R4. Typed task I/O and a task graph.**
- Each task declares `consumes` (artifact types or template IDs), `produces`, `depends_on` and its gate.
- Validate per workflow that the graph is acyclic, apart from declared rework loops, and that each consumed artifact is produced upstream or declared as an external input.
- This gives the site its pipeline diagram and a project engine its scheduling (4.4).

**R5. AI assistance as first-class definitions, with generated agent files.**
- `AIA-*` objects hold: task ref, purpose, permitted input classifications, `may_share_with_external_ai`, output shape, required human verifier, prompt body and version.
- Generate one `AGENTS.md` per stage (plus a `CLAUDE.md` that points to it) from the workflow, stage, task and AIA objects. Do the same for each project.
- One source with many adapters is the intent of `ARCHITECTURE_MEMO.md` §5. It meets the "AI instructions at every stage" goal without hand-maintaining 16 or more files (4.6).

**R6. One document AST and several renderers.**
- Block kinds include the legal-article hierarchy (編・章・節・条・項・号), with stable IDs kept separate from display numbering, inline marks (emphasis, link, cross-reference, footnote, defined term) and per-block authority.
- Renderers: TeX (the existing styles), HTML (new), and Markdown or plain text (accessibility, review diffs).
- **Authoring.** Decide whether people write JSON directly. One option is to author long-form text in a constrained format (YAML front matter plus a Markdown subset with directives for clauses), compiled into the JSON AST, so JSON stays the stored and validated form. Another is to edit JSON through the future web client.

**R7. Invariant tests and golden files.**
Replace count and string assertions with graph and semantic invariants. Keep golden TeX and HTML snapshots for a few representative objects to catch renderer regressions (4.9).

**R8. Execution layer and repository split.**
- Build a minimal CLI over the v2 records: new project, start task (creates a TaskRun pinned to versions), fill form (DocumentInstance), run checklist (ChecklistRun), record decision (ReviewDecision), render. Gate state is computed and never auto-approves.
- Keep real project records **outside** this repository, in a private repository or local workspace that pins an OS release. This repository carries only synthetic examples; `.gitignore` already excludes `projects/*` (4.14).

**R9. Generated outputs as release artifacts.**
Once CI publishes PDFs and HTML for each tagged release, either stop tracking `build/` and the `docs/` copies, or keep `build/` and have CI fail on drift (4.10).

**R10. Defer the P0 handbook rewrite until R2 and R6 exist.**
The AST has to exist before eight handbooks are recast in article form. Otherwise the rewrite happens twice.

## 6. Open Decisions Governing the Revision

1. **Authoring:** Who writes and edits content day to day, and in which tool? This decides R6.
2. **Records:** Will real project data ever live in this repository, and is the GitHub repository public or private? This decides R8.
3. **Scope:** Is the target mainly the research-communication pipeline for one office, or a general-purpose OS? Generality costs abstraction.
4. **Naming neutrality:** `test_no_organization_branding` forbids institution names in all sources. Should this rule stay? The current README and CLAUDE.md comply.
5. **Layout:** Store definitions by kind (R3) or by stage?
6. **History:** Keep hand-copied version archives, or rely on git tags plus generated snapshots?
7. **Languages:** Japanese only, or Japanese and English in parallel?
