# Core — Machine-Readable Operating Definitions

This directory is the small **definition layer** for the independent Operations OS prototype. It is not the project data store and does not establish official any named organization policies.

- `workflows/eight_stage.json` is the **single authoritative list of stage IDs, names, and directory mappings**. The existing stage folder names are deliberately preserved, including typos, to avoid breaking references.
- `schemas/` documents the intended structure of project, stage-instance, and future task-definition records. Schemas are provisional and can evolve with versioned migrations.
- `policies/` holds system-wide operational rules; actual law, external professional guidance, institution-specific rules and our proposals must be labeled with their respective provenance and authority.

**Model:** shared definitions → project-specific instances → immutable or traceable work records → optional site views. A project's recorded definition version must be retained as definitions evolve.

`script/validate_repo.py` runs lightweight structural validation using Python's standard library; it does not constitute full JSON Schema validation, a compliance assessment, or editorial approval.
