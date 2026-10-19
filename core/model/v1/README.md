# Canonical Content Model v1 (Design Contract)

**Status:** v1.0.0 schema draft for an independent Operations OS prototype. These schemas define **data contracts**, not organizational-approved operations, legal compliance or usable completed templates.

## Objects and responsibilities

| Object | Purpose | First-class identity |
|---|---|---|
| SourceRecord | Bibliographic evidence source and verification status | `SRC-*` |
| ClaimRecord | Scientific claim, epistemic status, supporting sources and unresolved questions | `CLM-*` |
| KnowledgeEntry | Reusable normative, ethical or explanatory content | `KNW-*` |
| ProcedureDefinition | Ordered work method and exception points | `PRC-*` |
| TaskDefinition | Reusable unit of work and dependencies | `TSK-*` |
| DocumentTemplate | Form layout, typed input fields and applicability | `DTPL-*` |
| ChecklistDefinition | Reusable criteria, evidence conditions and review requirements | `CLD-*` |
| TaskRun | Execution state for a project task | `TRUN-*` |
| DocumentInstance | Actual project-specific completed/partially completed document | `DOC-*` |
| ChecklistRun | Project-specific responses, including unresolved/NA | `CRUN-*` |
| ReviewDecision | Named human decision, conditions and target | `DEC-*` |
| PublicationRecipe | Named editorial composition of sources | `PUB-*` |
| MediaAsset | Rights and accessibility metadata for media | `AST-*` |
| RenderedArtifact | Build metadata, provenance and release state | `ART-*` |

**Other entities:** Existing Workflow and Stage definitions stay under `core/workflows/` and `pipeline/`; SourceRecord and ClaimRecord use explicit ID/version references to their evidence; a full external bibliographic harvesting service is a future option. The stage/task content and sample v4 JSON remain legacy prototypes. No automatic migration or dual-writing has been implemented.

## Relationships

`Workflow → Stage → TaskDefinition → TaskRun`. A `ClaimRecord` refers to versioned `SourceRecord`s with locators, epistemic qualifications, and open questions. A TaskDefinition references `ProcedureDefinition`, `KnowledgeEntry`, `ClaimRecord`, `DocumentTemplate`, and `ChecklistDefinition`. The TaskRun references a `ChecklistRun` and may produce a `DocumentInstance`; a `ReviewDecision` references its precise target. A `PublicationRecipe` selects version-pinned canonical entries and contextual transitions; its rendering produces `RenderedArtifact`s. `MediaAsset`s may serve multiple presentations.

**ID vs version:** ID is a stable logical identity; version pins immutable content. Changes that materially alter required procedure, checklist, output, or normative meaning require a new version. Builds and executions pin versions and, for reproducibility, may save the exact bytes' SHA-256. Draft references may be explored loosely in editorial tools, but release builds cannot use floating versions.

**Authority is separate from lifecycle:** `lifecycle=validated_for_use` is an internal lifecycle state, not proof that a law applies or that an institution approved the rule. `authority.normative_class` classifies the claimed category; `authority.institutional_approval` tracks the *actual* institution's decision (unverified by software). An independent proposal should retain `origin=independent_proposal` unless independently verified institutional adoption occurs. Case law, law amendments and agency instructions require dated, authoritative source records and human review.

**Information handling:** `access.classification` and `may_share_with_external_ai` are declarative labels only. Security enforcement, permissions, embargoes and consent are NOT implemented. Restrict all real personal, confidential, unpublished and embargoed materials until a reviewed access-control system exists.

**Accessibility and multimodality:** Information is structured independently of PDF/HTML/audio/video. Transcripts, captions, alternative text and rights are tracked through asset metadata. Equivalent scientific claims should be consistent, but each modality may have an authored adaptation, not mechanically identical narration.

**Checklists do not authorize publication:** Completing a mandatory checklist item is an observation. Approval is a separate human ReviewDecision, with reviewer role, scope and conditions. Missing evidence, negative findings and `not_applicable` need reasons where relevant. The pilot does not automatically enforce gate conditions.

**Templates:** The 139 blank `.md` inventory files in `templates/` remain empty; `templates/catalog.json` retains `TPL-DOC-*` and `TPL-CHK-*` *catalog identifiers*. The new `DTPL-*` and `CLD-*` represent **future structured definitions** and point back to the catalog, not replacements for blank placeholders. The examples in this directory are synthetic *schema fixtures only*, never completed templates.

**Japanese formal document organization:** Keep section identity separate from display numbering (`編・章・節・条・項・号` as appropriate). Document typography does not confer legal authority or approval. Treat drafted SOPs as proposals until institutionally adopted.

**Migration:** The v4 `knowledge_entry.schema.json`, task/procedure/checklist JSON and `document_recipe.schema.json` are left untouched. The new v1 model is an additive contract, with explicit migration to be considered after review.

## Validation

From the repository root:

```sh
python script/validate_canonical_model.py
python script/validate_template_catalog.py
python script/validate_content.py
python script/validate_repo.py
```

The first command checks schemas, synthetic instances, known relationships and the registry connection. It is not a legal/scientific/ethical/accessibility compliance evaluation.
