> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Object Relationship Map (v6)

```mermaid
flowchart TD
  SR[SourceRecord] --> CL[ClaimRecord]
  CL --> K[KnowledgeEntry: standards / ethics / background]
  CL --> T[TaskDefinition]
  W[Workflow / Stage] --> T[TaskDefinition]
  T --> P[ProcedureDefinition]
  T --> K[KnowledgeEntry: standards / ethics / background]
  T --> DT[DocumentTemplate]
  T --> CD[ChecklistDefinition]
  T --> TR[TaskRun]
  TR --> DI[DocumentInstance]
  TR --> CR[ChecklistRun]
  DI --> DT
  CR --> CD
  TR --> RD[ReviewDecision]
  DI --> RD
  CR --> RD
  PB[PublicationRecipe] --> K
  PB --> P
  PB --> T
  PB --> RA[RenderedArtifact]
  MA[MediaAsset] --> RA
```

**Conceptual edges**, not yet an execution engine. `ReviewDecision` and approval are independent of a completed checklist. Reused definitions are referenced by ID + pinned version.
