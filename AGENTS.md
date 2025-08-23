# Agentic AI Instructions

Please follow the instructions within `./AGENTS.md` (this file) to build and maintain a static personal website within the current directory.

It is expected that the agent will create and manage a build process to translate source data in `./content` into a static website that meets the following ground rules and implements the following features:

## Ground rules

- DO NOT INSTALL ANYTHING OR MAKE CHANGES outside the scope of the current working directory
- The generated website must be static, no backend runtimes beyond a simple static server should be necessary to host it
- KEEP IT SIMPLE. The static site should be mostly html with just enough CSS and javascript to achieve the functionality requested.
- The build code should be implemented in TypeScript targeting the Bun runtime
- Avoid frameworks or any external dependencies -- always request permission to add any dependency or package to the project
- DO NOT MODIFY `./content` and its contents
- Every page should be responsive to work on desktop, tablet, and mobile devices
- Colors should be high contrast to meet accessibility standards
- Keep `./README.md` up to date with a high-level implementation overview of how the build process works
- All changes should be made on git feature branches. DO NOT PUSH TO `main` branch.
- Open pull requests to `main` for any changes that are ready.

## Features

- Homepage at `/`
  - Content should be sourced from `./content/hompage.md`
  - Link to index of all photo galleries at `/photos`
  - Links to recent photo galleries with preview photos for each
  - Link to index of all blog posts
  - Links to recent blog posts
  - Projects section with summaries of each project and link to project page
  - Includes a summary of me and my skills
- Photo gallery index at `/photos`
- Photo gallery at `/photos/:gallery-name`
  - `:gallery-name` in the URL refers to a specific gallery with content at `./content/photos/:gallery-name`
  - `./content/photos/:gallery-name/meta.yaml` contains metadata for the gallery
  - Gallery should have a scrolling experience to browse all photos, with delayed loading of images until they are nearing the viewport (infinite scroll)
  - Clicking a photo should open a full-page view of the image at `/photos/:gallery-name/:image-name`
- Blog at `/updates`
- Blog post at `/updates/:post-name`
  - `:post-name` in the URL refers to a specific blog post with content at `./content/blog/:post-name.md`
  - metadata for the post will live at `./content/blog/:post-name.meta.yaml`
- Each project at `/projects/:project-name`
  - `:project-name` in the URL refers to a specific project with content at `./content/projects/:project-name.md`
  - metadata for the project will live at `./content/projects/:project-name.meta.yaml`
    - if metadata contains a `dependencies` field, the files listed should be copied as-is to the same relative location of the generated html file for the project
	- if metadata contains an `additional_html` field, append the contents of the referenced file to the bottom of the page contents of the generated html file
- A dark/light theme toggle that uses device settings for the default
- A Github action to run the static site build step on every push to the `main` branch
- Site about page at `/about-this-site`, with an "About" link in the footer
- A footer containing icon links to my github (github.com/jackrr), my linkedin (https://www.linkedin.com/in/jack-ratner-1359b45a/), and my bluesky (https://bsky.app/profile/jackratner.bsky.social)

## Content

All content will live in `./content/*`. Agents MUST treat `./content` and all its contents as READ ONLY. DO NOT write, edit, OR delete the contents of this directory.

All site content should be organized in an intuitive directory structure that makes it trivially easy to update photo galleries, homepage content, and blog content.
