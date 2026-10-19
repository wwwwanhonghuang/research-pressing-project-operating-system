> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Operations OS — Repository Structure (v3)

**As packaged:** 2026-10-19. `core/` and `script/` are newly present in this archive. Existing eight stage folder names and original competency placeholders are retained unchanged. None of the existing official source documents has been represented as any named organization-approved.

```text
operations-os/
├── README.md
├── core/
│   ├── workflows/eight_stage.json     # Single stage-ID and directory map
│   ├── schemas/                      # Provisional machine-readable contracts
│   └── policies/                     # Prototype-wide accountability rules
├── pipeline/
│   ├── Readme.md                     # Original Japanese eight-stage overview
│   └── <one of eight existing stage folders>/
│       ├── stage.json                # Objective and version/ID
│       ├── tasks/                    # Reusable task definitions (not yet authored)
│       ├── AI_ASSIST/                # Stage instructions/prompts (scaffold)
│       ├── docs/
│       │   ├── standards/
│       │   ├── ethics/
│       │   ├── sops/
│       │   └── handbooks/
│       └── [legacy competency-named placeholders]
├── standards/                        # Canonical shared sources
├── ethics/                           # Canonical shared sources
├── competencies/                     # Cross-stage knowledge/skills
├── AI_ASSIST/                         # Shared AI prompt template/policy references
├── docs/                              # Shared readable/compiled material
│   ├── standards/
│   ├── ethics/
│   ├── sops/
│   └── handbooks/
├── templates/                         # Planned template library
├── projects/                          # Real project instances (empty in archive)
├── script/
│   ├── README.md
│   ├── init_project.py              # Functional initializer (tested)
│   └── validate_repo.py             # Structural consistency check (tested)
├── operations-os-site/                 # Website scope only; implementation deferred
└── design/                            # Architectural documentation
```

**Executed smoke tests:** validator passed with zero projects; initializer generated a temporary project with eight stage folders; validator passed with the new project; temporary project was removed; validator passed again. The scripts require only Python 3 and do not validate legal or editorial requirements.

## Definitions versus records

`core/` and `pipeline/` govern reusable definitions; `standards/` and `ethics/` are canonical shared editable references. `docs/` and stage `docs/` offer context-appropriate human-readable outputs. `projects/` stores actual state, progress, completed checks, source evidence, permissions and human decisions. `AI_ASSIST/` suggests bounded assistance; it has no release authority. `operations-os-site/` will eventually display and manage these resources.

Workflow transitions, task execution, actual review gates, access control, approvals and document compilation are **not yet implemented**. The repository is a tested scaffold for further design and learning.

## v4 additions — structured knowledge and compositions

```text
core/schemas/knowledge_entry.schema.json
core/schemas/document_recipe.schema.json
standards/STD-SOURCE-TRACEABILITY/entry.json
ethics/ETH-REPRESENTATION/entry.json
pipeline/2_Presurvery_And_Precollection_Of_Data/tasks/source_claim_register/
    task.json
    procedure.json
    checklist.json
publications/stage-02-handbook.json
script/build_documents.py
script/validate_content.py
pipeline/2_.../docs/handbooks/stage-02-handbook.{md,tex}
build/stage-02-handbook.{view,provenance}.json
```

`publications/` is the editable document-composition layer. `build/` is derived neutral-view/provenance data, and `docs/` contains human-readable outputs. Existing folders are preserved. `operations-os-site/` may later read the normalized view after a security and rendering design review.

## v5 addition — global templates and checklist inventory

```text
templates/
├── README.md
├── CATALOG.md
├── catalog.json
├── documents/
│   ├── shared/
│   ├── stage_01/ ... stage_08/
├── checklists/
│   ├── shared/
│   ├── stage_01/ ... stage_08/
├── project/                     # preserved
└── docs/                        # preserved
```

Every new `.md` template is an empty placeholder. `templates/catalog.json` supplies provisional identifiers, Japanese titles, scope, applicable pipeline stages and intended use. Future template instances belong in `projects/`. Source content, publication recipes and rendered files remain separate.

**Packaging note (v5):** empty root and stage-specific `docs/` folders require `.gitkeep` so extracted archives preserve the intended output destinations and pass the structural validator.
