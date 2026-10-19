> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Operations OS — Japanese professional print form style (v8)

**Status:** Agreed print-style baseline, 2026-10-19. Independent prototype; not an official any named organization form or purported reproduction of an agency's internal forms.

## User-directed requirements

1. **Monochrome:** All print typography, form marks and rules are black on white. No shaded areas, color accents, decorative panels or boxes.
2. **Mincho:** Use Japanese Mincho throughout, including headings; current portable XeLaTeX choice is `Noto Serif CJK JP` with Latin `Noto Serif`. Never distribute the font files.
3. **Heading treatment:** No rules above or below titles or section headings. Use modest hierarchy by font weight, size and spacing alone.
4. **Section numbers:** `1.`, `2.`, `3.` with **no zero padding**. Stable catalog identifiers such as `TPL-DOC-030` remain identifiers, not section numbers.
5. **Functional form marks:** Plain writing rules and checkbox symbols are permitted as functional controls; they are not decorative bordered fields. Long-text fields can use open whitespace. Tables, if needed, should be typographically restrained and borderless by default.
6. **Japanese formal register:** Precise, consistent Japanese labels. Page titles and headings should resemble ordinary professional administrative documents, not marketing presentation slides.
7. **A4 and pages:** A4 print format, conservative margins, clear page numbers, avoid gratuitous breaks, and keep form labels with their writing areas. Layout may be adjusted by template.

## Authoring and representation contract

- **TeX is the editable, authoritative PRINT-LAYOUT source.** Hand-authored `templates/tex/TPL-*.tex` and shared `operationsform.sty` determine typography, linework, pagination, and print presentation.
- **Structured JSON remains the semantic authority** for template IDs, field identifiers, types, requirements, checklists and eventual website data entry. Editable TeX and structured data serve distinct roles.
- `script/compile_tex_templates.py` compiles **existing TeX files**, never generates/replaces them from JSON. A preflight check verifies TeX field and checklist identifiers against the canonical JSON definitions.
- PDF is only a compiled view. Neither PDF nor TeX defines a project's factual content or grants authority to publish.
- The old `script/render_template_preview.py` now delegates to the TeX-first compiler, removing the previous purple-gray render pathway.
- Production authoring should supply structured document instances through a controlled TeX data bridge in a future phase, retaining the hand-authored TeX layout as source. Do not infer data from PDF.

## Verification performed for v8

Four representative blank templates were compiled with XeLaTeX; PDF pages were rasterized and visually inspected. The new preview outputs contain no accent colors or decorative boxed form fields. Field and checklist IDs were aligned with v7's schema-valid semantic definitions. The templates remain exploratory forms; official legal compliance, accessibility and any named organization approval are not established by compilation.

## Still to decide

- Whether general long-text fields should use ruled writing lines, open whitespace, or distinct electronic and print layouts.
- Page-number format and placement for long professional manuals versus short forms.
- Context-sensitive table/grid styles where the data's structure genuinely requires visible rules.
- Integration of the structured DocumentInstance into hand-authored TeX using escaped generated input, with safeguards against TeX injection.
- Japanese typographic details (vertical spacing, full-width punctuation, honorific style) of the final editorial stylebook.
