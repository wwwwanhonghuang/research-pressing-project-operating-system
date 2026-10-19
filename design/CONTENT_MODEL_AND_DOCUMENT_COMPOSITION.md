> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Content model and document composition

## Minimum entities (stable IDs)

| Entity | Purpose | Canonical source |
|---|---|---|
| Stage | Lifecycle slot, gates and dependencies | `core/workflows/eight_stage.json` and `pipeline/<stage>/stage.json` |
| Task definition | Reusable unit of work | `pipeline/<stage>/tasks/<id>/task.json` |
| Procedure | Ordered implementation steps | task-local `procedure.json` |
| Checklist definition | Requirements for completeness | task-local `checklist.json` |
| Standard / ethics entry | Context-independent reusable guidance | root `standards/<id>/entry.json`, `ethics/<id>/entry.json` |
| Document recipe | Named, ordered assembly with original transitions | `publications/<id>.json` |
| Document view | Resolved, portable, modality-neutral representation | generated `build/<id>.view.json` |
| Build manifest | Exact source versions and SHA-256 hashes | generated `build/<id>.provenance.json` |
| Project task run | Actual work, checks, evidence and decisions | project instance, future |
| Media asset | Image/audio/video/interactive reference plus alt/transcript/rights | future asset registry |

## Why not PDF or LaTeX as the source of truth?

PDF only fixes appearance; LaTeX is a strong output language but tends to encode typography and document order rather than reusable relationships among rules, tasks and media. Machine-readable structures permit automated link checking, project-instance checklists, cross-stage reuse, web navigation, and multiple presentations. LaTeX remains the recommended high-quality print renderer.

## Why not put everything in one large JSON file?

Split by *canonical identity*. Prefer compact JSON metadata and explicit typed blocks, optionally referenced Markdown explanatory texts and external media. Long-form writing can be versioned independently. The pilot intentionally uses a minimal subset of supported blocks (`paragraph`, `rule`, `commentary`, `warning`, `example`) and is not a fully general document AST.

## How a pipeline handbook is assembled

`Handbook(stage 02, revision X) = introduction + ordered task narratives/procedures/checklists + applicable standards + scoped ethical guidance + cross-task explanations + review/governance + sources`. It is an editorially constructed document. Deduplicate repeated sections within a handbook as appropriate while preserving source references and citations; do not mechanically concatenate arbitrary files.

A document recipe specifies chapter and section order and references source IDs. Resolve source versions, record hashes, materialize blocks, then render Markdown, XeLaTeX and a normalized JSON view. Article-like numbering is a renderer/style choice, not a replacement for stable IDs.

## Provenance design

- `content ID + version` is the stable logical reference. Build manifest adds relative file path and SHA-256 of exact source bytes.
- A source's status/authority is displayed with every included unit, including draft and independent proposals.
- Project execution binds to a version snapshot, not a live moving standard, and approval events are separate signed decisions.
- Treat publication status, knowledge validation status, legal applicability and rights permissions as distinct fields in future full schema versions.
- Do not publish private source material, personal details, unpublished interview notes or embargoed research in a generated public handbook merely because a task can reference them.

## Known pilot simplifications

No comprehensive JSON Schema enforcement, no full Japanese legislation XML support, no automated legal validity check, no full rich text AST, no asset rights registry, no review signatures, no granular access control. These are design matters for later phases, not hidden capabilities of the demo compiler.
