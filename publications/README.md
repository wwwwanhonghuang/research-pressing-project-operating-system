# Document compositions / 出版構成定義

`publications/*.json` are ordered recipes, not canonical copies of task rules or external law.
A recipe selects tasks, standards and ethics by stable IDs, and adds editorial transitions.
Source entries in `standards/`, `ethics/`, and `pipeline/<stage>/tasks/` remain authoritative for the **prototype's own content only**.

`python script/build_documents.py --recipe publications/stage-02-handbook.json`
creates a Markdown handbook, a XeLaTeX source, a website-neutral structured view and a provenance manifest. It does not compile or authorize a PDF. Reusable source references and exact versions are saved in the manifest; approval is not inferred from successful rendering.
