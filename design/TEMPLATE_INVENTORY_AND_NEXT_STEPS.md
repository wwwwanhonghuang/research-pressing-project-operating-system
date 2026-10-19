> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Operations OS — Template Inventory and Deferred Content-Model Decision (v5)

**Date:** 2026-10-19  
**Authority:** independent design proposal; no institutional adoption or legal approval implied.

## Accepted decisions

1. Keep **one global template library** under `templates/`; do not duplicate definitions across `pipeline/<stage>` directories. Stage-to-template relationships belong in an index/registry.
2. Inventory **both document templates and checklist templates**. Each may apply to one stage or several; cross-stage reusable templates reside in `shared/`.
3. Organize the inventory by `documents/` and `checklists/`, then `shared/` and `stage_01`–`stage_08`.
4. Keep all individual `.md` files empty for this pass. Their names and catalog descriptions declare intended use, not legal terms, final form fields or procedures.
5. Retain a lightweight registry `templates/catalog.json` with template ID, Japanese title, path, intended use, provisional P0/P1 priority, applicable stages, status and a legal/institutional-review warning where appropriate.
6. Checklists are **typed procedural definitions**. Project checklist *responses/completions* need distinct execution records with person/role, timestamp, evidence, applicable template revision, exceptions, approvals and reopening history.
7. Document template, pipeline handbook composition, canonical knowledge, project instance, published document, and multimedia adaptation are separate concepts.
8. The website, PDF compiler and AI agents should eventually consume the same validated content model. The registry is a preliminary discovery layer, **not the final canonical model**.
9. Keep formal-looking documents' authority separate from formatting (any named organization, applicable law, professional guidance, independent proposal; verification current as of date); do not generate pre-approved consent or sign-off language.
10. The user-approved order: **inventory placeholders → design canonical content model → implement reusable templates/checklists → draft substantive per-stage/task knowledge → generated handbooks and multimodal site**. Minor technical prototype from v4 remains an experiment rather than completion of these phases.

## Structural relationships to specify next

- `KnowledgeEntry`: reusable scientific/procedural/ethical/standards content with stable IDs, versions, source authority and cross-references.
- `DocumentTemplate`: structure and fields (title, sections, conditional blocks, form inputs), optional Japanese formal-document style and rendering hints.
- `ChecklistDefinition`: ordered items, category/severity, when applicable, evidence and human validation expectations; dependencies/conditional branching.
- `TaskDefinition`: inputs, steps, outputs, standards, ethical safeguards and referenced template/checklist IDs.
- `DocumentInstance`: actual project-specific content, its template/knowledge versions, revision/approval history.
- `ChecklistRun`: task-specific outcomes (checked/not checked/not applicable, reasons), author, evidence, review and history; not equivalent to a successful stage gate.
- `PublicationRecipe`: curated versioned assembly from canonical entries, including coherent bridging text and document-specific editorial context.
- `RenderedArtifact`: PDF/HTML/Markdown/media, with provenance, hash, permissions and release state.

## Design risks and questions

- A final template may be declarative JSON (fields/blocks) with rich text expressed separately, or contain Markdown-based fragments. Decide schema before writing content.
- Forms with signatures, consent, rights, embargoes or privacy implications require human legal/institutional review before practical use.
- Avoid treating a checked checklist as legal clearance, scientific verification or publishing authorization.
- Local Japanese `編・章・節・条・項・号` numbering should be a **presentation option**, distinct from whether a source has legal force.
- Model optional modalities (text, audio, video, interactive presentations) without requiring users to consume a specific medium.
- A single content entry may feed several documents. Template instances should be version-pinned to avoid retroactively changing approved work.

## First recommended slice after content model

Implement one P0 planning document (`企画書`), one P0 research/interview document (`取材質問設計表`), and one P0 checklist (`科学的事実・根拠確認チェックリスト`). Validate template → project instance → review → neutral view → sample Japanese TeX (later), using synthetic/public sources only. Then expand by cross-stage priority.

## Files

- `templates/catalog.json` — inventory and metadata.
- `templates/CATALOG.md` — human-readable table of all entries.
- `templates/documents/` — empty document placeholders.
- `templates/checklists/` — empty checklist placeholders.
- `script/validate_template_catalog.py` — non-semantic registry/path consistency verification.

No individual template contents were written in this iteration.
