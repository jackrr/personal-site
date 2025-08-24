# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- HTML file inclusion feature: Image markdown tags that reference HTML files now include the HTML content directly in the compiled output
- Enhanced Eymo project interface with improved UI/UX:
  - Modern responsive design with better layout and styling
  - Loading state with spinner animation during WASM initialization
  - Hidden UI elements until initialization completes
  - Multiline textarea for command editing instead of single-line input
  - Sample configuration buttons for quick preset loading
  - Automatic command submission when sample configs are selected
  - Error handling with user-friendly messages
  - Mobile-responsive button layouts
- WebGPU compatibility notice in Eymo project documentation
- CHANGELOG.md file to track all project changes

## [2025-08-24]

### Added
- Ability to embed custom HTML and scripts in projects via image markdown syntax

## [2025-08-22]

### Fixed
- Fixed markdown list processing bug that merged separate lists incorrectly

### Changed
- Minor content updates and edits

## [2025-08-21]

### Added
- Mobile improvements: hamburger navigation menu and swipe navigation for photo galleries
- RSS feed generation for blog posts and photo galleries
- Footer with social links (GitHub, LinkedIn, Bluesky)
- Metadata-driven publication dates and gallery descriptions
- Code block formatting improvements with placeholder system

### Fixed
- Navigation routing issues
- Code block formatting problems
- RSS feed publication date preservation for existing items

### Changed
- Enhanced markdown parsing capabilities
- Comprehensive site improvements including list formatting and cleanup
- Updated documentation and README
- Disabled GitHub Actions deployment (switched to Cloudflare)
- Added dist/ to .gitignore

## [2025-08-20]

### Added
- Initial static site implementation with TypeScript and Bun
- Custom markdown parser supporting headers, links, lists, images, code blocks
- Development server with live reload
- Photo gallery system with:
  - Automatic image processing and resizing
  - Individual photo pages with navigation
  - Arrow key navigation support
  - Responsive grid layout
- Blog system with individual post pages
- Project showcase pages
- Dark/light theme toggle with system preference detection
- GitHub Actions for automated deployment
- Responsive design for desktop, tablet, and mobile devices
- High contrast accessibility features

### Infrastructure
- TypeScript build system targeting Bun runtime
- Custom static site generator (build.ts)
- Photo processing script (process-photos.ts)
- Development server (server.ts)
- GitHub Actions workflow for CI/CD

### Initial Content Structure
- Homepage with recent posts and galleries
- Blog posts at `/updates`
- Projects at `/projects`
- Photo galleries at `/photos`
- About page at `/about-this-site`

## [Initial Commit] - 2025-08-20

### Added
- Project initialization
- Empty README placeholder