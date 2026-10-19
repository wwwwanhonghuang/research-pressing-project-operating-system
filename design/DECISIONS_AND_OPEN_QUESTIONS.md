> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Operations OS — Design Decisions and Open Questions

**Date:** 2026-10-19  
**Status:** Notes from exploratory discussion; not an approved institutional operational system.

## Agreed design directions

1. The current workflow has **eight stages**: planning; preliminary research; reporting/interviews; drafting; editing/verification; scientific review and release approval; publication/distribution; and correction/evaluation/archive. The stage names are in `pipeline/Readme.md`.
2. We retain a **stage-centered repository** with stage-specific tasks and supporting guidance.
3. Each task should have a **procedure (how to do it), reusable checklist, relevant standards, ethical considerations, required evidence/artifacts**, and clear inputs/outputs.
4. Every stage has an `AI_ASSIST/` area containing possible AI assistance, approved reusable prompts, and optional agent support. AI does not replace human verification or approval.
5. **NEW, accepted:** `docs/` directories have `standards/`, `ethics/`, `sops/`, `handbooks/` subfolders **both globally and inside all eight stages**, to organize compiled and readable documents. Editable canonical sources remain separate to avoid divergence.
6. Operations OS supports **multiple projects** created from reusable pipeline/task templates; progress, evidence, decisions, completed checklists and audit records belong to the concrete project instance.
7. On project creation, the system may generate lightweight project- and stage-scoped `AGENTS.md` and `CLAUDE.md`, sharing canonical policy references rather than copying divergent rules into each project.
8. `operations-os-site/` is a **later concern**: it will present documents/handbooks in multiple optional modalities, visualize pipeline progress, and support multi-project management. Choice of UI, database, hosting and framework is deferred.
9. Record source/authority and versions. Distinguish professional guidance and independent proposals from actual any named organization or legally binding requirements.
10. The process is **iterative**: reviews, corrections, and new evidence may reopen earlier tasks/stages; document the reason, approver and changed artifact.

## Inferred implementation conventions (provisional, revise freely)

- Shared canonical material: root `standards/`, `ethics/`; eventual `competencies/` for learning materials.
- Compiled human-readable material: root `docs/<category>/`, and each `pipeline/<stage>/docs/<category>/` with four categories.
- Stage task definitions: `pipeline/<stage>/tasks/<task_id>/` containing `task.yaml`, `procedure.md`, `checklist.md`, and optional task-level prompts or references.
- Project instance: `projects/<project_id>/`, with a manifest, applied source versions, stage workspace/task records, evidence, drafts, approvals, and corrections.
- A release authorization is an **explicit human decision**, never inferred from checked boxes or AI text alone.

## Unresolved design questions

- Precise **task contract**: task ID, subtasks, dependencies, checklist schema, reviewer, exception handling, progress state.
- Do `docs/` contain only generated artifacts, or also approved human-authored final documents? Recommended: support both, but clearly record document type and source ownership.
- Canonical format for standards, ethical requirements, SOPs, handbooks and generated output (Markdown/LaTeX/PDF/HTML etc.).
- How local stage-specific guidance inherits shared rules and handles exceptions/conflicts.
- Which project types need all eight stages, which have additional branches, and who can waive a stage.
- How to store confidential source material, permissions, embargoes, AI usage records, and approval audit trails.
- How agents receive project context, permissions and tool access; what can be automated versus human-approved.
- How to organize and migrate **existing empty competency-named files** and correct typos in existing stage directory names without breaking references.
- Website design and technical architecture are explicitly deferred.

## Scope caution

Operations OS here is an independent proposed system, not an official any named organization implementation. Actual any named organization workflows, legal obligations and institutional approval authorities require validation before operational use.


## Revision v3 — implemented 2026-10-19

- **Accepted:** Introduce root `core/{schemas,workflows,policies}/` as a thin definition layer. `core/workflows/eight_stage.json` gives stable IDs (`01`–`08`) and maps the **existing** stage folder names without renaming them.
- **Accepted:** Add root `script/` (singular) for lightweight operational scripts. A standard-library initializer and structural validator are now implemented and smoke-tested; future document compilers and task-instantiation tools remain suggestions.
- **Accepted:** Add root `AI_ASSIST/` as a shared layer while retaining stage-specific `AI_ASSIST/`. Contextual `AGENTS.md` and `CLAUDE.md` are generated at project and stage level without automatic approval authority.
- **Accepted:** Retain `docs/{standards,ethics,sops,handbooks}/` **at root and within every stage**, using sources and version references rather than independent, contradictory canonical rules.
- **Accepted:** Separate reusable `pipeline/<stage>/tasks/` from execution records in `projects/<project-id>/stages/<id>/tasks/`. Reusable task contracts are not yet populated, and project creation does not fabricate task completion.
- **Implementation note:** To make the minimal tools work without dependencies, new machine-readable metadata uses JSON (`project.json`, `stage.json`, and future `task.json`) rather than the earlier illustrative YAML filenames. We may revisit serialization later.
- **Open:** Task-level schemas and operations beyond placeholders; publication gates and signatures; confidentiality, authorization and access controls; document compilation, search/indexing and website implementation.

## Revision v4 — structured-first implementation decision (2026-10-19)

- **Accepted design direction:** canonical structured content precedes PDF and website generation; Markdown/TeX are output representations.
- **Accepted:** a pipeline handbook is an editorially curated, versioned **composition**, referencing standards, ethics, task procedures and other documents with bridging text, not a mere concatenation.
- **Accepted:** preserve `docs/{standards,ethics,sops,handbooks}` as output/publication folders at root and stage level.
- **Accepted:** retain `script/` for content validation, assembling a document view, and future rendering/quality assurance.
- **Accepted:** use Japanese formal document hierarchy selectively; do not conflate legal-style numbering with legal or institutional force; store an authority/status field separately.
- **Implemented pilot:** source JSON examples, document composition recipe, sample XeLaTeX/Markdown/view export and SHA-256 source manifest.
- **Open:** substantive legal verification, agency style approval, authoritative SOPs, full media schema and multimedia rendering, permissions, approvals, project task instances and website implementation.

## Revision v5 — global template placeholder inventory (2026-10-19)

- **Accepted:** Before implementing more content, enumerate global reusable templates for planning, reporting, writing, approvals, dissemination, evaluation and cross-stage operations. Add checklists as first-class templates.
- **Accepted:** Define one global inventory (`templates/catalog.json`) and editable future templates in `templates/documents/{shared,stage_01…stage_08}/` and `templates/checklists/{shared,stage_01…stage_08}/` rather than per-stage duplicates.
- **Accepted:** Placeholders remain empty. The registry labels every item as an independent provisional suggestion; it is not an institutional standard, ready-to-sign consent form, or legal instrument.
- **Accepted:** Separate reusable checklist definitions from project-specific completed checklist records and reviews; a completion mark does not authorize publication.
- **Next design milestone:** finalize canonical content model and typed relationships before implementation of document/checklist contents; only then expand substantive SOPs, ethics, standards and task handbooks.
- **Open:** field/block and form types, conditionals, checklist statuses, template selection by project, version pinning, Japanese legal-style hierarchy, localization, permissions/consents, rendering and sign-off semantics.


## v6 canonical-content-model proposal (2026-10-19)

Implemented additive typed/versioned design contracts for SourceRecord, ClaimRecord, KnowledgeEntry, ProcedureDefinition, TaskDefinition, DocumentTemplate, ChecklistDefinition, TaskRun, DocumentInstance, ChecklistRun, ReviewDecision, PublicationRecipe, MediaAsset and RenderedArtifact. Stored at `core/model/v1/`; synthetic-only test fixtures and `script/validate_canonical_model.py`. Catalog/template placeholders unchanged. No migration of prior pilot data; no implementation of actual template fields or public operating authority. See `design/CANONICAL_CONTENT_MODEL_v6.md`.

## 2026-10-19 — v7 blank Japanese template print previews

Accepted for prototype evaluation: convert four high-priority inventory entries into schema-valid reusable definitions and distinct print profiles, render **blank** XeLaTeX/PDF forms, and retain the untouched placeholder inventory. The four are editorial proposal, interview question plan, scientific-evidence checklist and publication-approval request. Their human review and authority semantics remain provisional; checklists are records, not automatic authorizations. Typed table columns and full web-editable form semantics are not yet included in the canonical model. See `TEMPLATE_PRINT_PROTOTYPE_v7.md`.

## 2026-10-19 — v8 monochrome Mincho / TeX-first print rules

**Accepted after the v7 print-style review:** Previous decorative form styling was not professionally appropriate. The v8 blank forms use black/white exclusively, Mincho for all text and headings, no boxes/shading, no lines decorating headings, and section numbers without leading zeroes. Printable writing lines and selection squares are functional marks only. Minimize gratuitous pagination. **TeX is the canonical editable print-layout source**, JSON is the canonical structural/semantic template definition, and PDFs are derived previews. This is a division of responsibilities, not a return to PDF-first content authoring.

**Implemented:** four hand-authored `.tex` masters and one shared `.sty` under `templates/tex/`; a TeX-first compiler with field/checklist ID validation; v8 PDF review pack; previous color preview generator replaced by a compatibility entrypoint; old v7 compiled previews treated as superseded.

**Open:** source-to-TeX data injection model for filled documents; more flexible print controls for long answers; final Japanese professional style conventions; accessibility of future web and PDF outputs. No claim that an independent print prototype is an official any named organization document.
