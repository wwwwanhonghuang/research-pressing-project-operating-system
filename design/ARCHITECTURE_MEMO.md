> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Operations OS — Architecture Discussion Memo

**Status:** Evolving design memo; `docs/` taxonomy accepted, other architectural elements provisional  
**Date:** 2026-10-19  
**Context:** Independent prototype for research communication and editorial workflows. The name "Operations OS" does not imply an official any named organization product or approval.

## 0. Current repository observation

The uploaded archive currently contains eight numbered folders under `pipeline/`, a separate `operations-os-site/`, and `templates/docs/pipeline_handbook/`. Each pipeline folder contains `AI_ASSIST/Agent_Support/`, `AI_ASSIST/common_prompts/` and `docs/`. Some competency names appear as empty entries in multiple stage folders. Nearly all directory entries are placeholders; `pipeline/Readme.md` currently describes the eight stages.

The most important issue is **not website layout**. It is establishing the identity, authority, and lifecycle of reusable guidance versus actual project work.

## 1. Conceptual model

| Concept | Meaning | Example | Owns / maintains |
|---|---|---|---|
| Pipeline definition | A reusable workflow, stage order, dependencies, and quality gates | Eight-stage science feature workflow | Stage requirements and gate rules |
| Stage | A phase/workspace within that workflow | `02_事前調査・資料収集` | Stage objective, tasks, expected outputs |
| Task definition | A reusable unit of work with inputs, steps, and acceptance criteria | `prepare-source-register` | Checklist, how-to, standard/ethics references |
| Competency | A skill required to perform tasks, not itself a task | `1.1 Evidence-grounded claim checking` | Learning material and proficiency assessment |
| Standard/policy | A versioned, cross-cutting normative or technical reference | Scientific evidence policy, quotations, privacy, editorial style | Rules and exception conditions |
| Project | A specific research communication undertaking | A particular researcher interview feature | Schedule, team, roles, outcomes |
| Task instance | One project's performance of one task | Source register for Feature ABC | Status, assignee, evidence, comments, sign-off |
| Artifact/record | Source, draft, interview permission, review decision, published output | `sources.csv`, `draft-v03.md`, `approval.json` | Provenance and permissions |
| AI assistance definition | Suggested bounded, auditable AI support for a task | Draft interview questions; check numerical consistency | Prompts, safeguards, input/output rules |
| OS site | Presentation/interaction layer across these concepts | Handbook viewer and project dashboard | UI; should not be the only repository of authoritative rules |

**Design rule:** stage folders can organize *how work is done*. Reusable rules and competencies need a canonical home. Projects store *what actually happened*. AI is subordinate to human editorial and institutional responsibility.

### 1.1 Competency is not a task

Competency `1.1 Scientific fact checking` supports at least three distinct tasks:

- Stage 02: collect primary sources and create a claim/evidence register;
- Stage 05: check every material statement of a draft against evidence;
- Stage 08: investigate a reported error and issue a correction record.

Rather than duplicate the entire `1.1` learning content into every stage, stage tasks should **reference** a canonical competency and relevant standards. The stages each have their own task-specific checklists.

## 2. Suggested repository organization (target model, not yet applied)

```text
operations-os/
├── design/
│   ├── ARCHITECTURE_MEMO.md
│   ├── REPOSITORY_STRUCTURE.md
│   ├── DECISIONS_AND_OPEN_QUESTIONS.md
│   └── COMPETENCY_STAGE_MAP.md
├── standards/                       # Editable, canonical shared standard sources
├── ethics/                          # Editable, canonical shared ethics sources
├── competencies/                    # Reusable skills and learning objectives
├── docs/                            # Compiled shared documentation
│   ├── standards/
│   ├── ethics/
│   ├── sops/
│   └── handbooks/
├── pipeline/
│   ├── Readme.md                    # Existing eight-stage overview
│   ├── 1_Project_Design_and_Edtorial_Principles/
│   │   ├── tasks/                    # Planned reusable task definitions
│   │   │   └── <task_id>/           # Future: task.yaml, procedure.md, checklist.md
│   │   ├── AI_ASSIST/
│   │   │   ├── Agent_Support/
│   │   │   └── common_prompts/
│   │   ├── docs/                     # Compiled docs for this stage
│   │   │   ├── standards/
│   │   │   ├── ethics/
│   │   │   ├── sops/
│   │   │   └── handbooks/
│   │   └── [legacy empty competency placeholders]
│   ├── 2_Presurvery_And_Precollection_Of_Data/
│   ├── 3_Interview_And_Additional_Confirmation/
│   ├── 4_Structuring_And_Writing/
│   ├── 5_Edit_Proofreading_And_Corrections/
│   ├── 6_Fact_And_Scientific_Review_And_Approval_For_Publication/
│   ├── 7_Publication_And_Dissemination/
│   └── 8_Correction_Evaluation_And_Archieve/
│       # Stages 2–8 use the same tasks/, AI_ASSIST/, docs/ pattern.
├── templates/
│   ├── project/                     # Planned project + AI-context templates
│   └── docs/pipeline_handbook/     # Existing handbook template placeholder
├── projects/                        # Planned project instances, none created
└── operations-os-site/                # Scope recorded; implementation deferred
```


This is a *conceptual target*, not a demand to rename existing folders immediately. Your eight stage folders and `AI_ASSIST` structure can remain. A migration can be incremental.

## 3. What belongs inside one stage folder?

A stage should contain:

1. A **stage definition**: purpose, entry conditions, exit criteria, inputs, outputs, permitted skips/rework, responsible roles.
2. An **inventory of tasks**: each task owns its procedure, task checklist, expected artifacts, evidence requirements, and links to applicable standards and ethics.
3. **AI assistance for its tasks**: prompt templates and agent instructions, each mapped to a real task, with clear limitations.
4. A **four-part `docs/` library**: compiled `standards/`, `ethics/`, `sops/`, and `handbooks/` assembled from approved and versioned canonical sources.

### Example task contract

```yaml
schema_version: 1
id: source-register
version: 0.1.0
stage_id: "02"
title_ja: 一次資料の収集と根拠一覧の作成
competencies: ["1.1"]
inputs: [editorial_brief]
outputs: [source_register, claim_evidence_map]
procedure: procedure.md
checklist: checklist.md
standard_refs: [scientific_evidence, quotation_attribution]
ethics_refs: [research_participant_privacy]
review_roles: [editor]
requires_human_approval: false
ai_assist_refs: ["source-list-triage"]
acceptance_criteria:
  - Every material claim has a traceable source or is marked unresolved.
  - Evidence status and uncertainty are recorded.
```

A **checklist definition** is reusable. A **completed checklist** is specific to one project and must include who checked it, when, supporting evidence, and exceptional decisions. Checkboxes alone do not prove a review happened.

## 4. Where standards, ethics, and handbooks should live

### Canonical and referenced, not duplicated

- `standards/` and `ethics/` contain editable canonical cross-stage references, with document IDs and versions.
- The task definition specifies **which** requirements apply and **how** they are operationalized.
- The stage handbook collects relevant content for human reading, but is a **compiled view** rather than an independent source of truth.
- Public professional guidance, laws, internal institutional rules, and our proposed practices must be marked with their distinct authority. Never describe our draft checklists as verified any named organization regulations.
- Record a policy's effective/review date and source link; later revisions should not silently change the rationale for an earlier project decision.

**Updated decision (2026-10-19):** `docs/` contains **explicitly named subfolders** for compiled documents: `standards/`, `ethics/`, `sops/`, and `handbooks/`. These exist at the **root** (`docs/`) and **inside every pipeline stage** (`pipeline/<stage>/docs/`). This is an accepted organizational choice, reflected by new directories in the zip, although the substantive content has not yet been produced.

- Root `docs/`: compiled cross-stage standards, ethics, SOPs, and integrated handbooks.
- Stage `docs/`: compiled stage-specific standards, ethics, SOPs, and handbooks.
- Root `standards/` and `ethics/`: versioned **editable canonical sources** rather than competing duplicate compilations.
- Stage `tasks/<task_id>/procedure.md` and `checklist.md`: editable operational instructions and task-specific checklists; compiled SOPs and handbooks may assemble them.
- `templates/docs/pipeline_handbook/`: handbook generation/layout template.
- Each compiled document should include provenance (`source_id`, `source_version`, applicable stage(s), revision/approval status) and link to canonical sources. A shared policy reused by multiple stages should have a single authoritative source, with stage-specific excerpts or references as appropriate.

**In other words: `docs/standards/` is desired even though `standards/` also exists.** They serve different functions (compiled document library versus editable standards source). The same principle applies to ethics.

## 5. AI_ASSIST and AGENTS.md / CLAUDE.md

Keep AI assistance close to the work, as you propose, but separate:

- **Capability description**: what an AI could usefully assist with (e.g. summarize source comparisons).
- **Prompt template**: user-facing instructions and expected input/output format.
- **Agent rules**: boundaries, data permissions, provenance, mandatory verification, escalation.
- **Execution record**: if AI was used in a live project, what material was provided, which prompt/version and model/tool were used (when known), and what human verified.

### Project instantiation policy

On project creation, it is reasonable to generate a project `AGENTS.md`, an optional `CLAUDE.md`, and stage-specific context files. **Do not duplicate an entire instruction manual eight times.** Generate short adapters pointing to canonical instructions and local context, or generate from a single source so updates can be validated. This avoids conflicting agent rules.

- A project-level file defines project context, audience, confidentiality, and permitted tools.
- A stage-level adapter indicates the stage objective, linked tasks, relevant standards, and current state.
- `AGENTS.md` and `CLAUDE.md` can share one canonical policy but may require format differences depending on the agent runtime. Treat them as tool-facing instructions, not a substitute for workflow state.
- AI cannot substitute for source verification, permission to use restricted interview materials, human scientific review, or publication authorization. Keep publish/approve actions behind human gates.
- Untrusted documents and web pages must be treated as evidence, not instructions to the agent. Protect unpublished materials, personal data, embargoes, and confidential interviews; require explicit approved data handling before sending materials to external AI services.

### Example prompt metadata

```yaml
id: check-claim-to-source
applies_to_tasks: [source-register, draft-claim-audit]
input_sensitivity: internal_or_public_only
output: table_with_claim_source_location_status_uncertainty
human_verification: mandatory
may_publish: false
```

## 6. Project creation, lifecycle, and gates

A new project should **reference a pipeline template** and instantiate only its operational records. Possible classes include research feature, press release, multimedia explainer and event report. The full eight-stage workflow is a default, not a rigid assumption: for example, not every project requires a newly conducted interview. If a stage is skipped or modified, record who agreed and why.

Suggested project creation steps:

1. Choose project type, working title, intended audience, editorial owner, and confidentiality category.
2. Select a versioned workflow template and applicable standards/ethics revisions.
3. Create a manifest, project-wide artifact/record spaces, and a workspace for each applicable stage.
4. Instantiate task checklists from reusable definitions; link each task to its canonical version.
5. Generate lightweight project and stage agent instructions from one trusted template, if AI support is enabled.
6. Record actual assignees, milestones, dependencies, and review authorities.

Potential task statuses: `not_started`, `in_progress`, `blocked`, `ready_for_review`, `changes_requested`, `completed`, `waived`. Stage exit should be computed from required task outcomes and documented reviews; **a green checkbox is not institutional approval**.

Publishing should have an explicit authorization gate. Later corrections must be able to reopen earlier tasks, supersede artifacts and retain the approved original history. The workflow is therefore a directed process with loops, not merely a fixed straight line.

### Example project manifest

```yaml
schema_version: 1
project_id: feature_2026_001
project_type: researcher_feature
working_title: Sample interview feature
pipeline_id: science_feature_8_stage
pipeline_version: 0.1.0
standards_snapshot: 2026-10-19
editorial_owner: unassigned
confidentiality: internal
current_stage_ids: ["02", "03"]
publication_authorized: false
```

## 7. OS site: recorded requirements, implementation deferred

`operations-os-site/` should ultimately provide:

- Interactive navigation of handbooks, standards, ethics and SOPs; multimodal documents and linked sources, with accessible text alternatives.
- A multi-project registry and per-project dashboards (stage progress, task checklists, dependencies, deadlines, ownership, approvals).
- Task-level contextual guidance: procedure + standards + relevant ethical considerations + AI assistance + related records in one place.
- Review workflows, status and revision history, provenance and cross-project learning without leaking private materials.

For now, **do not select a framework or data store on the basis of visual design**. A file-first source-of-truth with a small manifest/schema could be enough for initial work. Later the website can read a structured index or database as needed. Website layouts, interactions and technology choices should be a separate discussion.

## 8. Three distinctions to settle before implementation

1. **Policy vs guidance.** What is mandatory (and who authorizes exceptions), what is recommended, and what is training material? Mark authority and source.
2. **Template vs instance.** Templates define tasks and checklists. A project's executed work stores decisions, evidence and completed checklists; no duplication of canonical guidance.
3. **Training OS vs live operations.** Early pilot data can be simulated; actual any named organization or partner research projects require permission, appropriate confidentiality controls, and institution-specific operating rules. This project is not an official any named organization system.

## 9. Migration / next design steps

No changes to existing stage folders are necessary yet. Next proposed steps:

- **A.** Agree on the entity model: pipeline, stage, task definition, standard, project, task instance, artifact, review record, agent assistance.
- **B.** Prototype a single task (e.g. Stage 02 source register) with `task.yaml`, procedure, checklist and source/standard links.
- **C.** Instantiate one sample project and execute that task manually, saving a completed evidence-linked checklist.
- **D.** Test one revision loop (Stage 06 returns a claim to Stage 02 / Stage 05), then determine which rules merit automation.
- **E.** Only afterwards design navigation and project management in `operations-os-site`.

### Repository observations for future cleanup (not modified)

The existing folder names contain probable typos (`Edtorial`, `Presurvery`, `Archieve`). Some stage folders also contain repeated empty competency titles, sometimes under variants of the same name. Prefer canonical identifiers and links, and rename directories in one deliberate migration before references proliferate.

**Proposed first architectural decision:** Stage-centered workspaces, with canonical cross-stage standards/ethics and competencies, reusable task definitions, and project-specific task instances. This retains the clarity of your current approach while making multi-project management and AI assistance viable.

## 10. Notes from the competency mapping discussion

The first learning domain contains eight competencies: evidence checking (1.1), article architecture (1.2), accessible technical Japanese (1.3), copyediting and fact-checking (1.4), quotation integrity (1.5), review/version control (1.6), audience-sensitive formats (1.7), and an editorial stylebook (1.8). The same competency can participate in many of the eight stages. Competency-to-stage coverage is recorded separately in `design/COMPETENCY_STAGE_MAP.md`. Do not make a competency folder synonymous with a task; stage-specific actions differ.

## 11. What has actually changed in this revision

The archive now contains real **directory scaffolding** for root and stage `docs/{standards,ethics,sops,handbooks}/`, plus stage `tasks/` placeholders, shared source-library placeholders, and a `projects/` placeholder. The original stage names, empty competency files, `AI_ASSIST/` and `templates/` are preserved. **No actual standards, finalized SOPs, approved ethical policies, working automation, or OS website have been implemented.**


## 12. Architecture revision v3 — implemented prototype shell (2026-10-19)

The v2 structure was refined into a **thin operating layer** while preserving the original eight stage names and original files. Previously proposed items such as a project initializer are now partly implemented.

- `core/workflows/eight_stage.json` is the authoritative stage directory map (IDs `01`–`08`), with initial notes on iteration and mandatory human publication authorization.
- `core/schemas/` defines provisional JSON Schema contracts for project instances, stage instances and future task definitions. `core/policies/HUMAN_ACCOUNTABILITY.md` sets prototype accountability boundaries.
- Each stage now has `stage.json` and retains `tasks/`, `AI_ASSIST/` and `docs/{standards,ethics,sops,handbooks}/`. Task definitions are not populated yet.
- Root `AI_ASSIST/` holds shared AI constraints and prompt drafting guidance, while stage-specific AI material stays close to the stage. Agent entrypoint files generated by the initializer reference these rules.
- Root `script/init_project.py` creates a project from the workflow, initializing empty evidence/approval folders and eight project-stage statuses. `script/validate_repo.py` checks directory and manifest consistency. Both scripts were smoke-tested with a temporary project, subsequently removed.
- Root and stage `docs/` keep your requested four-folder taxonomy. Version, source ID and authority remain necessary metadata for all substantive compiled or approved documents.

**Deliberate limitation:** no task engine, signed approvals, document compiler, website, persistence database, authorization/access controls or official any named organization workflow certification has been implemented. A `stage.json` gate label indicates intended process design, not a running gate or completed scientific review. Future development should validate a single end-to-end task before scaling automation.
