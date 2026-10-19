# Pending work after Operations OS v18

**Recorded:** 2026-10-19  
**Status:** Deferred design and implementation memorandum; no handbook revision authorized by this memo.  
**Scope:** General-purpose Operations OS. Retain canonical JSON as the source of truth and render TeX/PDF, website views, and optional media from versioned content.

## P0 — Substantial handbook revision (explicitly deferred)

The eight stage handbooks are **substantive first drafts**, not completed professional manuals. The user requests a major later revision and a more rigorous **Japanese legislation-style article and clause form (法令の条文形式)**. Do not undertake the rewrite as part of this memorandum or of the initial multimodal presentation prototype.

When resumed:

1. **Separate document genres**: distinguish explanatory handbook text from operational policies, SOPs, checklists, and normative clauses. Apply legislation-inspired drafting only where it improves rigor and navigation; do not mechanically recast scientific explanations as obligations.
2. **Model article structure semantically** in the canonical document AST: `編 → 章 → 節 → 条 → 項 → 号`, with optional `款`/`目`, definitions, scope, conditions, exceptions, responsibilities, required records, review and revision rules. Article hierarchy and stable IDs must be distinct from print numbering. Japanese presentation may use `第1章`, `第1条`, `2`, `一`, `二`, `イ`, `ロ` as appropriate. Validate nested clauses and references to them; avoid embedding numbering directly in long-form strings.
3. **Track normative authority per clause**: distinguish actual laws/regulations and their verified article references, adopted organizational rules, professional recommendations, proposed internal procedures, and descriptive explanations. The visual shape of 条文 must never imply enactment or legal force.
4. **Attach external legal source metadata** where an actual law is cited: jurisdiction, statute title, relevant article/subarticle, official authoritative URL or publication, effective/amendment date, verification date and applicability caveats. A paraphrase must be labeled separately from verbatim statutory text. No unverified statutory text or invented legal citation may be presented as law. Verify currency when this work is actually performed.
5. **Revise substance section-by-section**: tighten definitions, triggers, exceptions, actions, decision owners, evidence, outputs, deadlines where grounded, escalation, appeals/corrections, and record retention. Resolve duplication between stage handbooks and checklists, and test cross-stage consistency. Preserve ethics, epistemic uncertainty, methodological limits, scientific evidence and accessibility.
6. **Support parallel formats**: legal-article print form in the common XeLaTeX style, HTML article navigation/permalinks, and accessible linear text. Preserve black-and-white Japanese Mincho print styling. Preview representative articles, long subclauses, tables and page breaks before mass regeneration.
7. **Migration and regression**: create explicit schema migrations and backwards-compatible versioned recipes. Preserve old document/template versions, source hashes and existing project references. Add article-numbering, clause cross-reference, authority-label and rendering tests; have subject-matter and legal reviewers examine content where relevant.

**Non-goal for now:** changing the existing eight PDFs, claiming the draft handbooks are formally enacted, or performing a legal compliance audit.

## Current document completion assessment

**Present in v18:** all eight draft handbook recipes and their generated PDFs/TeX/JSON views; 139 versioned template definitions (94 document and 45 checklist types); stage-specific tasks, procedures, standards and ethics entries; source-hash manifests; print generation and tests.

**Still pending:** substantive handbook rewrite; genre/authority consistency review; deeper legal-source and domain verification; dedicated legal-article semantic schema and renderer; harmonization of the wider `core/model/v1` and `content/schemas` schemas; realistic project-instance lifecycle with authenticated task runs and authorization; stable content segments tied to claim and source IDs across media; richer table, media, chart and equation renderers; actual content/rights/access controls; evidence and consent handling; end-to-end synthetic integration including correction/archiving; usability, accessibility and editorial acceptance tests. Blank form templates and successful compilation should not be treated as actual organizational approvals.

**Conclusion:** document *draft coverage* is complete across eight stages. Document *substantive and operational readiness* is not. The deferred work does not block a constrained presentation-layer prototype.

## Next workstream — optional multimodal presentation layer

Proceed with a **read-only, source-grounded prototype** consuming versioned canonical JSON / generated `.view.json`. Do not implement permissions, approvals, or automatic publishing by inferring state from static files.

Suggested pilot sequence:

1. Stage/table-of-contents navigation → task/procedure/standard/ethics page, with stable IDs, revisions, source and authority labels.
2. Toggle between article/handbook text, outline, process diagram, printable TeX/PDF, and an accessible responsive HTML reader. Provide a plain-text path for every page.
3. Add optional audio narration and transcript, then optional captioned video/animation or interactive visual explainers with equivalent accessible descriptions. No medium is mandatory.
4. Introduce a `MediaRendition`/`PresentationVariant` metadata record for each transformation, pointing to exact source IDs and versions, represented claims, editorial choices/omissions, asset permissions, language, accessibility alternatives, reviewer, build timestamp and hashes.
5. Build a cross-media consistency checker: linked claim presence, changed-scientific-meaning warnings, version drift and missing caption/transcript/alt text. Human review remains required.
6. Run a synthetic eight-stage walk-through; test responsive and keyboard interactions, screen-reader reading order, caption quality, and the path back to source.

Presentation can advance alongside deferred handbook/content work, provided that displayed drafts remain labeled as drafts and neither fabricated approvals nor sensitive project data enter public previews.

## Recommended work ordering

- **Now:** Read-only multimodal presentation architecture and narrow executable prototype for one handbook plus several tasks.
- **In parallel:** Audit cross-media claim linkage and draft accessible media metadata; document instance/runtime requirements.
- **Later:** Major handbook/article-form rewrite and legal-source verification, after its data structure and editorial approach are reviewed.
- **Before production use:** Security, rights, permissions, human approvals, accessibility, professional and domain review, and end-to-end tests.

Cross-references: `design/GENERAL_PURPOSE_ARCHITECTURE_V9.md`, `design/CONTENT_MODEL_AND_DOCUMENT_COMPOSITION.md`, `design/ALL_EIGHT_STAGES_v18.md`, `os-site/README.md`, `content/README.md`.
