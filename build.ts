#!/usr/bin/env bun

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync, copyFileSync } from 'fs';
import { join, basename, dirname, extname } from 'path';

interface ParsedMarkdown {
  title: string;
  content: string;
  slug: string;
}

class SimpleMarkdownParser {
  private imagesToCopy: Array<{source: string, dest: string, relativePath: string}> = [];

  parse(markdown: string, sourceDir: string, outputPath: string): string {
    return markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        // Clean up the source path (remove quotes)
        const cleanSrc = src.replace(/["']/g, '');
        
        // Handle relative paths starting with ./ 
        if (cleanSrc.startsWith('./')) {
          const imageName = basename(cleanSrc.substring(2));
          const sourcePath = join(sourceDir, imageName);
          
          // Calculate relative path from output location to assets directory
          const outputDir = dirname(outputPath);
          const relativeDepth = outputPath.split('/').length - 2; // subtract 1 for dist, 1 for filename
          const relativePath = '../'.repeat(relativeDepth) + 'assets/' + imageName;
          const destPath = join('dist/assets', imageName);
          
          // Store for copying later
          this.imagesToCopy.push({
            source: sourcePath,
            dest: destPath,
            relativePath: relativePath
          });
          
          return `<img src="${relativePath}" alt="${alt}">`;
        }
        
        // For absolute URLs, keep as-is
        return `<img src="${cleanSrc}" alt="${alt}">`;
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote-line>$1</blockquote-line>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
      .replace(/(<li>.*<\/li>)/s, (match) => {
        const items = match.match(/<li>.*?<\/li>/g);
        if (items && items.some(item => /^\d+\./.test(item))) {
          return `<ol>${items.join('')}</ol>`;
        }
        return `<ul>${items?.join('') || ''}</ul>`;
      })
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '')
      .join('\n')
      .replace(/<p><h([1-6])>/g, '<h$1>')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><img/g, '<img')
      .replace(/><\/p>/g, '>')
      .replace(/<p><blockquote-line>/g, '<blockquote-line>')
      .replace(/<\/blockquote-line><\/p>/g, '</blockquote-line>')
      .replace(/(<blockquote-line>.*<\/blockquote-line>)/s, (match) => {
        const lines = match.match(/<blockquote-line>(.*?)<\/blockquote-line>/g);
        if (lines) {
          const content = lines.map(line => line.replace(/<\/?blockquote-line>/g, '')).join('<br>');
          return `<blockquote>${content}</blockquote>`;
        }
        return match;
      })
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<p><ol>/g, '<ol>')
      .replace(/<\/ol><\/p>/g, '</ol>')
      .replace(/<p><li>/g, '<li>')
      .replace(/<\/li><\/p>/g, '</li>')
      .replace(/<p><\/p>/g, '');
  }

  parseFile(filePath: string, outputPath: string = ''): ParsedMarkdown {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const firstLine = lines[0];
    const title = firstLine.startsWith('# ') ? firstLine.substring(2) : basename(filePath, '.md');
    const slug = basename(filePath, '.md');
    const sourceDir = dirname(filePath);
    
    return {
      title,
      content: this.parse(content, sourceDir, outputPath),
      slug
    };
  }

  getImagesToCopy(): Array<{source: string, dest: string, relativePath: string}> {
    return this.imagesToCopy;
  }

  clearImagesToCopy(): void {
    this.imagesToCopy = [];
  }
}

class StaticSiteBuilder {
  private parser = new SimpleMarkdownParser();
  private distDir = 'dist';
  
  constructor() {
    this.ensureDistDir();
  }

  private ensureDistDir() {
    if (!existsSync(this.distDir)) {
      mkdirSync(this.distDir, { recursive: true });
    }
    // Ensure assets directory exists
    const assetsDir = join(this.distDir, 'assets');
    if (!existsSync(assetsDir)) {
      mkdirSync(assetsDir, { recursive: true });
    }
  }

  private copyImages() {
    const imagesToCopy = this.parser.getImagesToCopy();
    for (const image of imagesToCopy) {
      if (existsSync(image.source)) {
        try {
          // Ensure destination directory exists
          const destDir = dirname(image.dest);
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }
          copyFileSync(image.source, image.dest);
          console.log(`Copied image: ${image.source} -> ${image.dest}`);
        } catch (error) {
          console.warn(`Warning: Could not copy image ${image.source} to ${image.dest}: ${error}`);
        }
      } else {
        console.warn(`Warning: Image not found: ${image.source}`);
      }
    }
    this.parser.clearImagesToCopy();
  }

  private createTemplate(title: string, content: string, cssPath = './styles.css', scriptPath = './script.js'): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="${cssPath}">
</head>
<body>
    <header>
        <nav>
            <a href="/">Home</a>
            <a href="/updates">Blog</a>
            <a href="/photos">Photos</a>
            <button id="theme-toggle" aria-label="Toggle dark/light theme">🌓</button>
        </nav>
    </header>
    <main>
        ${content}
    </main>
    <footer>
        <div class="social-links">
            <a href="https://github.com/jackrr" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
            </a>
            <a href="https://www.linkedin.com/in/jack-ratner-1359b45a/" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
            </a>
            <a href="https://bsky.app/profile/jackratner.bsky.social" aria-label="Bluesky" target="_blank" rel="noopener noreferrer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.5c-2.4 2.8-5.8 8.3-6.9 11.1-.6 1.5-.9 2.8-.9 3.9 0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.1-.3-2.4-.9-3.9C10.2 10.8 9.4 5.3 12 2.5z"/>
                    <path d="M12 2.5c2.4 2.8 5.8 8.3 6.9 11.1.6 1.5.9 2.8.9 3.9 0 2.2-1.8 4-4 4s-4-1.8-4-4c0-1.1.3-2.4.9-3.9C13.8 10.8 14.6 5.3 12 2.5z"/>
                    <circle cx="12" cy="12" r="1.5"/>
                </svg>
            </a>
        </div>
    </footer>
    <script src="${scriptPath}"></script>
</body>
</html>`;
  }

  buildHomepage() {
    const homepage = this.parser.parseFile('content/homepage.md', 'dist/index.html');
    
    // Add recent blog posts
    const blogPosts = this.getBlogPosts();
    const recentPosts = blogPosts.slice(0, 3);
    const blogSection = `
      <section class="recent-posts">
        <h2>Recent Blog Posts</h2>
        ${recentPosts.map(post => `
          <article>
            <h3><a href="/updates/${post.slug}">${post.title}</a></h3>
          </article>
        `).join('')}
        <a href="/updates">View all posts →</a>
      </section>
    `;

    // Add photos section
    const photosSection = `
      <section class="photos">
        <h2>Photo Galleries</h2>
        <p>Photo galleries will be available soon.</p>
        <a href="/photos">View all galleries →</a>
      </section>
    `;

    // Add projects section
    const projects = this.getProjects();
    const projectsSection = `
      <section class="projects">
        <h2>Projects</h2>
        ${projects.map(project => `
          <article>
            <h3><a href="/projects/${project.slug}">${project.title}</a></h3>
          </article>
        `).join('')}
      </section>
    `;

    const fullContent = homepage.content + blogSection + photosSection + projectsSection;
    const html = this.createTemplate(homepage.title, fullContent);
    
    writeFileSync(join(this.distDir, 'index.html'), html);
  }

  buildBlogIndex() {
    const blogPosts = this.getBlogPosts();
    const content = `
      <h1>Blog Posts</h1>
      ${blogPosts.map(post => `
        <article>
          <h2><a href="/updates/${post.slug}">${post.title}</a></h2>
        </article>
      `).join('')}
    `;
    
    const html = this.createTemplate('Blog Posts', content, '../styles.css', '../script.js');
    
    mkdirSync(join(this.distDir, 'updates'), { recursive: true });
    writeFileSync(join(this.distDir, 'updates', 'index.html'), html);
  }

  buildBlogPosts() {
    const blogPosts = this.getBlogPosts();
    
    blogPosts.forEach(post => {
      const html = this.createTemplate(post.title, post.content, '../styles.css', '../script.js');
      writeFileSync(join(this.distDir, 'updates', `${post.slug}.html`), html);
    });
  }

  buildProjects() {
    const projects = this.getProjects();
    
    mkdirSync(join(this.distDir, 'projects'), { recursive: true });
    
    projects.forEach(project => {
      const html = this.createTemplate(project.title, project.content, '../styles.css', '../script.js');
      writeFileSync(join(this.distDir, 'projects', `${project.slug}.html`), html);
    });
  }

  buildPhotosIndex() {
    const photosDir = 'content/photos';
    mkdirSync(join(this.distDir, 'photos'), { recursive: true });
    
    if (!existsSync(photosDir)) {
      const content = '<h1>Photo Galleries</h1><p>No photo galleries available yet.</p>';
      const html = this.createTemplate('Photo Galleries', content, '../styles.css', '../script.js');
      writeFileSync(join(this.distDir, 'photos', 'index.html'), html);
      return;
    }

    const galleries = this.getPhotoGalleries();
    
    if (galleries.length === 0) {
      const content = '<h1>Photo Galleries</h1><p>No photo galleries found in content/photos.</p>';
      const html = this.createTemplate('Photo Galleries', content, '../styles.css', '../script.js');
      writeFileSync(join(this.distDir, 'photos', 'index.html'), html);
      return;
    }

    // Build photo galleries index
    const content = `
      <h1>Photo Galleries</h1>
      ${galleries.map(gallery => `
        <article class="gallery-preview">
          <h2><a href="/photos/${gallery.name}">${gallery.displayName}</a></h2>
          <p>${gallery.imageCount} photos</p>
          ${gallery.previewImage ? `<img src="/photos/${gallery.name}/${gallery.previewImage}" alt="${gallery.displayName} preview" class="gallery-preview-image">` : ''}
        </article>
      `).join('')}
    `;
    
    const html = this.createTemplate('Photo Galleries', content, '../styles.css', '../script.js');
    writeFileSync(join(this.distDir, 'photos', 'index.html'), html);

    // Build individual gallery pages
    this.buildPhotoGalleries(galleries);
  }

  buildPhotoGalleries(galleries: Array<{name: string, displayName: string, images: string[], imageCount: number}>) {
    galleries.forEach(gallery => {
      const galleryContent = `
        <h1>${gallery.displayName}</h1>
        <div class="photo-gallery">
          ${gallery.images.map((image, index) => `
            <div class="photo-item">
              <a href="/photos/${gallery.name}/${this.getImageNameWithoutExt(image)}" class="photo-link">
                <img src="/photos/${gallery.name}/${image}" alt="${image}" loading="lazy" class="gallery-image">
              </a>
            </div>
          `).join('')}
        </div>
        <a href="/photos" class="back-link">← Back to all galleries</a>
      `;
      
      const html = this.createTemplate(gallery.displayName, galleryContent, '../../styles.css', '../../script.js');
      
      const galleryDir = join(this.distDir, 'photos', gallery.name);
      mkdirSync(galleryDir, { recursive: true });
      
      // Copy images to dist directory and create individual photo pages
      gallery.images.forEach((image, index) => {
        const sourcePath = join('content/photos', gallery.name, image);
        const destPath = join(galleryDir, image);
        
        // Copy image file
        if (existsSync(sourcePath)) {
          try {
            copyFileSync(sourcePath, destPath);
          } catch (error) {
            console.warn(`Warning: Could not copy ${sourcePath} to ${destPath}`);
          }
        }
        
        // Create individual photo page
        this.buildIndividualPhotoPage(gallery, image, index);
      });
      
      writeFileSync(join(galleryDir, 'index.html'), html);
    });
  }

  buildIndividualPhotoPage(gallery: {name: string, displayName: string, images: string[]}, image: string, currentIndex: number) {
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : gallery.images.length - 1;
    const nextIndex = currentIndex < gallery.images.length - 1 ? currentIndex + 1 : 0;
    const prevImage = gallery.images[prevIndex];
    const nextImage = gallery.images[nextIndex];
    
    const photoContent = `
      <div class="photo-viewer" data-gallery="${gallery.name}" data-current="${currentIndex}" data-total="${gallery.images.length}">
        <div class="photo-nav">
          <a href="/photos/${gallery.name}" class="back-to-gallery">← Back to ${gallery.displayName}</a>
          <div class="photo-counter">${currentIndex + 1} / ${gallery.images.length}</div>
        </div>
        
        <div class="photo-display">
          <a href="/photos/${gallery.name}/${this.getImageNameWithoutExt(prevImage)}" class="nav-prev" aria-label="Previous photo">
            <span>‹</span>
          </a>
          
          <div class="photo-main">
            <img src="/photos/${gallery.name}/${image}" alt="${image}" class="full-photo">
          </div>
          
          <a href="/photos/${gallery.name}/${this.getImageNameWithoutExt(nextImage)}" class="nav-next" aria-label="Next photo">
            <span>›</span>
          </a>
        </div>
        
        <div class="photo-info">
          <h2>${image}</h2>
        </div>
      </div>
    `;
    
    const html = this.createTemplate(`${image} - ${gallery.displayName}`, photoContent, '../../../styles.css', '../../../script.js');
    
    const photoFileName = this.getImageNameWithoutExt(image) + '.html';
    const photoPath = join(this.distDir, 'photos', gallery.name, photoFileName);
    writeFileSync(photoPath, html);
  }

  private getImageNameWithoutExt(filename: string): string {
    return basename(filename, extname(filename));
  }

  private getPhotoGalleries() {
    const photosDir = 'content/photos';
    if (!existsSync(photosDir)) return [];
    
    const galleries = [];
    const entries = readdirSync(photosDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const galleryPath = join(photosDir, entry.name);
        const images = readdirSync(galleryPath)
          .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
          .sort();
        
        if (images.length > 0) {
          galleries.push({
            name: entry.name,
            displayName: entry.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            images,
            imageCount: images.length,
            previewImage: images[0] // Use first image as preview
          });
        }
      }
    }
    
    return galleries;
  }

  buildStyles() {
    const css = `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      :root {
        --bg-color: #ffffff;
        --text-color: #000000;
        --link-color: #0066cc;
        --border-color: #cccccc;
      }

      @media (prefers-color-scheme: dark) {
        :root {
          --bg-color: #1a1a1a;
          --text-color: #ffffff;
          --link-color: #4da6ff;
          --border-color: #444444;
        }
      }

      [data-theme="dark"] {
        --bg-color: #1a1a1a;
        --text-color: #ffffff;
        --link-color: #4da6ff;
        --border-color: #444444;
      }

      [data-theme="light"] {
        --bg-color: #ffffff;
        --text-color: #000000;
        --link-color: #0066cc;
        --border-color: #cccccc;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.6;
        color: var(--text-color);
        background-color: var(--bg-color);
        transition: background-color 0.3s, color 0.3s;
      }

      header {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        margin-bottom: 2rem;
      }

      nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
      }

      nav a {
        color: var(--link-color);
        text-decoration: none;
        margin-right: 1rem;
        font-weight: 500;
      }

      nav a:hover {
        text-decoration: underline;
      }

      #theme-toggle {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-color);
        padding: 0.5rem;
        cursor: pointer;
        border-radius: 4px;
        font-size: 1rem;
      }

      main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }

      h1, h2, h3, h4 {
        margin-bottom: 1rem;
        color: var(--text-color);
      }

      h4 {
        font-size: 1.1rem;
        margin-bottom: 0.75rem;
      }

      img {
        max-width: 100%;
        height: auto;
        margin: 1rem 0;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      blockquote {
        margin: 1.5rem 0;
        padding: 1rem 1.5rem;
        border-left: 4px solid var(--link-color);
        background: rgba(0, 0, 0, 0.05);
        border-radius: 0 8px 8px 0;
        font-style: italic;
        color: var(--text-color);
      }

      p {
        margin-bottom: 1rem;
      }

      a {
        color: var(--link-color);
      }

      ul, ol {
        margin-bottom: 1rem;
        padding-left: 2rem;
      }

      section {
        margin-bottom: 3rem;
      }

      article {
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      /* Photo Gallery Styles */
      .gallery-preview {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding: 1rem;
        border: 1px solid var(--border-color);
        border-radius: 8px;
      }

      .gallery-preview-image {
        width: 200px;
        height: 150px;
        object-fit: cover;
        border-radius: 4px;
        margin-top: 0.5rem;
      }

      .photo-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
      }

      .photo-item {
        position: relative;
        aspect-ratio: 4/3;
        overflow: hidden;
        border-radius: 8px;
        border: 1px solid var(--border-color);
      }

      .gallery-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      .photo-link:hover .gallery-image {
        transform: scale(1.05);
      }

      .back-link {
        display: inline-block;
        margin-top: 2rem;
        color: var(--link-color);
        text-decoration: none;
        font-weight: 500;
      }

      .back-link:hover {
        text-decoration: underline;
      }

      /* Individual Photo Viewer Styles */
      .photo-viewer {
        max-width: 100%;
      }

      .photo-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .back-to-gallery {
        color: var(--link-color);
        text-decoration: none;
        font-weight: 500;
      }

      .back-to-gallery:hover {
        text-decoration: underline;
      }

      .photo-counter {
        color: var(--text-color);
        font-size: 0.9rem;
        opacity: 0.8;
      }

      .photo-display {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 2rem;
        min-height: 70vh;
      }

      .photo-main {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .full-photo {
        max-width: 100%;
        max-height: 70vh;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .nav-prev, .nav-next {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background: rgba(0, 0, 0, 0.1);
        border: 1px solid var(--border-color);
        border-radius: 50%;
        color: var(--text-color);
        text-decoration: none;
        transition: all 0.3s ease;
        flex-shrink: 0;
      }

      .nav-prev span, .nav-next span {
        font-size: 3rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        transform: translateY(-0.12em);
      }

      .nav-prev:hover, .nav-next:hover {
        background: rgba(0, 0, 0, 0.2);
        transform: scale(1.1);
      }

      .photo-info {
        text-align: center;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 8px;
        margin-top: 1rem;
      }

      .photo-info h2 {
        margin: 0;
        font-size: 1.1rem;
        color: var(--text-color);
      }

      @media (max-width: 768px) {
        nav {
          flex-direction: column;
          gap: 1rem;
        }
        
        main {
          padding: 0 0.5rem;
        }

        .photo-gallery {
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        }

        .gallery-preview-image {
          width: 150px;
          height: 112px;
        }

        .photo-display {
          flex-direction: column;
          gap: 0.5rem;
          min-height: 50vh;
        }

        .nav-prev, .nav-next {
          width: 50px;
          height: 50px;
        }

        .nav-prev span, .nav-next span {
          font-size: 2rem;
          transform: translateY(-0.08em);
        }

        .photo-nav {
          flex-direction: column;
          gap: 0.5rem;
          align-items: center;
          text-align: center;
        }
      }

      /* Footer Styles */
      footer {
        margin-top: 4rem;
        padding: 2rem 1rem;
        border-top: 1px solid var(--border-color);
        background: var(--bg-color);
      }

      .social-links {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        max-width: 1200px;
        margin: 0 auto;
      }

      .social-links a {
        color: var(--text-color);
        transition: color 0.3s ease, transform 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.05);
      }

      .social-links a:hover {
        color: var(--link-color);
        transform: translateY(-2px);
        background: rgba(0, 0, 0, 0.1);
      }

      .social-links svg {
        width: 24px;
        height: 24px;
      }

      @media (max-width: 480px) {
        header {
          padding: 0.5rem;
        }
        
        nav a {
          margin-right: 0.5rem;
          font-size: 0.9rem;
        }

        footer {
          margin-top: 2rem;
          padding: 1.5rem 0.5rem;
        }

        .social-links {
          gap: 1rem;
        }

        .social-links svg {
          width: 20px;
          height: 20px;
        }
      }
    `;
    
    writeFileSync(join(this.distDir, 'styles.css'), css);
  }

  buildScript() {
    const js = `
      // Theme toggle functionality
      const themeToggle = document.getElementById('theme-toggle');
      const html = document.documentElement;

      // Initialize theme based on system preference or stored preference
      const savedTheme = localStorage.getItem('theme');
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
      } else if (systemPrefersDark) {
        html.setAttribute('data-theme', 'dark');
      } else {
        html.setAttribute('data-theme', 'light');
      }

      themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      });

      // Photo navigation with arrow keys
      const photoViewer = document.querySelector('.photo-viewer');
      if (photoViewer) {
        const galleryName = photoViewer.dataset.gallery;
        const currentIndex = parseInt(photoViewer.dataset.current);
        const totalImages = parseInt(photoViewer.dataset.total);
        
        // Get navigation URLs
        const prevButton = document.querySelector('.nav-prev');
        const nextButton = document.querySelector('.nav-next');
        const prevUrl = prevButton ? prevButton.href : null;
        const nextUrl = nextButton ? nextButton.href : null;
        
        // Arrow key navigation
        document.addEventListener('keydown', (event) => {
          switch(event.key) {
            case 'ArrowLeft':
              event.preventDefault();
              if (prevUrl) {
                window.location.href = prevUrl;
              }
              break;
            case 'ArrowRight':
              event.preventDefault();
              if (nextUrl) {
                window.location.href = nextUrl;
              }
              break;
            case 'Escape':
              event.preventDefault();
              // Go back to gallery
              window.location.href = '/photos/' + galleryName;
              break;
          }
        });
      }
    `;
    
    writeFileSync(join(this.distDir, 'script.js'), js);
  }

  private getBlogPosts(): ParsedMarkdown[] {
    const blogDir = 'content/blog';
    if (!existsSync(blogDir)) return [];
    
    const files = readdirSync(blogDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const slug = basename(file, '.md');
        const outputPath = `dist/updates/${slug}.html`;
        return this.parser.parseFile(join(blogDir, file), outputPath);
      });
    
    return files;
  }

  private getProjects(): ParsedMarkdown[] {
    const projectsDir = 'content/projects';
    if (!existsSync(projectsDir)) return [];
    
    const files = readdirSync(projectsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => {
        const slug = basename(file, '.md');
        const outputPath = `dist/projects/${slug}.html`;
        return this.parser.parseFile(join(projectsDir, file), outputPath);
      });
    
    return files;
  }

  build() {
    console.log('Building static site...');
    
    this.buildHomepage();
    this.buildBlogIndex();
    this.buildBlogPosts();
    this.buildProjects();
    this.buildPhotosIndex();
    this.buildStyles();
    this.buildScript();
    
    // Copy all images that were referenced in markdown
    this.copyImages();
    
    console.log('Build complete! Files generated in dist/');
  }
}

// Run the build
const builder = new StaticSiteBuilder();
builder.build();