> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Canonical Content Model — Architecture Decision v6

**2026-10-19 · Proposed specification · Independent research prototype**

## 1. Decision and motivation

The canonical unit of Operations OS is a **versioned and typed content object**, rather than a PDF page, TeX macro, Markdown file, web component or AI prompt. Each content object has persistent identity, lifecycle, authority classification, access metadata, sources and typed references. Presentations are downstream products; human work produces separate execution records.

Retain the eight-stage editorial pipeline as the main operating map, while allowing shared standards, task dependencies spanning multiple stages, review loops and parallel work. Stage ownership is an index into content, not the basis of normative authority.

## 2. Distinct object families

### A. Shared definitions

- **SourceRecord / ClaimRecord:** identify evidence sources and preserve individual claims, whether measured, inferred, interpreted, proposed or forecast. A claim records supporting/contradicting material, precise locators, uncertainty, methodological limits and unresolved questions. Neither an individual source nor an interview quote automatically makes a causal interpretation warranted.
- **KnowledgeEntry:** a reusable body of professional, scientific, legal-reference, standards or ethical content. A legal *reference* does not automatically encode an enforceable obligation. Its applicability needs review in context.
- **ProcedureDefinition:** steps, inputs, expected outputs, exception and escalation routes. It may be used by more than one TaskDefinition.
- **TaskDefinition:** stage associations, prerequisites, procedures, document/checklist definitions, applicable standards and ethics, conditions for human review.
- **DocumentTemplate:** declarative sections and typed fields, validation expectations, audience and profile. This is the future *implementation* of an item identified in the global template catalog.
- **ChecklistDefinition:** typed questions/criteria, required evidence, applicability and handling of failures or exceptions. A reusable definition is separate from a checked checklist.
- **PublicationRecipe:** editorial assembly plan for a stage or topic handbook. Selects canonical entries by reference and adds contextual bridge text without copying sources.

### B. Operational records

- **TaskRun:** one task executed within a project, with task-definition version, assignee role, status, inputs and outputs.
- **DocumentInstance:** project form values and edit/review history, bound to an immutable DocumentTemplate version.
- **ChecklistRun:** item-level responses, evidence and outstanding issues, bound to a ChecklistDefinition version. An unresolved answer remains unresolved even when the operator is finished entering information.
- **ReviewDecision:** separate authorized-human judgment (approve, request changes, reject, etc.), target and conditions. A completed checklist does *not* automatically imply permission.

### C. Outputs and supporting resources

- **MediaAsset:** rights, accessibility metadata, classification and reference to audio, video, figure or interactive assets.
- **RenderedArtifact:** PDF, TeX, HTML, JSON view, Markdown or other rendition, source snapshots, hashes and release state.

The eight-stage workflow and global `templates/catalog.json` remain existing infrastructure; no migration has yet been made from v4 prototypes to these new contracts.

## 3. Reference model and reproducibility

Every reference is explicit: `{kind, id, version}` with optional internal anchor. Relative paths are implementation details. Resolving an unknown ID, kind, version or anchor is a validation failure. A published manual or completed project should refer to the exact source version used, plus checksum when possible. Replacing a standard should never silently rewrite completed historic records.

Change kinds:

1. Editorial change that preserves substantive meaning: revised patch version.
2. Change to requirements, checklists, interpretation or workflow: explicitly reviewed minor or major version depending on backward compatibility.
3. Withdrawal/supersession: retain old record with status, link successor, re-assess affected projects; do not delete audit evidence.

## 4. Authority / epistemology / evidence

Keep distinct:

1. Normative authority (law, regulation, institutional policy, professional guidance, operational proposal, informational).
2. Provenance and source support (who issued it, where it was checked, applicability, uncertainty and revisions).
3. Review/approval (who authorized a specific document or operational action, and within which powers).
4. Publication permission and licensing (including third-party materials, images, interviews, embargoes).
5. Visibility / external-AI sharing permissions (not automatically determined by being referenced).

Both shared sources and generated documents must visibly retain independent-proposal status when applicable. Formatting in Japanese legal style is not evidence of enactment or any named organization endorsement.

## 5. Structured writing and multimodal consumption

An initial content AST supports paragraph, heading, list, table, figure, equation, example, notice, and references to audio, video and interactive content. This is deliberately narrower than a general rich-text editor and may be extended after real examples. Text-bearing blocks are authored once in canonical form; modality-specific explanations can be separate adaptations linked to the same claims and source identifiers.

PDF: render Japanese documents through XeLaTeX, with typography and `編・章・節・条・項・号` numbering as a *style profile* only. Site: produce a normalized view model that adds navigation, access-appropriate interaction, history and progress without modifying canonical meaning. Handbooks are curated publications, not simply concatenated task Markdown. Media never becomes a required condition for reading the same core information.

## 6. Templates and operational work

The inventory provides 139 blank placeholders in one global folder. Its catalog IDs identify planning intent and stage applicability. Actual declarative templates will later use distinct `DTPL-*` and `CLD-*` identities and refer to `TPL-DOC-*` / `TPL-CHK-*` entries. Suggested first slice after approval: `TPL-DOC-030` (企画書), `TPL-DOC-046` (取材質問設計表), and `TPL-CHK-002` (科学的事実・根拠確認チェックリスト).

A project may instantiate templates repeatedly, with version-pinned definitions and independent entries. It can also reuse task and knowledge definitions without copying them into the project folder. Project creation may generate `AGENTS.md` / `CLAUDE.md` as minimal context pointers; such files have no independent governing authority and should cite canonical policies.

## 7. Referential integrity and validation

Validation layers (do not conflate):

- **Schema:** shape, required fields and primitive data types.
- **Registry:** global uniqueness, valid references, correct kinds, pinned versions, and template-catalog relations.
- **Semantic:** consistency of stages, prerequisites, checklist item responses, document field values and access classification.
- **Editorial/scientific:** factual verification and accurate language by responsible people.
- **Governance/rights:** approvals, consent, legal applicability, privacy review and release authorization by responsible personnel.

Current v6 code implements **only the first two** for synthetic fixture objects, plus limited item/field consistency. It does not enforce role-based access control, grant permissions, prove signatures, verify science or law, or execute workflow.

## 8. Implementation sequence

- **v6, now:** define entity types and relationships; add JSON Schema design contracts; add synthetic examples and a validator; keep all templates empty and v4 prototype working.
- **Next, review:** settle field types, conditional applicability, Japanese form structure and approval-gate semantics. Adapt schemas based on feedback, create migration plan for v4 samples.
- **Then:** implement three first-priority real templates and their checklist/document instances; no actual legal clearance assertions.
- **Then:** implement task content and handbook assembly, with provenance, LaTeX and site-neutral structured views.
- **Later:** website project management, secure identity/permissions and richer media, with accessibility testing.

## 9. Open decisions (do not silently assume)

- Policy for storing long-form scholarly prose: structured blocks with Markdown strings vs externally versioned Markdown referenced by immutable digest.
- Local identifier/version rules and evolution/migrations for legacy task definitions.
- Conditional form field expression language and repeating tables; avoid unsafe evaluation.
- Exact meaning of approval roles, signature mechanisms and institutional authority.
- Sensitive data storage, retention schedules, consent and external AI restrictions.
- Whether a standard can be promoted to "institutional adopted" only by administrator workflow after documented official source review.
- Fine-grained linking between a claim, a cited study and its representation across different modalities.

All choices above are **proposals for further review**, not a declaration that a working operational platform or official any named organization process already exists.
