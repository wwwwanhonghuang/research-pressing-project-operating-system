# Stage 6 consolidation and review-gate semantics — v16

## Current design decisions

- The previous archive contained canonical Stage 6 source fragments that were not all connected to its handbook and stage descriptor. The v16 recipe now integrates the existing 13 task/procedure pairs and 12 standards/ethics entries, and references four enhanced checklist definitions.
- The Stage 6 `docs/standards`, `docs/ethics`, `docs/sops`, `docs/handbooks` taxonomy remains available; rendered handbooks are compiled, never canonical.
- Source JSON is canonical for operational semantics, TeX for print presentation, PDF a generated artifact. The website should consume neutral JSON views.
- Every review is version-specific, scoped to a media/publishing target, and retains residual uncertainty. A source hash can identify content, but does not authenticate the reviewer or their authority.
- Review coordination, scientific validity assessment, editorial revision, copyright/portrait/contract checks, privacy, ethics, embargo coordination and authorized publication decisions are distinct responsibilities.
- `check_release_gate.py` performs **structural inspection only**. Its positive result means the record contains fields, not that any approval is genuine, legally valid, or usable to trigger publication. Automatic publication remains disabled.
- A conditional, pending, returned or rejected decision is blocking. A reviewer stating `not_applicable` must explain why. Five unique review domains are required for the example gate. These are proposed internal requirements, not universal Japanese legal rules.
- Old `0.1.0` definitions were archived before revising tasks, templates or recipes, enabling comparison and historical reference. The existing renderer only resolves historical *checklist* versions; generalized cross-version resolution for all objects remains a future task.
- Source references are assigned to standards/ethics as external background, not as authority to enforce these proposals.

## Stage 6 content

1. 13 versioned task definitions and 13 associated procedures.
2. 8 standards and 4 ethics entries linked to tasks and compiled in the handbook.
3. 8 form templates and 4 checklist templates revised to `0.2.0`, previous versions kept.
4. 13 AI-assistance guidance documents with a default restriction on external AI handling of sensitive content.
5. A reproducible handbook composition recipe, source hash manifest and TeX/PDF outputs.
6. Synthetic examples and separate gate checks to demonstrate the distinction between structured records and human authority.

## External sources and limited scope

- 日本心理学会、科学コミュニケーション・ガイドライン: https://psych.or.jp/jpamember/press_release_guidelines/ (scientific news releases; nonstatutory guidance).
- 日本新聞協会、新聞倫理綱領: https://www.pressnet.or.jp/outline/ethics/ (journalistic ethics; distinct from organizational PR policies).
- 個人情報保護委員会、通則編: https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/ (applicability depends on entity, purpose and legal conditions).
- 文化庁、他人の著作物を利用したい場合など: https://www.bunka.go.jp/seisaku/chosakuken/seidokaisetsu/chosakukensha_fumei/ (rights limitations, rights holders and use conditions require separate assessment).

## Remaining work

- Institutional implementation of authority, real identity verification and signed decisions.
- Current law/contract applicability and specialist review case by case.
- Task execution store, actual secure permissions, versioned human decisions and revocation.
- The source of the official stage workflow remains a proposed model; stages can repeat or run in parallel.
- The next editorial stage is publication and distribution, but it should consume only a genuinely approved target from a properly authorized workflow.
