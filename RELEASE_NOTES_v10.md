# Operations OS v10 — First substantive stage

Date: 2026-10-19

## Newly authored

- Six stage-01 task definitions (`TSK-PLN-*`) with inputs, outputs, assigned roles, acceptance criteria and explicit human review.
- Six individual operational procedures (`PRC-PLN-*`) with recorded expected outputs and exception handling.
- Three independent draft standards and two draft ethics entries (`KNW-*`), all with authority classifications, identifiers and provenance.
- Seven upgraded Stage 1 form definitions and three upgraded Stage 1 checklists; stable template IDs preserved and versions advanced to 0.2.0.
- Six example AI-assistance prompt notes limited to human-reviewed ideation and drafting support.
- Eleven-chapter, 13-page draft stage handbook composed from a pinned publication recipe. External references are informational professional guidance, not official adoption.

## Engine and checks

- `script/compose_handbook.py` resolves typed version-pinned definitions, checks JSON Schemas, generates standalone, inspectable TeX, neutral JSON view and hash manifest; rejects missing or mismatched versions.
- `templates/tex/operationshandbook.sty` is the editable black-and-white Mincho handbook layout authority.
- `make stage-01-handbook` builds the output with XeLaTeX; `make test` includes additional Stage 1 regression tests.
- All 139 original library templates remain in place. Ten revised stage-specific PDFs compiled as an additional smoke test.

## Release status

This release is an independent research/design prototype. The Stage 1 documents are substantive **drafts**, not legally audited, professionally reviewed or authorized for any particular institution. Valid schema and PDF compilation do not confer those statuses.

## Next work

Stage 2 research-and-source collection: inputs, source and claim registry, evidence evaluation, unresolved questions, verification SOPs and compilation of a stage handbook, reusing shared knowledge definitions by ID rather than duplicating them.
