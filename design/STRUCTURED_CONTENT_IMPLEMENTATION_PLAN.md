> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Operations OS — Structured-content-first implementation plan

**Date:** 2026-10-19  
**Status:** independent architecture proposal; not an approved any named organization process.

## Decision

Build structured canonical knowledge and task contracts first, document compositions second, TeX/PDF and interactive website as output/adaptation layers. Do **not** author PDF handbooks as the canonical sources. Preserve existing `docs/{standards,ethics,sops,handbooks}` at root and within each pipeline stage as publication targets.

## System layers

1. **Canonical knowledge** — `standards/`, `ethics/`, per-stage `tasks/`, `AI_ASSIST/`, with stable IDs, authority labels, versions, conditions and source references.
2. **Document composition** — `publications/*.json` determines handbook scope, order and commentary; includes knowledge by reference (version pinned by build manifest).
3. **Build/validation** — `script/` resolves refs, checks required metadata and content rules, constructs modality-neutral view objects and reproducible source manifests.
4. **Presentation** — generated Markdown and XeLaTeX now; website, audio/video, diagrams, interactive guidance and accessibility variants later.
5. **Execution** — `projects/` records task instances, evidence, completed checklists, reviewer decisions, applied source versions and change history; these are separate from reusable published knowledge.

## Recommended storage conventions

- **JSON metadata and structured blocks** for stable identities, applicability, typed normative statements, source and modality references; short prose strings are valid within these blocks.
- **Markdown only where semantically appropriate** (long free-form explanations, examples), linked by ID and version, avoiding a single huge JSON file. Pilot uses JSON blocks exclusively to validate the model.
- `entry.json` for one canonical standard or ethical guidance; `task.json`, `procedure.json`, `checklist.json` for stage-local task definitions.
- `publications/<publication-id>.json` for an ordered, editorially composed handbook or SOP collection.
- `docs/<category>/` for generated/published text and TeX/PDF artifacts; `build/` for derived website-neutral representation and provenance manifests.
- Do not let a compiled document become a silent second canonical source; preserve provenance and mark separately authored exceptions.

## Important boundaries

- **Task ≠ competency.** A competency can support many tasks across several stages.
- **Task definition ≠ task execution.** Instances carry state, evidence and approvals.
- **Document structure ≠ substantive authority.** Japanese legal-style numbering is not an institutional or legislative authorization.
- **AI suggestion ≠ verification or authorization.** Independent human review and relevant institution rules remain essential.
- **Citation ≠ blanket reproduction license.** Preserve permissions, attribution, personal information, third-party rights and context.
- **Multimodal ≠ forced conversion.** Website, PDF, print, audio, video and interactive forms are optional reader pathways, with editorial checks and accessibility metadata.

## Phased implementation

### Phase 0 — Freeze conceptual contract (now)
Define canonical IDs, authority taxonomy, source metadata, sections/blocks, task inputs/outputs, links, checklist and approval semantics. Record unresolved cases and prototype scope. Do not rename legacy eight-stage directories before adding aliases.

### Phase 1 — One narrow vertical slice (started)
Create one Stage 02 task (`source_claim_register`), one draft standard, one draft ethical guide and one composed handbook recipe. Validate references, stable IDs and human-readable renderings. All pilot content is independent and not an official any named organization document.

### Phase 2 — Deterministic document pipeline
Add strict JSON Schema validation, cross-reference resolution, `§`-level Japanese numbering conventions, source hashing, version pinning, protected image/citation rendering and diff reports. Ensure Markdown, XeLaTeX and structured-view outputs agree. Add regression tests.

### Phase 3 — Task and project execution
Instantiate concrete task runs with statuses, due dates, assigned reviewers, completed checklists, evidence links, exceptions and human-approval records. Capture versions of standards and task definitions used for each run. Add permissions and retention controls before using sensitive information.

### Phase 4 — Domain and document expansion
Populate one complete pipeline stage with realistic, appropriately verified procedures and source-based standards. Produce stage handbook, standards compilation, ethics briefing and task quick-reference from **shared** canonical entries. Introduce change impact checks across publications.

### Phase 5 — Website and multimodal outputs
Design the website against stable structured-view schemas; implement searchable linked content, optional interactive checklists and multi-project visualizations. Add audio/video scripts, transcripts, diagrams and alt text when useful. Evaluate Japanese accessibility and multilingual presentation.

## Pilot acceptance criteria

1. Existing 8 stages, `docs/` folders, projects and scripts remain intact.
2. One standard/ethics/task exists only once canonically, but may appear in multiple compiled documents via references.
3. A handbook recipe deterministically generates Markdown, `.tex`, normalized view JSON and a version/hash manifest.
4. Unknown IDs or inconsistent stage references fail clearly.
5. The output displays draft/nonofficial authority and never asserts an approval.
6. Changing a canonical block changes the generated source manifest and rendering; old project records remain independent.

## Before any production deployment

Verify any named organization internal rules with an authorized owner; verify applicable Japanese law and effective versions with official sources; define real editorial approvals; implement access controls, classification, evidence retention, incident handling and review/update owners. This repository is an educational, independent design prototype.

## v5 sequencing update — templates first as inventory

An empty global template inventory now precedes canonical-model finalization. The **implementation sequence** is: (A) review the provisional template/catalog inventory; (B) design and validate canonical content definitions and task–document–checklist relationships; (C) implement a small selection of P0 document/checklist templates; (D) populate per-task/per-stage source content and compose handbooks; (E) expand multimodal website and XeLaTeX outputs. The preexisting Stage 02 v4 document build remains an experimental slice, not production content. See `design/TEMPLATE_INVENTORY_AND_NEXT_STEPS.md`.
