# Personal Site

A static personal website built with TypeScript and Bun, featuring a blog, projects showcase, and photo galleries.

## Build Process Overview

The site uses a custom static site generator implemented in TypeScript (`build.ts`) that:

1. **Content Processing**: Reads markdown files from the `./content/` directory
   - `content/homepage.md` → Homepage at `/`
   - `content/blog/*.md` → Blog posts at `/updates/:post-name`
   - `content/projects/*.md` → Project pages at `/projects/:project-name`
   - `content/photos/*` → Photo galleries at `/photos/:gallery-name` (when available)

2. **Markdown Parsing**: Custom lightweight markdown parser that converts:
   - Headers (`#`, `##`, `###`)
   - Bold/italic text (`**bold**`, `*italic*`)
   - Links (`[text](url)`)
   - Lists (bulleted and numbered)

3. **HTML Generation**: Creates responsive HTML pages with:
   - Consistent navigation header
   - Dark/light theme support
   - Mobile-responsive design
   - High contrast accessibility

4. **Asset Generation**:
   - `styles.css` - Responsive CSS with CSS variables for theming
   - `script.js` - Theme toggle functionality with localStorage persistence

## Commands

- `bun run build` - Build the static site to `./dist/`
- `bun run dev` - Build and serve locally
- `bun run serve` - Serve the built site

## Directory Structure

```
├── build.ts          # Main build script
├── content/          # Source content (read-only)
│   ├── homepage.md
│   ├── blog/
│   └── projects/
├── dist/             # Generated static site
├── .github/workflows/ # GitHub Actions
└── package.json      # Project configuration
```

## Features

- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Dark/light theme toggle with system preference detection
- ✅ High contrast accessibility
- ✅ Blog with individual post pages
- ✅ Projects showcase
- ✅ Photo gallery support (when content available)
- ✅ GitHub Actions CI/CD
- ✅ Zero external dependencies for runtime

## For AI Agents

AGENTS.md contains instructions targeted to AI agents working within this project.
