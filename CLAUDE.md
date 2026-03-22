# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun run dev            # Build and serve locally at localhost:3000
bun run build          # Build static site to ./dist/
bun run serve          # Serve already-built site
bun run process-photos # Process/resize photos for galleries
```

## Architecture

This is a **custom static site generator** — no framework (no Next.js, Astro, etc.). The entire build system lives in `build.ts` (~1800 lines).

### Build pipeline (`build.ts`)

The `StaticSiteBuilder` class orchestrates everything:
- Reads markdown + YAML frontmatter from `content/`
- Renders HTML pages into `dist/`
- Copies referenced images to `dist/assets/`
- Generates `feed.xml` (RSS)

Key internal classes:
- `SimpleMarkdownParser` — custom markdown→HTML transpiler; handles image asset copying as a side effect
- `SimpleYamlParser` — lightweight frontmatter parser
- `createTemplate()` — wraps all pages in consistent HTML (nav, theme toggle, footer)

### Content structure

All source content lives in `content/`:
- `homepage.md`, `about.md` — single pages
- `blog/` — one `.md` file per post
- `projects/` — one `.md` file per project; optional `.meta.yaml` sidecar for `published_at` and `dependencies` (files to copy to dist, e.g. WASM)
- `photos/` — subdirectories become galleries; managed by `process-photos.ts`

### Routes produced

| Route | Source |
|---|---|
| `/` | `content/homepage.md` |
| `/about-this-site` | `content/about.md` |
| `/updates/` | all `content/blog/*.md` |
| `/updates/:slug` | individual blog posts |
| `/projects/` | all `content/projects/*.md` |
| `/photos/` | `content/photos/` subdirs |
| `/feed.xml` | auto-generated RSS |

### Asset handling

Images referenced in markdown are automatically copied to `dist/assets/` (paths flattened). HTML files can be embedded using a special image syntax: `![](./foo.html)` — the file content is inlined directly.

### Theming

Dark/light mode via CSS custom properties (`--bg`, `--fg`, etc.). Theme toggle stored in `localStorage`; system preference detected via `prefers-color-scheme`.

### Deployment

GitHub Actions (`.github/workflows/build.yml`) builds the site and commits `dist/` back to the repo on `workflow_dispatch`.
