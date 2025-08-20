#!/usr/bin/env bun

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, basename, dirname, extname } from 'path';

interface ParsedMarkdown {
  title: string;
  content: string;
  slug: string;
}

class SimpleMarkdownParser {
  parse(markdown: string): string {
    return markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
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
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<p><ol>/g, '<ol>')
      .replace(/<\/ol><\/p>/g, '</ol>')
      .replace(/<p><li>/g, '<li>')
      .replace(/<\/li><\/p>/g, '</li>')
      .replace(/<p><\/p>/g, '');
  }

  parseFile(filePath: string): ParsedMarkdown {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const firstLine = lines[0];
    const title = firstLine.startsWith('# ') ? firstLine.substring(2) : basename(filePath, '.md');
    const slug = basename(filePath, '.md');
    
    return {
      title,
      content: this.parse(content),
      slug
    };
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
    <script src="${scriptPath}"></script>
</body>
</html>`;
  }

  buildHomepage() {
    const homepage = this.parser.parseFile('content/homepage.md');
    
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
    // Handle case where photos directory doesn't exist
    const photosExist = existsSync('content/photos');
    const content = photosExist ? 
      '<h1>Photo Galleries</h1><p>Photo galleries will be implemented when content/photos directory is available.</p>' :
      '<h1>Photo Galleries</h1><p>No photo galleries available yet.</p>';
    
    const html = this.createTemplate('Photo Galleries', content, '../styles.css', '../script.js');
    
    mkdirSync(join(this.distDir, 'photos'), { recursive: true });
    writeFileSync(join(this.distDir, 'photos', 'index.html'), html);
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

      h1, h2, h3 {
        margin-bottom: 1rem;
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

      @media (max-width: 768px) {
        nav {
          flex-direction: column;
          gap: 1rem;
        }
        
        main {
          padding: 0 0.5rem;
        }
      }

      @media (max-width: 480px) {
        header {
          padding: 0.5rem;
        }
        
        nav a {
          margin-right: 0.5rem;
          font-size: 0.9rem;
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
    `;
    
    writeFileSync(join(this.distDir, 'script.js'), js);
  }

  private getBlogPosts(): ParsedMarkdown[] {
    const blogDir = 'content/blog';
    if (!existsSync(blogDir)) return [];
    
    const files = readdirSync(blogDir)
      .filter(file => file.endsWith('.md'))
      .map(file => this.parser.parseFile(join(blogDir, file)));
    
    return files;
  }

  private getProjects(): ParsedMarkdown[] {
    const projectsDir = 'content/projects';
    if (!existsSync(projectsDir)) return [];
    
    const files = readdirSync(projectsDir)
      .filter(file => file.endsWith('.md'))
      .map(file => this.parser.parseFile(join(projectsDir, file)));
    
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
    
    console.log('Build complete! Files generated in dist/');
  }
}

// Run the build
const builder = new StaticSiteBuilder();
builder.build();