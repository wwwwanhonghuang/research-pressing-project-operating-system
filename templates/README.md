# Global template catalog

`catalog.json` catalogs 94 documents and 45 checklists and retains the original empty Markdown placeholders as inventory records. **The working, editable definitions are now `../content/templates/TPL-*.json`.**

- `tex/operationsform.sty`: central print-layout source in pure black/white Japanese Mincho.
- `documents/` and `checklists/`: original empty inventory placeholders, retained for traceability. Do not fill these separately and create a competing authority source.
- `project/` and `docs/`: earlier reusable scaffolding.

Each structured definition has domain-specific Japanese sections and fields or checklist checks, a stable ID, review state and stage references. Actual source research, detailed SOP instructions, regulatory assessment, ethical analysis and approval workflows remain distinct subsequent content workstreams.

Use `make tex` to generate print sources for all templates. Edit a JSON definition to change **meaning and content structure**, or the shared TeX style to change **print presentation**. Never make direct edits to generated PDF output.
