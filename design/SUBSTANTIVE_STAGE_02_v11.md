# Stage 2 design and substantive drafting record — v11

Date: 2026-10-19. Status: independently authored draft.

## Scope and structure

The eight-stage editorial workflow is a configurable preset of the general OS. Stage 2 has eight independent tasks, eight procedures, five common standards, three ethics entries, five reused/revised checklists, task-level AI prompts, a version-pinned handbook recipe, TeX output and a website-neutral JSON view.

## Principle

Source → claim relationships retain each source's edition, access conditions, identified passages, evidentiary role, conflicting evidence and change history. Recording something is not proof of truth. A completed checklist and editorial handoff are not institutional or publication approval.

## Source and claim categories

The research workflow separates discovery, source version provenance, study methods, quantitative evidence, conflicting interpretations, editorial claims and rights/approvals. Reuse the persistent SourceRecord/ClaimRecord data model.

## AI

AI may propose search terms, suggest correspondence, extract candidate claims from allowed public sources and prepare questions. Human review of the original source is required. Non-public material is not supplied to external AI unless applicable permissions and controls allow it.

## Cross-stage relations

Stage 1 produces an editorial brief and open questions. Stage 2 produces a claim-source register, research methods and limitations summary, quantified evidence record, unresolved issues, and interview questions for Stage 3. Stage 5 and Stage 6 may request renewed Stage 2 checks.

## References and verification status

See content/operational/stage_02/REFERENCES.md. The sources have different authority: professional guidance, scholarly metadata services, national archival program descriptions, official public administration guidance. No individual scientific study was evaluated here. All scientific examples are conceptual, not empirical validation.

## Remaining work

In-depth professional review of each section, robust document-level citations per normative proposition, structured source and claim editing UI, workflow state transitions, canonical form sync tests, rights review, external dataset integration, and full project pilot are still required.

## Template revision and backward compatibility

Five research checklists now have substantive criteria at definition version `0.2.0`. Their original `0.1.0` definitions are preserved under `content/template_versions/<template_id>/0.1.0.json`. The handbook composer now resolves an explicitly requested historical version from this archive. Current blank-form generation uses the latest definition. This separates historical project evidence from subsequent improvement of criteria.

## Output and reproducibility

`make stage-02-handbook` composes the pinned recipe, renders TeX and presentation-neutral JSON, emits a hash manifest, then compiles an A4 XeLaTeX PDF. The generated TeX is editable for print typography, but canonical substantive content remains in JSON. The copy in `pipeline/<stage>/docs/handbooks/` is a convenient generated document, not a source file.

## Historical prototype

The pre-existing `publications/stage-02-handbook.json` and its earlier proof-of-concept pipeline are retained for history; `content/operational/stage_02/recipes/PUB-RES-HANDBOOK.json` is the current version-pinned canonical handbook recipe. A later consolidation can retire the superseded format after migration testing.
