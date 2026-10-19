# Operations OS — Compiled Documentation Library

**Status:** Folder taxonomy agreed in the architecture discussion. Content remains to be authored.

This `docs/` directory organizes **human-readable, compiled/published documentation** into:

- `standards/` — standards, editorial conventions, quality rules, and versioned compilations;
- `ethics/` — ethical guidance, rights/privacy/AI-use guidance, and their compiled forms;
- `sops/` — standard operating procedures and operational manuals;
- `handbooks/` — synthesized, readable handbooks and cross-stage guides.

The eight stage-specific `pipeline/<stage>/docs/` directories use **the same four subfolders** for stage-scoped compiled material.

**Source versus compilation:** Editable canonical sources may live in `standards/`, `ethics/`, stage task `procedure.md` / `checklist.md`, and handbook templates. A compiled item in `docs/` should state its source document ID/version, compilation date, and applicability. Avoid independently editing divergent copies. Where a shared document applies to several stages, stage compilations can reference or curate it rather than silently duplicating normative content.

**Authority:** External official rules, enacted laws, any named organization-specific policies (if actually obtained), professional association guidance, and our draft proposals have different statuses; label each clearly. This independent prototype is not official any named organization software.
