# Projects — Real Execution Instances

Each concrete project is created from the shared eight-stage workflow by `python script/init_project.py <project-id> --title "Title"`.

Project instances contain `project.json`, all eight `stages/<id>/stage.json` files, per-stage task workspaces, source and artifact directories, records grouped by decisions/reviews/approvals/corrections, and context-only `AGENTS.md` / `CLAUDE.md` at both project and stage levels.

The command **does not** instantiate task checklists, populate evidence, record approvals, publish content, or assert that a stage has been completed. These will require separately designed contracts and actual human decisions. Project initialization is operational; project/task execution and security enforcement are not implemented.

Never store real confidential or embargoed source material in an unprotected shared repository. No operational project was included in this ZIP.
