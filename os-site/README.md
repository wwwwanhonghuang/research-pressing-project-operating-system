# Operations OS Site — Deferred Design Note

**Status:** Scope memo only. UI and implementation decisions are intentionally deferred.

The website should be an interactive presentation and work-management layer of Operations OS, not the sole source of truth for operational standards.

## Expected purposes

1. **Knowledge presentation:** multimodal, accessible, optionally interactive views of handbooks, SOPs, standards, ethics guidance, checklists and source-linked documents. Readers should be able to choose text or other modalities without being forced to watch video or use an AI interface.
2. **Pipeline navigation:** show the eight-stage reference workflow, task dependencies, standards, context-sensitive AI support, progress and review gates. The workflow may branch, repeat, or omit stages with documented reasons.
3. **Multi-project management:** create projects from templates, manage tasks, ownership, milestones, approvals, and project-specific artifacts; keep histories and evidence/approval trails.
4. **Knowledge reuse:** reference canonical versioned standards and procedures across projects while preserving each project's applied versions and actual decisions.
5. **Trust boundaries:** restrict access to sensitive research, unpublished records and personal information. AI may assist, but must not independently claim verification, grant approval, or publish.

## Deferred questions

- UI/UX, visual identity, front-end framework, hosting, authentication and storage engine.
- Whether documents are generated at build time or served dynamically; desired localization and accessibility implementation.
- Integration with institutional services and collaboration tools, subject to availability and authorization.

See `../design/ARCHITECTURE_MEMO.md` for the proposed logical and folder architecture. Do not start implementing the site before the core project/task/standard data contracts are agreed.

## Documentation organization (architecture update, 2026-10-19)

The site should eventually draw from both **root** `docs/{standards,ethics,sops,handbooks}/` and **stage-level** `pipeline/<stage>/docs/{standards,ethics,sops,handbooks}/`, plus versioned task definitions and project task records. Compiled documents carry provenance and authority labels; actual project status comes from project instances, not handbook text. The website implementation remains deferred.


## v3 data contract note

The future site should read the stage directory/ID map from `../core/workflows/eight_stage.json` and project execution state from `../projects/<project-id>/`. It should not infer task completion or publication permission from directory existence. The `script/` scaffolding is independent of UI implementation.


## Data contract note (v4)

The website remains deferred. A future first reader may consume `build/<publication>.view.json`, not parse TeX/PDF or independently reconstruct standards from scattered Markdown. A future project-management module will require separate authenticated state and permissions; it must not write completion or approval into canonical task definitions. Optional audio/video/visual interpretations should link to source IDs, include transcripts/alt descriptions and preserve human review. The pilot JSON is **not yet a stable public API**.
