> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Operations OS v7 — structured templates and Japanese print-preview pilot

**Date:** 2026-10-19  
**Status:** Independent, unapproved design prototype. Neither any named organization's authorized process nor its official forms.

## Design conclusions and implementation

1. The canonical template definition, its project-specific instance, and its printable representation are separate. Blank printable forms are built from **template definitions**, not from completed documents or live project data.
2. Preserve the v6 `DocumentTemplate` and `ChecklistDefinition` JSON Schemas; the pilot uses four schema-valid definitions in `templates/implemented/TPL-*/definition.json`.
3. Keep presentation preferences in `print_profile.json` per template. The profiles currently specify physical writing heights and table headers/column widths. **Open issue:** semantic table-column definitions belong in a future canonical schema extension; they are not adequately expressed by `structured_table` alone.
4. Use a single renderer, `script/render_template_preview.py`, which outputs `.tex`, PDF when `--compile` is specified, and neutral `.view.json`. The `.view.json` is a structured interchange proof-of-concept, **not** a finished web view or browser form schema.
5. XeLaTeX compiles Japanese Mincho body text and sans headings. A4 paper; quiet purple-gray section rules; generous annotation fields; restrained headers/footers. No imitation of any named organization stationery, logos, institutional seals or approval blocks.
6. No template in this pilot constitutes a real scientific check or actual permission to publish. The release approval form requires a human authority decision if adopted in any institution.
7. Global template catalog now points to the four prototyped definitions; the 139 original `.md` placeholder files remain untouched and empty. All other templates remain inventory entries without structured implementation.
8. The printable checklist distinguishes fit, nonfit, not applicable and unresolved; evidence citations/IDs are required conceptually but must be enforced by a future ChecklistRun validator.
9. Rendering is deterministic at the source level given identical JSON and renderer code. **PDF-byte identity** and PDF/A or accessibility conformance were **not** established. XeLaTeX does not prove rights clearance, legal validity, accessibility or editorial accuracy.
10. The website should eventually use the same definitions, with a separate accessible presentation layer and appropriate validation; it should not parse or rely on PDF layout as a data source.

## Four selected forms

| Catalog ID | Draft form | Stage | Paper |
| --- | --- | --- | --- |
| TPL-DOC-030 | 企画書 | 01 | 2 pages |
| TPL-DOC-046 | 取材質問設計表 | 03 | 2 pages |
| TPL-CHK-002 | 科学的事実・根拠確認チェックリスト | 02, 03, 04, 05, 06, 08 | 2 pages |
| TPL-DOC-072 | 公開承認申請書（試案） | 06 | 1 page |

The printed forms contain no real identifiers, researcher names, approvals or project data.

## Review questions

- Is the Japanese Mincho / sans hierarchy appropriate to professional editorial work?
- Are the writing spaces usable when printed, and should some items require electronic-only completion?
- Should evidence IDs, field IDs, document identifiers, revision dates and rights metadata be visible on each form?
- Should the approval form be split into a request and a separate **ReviewDecision** rather than providing a decision box in the same document? This is the recommended direction for machine-readable governance.
- Is a repeatable question table more useful as a separate unlimited attachment rather than five fixed paper rows?
- What conditional fields depend on the article type, publication channel or scientific context?
- Should the checklist's `対象外` require a rationale and a designated reviewer for high-impact criteria?
- Should source and evidence registries be separate attached sheets linked by claim IDs?

## Reproduction

```bash
python script/render_template_preview.py --compile
python script/validate_canonical_model.py
python script/validate_repo.py
```

XeLaTeX must be installed with `fontspec`, `xeCJK` and the Noto Serif / Noto CJK fonts. The preview renderer needs Python `jsonschema`.

## Next step after format review

Revise the canonical model for typed table columns, conditional field logic, data entry/validation semantics and structured review decisions. Then expand the print/website renderers before implementing the remaining templates. Content writing for individual pipeline tasks remains a later stage.

**Historical note (v8):** The purple-gray/sans-heading layout described above has been superseded, based on user review. The current print masters are monochrome, entirely Mincho, with no decorative boxes/heading rules, and are directly maintained as TeX under `templates/tex/`. See `design/JAPANESE_PRINT_FORM_STYLE_v8.md`.
