# Operations OS Web Interface

`os-site/` is the browser interface of Operations OS. Its main page is a **project workspace**: create a project, move it through the eight stages, work through each task with an assistant, and fill in the task's forms and checklists. The **reading room** is one function of the workspace. It holds every handbook, task, procedure, standard, ethics entry, form, checklist and AI-assistance prompt, and every stage and task links to it. All of it is set live in the browser from the canonical JSON; no PDF is involved at any point.

> **Status:** first working implementation. The workspace keeps project records as local JSON files through a small local server (`script/serve_os.py`) and has no accounts or access control. Like the rest of the repository, every definition it shows is a first draft and not institutionally approved.

## 1. Purpose and Scope

**In scope now**
- The workspace (requires the local server):
  - projects: create, open and edit their details;
  - the eight stages of each project, with their status, task progress, notes and documents;
  - a task assistant for every task: procedure steps, acceptance criteria, inputs and outputs, the AI-assistance prompt, and the forms and checklists the task produces;
  - a document editor for forms and checklists;
  - review decisions, recorded with the name of the person who made them.
- The reading room (also works without the server):
  - each stage's handbook, as a paginated book or a continuous sheet;
  - each definition with its provenance: identifier, pinned version, source path, SHA-256 and declared authority;
  - the library of all 139 forms and checklists;
  - search across every definition.

**Out of scope now**
- Editing definitions. The interface reads definitions and writes only project records.
- Accounts, permissions, several users and deployment on a network.
- Audio, video and interactive renditions.

The interface must never become a second source of truth for definitions, infer completion or approval, or display an approval that the records do not hold.

## 2. Design Concept

### 2.1 Work First, Reading at Hand

The main page lists projects, not books. A project opens on its eight stages; a stage opens on its tasks and its review gate; a task opens on what to do, what to produce and how to check it. The handbook, definitions and guidance for a stage are one link away from the stage and from each of its tasks. A reader opened from the workspace returns to where it was opened.

The interface is a quiet desk, and documents are lit paper objects on it. Two surfaces have their own colour tokens:

- **Desk:** the interface, including the workspace's lists, stage tiles and task rows. It follows the theme.
- **Paper:** handbooks, definitions, and the forms and checklists being filled in. They stay paper in both themes.

The dark theme is *lamplight*, not an inversion: the room darkens and the paper warms under a desk lamp.

### 2.2 Structure Carries Information

Visual devices encode facts from the data:

| Device | Meaning |
|---|---|
| Eight swatches beside a project | The status of each stage, filled as the stage moves from active through review to completed |
| Rule under a stage tile | Tasks completed, waived or skipped, out of the stage's tasks |
| Indigo depth of a spine, cover, stage tile and stage marker | Position in the process: eight successive dye baths (藍染), from 瓶覗 to 褐 |
| Spine thickness on the library shelf | Number of definitions in the stage |
| Page-edge stacks beside the open book | Pages read and pages remaining |
| Typewriter marginalia | Identifier, pinned version and SHA-256 of the source |
| The seal (stamp) on title pages and definitions | The authority the source declares, e.g. "Draft · Not approved" |
| Form and checklist thumbnails | The definition's real sections, writing lines and tick boxes |

### 2.3 Typography

| Role | Typeface |
|---|---|
| Japanese | Shippori Mincho |
| Simplified Chinese | Noto Serif SC |
| English and French | EB Garamond |
| Display numerals | Cormorant Garamond |
| Identifiers | IBM Plex Mono |
| Interface | IBM Plex Sans |

The print rules of the repository carry over: monochrome documents, unpadded section numbers, and no decorative boxes on content. A form being filled in is set in Mincho on ruled lines, like the printed form.

## 3. Workspace Architecture

```text
browser ──► /api/*        JSON ──► script/serve_os.py ──► projects/<id>/…   (project records)
        ──► /data/*.json       ──►       │                 composed in memory from the canonical JSON
        ──► everything else    ──►       └──────────────── static files from os-site/
```

### 3.1 The Local Server

`script/serve_os.py` uses only the standard library. It serves the site and composes the data bundles in memory from the canonical JSON. It recomposes them when a source changes, checking at most once a second. It also reads and writes project records.

It is a tool for one person's machine, and it defends itself accordingly:

- It binds to 127.0.0.1 and refuses requests whose `Host` is not a local name, which defends against DNS rebinding.
- It accepts writes only with `Content-Type: application/json`, which defends against cross-site form posts.
- It checks every identifier against a fixed pattern before the identifier touches a path.
- It writes each file atomically (a temporary file, then `os.replace`) and limits request bodies to 2 MB.

### 3.2 Project Records

Records use the layout that `script/init_project.py` creates, and `script/validate_repo.py` accepts the result:

```text
projects/<id>/
  project.json                      title, purpose, workflow pin, stage list
  stages/<NN>/stage.json            stage status and notes
  stages/<NN>/tasks/TSK-….json      task run: status, steps ticked, criteria checked, notes
  artifacts/DOC-<tpl>-<nnn>.json    document instance: pinned template, field values, checklist results
  records/decisions/DEC-NNNN.json   review decision: target, outcome, person, note
```

| Record | Statuses |
|---|---|
| Stage | not started, active, in review, blocked, reopened, completed, skipped |
| Task run | not started, in progress, blocked, ready for review, changes requested, completed, waived |
| Document | draft, in review, final |
| Decision | approved, changes requested, rejected, noted |

Statuses describe the state of work; none of them is an approval. A decision is a human record: it requires the name of the person who made it, and the server notes that the name is not verified. Nothing derives a decision, a stage's completion or an approval from ticked steps, checked criteria or a document's status. The one automatic change is that ticking the first step of a task that has not started marks it in progress.

### 3.3 API

| Method and path | Purpose |
|---|---|
| `GET /api/health` | Whether the workspace is available |
| `GET` / `POST /api/projects` | List projects / create one |
| `GET` / `PUT /api/projects/<id>` | A project with its stages, task runs, documents and decisions / edit its details |
| `PUT /api/projects/<id>/stages/<NN>` | Stage status and notes |
| `PUT /api/projects/<id>/tasks/<NN>/<task>` | A task run |
| `POST /api/projects/<id>/documents` | Start a document from a pinned template |
| `PUT /api/projects/<id>/documents/<doc>` | Edit a document's title, status, fields or checklist results |
| `POST /api/projects/<id>/decisions` | Record a decision on a stage, task or document |

Without the server, the reading room works from the committed bundles in `data/`, and the workspace pages say how to start the server.

## 4. Rendering Architecture

```text
canonical JSON ──► script/build_site_data.py ──► os-site/data/*.json  (presentation-neutral bundles)
                                                      │
                          render/model.js  ◄──────────┘   one block stream per document
                               │
             ┌─────────────────┴─────────────────┐
     render/paginate.js                    reader/flow.js
     (measure, pack, front/back matter)    (continuous sheet, outline, provenance rail)
             │
     render/page.js ──► reader/book.js  (spread or single page; physics, light, motion)
```

### 4.1 Data Bundles

`script/build_site_data.py` uses only the standard library and resolves every `{kind, id, version}` pin, failing closed on any unresolved pin. It writes:

- `site.json`: the workflow, stage summaries, the template library and the search index;
- one `stage-NN.json` per stage: objects, the resolved handbook, the collection and reverse references;
- `templates.json`: every current form and checklist.

Builds are deterministic and use LF on every platform. `tests/test_site_data.py` checks that the committed bundles match a fresh build. The local server serves the same composition, live.

### 4.2 Document Model

`render/model.js` turns every kind of object into one stream of typed blocks. These include chapter, object head, heading, paragraph, list item, step, check, form section, field, source, reference, contents entry and provenance row.

Both renderings consume the same stream, and blocks keep stable indices. Switching between book and sheet, changing the type size or changing the language therefore keeps your place.

### 4.3 Pagination

Pages have a fixed virtual size and the book is scaled to the window, so page numbers do not change on resize. Pagination works as follows:

- Blocks are measured in a hidden page body of the exact width, then packed with keep-with-next rules.
- Paragraphs are split at sentence boundaries (`Intl.Segmenter`), falling back to words (Latin) or characters (CJK).
- Widow control carries at least two lines to the next page.
- A paragraph broken mid-sentence keeps its last line justified.
- Handbooks get a cover, endpapers with seigaiha waves, a title page, an edition notice, contents, an appendix of pinned sources, a colophon and a back cover. Front matter is numbered in lower-case roman numerals.

Japanese and Chinese web fonts arrive in many unicode-range subsets. Before measuring, the reader requests exactly the characters each document uses, per language and weight. The font stylesheet itself is non-blocking, so the site opens even where the font host is slow or unreachable. In that case, pages are set with local fallback faces and re-set once, at rest, if the fonts arrive later.

### 4.4 Multilingual Typesetting

The interface is English. Document text may be Japanese, Chinese, English or French, and every block carries its language, so the browser chooses the correct Han glyph forms and line-breaking rules:

- **Japanese and Chinese:** strict line breaking, inter-character justification and a one-em indent.
- **English and French:** hyphenation and `text-wrap: pretty`. French also gets a narrow no-break space before `; : ! ?` and inside « ».

Localized fields follow the repository's conventions (`title.ja/en`, `label_ja`/`label_en`, …). The **Text** selector resolves them with a stated fallback. Canonical content currently exists in Japanese only, and the reader says so rather than translating.

## 5. Physical Simulation, Lighting and Animation

### 5.1 Fold Geometry (`physics/fold.js`)

A leaf is grabbed at G0 and carried to P. Paper does not stretch, so the fold line is the perpendicular bisector of G0 and P:

- points closer to G0 fold over, reflected across that line;
- points closer to P stay flat.

The binding must stay intact, so P is constrained to |P − S| ≤ |G0 − S| for both ends S of the spine. The reverse side of the leaf is placed by one affine map: a mirror across the spine composed with the reflection across the fold. That composition is a rotation plus a translation, so the back of the page is never drawn mirrored.

### 5.2 Dynamics (`physics/spring.js`, `reader/book.js`)

- **Dragging:** a stiff spring follows the hand.
- **Release:** a critically damped spring settles the leaf. A turn completes past a travel threshold or on a flick (lower thresholds on a single page, for phone swipes).
- **Clicks, taps and keys:** the leaf turns along a lifted arc, eased with a sine over 0.85 s and timed by the clock, so a turn ends on time even when frames drop.
- **Hover peek:** at rest, a corner under the cursor lifts slightly.
- **Repeated presses** accumulate.
- **Jumps** from the contents or the scrubber reveal the destination in a single turn.
- **Single-page mode:** the leaf's reverse shows the same sheet from behind, as a faint mirrored show-through.

### 5.3 Lighting (`physics/light.js`)

The light is a design token: `--light-x/y/z` in `tokens.css`, a window at the upper left by day and an overhead lamp at night. From that single vector the site derives:

- every paper shadow (pure CSS, offset away from the light and growing with lift);
- the cylindrical shading of the book spines;
- the light falloff across each page and the gutter shading;
- the shading of a turning page's curl (Lambert diffuse plus a soft specular sheen across the rolled band);
- the shadow the curl casts on the revealed page;
- the flap's own cast shadow.

### 5.4 Cost Discipline

- Nothing animates at rest except a slow, compositor-only "breathing" of the open page's free edge.
- The animation loop exists only while something moves.
- During a turn, the visible front of the leaf and its folded back both lie on the hand's side of the fold. One rotated, overflow-clipped layer — a half-plane clip — therefore cuts both. Each frame changes three transforms and a few SVG points, and no page text is repainted. Measured at about 90–100 frames per second in a headless browser with GPU rendering.
- The cast shadow uses stacked offset polygons instead of a per-frame blur.
- `prefers-reduced-motion` replaces turns with an immediate change.
- Workspace edits are saved after a short pause in typing, and any pending save is flushed when you leave the page.

## 6. Interaction Reference

| Where | Action |
|---|---|
| Anywhere | `/` or `Ctrl`/`⌘`+`K` opens search; the sun/moon button switches daylight and lamplight |
| Projects | **New project** opens a short form: title, identifier and purpose |
| Project | Stage tiles open a stage; **Edit details** changes the title and purpose |
| Stage | Set the stage status; open a task; keep stage notes; **Record a decision** at the review gate; **Read the handbook** and **Stage definitions** open the reading room |
| Task | Tick procedure steps and acceptance criteria; set the task status; **Start** a form or checklist the task produces; **Copy prompt** or **Copy with task context**; guidance links open the reading room |
| Document | Fields, tables, choices and checklist items save as you type; **Draft / In review / Final**; **Record a decision** |
| Book | Drag a page's outer edge (the fold follows the hand); click or tap an edge; `←` `→` `PageUp` `PageDown` `Home` `End`; scrubber at the bottom; contents entries jump |
| Book or Sheet | Toolbar switches mode, text language and type size |
| Sheet (definitions) | Provenance rail: authority as declared, and everything that references the definition |

Routes:

| Route | Page |
|---|---|
| `#/` | Projects |
| `#/p/<project>` | A project's stages, documents and decisions |
| `#/p/<project>/s/NN` | A stage of the project |
| `#/p/<project>/s/NN/t/<task>` | The task assistant |
| `#/p/<project>/d/<document>` | The document editor |
| `#/library[/shared\|/stage_NN]`, `#/library/doc/<ID>` | The library and its forms and checklists |
| `#/stage/NN`, `#/stage/NN/handbook`, `#/stage/NN/doc/<ID>` | A stage's definitions, its handbook, one definition |

A reader opened from the workspace carries `?from=<route>`, and its **Back** link returns there.

## 7. Running and Building

```bash
make os            # the workspace and reading room at http://127.0.0.1:8765/ (records in projects/)
make site          # rebuild os-site/data/ from the canonical JSON
make site-serve    # the reading room only, served statically
```

To keep records elsewhere: `python3 script/serve_os.py --port 8765 --projects-dir <dir>`. `projects/` is git-ignored because records may hold confidential material.

The client is ES modules, CSS and JSON with no build step and no dependencies. `file://` does not work, because modules and `fetch` need HTTP. After changing canonical content, run `make site` and commit the regenerated bundles. The test suite fails if they are stale.

## 8. Quality Assurance

`make test` covers:

- the data bundles (`tests/test_site_data.py`): completeness against the source tree, every reference resolving, no approval claims, hashes, determinism and freshness;
- the workspace server (`tests/test_serve_os.py`), against a temporary directory: the project lifecycle, rejection of bad identifiers and unknown templates, the JSON and local-host requirements, and that the records it writes pass `validate_repo.py`.

Query switches for visual QA, read only by the client:

| Switch | Effect |
|---|---|
| `?theme=dark` | Lamplight |
| `?lang=fr` | Text language |
| `?mode=sheet` | Reading mode |
| `?page=12` | Start page |
| `?peel=0.4` | Freeze a turn at 40 % for inspection |
| `?turns=3` | Perform real turns through the engine |
| `?qa=1` | Expose the book as `window.__book` |

## 9. Accessibility

- Text is real, selectable DOM text in every mode.
- Each element carries its language.
- Keyboard focus is visible, and pages and the scrubber are labelled.
- Procedure steps and criteria are checkboxes, and document status is a radio group, to assistive technology.
- Saving, filter counts and confirmations are announced politely.
- Reduced motion is respected.
- The sheet mode is the plain, linear reading path for any document.

Colour is never the only carrier of meaning: dye depth is always accompanied by the stage number, and every status mark by its word.

## 10. Limitations and Next Steps

- **Single user, local.** There are no accounts, identities or access control. A decision's "decided by" is a typed name, not a verified identity. Do not expose the server on a network.
- **Records are partial.**
  - Filled checklists are kept as document instances. Checklist runs (`core/model/v1/schemas/checklist_run.schema.json`) are not yet written as separate records.
  - Task dependencies are not modelled.
- **Template revisions.** A document pins its template version. The editor opens only versions present in the data bundles, so a document pinned to a version that has since been archived cannot yet be opened.
- **Fonts** come from Google Fonts when reachable. Self-hosted, subsetted fonts would remove that dependency.
- **Translations:** no English, Chinese or French translations of the canonical content exist yet. The selector and the renderer are ready for them.
- **Audio, video and interactive explainers** are not implemented; the block model leaves room for them.

## 11. File Map

```text
index.html                 entry point
assets/css/                tokens (themes, light, dye), base, views, doc (typography), reader (book), workspace
assets/js/core/            dom, i18n, store, data, api, status, router, ticker, fonts
assets/js/physics/         fold geometry, springs, light
assets/js/render/          document model, block renderer, paginator, page renderer
assets/js/reader/          reader shell, book engine, sheet
assets/js/views/           projects, project, project stage, task assistant, document editor,
                           library, stage room, cards, provenance rail, shared workspace parts (ws)
assets/js/ui/              chrome (top bar, theme), dialog, search palette
data/                      generated bundles — never edit by hand
../script/serve_os.py      the local workspace server
```
