# Stage 02 Reusable Task Definitions — 事前調査・資料収集

Each future `tasks/<task-id>/` will define a reusable **task**, not a completed project action.

Recommended files: `task.json` (contract), `procedure.md`, `checklist.md`, and references to applicable standards, ethics, skills and AI prompts. `core/schemas/task_definition.schema.json` is the provisional contract.

Project-specific execution (progress, evidence, completed checks, sign-off and decisions) lives under `projects/<project-id>/stages/02/`, not here. Stage-level `stage.json` identifies this workspace; `core/workflows/eight_stage.json` owns the canonical eight-stage map.

Legacy empty competency-named files are retained unmodified for future inventory or migration.
