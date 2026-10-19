# Operations OS

**An operating system for research-communication work: operational knowledge treated as source code.**

> **Status: experimental prototype (v18, 2026-10-19).** All eight stages of the default workflow exist as *first drafts*. Nothing here is institutionally approved, legally reviewed or ready for operational use. The design is under revision; see [design/DESIGN_REVIEW_v18.md](design/DESIGN_REVIEW_v18.md).

## Abstract · 摘要 · 概要

### English

Operations OS is an experimental operating system for research-communication work. It covers the whole process of explaining research to the public: planning, background research, interviews, writing, verification, approval, publication and correction.

It treats an office's operational knowledge the way software engineering treats source code. Workflows, tasks, procedures, standards, ethics guidance, forms, checklists and AI-assistance rules are each written once, as structured and versioned data. Every handbook, form, web view and other medium is compiled from that single source.

Reusable *definitions* are kept apart from the *records* of what actually happened in a project. Authority and approval are recorded explicitly, never implied by a document's appearance. AI may assist every task, but it never verifies facts, gives consent, approves or publishes; those decisions stay with accountable people. The default workflow is an eight-stage editorial pipeline, and all eight stages exist as first drafts.

### 中文

Operations OS 是一个面向科研传播工作的实验性“业务操作系统”。它覆盖向公众阐释科研成果的完整过程，包括选题策划、背景调研、采访、写作、核查、审批、发布与更正。

它用软件工程对待源代码的方式，对待一个部门的业务知识：工作流程、任务、操作步骤、业务标准、伦理指南、表单、核查清单以及 AI 辅助规则，都以结构化、带版本的数据只编写一次；手册、表单、网页视图及其他媒介形式，全部由这一唯一来源编译生成。

可复用的“定义”与项目中实际发生的“记录”严格分离。权威性与审批状态以数据形式明确记录，而不是由文件的外观来暗示。AI 可以辅助每一项任务，但永远不代替人进行事实核实、同意、审批或发布，这些判断始终由负责的人作出。默认工作流程为八阶段编辑流程，目前八个阶段均已完成初稿。

### 日本語

Operations OS は、研究広報・科学コミュニケーション業務のための実験的な業務OSである。研究成果を社会に伝える一連の業務、すなわち企画、事前調査、取材、執筆、確認、承認、公開及び訂正を対象とする。

組織の業務知識を、ソフトウェア開発がソースコードを扱うのと同じ方法で扱う点に特徴がある。業務工程、タスク、手順、業務標準、倫理指針、様式、チェックリスト及びAI支援の規則は、構造化され版管理されたデータとして一度だけ記述する。ハンドブック、様式、Web表示その他の媒体は、すべてこの単一の正本から生成する。

再利用する「定義」と、個別案件で実際に行われたことの「記録」とを分離する。権限と承認は文書の体裁から推測させず、データとして明示する。AIはあらゆるタスクを補助し得るが、事実の確認、同意、承認及び公開を行うことはなく、これらの判断は責任を負う人が行う。既定の業務工程は8段階の編集工程であり、8段階すべてが第一稿の段階にある。

---

## 1. Background and Problem Statement

Research communication is heavy on documents and on accountability. A single feature article or press release can pass through all of these:

- an editorial proposal and a source register;
- interview requests and consent records;
- quotation checks and a fact-check log;
- specialist reviews, rights clearance and a publication decision;
- months later, possibly, a correction notice.

In most offices, the knowledge of how to do this well lives in three places: people's heads, templates copied from the previous project, and handbooks that start to drift from practice the day they are printed. Three failures recur:

1. **Rules and practice diverge.** Nobody can say which version of a rule a past decision followed.
2. **Appearance stands in for authority.** A neatly formatted guideline is read as an official rule. A ticked checklist is read as an approval.
3. **New tools arrive without boundaries.** Generative AI in particular is adopted without clear limits on what it may see and what it may decide.

Operations OS addresses all three through a single organizing concept.

## 2. Central Concept: Operational Knowledge as Source Code

Operational knowledge is treated the way software engineering treats source code:

- **Authoring.** Each rule, task, procedure and form is written once, as structured data with a permanent identity and a version.
- **Compilation.** Every human-facing document is generated from that source, as a program is compiled.
- **Verification.** The source is checked automatically, as code is tested.
- **History.** Earlier states are retained, as in version control.
- **Execution records.** What happened on a project is stored in separate records, each pointing at the exact versions it followed.

The resulting object model has three layers:

```text
 DEFINITIONS — how work should be done          RECORDS — what actually happened
 (reusable, versioned, never project-specific)  (one project, accumulated, never rewritten)

 workflow ─ stage ─ task ─ procedure            task run
                    ├─ standards / ethics        ├─ filled document
                    ├─ document & checklist      ├─ checklist results + evidence
                    │  templates                 └─ review decision (a named human)
                    └─ AI-assistance rules
          ▲                                               │
          └──────── pinned by {kind, id, version} ────────┘
                               │
              RENDITIONS — generated, never edited by hand
      handbook PDF · form PDF · JSON view · (web · audio · video · interactive)
```

The design principles in Section 3 follow from this concept.

## 3. Design Principles

### 3.1 Single Source of Truth and Derived Renditions

Each piece of knowledge is written once, as structured JSON. These are all generated views of that source:

- the print handbook;
- the blank form and the filled form;
- the web page;
- later, audio, video or interactive explanations.

TeX is kept as the *print rendering* language, not the source. It encodes typography and page order, not the relationships between rules, tasks and evidence that the system needs to check.

*Rationale.* Documents maintained by hand in several formats drift apart; when the PDF and the web page disagree, nobody can tell which is right. A generated document cannot disagree with its source.

### 3.2 Separation of Definitions, Records and Renditions

- A **definition** states how work should be done, and is reused across projects.
- A **record** states what was actually done on one project, by whom, and with what evidence.
- A **rendition** is a generated view of either.

*Rationale.* Most of the familiar failures come from mixing these. A template edited to fit one case changes the rule for everyone. A completed checklist overwritten the next year erases the audit trail. A PDF becomes the only surviving copy of a decision. Keeping the three apart lets the rules evolve while the past stays intact.

### 3.3 Immutable Versioning and Reproducible Builds

- Every object has a permanent ID and an immutable version.
- Every reference names both: `{kind, id, version}`.
- A build stops if any reference cannot be resolved *exactly*.
- Each build writes a manifest of SHA-256 hashes covering every input, the print style and the renderer itself.

*Rationale.* A project decided under last year's standard must stay interpretable under that standard. Replacing a rule must never silently rewrite the reasoning behind an earlier decision. Failing closed is safer than guessing.

### 3.4 Explicit Representation of Authority

Every object declares three properties:

- **origin:** independent proposal, external source, or institutional adoption;
- **normative class:** law, regulation, institutional policy, professional guidance, operational proposal, or information;
- **institutional approval:** whether any institution has actually approved it.

These are kept separate from the object's lifecycle, from permission to publish, and from permission to share it with external AI.

*Rationale.* A document set in Japanese legislative style (第1条、第2項…) looks binding. A draft guideline, a professional body's recommendation and an enacted law must not be confused because they look alike. Legal-style numbering is a presentation choice; it never gives a text legal force.

### 3.5 Human Accountability for Decisions

- A completed checklist is an **observation**, not an approval.
- An approval is a **separate record** made by a named person, stating its scope and conditions.
- The inspection scripts check whether a review record is *documentarily complete*. Their strongest possible result is "complete, human authority unverified". They cannot return "approved", and the tests ensure they never will.

*Rationale.* The judgments in research communication have real consequences for researchers, interviewees and the public: scientific accuracy, consent, rights, privacy, embargo timing, and the decision to publish or correct. They must remain with accountable people, and a completion mark must never stand in for one.

### 3.6 Bounded, Task-Local AI Assistance

Every task carries its own AI-assistance prompt. The prompt states:

- what the AI may help with;
- what material it may receive;
- what it must keep apart (confirmed facts, unconfirmed points, speculation);
- which person checks its output.

AI never confirms facts, infers consent, clears rights, approves or publishes. Sensitive material reaches external AI services only with authorization. Agent instruction files (`AGENTS.md`, `CLAUDE.md`) are meant to be generated from one source, not copied by hand into every folder.

*Rationale.* AI is most useful *inside* specific tasks, such as drafting interview questions, checking numbers against sources or flagging gaps. It is most hazardous when its fluent output is taken as verification. Placing the boundaries next to each task makes them concrete; generating the instruction files keeps them consistent.

### 3.7 Epistemic Differentiation of Claims

The standards distinguish six kinds of statement:

- observed fact;
- inference from analysis;
- causal interpretation;
- hypothesis;
- application outlook;
- long-term goal.

They also require uncertainty to be carried from stage to stage, not smoothed away.

*Rationale.* The central risk in science communication is not typographical error but overstatement: a correlation reported as a cause, an animal study as a cure, a research goal as a result. The system treats this distinction as an operational requirement, not a matter of style.

### 3.8 Editorial Composition by Reference

A stage handbook is a **recipe**, an editorial plan with two parts:

- the version-pinned tasks, procedures, standards, ethics entries and checklists it includes, each selected by reference;
- bridging text written for the reader.

*Rationale.* A good handbook is written for a reader, not assembled by concatenating files, yet it must not become a second, diverging copy of the rules. Composition by reference gives editorial freedom while keeping one source.

### 3.9 Non-Linear Workflow with Recorded Deviation

- The eight stages are the default map of editorial work. Stages may overlap, repeat or return to an earlier stage; for example, a specialist review can send a claim back to source research.
- A stage can be omitted, provided the record states who agreed and why.
- The eight-stage workflow is a *preset*. A six-stage generic preset shows that the machinery is independent of editorial work.

*Rationale.* Real work iterates. A system that forces a linear sequence gets bypassed; a system that records the loops keeps its history honest.

### 3.10 Optional Multimodality with Traceable Equivalence

- Readers choose among print, web, plain text, audio and visual explanation. No reader is forced into one medium, and each medium has an accessible alternative.
- Every rendition keeps links to the same claims and sources. A shortened social-media post or a narrated video therefore cannot quietly drop a qualification.

*Rationale.* Audiences differ in needs and abilities. Moving content between media is also where scientific meaning is most easily lost, so the equivalence has to be traceable.

### 3.11 Typographic Restraint

Print output is monochrome, set in Mincho type on A4, with plain numbered headings and no decorative boxes, shading or colour.

*Rationale.* This follows the conventions of formal Japanese administrative and scholarly documents. It prints and photocopies faithfully, and keeps attention on the content. Appearance is controlled centrally by two style files, so changing it never touches content.

### 3.12 Transparent Status and Additive Evolution

- Every object states what it is: a draft, an independent proposal, not institutionally approved.
- Earlier versions are archived, not overwritten.
- Legacy layers are marked, not deleted.

*Rationale.* A system built around accountability must be accountable about itself. Overstating its own maturity would undermine the principle it exists to serve.

## 4. Implementation Status of the Principles

| Principle | State in v18 |
|---|---|
| 3.1 Single source of truth | **Print: done.** 139 forms and 8 handbooks are generated from JSON, and JSON views are exported. HTML, audio and video renderers are planned. |
| 3.2 Separation of definitions, records, renditions | **Definitions and renditions: done.** Record schemas exist (task runs, checklist runs, review decisions), but the project execution layer is still a scaffold. |
| 3.3 Immutable versioning | **Done:** pinned references, fail-closed builds, SHA-256 manifests, archived versions. Historical versions can be looked up only for checklists so far. |
| 3.4 Explicit authority | **Done** on every object. Clause-level authority for legal-style documents is planned. |
| 3.5 Human accountability | **Done.** The Stage 6–8 inspectors can never authorize anything, and tests enforce this. |
| 3.6 Bounded AI assistance | **Partial.** There is one prompt per task (78 in all). Structured AI definitions and generated per-stage agent files are planned. |
| 3.7 Epistemic differentiation | **Built in** to the standards and checklists of all eight stages (first drafts). |
| 3.8 Composition by reference | **Done:** one recipe per stage. Sharing one standard across several stages is planned; entries are currently stage-local. |
| 3.9 Non-linear workflow | **Done:** workflow presets with rework rules. An explicit task-dependency graph is planned. |
| 3.10 Multimodality | **Partial:** print and neutral JSON today; other media are planned. |
| 3.11 Typographic restraint | **Done** in two central TeX styles. |
| 3.12 Transparent status | **Done:** every object and output carries its draft / unapproved status. |

[design/DESIGN_REVIEW_v18.md](design/DESIGN_REVIEW_v18.md) analyses the remaining gaps and proposes revisions.

## 5. Scope and Non-Goals

- **Publication:** it never publishes anything.
- **Approval:** it records and checks; people approve.
- **Legal compliance:** it cites legal and professional sources but does not establish that they apply. It is not legal advice or compliance certification.
- **Institutional status:** it is not any organization's official procedure. It is an independent, general-purpose proposal that an organization would have to review and adopt itself.
- **Professional judgment:** checklists and AI support that judgment; they never replace it.

---

## 6. Reference Workflow: Eight Editorial Stages

| ID | Stage | Focus | Tasks |
|---|---|---|---:|
| 01 | 企画・編集方針 — Planning and editorial direction | Topic, audience, editorial purpose | 6 |
| 02 | 事前調査・資料収集 — Preliminary research and source collection | Primary sources, context, evidence | 8 |
| 03 | 取材・追加確認 — Interviews and reporting | Interviews, verification of statements | 9 |
| 04 | 構成・執筆 — Structure and writing | Story architecture, drafts, figures, multimodal plans | 9 |
| 05 | 編集・校正・校閲 — Editing, proofreading and fact-checking | Structural edit, copyedit, claim audit | 9 |
| 06 | 専門確認・公開承認 — Expert review and release approval | Scientific review, rights, privacy, accountable authorization | 13 |
| 07 | 公開・配信 — Publication and distribution | Release, accessibility, channels, post-release checks | 12 |
| 08 | 訂正・評価・アーカイブ — Corrections, evaluation and archive | Corrections, evaluation, fixity, learning | 12 |

Each stage provides:

- tasks, each with a procedure and acceptance criteria;
- the standards and ethics entries that apply;
- the forms and checklists it uses;
- an AI-assistance prompt for each task;
- a review gate;
- a compiled stage handbook.

## 7. Build Pipeline

```text
JSON definitions ─► schema + reference validation ─► recipe / template resolution (pinned versions)
                 ─► escaped TeX + SHA-256 manifest + JSON view ─► XeLaTeX ─► PDF
```

- **Meaning and structure** change in the JSON. A semantic change bumps the version, and the previous version is archived.
- **Print appearance** changes in `templates/tex/*.sty`.
- **Generated output** under `build/` is never edited by hand. It is regenerated.

All text passes through an escaping function, so content can never run as TeX code.

## 8. Repository Structure

| Item | Count | Location |
|---|---:|---|
| Document / checklist templates | 94 / 45 | `content/templates/` |
| Tasks / procedures | 78 / 78 | `content/operational/stage_0N/{tasks,procedures}/` |
| Standards and ethics entries | 94 | `content/operational/stage_0N/knowledge/` |
| Handbook recipes | 8 | `content/operational/stage_0N/recipes/` |
| AI-assistance prompts | 78 | `pipeline/<stage>/AI_ASSIST/common_prompts/` |
| Generated handbooks / forms | 8 / 139 | `build/handbooks/`, `build/tex/` |
| Automated tests | 77 | `tests/` |

```text
core/        workflow presets, canonical object schemas, accountability policies
content/     canonical definitions: templates, per-stage operational objects, version archives
pipeline/    per-stage descriptors, AI-assistance prompts, compiled document copies
templates/   template catalog and the two print styles
script/      validators, renderers, compiler, project initializer, documentary inspectors
tests/       regression tests and synthetic fixtures
build/       generated TeX, PDF, JSON views and provenance manifests (never edit)
design/      design notes and decisions; start with DESIGN_REVIEW_v18.md
projects/    project instances (git-ignored; may contain confidential material)
os-site/     scope note for the future website
```

## 9. Installation and Usage

**Requirements:**
- Python 3.10+ with `jsonschema`.
- GNU Make.
- For PDFs only: XeLaTeX with `fontspec`, `xeCJK`, `geometry`, `tabularx`, `needspace`, `fancyhdr`, `enumitem`, `titlesec` and `hyperref`, plus the fonts Noto Serif and Noto Serif CJK JP.

```bash
pip install jsonschema
make test                                  # validators + 77 regression tests
make stage-01-handbook                     # … through stage-08-handbook: JSON → TeX → PDF
make pdf IDS="TPL-DOC-030 TPL-CHK-002"     # generate and compile selected forms
make sample                                # eight representative forms
make view                                  # presentation-neutral JSON views
```

**Windows:** run the toolchain inside WSL. If your WSL `python3` lacks `jsonschema`, pass one that has it: `make test PYTHON=/usr/bin/python3`.

A **synthetic** filled document, and a project workspace (all stages start `not_started`; nothing is completed or approved):

```bash
python3 script/generate_tex.py --ids TPL-DOC-030 \
  --instance content/examples/synthetic_editorial_proposal.json --output build/example
python3 script/compile_pdf.py --ids TPL-DOC-030 --tex-dir build/example
python3 script/init_project.py example-editorial --title '編集企画例'
```

## 10. Current Limitations and Release History

- **Content maturity:** all content is a first draft. It is structurally complete but substantively unreviewed, and needs domain, editorial, ethical and case-specific legal review before any real use.
- **Execution layer:** project execution is a scaffold.
- **Security:** there is no access control, identity, signature or secure storage. Do not put real personal, unpublished, interview or embargoed material in this repository.
- **Media:** the website and the HTML, audio and video renditions are deferred.

| Version | Milestone |
|---|---|
| v3–v8 | Scaffold, structured-first pilot, template inventory, canonical model, monochrome Mincho print prototypes |
| v9 | General-purpose, organization-neutral identity; 139 structured templates; TeX/PDF pipeline |
| v10–v13 | Stages 1–4: first substantive drafts ([v10](RELEASE_NOTES_v10.md), [v11](RELEASE_NOTES_v11.md), [v12](RELEASE_NOTES_v12.md), [v13](RELEASE_NOTES_v13.md)) |
| v14 | Stage 5: editing, proofreading and fact-checking |
| v15–v16 | Stage 6: specialist review and documentary release gate ([v16](RELEASE_NOTES_v16.md)) |
| v17 | Stage 7: publication and distribution ([v17](RELEASE_NOTES_v17.md)) |
| v18 | Stage 8: corrections, evaluation and archive; all eight stages at first draft ([v18](RELEASE_NOTES_v18.md)) |

## 11. Contribution Guidelines

Contributors and AI agents should read [CLAUDE.md](CLAUDE.md) before making changes. It covers the location of canonical sources, the invariants enforced by the tests, and the change procedure.

## 12. License

The repository is licensed in two parts, by content type:

- **Code: [MIT](LICENSE).** Covers `script/`, `tests/` (including fixtures), `Makefile`, `templates/tex/*.sty`, and every `*.schema.json`.
- **Documents and content: [CC BY-NC 4.0](LICENSE-CC-BY-NC-4.0.txt).** Covers everything else, including `content/`, `pipeline/`, `core/workflows/`, `design/`, `docs/`, `templates/catalog.json`, the AI-assistance prompts, and the generated TeX, PDF and JSON under `build/`.

External works cited by URL are not redistributed here, and remain under their owners' terms.

## 13. Disclaimer

This is an independent design prototype. It implies no affiliation with, or endorsement by, any organization, and it is not legal advice. A valid schema, a compiled PDF or a fully checked checklist never establishes that content is accurate, lawful, rights-cleared or approved for publication.
