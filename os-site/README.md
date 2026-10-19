# Operations OS Reading Room

The reading room is the web presentation of Operations OS. It shows every stage, handbook, task, procedure, standard, ethics entry, form, checklist and AI-assistance prompt. Each page is set live in the browser from the canonical JSON; no PDF is involved at any point.

> **Status:** first implementation (read-only, static). The site never edits definitions and holds no project records. Like the rest of the repository, everything it shows is a first draft and not institutionally approved.

## 1. Purpose and Scope

**In scope now**
- Reading, per stage:
  - the stage handbook, as a paginated book or a continuous sheet;
  - each task with its procedure, forms, checklists, standards, ethics guidance and AI prompt;
  - the review gate.
- The card catalogue of all 139 forms and checklists.
- Search across every definition.
- Provenance shown beside every definition: identifier, pinned version, source path, SHA-256 and declared authority.

**Out of scope now**
- Editing.
- Project execution: task runs, completed checklists, review decisions.
- Accounts, permissions and a server.

The site is a presentation layer. It must never become a second source of truth, infer completion, or display an approval that the data does not record.

## 2. Design Concept

### 2.1 A Reading Room

The interface is a quiet desk, and documents are lit paper objects on it. Two surfaces have their own colour tokens:

- **Desk:** the interface. It follows the theme.
- **Paper:** the documents. They stay paper in both themes.

The dark theme is *lamplight*, not an inversion: the room darkens and the paper warms under a desk lamp.

### 2.2 Structure Carries Information

Visual devices encode facts from the data:

| Device | Meaning |
|---|---|
| Spine thickness on the shelf | Number of definitions in the stage |
| Indigo depth of a spine, cover and stage marker | Position in the process: eight successive dye baths (藍染), from 瓶覗 to 褐 |
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

The print rules of the repository carry over: monochrome documents, unpadded section numbers, and no decorative boxes on content.

## 3. Rendering Architecture

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

### 3.1 Data Bundles

`script/build_site_data.py` uses only the standard library and resolves every `{kind, id, version}` pin, failing closed on any unresolved pin. It writes:

- `site.json`: the workflow, stage summaries, the template library and the search index;
- one `stage-NN.json` per stage: objects, the resolved handbook, the collection and reverse references;
- `templates.json`: every current form and checklist.

Builds are deterministic and use LF on every platform. `tests/test_site_data.py` checks that the committed bundles match a fresh build.

### 3.2 Document Model

`render/model.js` turns every kind of object into one stream of typed blocks. These include chapter, object head, heading, paragraph, list item, step, check, form section, field, source, reference, contents entry and provenance row.

Both renderings consume the same stream, and blocks keep stable indices. Switching between book and sheet, changing the type size or changing the language therefore keeps your place.

### 3.3 Pagination

Pages have a fixed virtual size and the book is scaled to the window, so page numbers do not change on resize. Pagination works as follows:

- Blocks are measured in a hidden page body of the exact width, then packed with keep-with-next rules.
- Paragraphs are split at sentence boundaries (`Intl.Segmenter`), falling back to words (Latin) or characters (CJK).
- Widow control carries at least two lines to the next page.
- A paragraph broken mid-sentence keeps its last line justified.
- Handbooks get a cover, endpapers with seigaiha waves, a title page, an edition notice, contents, an appendix of pinned sources, a colophon and a back cover. Front matter is numbered in lower-case roman numerals.

Japanese and Chinese web fonts arrive in many unicode-range subsets. Before measuring, the reader requests exactly the characters each document uses, per language and weight. The font stylesheet itself is non-blocking, so the site opens even where the font host is slow or unreachable. In that case, pages are set with local fallback faces and re-set once, at rest, if the fonts arrive later.

### 3.4 Multilingual Typesetting

The interface is English. Document text may be Japanese, Chinese, English or French, and every block carries its language, so the browser chooses the correct Han glyph forms and line-breaking rules:

- **Japanese and Chinese:** strict line breaking, inter-character justification and a one-em indent.
- **English and French:** hyphenation and `text-wrap: pretty`. French also gets a narrow no-break space before `; : ! ?` and inside « ».

Localized fields follow the repository's conventions (`title.ja/en`, `label_ja`/`label_en`, …). The **Text** selector resolves them with a stated fallback. Canonical content currently exists in Japanese only, and the reader says so rather than translating. The typesetting specimen (`assets/specimen.json`, public-domain passages) demonstrates all four languages.

## 4. Physical Simulation, Lighting and Animation

### 4.1 Fold Geometry (`physics/fold.js`)

A leaf is grabbed at G0 and carried to P. Paper does not stretch, so the fold line is the perpendicular bisector of G0 and P:

- points closer to G0 fold over, reflected across that line;
- points closer to P stay flat.

The binding must stay intact, so P is constrained to |P − S| ≤ |G0 − S| for both ends S of the spine. The reverse side of the leaf is placed by one affine map: a mirror across the spine composed with the reflection across the fold. That composition is a rotation plus a translation, so the back of the page is never drawn mirrored.

### 4.2 Dynamics (`physics/spring.js`, `reader/book.js`)

- **Dragging:** a stiff spring follows the hand.
- **Release:** a critically damped spring settles the leaf. A turn completes past a travel threshold or on a flick (lower thresholds on a single page, for phone swipes).
- **Clicks, taps and keys:** the leaf turns along a lifted arc, eased with a sine over 0.85 s and timed by the clock, so a turn ends on time even when frames drop.
- **Hover peek:** at rest, a corner under the cursor lifts slightly.
- **Repeated presses** accumulate.
- **Jumps** from the contents or the scrubber reveal the destination in a single turn.
- **Single-page mode:** the leaf's reverse shows the same sheet from behind, as a faint mirrored show-through.

### 4.3 Lighting (`physics/light.js`)

The light is a design token: `--light-x/y/z` in `tokens.css`, a window at the upper left by day and an overhead lamp at night. From that single vector the site derives:

- every paper shadow (pure CSS, offset away from the light and growing with lift);
- the cylindrical shading of the book spines;
- the light falloff across each page and the gutter shading;
- the shading of a turning page's curl (Lambert diffuse plus a soft specular sheen across the rolled band);
- the shadow the curl casts on the revealed page;
- the flap's own cast shadow.

### 4.4 Cost Discipline

- Nothing animates at rest except a slow, compositor-only "breathing" of the open page's free edge.
- The animation loop exists only while something moves.
- During a turn, the visible front of the leaf and its folded back both lie on the hand's side of the fold. One rotated, overflow-clipped layer — a half-plane clip — therefore cuts both. Each frame changes three transforms and a few SVG points, and no page text is repainted. Measured at about 90–100 frames per second in a headless browser with GPU rendering.
- The cast shadow uses stacked offset polygons instead of a per-frame blur.
- `prefers-reduced-motion` replaces turns with an immediate change.

## 5. Interaction Reference

| Where | Action |
|---|---|
| Anywhere | `/` or `Ctrl`/`⌘`+`K` opens search; the sun/moon button switches daylight and lamplight |
| Book | Drag a page's outer edge (the fold follows the hand); click or tap an edge; `←` `→` `PageUp` `PageDown` `Home` `End`; scrubber at the bottom; contents entries jump |
| Book or Sheet | Toolbar switches mode, text language and type size |
| Sheet (definitions) | Provenance rail: authority as declared, and everything that references the definition |

Routes: `#/`, `#/stage/NN`, `#/stage/NN/handbook`, `#/stage/NN/doc/<ID>`, `#/library[/shared|/stage_NN]`, `#/library/doc/<ID>`, `#/specimen`.

## 6. Running and Building

```bash
make site          # rebuild os-site/data/ from the canonical JSON
make site-serve    # rebuild, then serve at http://127.0.0.1:8765/
```

The site is static: ES modules, CSS and JSON with no build step and no dependencies. Any static file server works; `file://` does not, because modules and `fetch` need HTTP. After changing canonical content, run `make site` and commit the regenerated bundles. The test suite fails if they are stale.

## 7. Quality Assurance

`make test` covers the data bundles: completeness against the source tree, every reference resolving, no approval claims, hashes, determinism and freshness.

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

## 8. Accessibility

- Text is real, selectable DOM text in every mode.
- Each element carries its language.
- Keyboard focus is visible, and pages and the scrubber are labelled.
- Reduced motion is respected.
- The sheet mode is the plain, linear reading path for any document.

Colour is never the only carrier of meaning: dye depth is always accompanied by the stage number.

## 9. Limitations and Next Steps

- **Read-only.** Project records, task runs and review decisions need the execution layer proposed in `design/DESIGN_REVIEW_v18.md` (R8).
- **Fonts** come from Google Fonts when reachable. Self-hosted, subsetted fonts would remove that dependency.
- **Translations:** no English, Chinese or French translations of the canonical content exist yet. The selector and the renderer are ready for them.
- **Audio, video and interactive explainers** are not implemented; the block model leaves room for them.

## 10. File Map

```text
index.html                 entry point
assets/css/                tokens (themes, light, dye), base, views, doc (typography), reader (book)
assets/js/core/            dom, i18n, store, data, router, ticker, fonts
assets/js/physics/         fold geometry, springs, light
assets/js/render/          document model, block renderer, paginator, page renderer
assets/js/reader/          reader shell, book engine, sheet
assets/js/views/           atrium, stage room, library, cards, provenance rail
assets/js/ui/              chrome (top bar, theme), search palette
assets/specimen.json       typesetting specimen (public-domain texts)
data/                      generated bundles — never edit by hand
```
