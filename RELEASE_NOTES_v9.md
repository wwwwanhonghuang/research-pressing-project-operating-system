# Structural Release v9 — 2026-10-19

## Completed

- Adopted general-purpose, organization-independent identity and made the eight-stage editorial pipeline an optional preset.
- Added a six-stage generic project workflow preset and workflow-aware project initialization.
- Preserved existing `core/`, `pipeline/`, `docs/`, `standards/`, `ethics/`, `projects/` and future `os-site/` structure.
- Implemented 94 distinct JSON document definitions and 45 JSON checklist definitions, totaling 139 structural drafts.
- Preserved stable per-section, per-field and per-checklist item IDs; pinned versions and workflow IDs.
- Added structured long-form content blocks and one synthetic, source-linked three-page SOP example.
- Implemented shared monochrome Mincho TeX layout, `script/generate_tex.py`, `script/compile_pdf.py`, `script/validate_templates.py`, `script/validate_instance.py`, `script/export_view.py`, and the root Makefile.
- Generated TeX sources and rendered PDFs for all 139 templates. All PDFs compile under XeLaTeX.
- Added website-neutral JSON views for all 139 template definitions.
- Ran structural validation, JSON Schema checks, and automated regression tests.

## Quantitative validation

| Check | Result |
|---|---|
| Canonical structured templates | 139 |
| Draft document definitions | 94 |
| Draft checklist definitions | 45 |
| Generated TeX sources | 139 |
| Successfully compiled PDFs | 139 |
| PDF pages for blank templates | 233 |
| PDFs with page-bound text overflow detected | 0 |
| Automated regression test failures | 0 |

## Unfinished

- Individual substantive standards, ethics guidelines, legal compliance assessments, SOPs and stage handbooks remain to be authored and reviewed.
- Template-level structured content is an **initial design**, not finalized forms approved by a body or competent authority.
- The legacy broader canonical model in `core/model/v1` needs an explicit migration/compatibility review with the newer forms/instances schema.
- The future website and specialist video/audio/diagram renderers are deferred.
- Project instance security, real human approval mechanisms and formal access control remain to be implemented.

## File roles

| Directory | Responsibility |
|---|---|
| `content/templates/` | Canonical document and checklist definitions (JSON) |
| `content/schemas/` | Format and semantic validation contracts |
| `templates/tex/operationsform.sty` | Canonical monochrome Japanese Mincho print style |
| `build/tex/*.tex` | Generated editable TeX sources |
| `build/tex/*.pdf` | Generated blank form samples |
| `build/view/*.json` | Generated client-neutral views |
| `script/` | Generator, compiler, validator, project scaffolder |
| `design/` | Design decisions, historical notes and unresolved questions |

The presence of a PDF file, checked list or AI-generated content never establishes that the content is accurate, safe, legally compliant, or approved.
