# Operations OS v17: Stage 7 — 公開・配信

2026-10-19 | Independent operational draft | Organization-neutral

## Purpose and progress

This increment advances a generalized eight-stage editorial/science-communication Operations OS. Stage 7 manages the passage from Stage 6 human publication authorization to actual release, accessibility, multi-channel distribution and post-release verification. It does not execute a publication or approve content. Twelve version-pinned task/procedure pairs have been implemented. The handbook comprises 17 chapters and is generated from 45 pinned objects (24 task/procedure entries, 16 knowledge entries and five checklists).

## Canonical scope

- Tasks and procedures (12 each): Stage 6 handoff, channel design, schedule and embargo, web preflight, accessible alternatives, social posts, press provision, events, publication execution logging, independent confirmation, incident response, Stage 8 handoff.
- Standards (11): package identity, revision, channels, schedule, web presence, accessibility, cross-channel semantic consistency, deployment records, provenance, incident management and events.
- Ethics entries (5): authorization, accessibility/choice, privacy, reader dialogue, third-party editorial independence.
- Documents TPL-DOC-077 through TPL-DOC-085 revised to 0.2.0; checklists TPL-CHK-037 through TPL-CHK-041 revised to 0.2.0. All 0.1.0 source definitions retained in content/template_versions.
- Twelve limited AI assistance prompts: checking and drafting only. No automatic publication, consent inference, truth certification or authorization.
- JSON is the semantic source of truth; TeX, PDF, presentation-neutral JSON and SHA-256 provenance manifest are derived.

## Stage 6 integration / preflight inspector

`script/inspect_stage7_preflight.py` accepts an existing Stage 6 review JSON record and a proposed Stage 7 package JSON. It checks Stage 6 documentary blockers, primary artifact ID/version/hash match, release-record ID, channel metadata, distinct proposed execution and checking roles. The output `DOCUMENTARY_CHECK_PASSED_HUMAN_AUTHORITY_UNVERIFIED` is not an authorization. The field `can_publish` is always `false`; real authority, legal compliance, permits, channel scope and approval authenticity require human verification.

Synthetic blocked fixture under `tests/fixtures/stage7` is for demonstration only. Never interpret synthetically complete records as real approval.

## Key constraints and boundaries

1. Public-facing content must preserve important scientific qualifications and links to evidence even when shortened for social or audio/video media.
2. The user should be able to choose among communication formats where practicable, rather than being forced into a single mode.
3. Source asset version, release version and what each audience actually received are distinct evidence records. An HTTP response alone does not establish accurate published content.
4. Distribution time, embargo time, platform propagation and actual reader accessibility require separate verification.
5. The file hash is proof of byte identity under the hashing assumption, not proof of copyright clearance, actual human approval or legal compliance.
6. Privacy and external platform interactions are governed by case-specific access and data governance policies; no production credentials are included in this repository.
7. Cross-channel publication and any automated deployment remain out of scope for this design draft.
8. Referral to Stage 8 preserves issues, corrections, actual URL/post ID, timestamps, accessibility exceptions and evaluation-method limits.

## Sources used as bounded technical/professional references

- W3C WCAG 2.2, https://www.w3.org/TR/WCAG22/ (web accessibility technical standard, specific application must be determined).
- W3C WAI Making Audio and Video Media Accessible, https://www.w3.org/WAI/media/av/ (media-level alternatives, captions, transcripts and descriptions).
- IETF RFC 9110 HTTP Semantics, https://www.rfc-editor.org/rfc/rfc9110.html (HTTP response semantics, not evidence of publication authorization).
- Personal Information Protection Commission, https://www.ppc.go.jp/personalinfo/legal/guidelines_tsusoku/ (case-specific legal applicability).
- Japanese Psychological Association press release guidance, https://psych.or.jp/jpamember/press_release_guidelines/ (domain-sensitive scientific communication reference).

These sources do not jointly prescribe the OS workflow or establish law for all publication activities. Procedure design is independently proposed, and normative applicability remains open to qualified review.

## Validation and reproducibility

- 139 base template definitions validated with historical versions retained.
- 67 automated tests passed, including ten Stage 7-focused tests.
- Stage 7 handbook compiled through two-pass XeLaTeX, 23 A4 pages, Japanese Mincho monochrome, 17 chapters.
- Fourteen Stage 7 templates compiled into PDFs; source JSON and TeX are included.
- Stage 7 recipe pins 45 independently resolvable canonical content objects.
- A new source extraction and handbook/test rebuild was performed for this release.

Reproduce from `operations-os/`:

```sh
make test
make stage-07-handbook
make stage-07-forms
python3 script/inspect_stage7_preflight.py tests/fixtures/release_gate/blocked_SYNTHETIC.json tests/fixtures/stage7/blocked_package_SYNTHETIC.json
```

## Remaining questions

Approval authenticity, permissions and the actual platform user/role cannot be verified by the current local test tools. More domain-specific human-in-the-loop acceptance tests, browser/screen-reader checks, channel-specific scheduling and credential-management integrations are required for real deployments. The Stage 8 work should develop corrections, withdrawal versus replacement, evaluative methods, and long-term records retention.
