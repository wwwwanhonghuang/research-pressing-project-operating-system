# General-purpose Operations OS — Architecture v9

Date: 2026-10-19  
Status: implemented structural release, **draft and unapproved**

## 1. Scope and generalization

The system is **organization-independent**. It provides project execution, reusable task and document definitions, evidence traceability, standards, ethics, AI-assistance policies, and multi-format publication. The eight-stage editorial pipeline is one **example preset**, not the definition of the OS. A separate six-stage generic project preset is included. No official institutional relationship is implied.

Template stage references are **workflow-scoped**: the 139-template library is associated with the editorial eight-stage preset. Other workflows can reuse a definition explicitly after checking applicability; numeric stage IDs alone do not imply that a document belongs to a different workflow.

The `os-site/` module remains a future presentation and project-management client. No visual website specification is forced on the content model. Consumers should be able to render text, forms, PDFs, diagrams, audio, and video without requiring any one modality.

## 2. Authority and data model

- **Canonical content:** `content/templates/TPL-*.json` for 139 individually specified draft forms and checklists.
- **Canonical knowledge:** `standards/`, `ethics/`, the `core/model/v1` evidence and claim model, with explicit authority and provenance metadata.
- **Long-form semantic blocks:** `content/schemas/content_block.schema.json` supports paragraphs, headings, lists, formal clauses, steps, case studies, tables, media references, and equations; instances may carry `content_blocks`.
- **Document instances:** project-owned field values and content blocks, pinned to template version, distinct from template definitions.
- **Checklist runs:** evidence-backed item statuses, distinct from their checklists and from actual human review decisions.
- **Print authority:** `templates/tex/operationsform.sty` defines Japanese monochrome Mincho layout. The `.tex` files are generated, human-inspectable source artifacts. **PDF files are never canonical data.**
- **Other views:** web/mobile views should consume canonical JSON and referenced assets; media renditions must retain claim IDs, accessibility metadata, version hashes and provenance.

`core/model/v1` is a broader canonical-object vocabulary. `content/schemas/` specializes its reusable form/instance model. The existing v1 objects remain reference specifications pending a consolidated schema migration. We should not maintain incompatible active schemas silently; a formal v2 model migration will be a separate reviewed change.

## 3. How a handbook is assembled

A stage handbook is a versioned *publication recipe* that resolves relevant task definitions, SOPs, standards, ethics, checklists, examples and optional presentation-specific explanatory blocks. It is neither a duplicate authority source nor a blind concatenation of documents. Composition must preserve IDs, actual versions, source locations, authority class and review state.

## 4. Build pipeline

`JSON definitions/instances → validation → safe TeX generator → generated .tex + SHA-256 manifest → XeLaTeX → PDF`

TeX is regenerated from JSON on each `make tex` or `make pdf`; the shared `.sty` print file is versioned and directly editable. Generated `.tex` remains available for inspection and manual debugging. Avoid editing it as the source of truth: layout edits belong in `.sty`, content edits in JSON.

The renderer escapes content to prevent raw TeX execution. It does **not** interpret arbitrary externally supplied markup and does not use a web service. The current implementation supports fields, repeatable borderless tables, checklist options, and elementary long-form blocks. Equation/figure/audio/video blocks are represented semantically but specialized typeset and interactive renderers remain future work.

## 5. Japanese formal writing and typography

- Pure black on white; Mincho throughout; A4 document printing.
- No decorative boxes, headings rules, shaded backgrounds, decorative icons, or colored accents.
- Heading numbers 1, 2, 3 ... without zero padding.
- Formal document numbering may follow 章・節・条・項・号 **when appropriate**, inspired by Japanese legal documentation. A procedural handbook is not an enactment of law.
- Propose authority classification per provision: enacted law, regulation, adopted policy, professional guidance, or independent proposal. Never infer force of law from TeX appearance.
- Preserve editing decisions and source uncertainty; human review and approval remain distinct records.

## 6. Progress and outstanding work

| Workstream | Current status |
|---|---|
| Rename, remove narrow institutional branding | Completed across distributed text and names |
| Canonical JSON schema and source structure | Implemented as draft; broader-model reconciliation pending |
| 94 distinct document templates | Section and field structures authored (draft) |
| 45 distinct checklists | Specific criteria and evidence-state fields authored (draft) |
| TeX generation for all 139 | Implemented and validated |
| XeLaTeX compile script and Makefile | Implemented |
| Print appearance | Draft; human review still needed |
| Real task SOPs, ethics and standards | **Not yet substantively authored or externally verified** |
| Institutional compliance and actual approval workflows | **Not implemented or certified** |
| Website, audio and video renderers | **Deferred** |

## 7. Sequence of subsequent development

1. Review this canonical model, especially long-form block content and instance validation.
2. Evaluate representative print forms and refine a common TeX style before mass publication.
3. Fill P0 template sections **one document at a time**, using domain evidence and references, with quality gates and review metadata.
4. Implement source/provenance-validated SOPs, standards and ethics; create stage handbooks through explicit recipes.
5. Add instance execution, review decisions, asset permissions and accessibility checks, then build the site as a client over these objects.

Do not count a structural template as a legally reviewed SOP, a verified fact record, or an officially approved form.
