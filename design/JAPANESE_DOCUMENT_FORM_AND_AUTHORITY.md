> Historical design note. Current implementation and source-of-truth rules are described in `GENERAL_PURPOSE_ARCHITECTURE_V9.md`. This document may describe earlier approaches.

# Japanese formal-document structure, editorial conventions and authority

**Scope:** Adopt useful Japanese legal-document *structure*, not legal status. This is a prototype design note, not legal advice or an official any named organization rule.

## Reference points

- The attached `utokyo_hospital_manual_R38_1a_public_release.pdf` provided in the design conversation includes purpose/scope, institutional context, ethics, legal alignment, operational chapters, evidence/EBPM, quality assurance, disclosure, source notes and revision controls. It is expressly an *unofficial independent research edition*, and its content is not imported as any named organization policy.
- e-Gov, **法令の条文構造と法令XML**: https://laws.e-gov.go.jp/docs/law-data-basic/8ebd8bc-law-structure-and-xml/ (checked 2026-10-19). Describes structure `条 → 項 → 号 → 号の細分` and citations to individual provisions.
- e-Gov, **法令標準XMLスキーマ**: https://laws.e-gov.go.jp/docs/law-data-basic/419a603-xml-schema-for-japanese-law/ (checked 2026-10-19). Defines elements such as `Chapter`, `Section`, `Article`, `Paragraph`, and `Item`. The Operations OS pilot does **not** claim conformance to e-Gov legal XML or reproduce that schema.
- Digital Agency, **ウェブアクセシビリティ**: https://www.digital.go.jp/accessibility-statement (updated 2026-03-31). Cites JIS X 8341-3:2016 and WCAG 2.2 as its accessibility reference frameworks; treat these as external references, not a compliance claim for this prototype.

## Representation recommendation

A handbook may have `編 → 章 → 節 → 項（説明節）` for explanatory structure. A *normative internal rule* may use identifiable `条 → 項 → 号` within its own document where formal precision is valuable. Prefer task-oriented headings and steps for procedures; do not force a statutory visual style onto every instructional paragraph.

- For each rule, store `stable_id`, `authority`, `status`, `applicable_scope`, `version`, `effective_date` if verified, `source_refs`, `reviewed_on` and `supersedes` where relevant.
- Distinguish binding statute, applicable official institutional rule, external professional guideline and the author's independent recommendation. Scope and applicability must be independently verified; a simple label does not settle conflicts in Japanese law.
- In Japanese language: prefer accurate affirmative drafting; identify actors, objects, conditions, exceptions, deadlines, record obligations and decisions. For uncertain guidance explicitly label `案`, `参考`, `要確認`, `未承認` rather than implying official adoption.
- Reserve `義務` and statutory-sounding expressions for obligations grounded in verified sources; for independent proposals use clear `推奨する`, `検討する`, `試案` and state the level of authority.
- Preserve quotation integrity; maintain explicit explanatory, example and normative block types so each output can render them differently.
- For print use Mincho typography (e.g., Noto Serif CJK JP), stable hierarchy, numbered sections, tables, footnotes, references, date/revision statements and clear page headers/footers. The compiler's `.tex` is a deliberately minimal demonstration, not a finished legal-format typesetting system.
- For web present the same exact requirements and source IDs while offering optional explanatory diagrams and accessible interactive forms. Do not depend on color, sound or video alone to convey requirements.

## Presentation vs rights/governance

Never treat a correctly compiled PDF as proof of scientific accuracy, legal validity, editorial approval or permission to publish. A document can be technically complete while its status remains `draft`. A third-party source is an attribution target, not necessarily a content-reuse license.
