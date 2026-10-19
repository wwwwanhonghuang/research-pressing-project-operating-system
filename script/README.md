# Scripts

| Script | Responsibility |
|---|---|
| `validate_repo.py` | Check workflow preset and project directory structure |
| `validate_template_catalog.py` | Check global inventory and linked definition files |
| `validate_templates.py` | Validate all 139 canonical structured templates and ID consistency |
| `validate_instance.py` | Validate project-instance values against pinned template fields and checklist evidence requirements |
| `export_view.py` | Export website-neutral JSON views containing the same canonical semantics |
| `generate_tex.py` | Escape content and emit TeX, style file and SHA-256 source manifest |
| `compile_pdf.py` | Compile selected/all generated TeX sources using XeLaTeX |
| `init_project.py` | Create project instance scaffold with chosen workflow preset |
| `dev/seed_library.py` | **One-time design bootstrap only.** Do not rerun without reviewing changes; it can overwrite edited definitions when invoked with `--overwrite` |

The repository Makefile is the recommended entry point. Use `make test` before publishing changes. `make sample` is a visual QA aid, not an approval mechanism. Generated outputs live under `build/` and should be reproducible from versioned JSON plus the shared TeX style.
