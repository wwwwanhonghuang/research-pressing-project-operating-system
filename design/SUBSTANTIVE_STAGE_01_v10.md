# Stage 1 substantive implementation (v10)

Date: 2026-10-19  
Status: independent proposed operational guidance; not legally or institutionally approved

## Implemented

Stage 1 (企画・編集方針) now has six versioned task definitions and six corresponding step-by-step procedure objects under `content/operational/stage_01/`. Five independent knowledge entries cover traceability, scientific claim boundaries, audience/media accessibility, editorial selection bias, and independence/conflicts/rights. Their editorial status is **draft** and normative authority is explicitly an **independent proposal**.

Seven stage-specific document definitions (`TPL-DOC-030` to `036`) were upgraded to v0.2.0 with individual field guidance. Three stage-specific checklists (`TPL-CHK-015` to `017`) were upgraded to v0.2.0 with evidence-oriented criteria. Existing ID values were preserved and downstream task references were version-pinned accordingly. The synthetic proposal example was migrated to the newer template version.

A publication recipe at `content/operational/stage_01/recipes/PUB-PLN-HANDBOOK.json` assembles the five knowledge entries, six task definitions, six procedures, three checklists and bridging context into a Stage 1 handbook. `script/compose_handbook.py` resolves referenced objects, validates their declared schemas and exact versions, safely renders XeLaTeX, exports a website-neutral JSON view, and produces SHA-256 source hashes. It can use a different operational stage base when supplied another recipe path. It never grants publication approval.

## Scope/authority distinctions

- Journalism and science communication reference materials supply **external professional guidance**; OS SOP requirements are the authors' **independent operational proposals**.
- A completed checklist is evidence of recorded checks, not automatically an authorized go/no-go approval.
- Task definitions and their canonical metadata are distinct from project task runs, actual artifacts, human reviews and publication decisions.
- Each task can return to previous planning or research stages as new information arises; the numbering indicates a typical flow, not a rigid set of approvals.
- The stage's `docs/` folders hold rendered views and references; canonical documents and procedure steps reside in structured JSON.
- The `AI_ASSIST` directory contains six restricted-scope drafting prompt examples; AI may suggest, compare and flag uncertainty, but should not certify facts, assume permissions or execute human approval.
- Future website and audio/video outputs should reference stable IDs and evidence while allowing multimodal choice.

## Build and validation

`make stage-01-handbook` composes structured data to `build/handbooks/stage_01/stage-01-handbook.tex`, compiles it to PDF with XeLaTeX, and emits a website-neutral `.view.json` and provenance `.manifest.json`.

Existing `make validate` and `make test` still cover the reusable template library and the Stage 1 composition test. The PDF appearance remains black and white, A4, Mincho, no decorated section borders, headings numbered without zero padding. This is a technical result, not a content sufficiency or legal compliance finding.

## External sources consulted

- Japan Newspaper Publishers & Editors Association, 新聞倫理綱領: https://www.pressnet.or.jp/outline/ethics/ (accuracy, independence, dignity and correction ethics; not a binding rule for every OS user).
- Japanese Psychological Association, 科学コミュニケーション・ガイドライン: https://psych.or.jp/jpamember/press_release_guidelines/ (research context, source traceability, claim scope, avoiding spin; field-specific professional guidance, not an OS authorization).

## Next milestones

1. Expert editorial review of the first six task definitions and completeness of evidence requirements.
2. Refine remaining shared Stage 1-related templates (privacy, risk, accessibility, responsibility and communications planning) with real operational examples.
3. Extend the same content-to-handbook workflow to Stage 2, keeping shared standards referenced rather than duplicated.
4. Add project-specific task runs, human decision records, linked citations and rights verification.
5. Continue specialized TeX rendering for equations, complex tables, accessible figures and optional interactive content.
