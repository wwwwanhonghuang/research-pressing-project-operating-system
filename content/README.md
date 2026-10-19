# Structured content

`templates/` contains 139 versioned JSON definitions. A file's `id` remains stable across edits; a semantic change should increment its `version`, with completed project instances retaining the definition version used.

`schemas/` contains draft JSON Schemas for template definitions, project-specific instances and rich content blocks. Older `core/model/v1` schemas represent the wider record graph and are kept as reference until a formally reviewed migration.

`examples/` contains synthetic examples, which must never be interpreted as actual interviews, permission, factual verification or publication approval.

The field types currently rendered into TeX are `short_text`, `long_text`, `date`, `choice`, and `table`. A rich-text instance can additionally carry `content_blocks`. A semantically typed media or equation block can be stored but its specialized renderer and validation are still to be developed.

## Invariants

- Every template has a stable ID, version, authority state, **workflow ID**, and stage applicability within that workflow.
- Every field and checklist item has an ID suitable for project data and audit logs.
- Every checklist item has four independent states: 未確認, 適合, 不適合, 対象外. Evidence is expected for statuses other than 未確認.
- A completed checklist does not grant authorization. Only an authorized human review decision can do that.
- Project instance content and secret material should not be submitted to an external AI service merely because a local agent knows the file path.
