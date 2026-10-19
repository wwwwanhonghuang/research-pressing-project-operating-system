# Operations OS v12 — Stage 3 Interview and Additional Confirmation

**Status:** Independent first draft, 19 October 2026. The content is not a formally adopted organizational rule, a legal opinion, or permission to record or publish.

## Purpose and architecture

Stage 3 connects preliminary research to editorial production through attributable interviews, accountable recording, scientific clarification, and a documented handoff. The canonical content is JSON: `content/operational/stage_03/{knowledge,tasks,procedures,recipes}`. Documents are composed by `script/compose_handbook.py` and styled by `templates/tex/operationshandbook.sty`. TeX and PDF are derived print representations; the `.view.json` can support future multimodal display. Stage-specific AI guidance is located under `pipeline/3_Interview_And_Additional_Confirmation/AI_ASSIST/common_prompts/`.

## Nine tasks

1. `TSK-INT-PLAN` 取材目的・範囲と事前条件の設定
2. `TSK-INT-REQUEST` 取材依頼・連絡条件と日程調整
3. `TSK-INT-QUESTION` 研究論点・質問と追質問の設計
4. `TSK-INT-CONSENT` 参加・録音・撮影・公表範囲の確認
5. `TSK-INT-CONDUCT` 取材の実施・科学的追質問と文脈確認
6. `TSK-INT-RECORD` 原記録保全・文字起こしと情報分類
7. `TSK-INT-QUOTE` 引用候補・帰属と意味の照合
8. `TSK-INT-FOLLOWUP` 追加確認・発言照会と変更の管理
9. `TSK-INT-HANDOFF` 取材成果の確認・制作工程への引継ぎ

These are logical tasks; tasks may iterate and overlap. Important unresolved claims return to Stage 2; scientific review and publication approval remain later, separately accountable activities.

## Distinctions that must remain explicit

**Source ≠ claim ≠ recorded utterance ≠ paraphrase ≠ editorial sentence.** Preserve original audio/video, speaker, time range, transcription, translations, editing decisions, research sources, uncertainty, and the actual version used. For a candidate quotation, avoid replacing the original record with an edited sentence. Store reference IDs and retain permitted access controls.

**Interview participation ≠ recording permission ≠ publication authorization ≠ copyright clearance.** The appropriate legal requirements vary by activity, data and legal actor. The proposed checklist treats each as a distinct topic and records which authority has confirmed use. The personal-information regulatory framework also has exceptions related to reporting and authorship; do not assume either that those exceptions always apply or that consent is legally mandatory in every journalistic setting.

**Fact confirmation ≠ editorial control ≠ final approval.** A respondent's scientific/quotation review can identify errors; it does not by itself authorize publication or displace contractually defined editorial responsibility. A completed checklist is not a proof of legality, scientific validity, or institutional approval.

**Ethics ≠ formal legal compliance.** The OS may recommend participant explanations and privacy-sensitive handling beyond a particular legal minimum. Claimed legal obligations must be evaluated separately and cannot be inferred merely from a guidance source.

**AI assistance ≠ verified testimony.** AI may suggest follow-up questions and extract possible claims from authorized public sources, but confidential audio and personal data must not be uploaded without separately confirmed authority, security review, and service conditions. Machine transcripts, translations, and paraphrases require verification against records, and AI may not fabricate interviews or witness statements.

## Sources and authority status

See `content/operational/stage_03/REFERENCES.md` for source-specific scope and URLs. Reference sources include Japanese Psychological Association science communication guidance, the Japanese Newspaper Publishers & Editors Association ethical code, the Personal Information Protection Commission guidance including reporting exemptions, and Agency for Cultural Affairs educational material on quotations. These are external sources; the procedures and checklists in the OS are original, provisional professional proposals. Source links are not claims that an external organization endorses this repository.

## Template revisions

Nine document definitions `TPL-DOC-044` through `TPL-DOC-052` were refined from `0.1.0` to `0.2.0` with document-specific instructions and table columns. Six checklist definitions `TPL-CHK-004`, `006`, `021`, `022`, `023`, `024` were revised to evidence-linked substantive checks at version `0.2.0`. Historical versions are preserved at `content/template_versions/`. Task references and the stage handbook recipe refer to the revised versions.

## Build and validation

```bash
make validate
make test
make stage-03-handbook
make pdf IDS='TPL-DOC-044 TPL-DOC-045 TPL-DOC-046 TPL-DOC-047 TPL-DOC-048 TPL-DOC-049 TPL-DOC-050 TPL-DOC-051 TPL-DOC-052 TPL-CHK-004 TPL-CHK-006 TPL-CHK-021 TPL-CHK-022 TPL-CHK-023 TPL-CHK-024'
```

Stage 3 outputs are in `build/handbooks/stage_03/`: `.tex`, `.pdf`, `.view.json`, `.manifest.json` and a print style copy. Generated template TeX/PDF is in `build/tex/`. The manifest records source hashes and versions.

## Review still required

- Validate factual and procedural language with qualified science journalists, interviewers, editors, and legal experts as appropriate to the workplace.
- Determine particular organization's recording, retention, data security, public relations, editorial approval and quotation-confirmation policies.
- Verify the legal applicability of reporting exemptions, rights of portrait/voice, unpublished materials and quote rules for concrete work products.
- Exercise the workflow on a fully synthetic example with a SourceRecord, ClaimRecord, RecordAsset and QuoteCandidate. The last two are represented here by existing asset/record mechanisms; detailed canonical schemas for time-coded testimony and permission records would improve precision.
- Implement structured evidence attachments and role-specific review outcomes in the project run, then ensure the interactive OS site applies the same permissions as the canonical records.

## Following stage

Stage 4: 構成・執筆, including narrative architecture, Japanese language accuracy, science/uncertainty framing, graphics and multimodal adaptation, and versioned drafting from attributable records.
