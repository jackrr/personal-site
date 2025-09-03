#!/usr/bin/env bun

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync, copyFileSync, rmSync } from 'fs';
import { join, basename, dirname, extname } from 'path';

interface ParsedMarkdown {
  title: string;
  content: string;
  slug: string;
  lastUpdated?: Date;
  publishedAt?: Date;
  dependencies?: string[];
  additionalHtml?: string;
}

interface GalleryMeta {
  publishedAt?: Date;
  description?: string;
}

class SimpleYamlParser {
  static parseSimple(yamlContent: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = yamlContent.split('\n');
    let currentArray: string[] = [];
    let currentArrayKey = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed && !trimmed.startsWith('#')) {
        // Handle array continuation
        if (trimmed.startsWith('- ')) {
          if (currentArrayKey) {
            currentArray.push(trimmed.substring(2).trim());
          }
          continue;
        }
        
        // Finalize any ongoing array
        if (currentArrayKey && currentArray.length > 0) {
          result[currentArrayKey] = [...currentArray];
          currentArray = [];
          currentArrayKey = '';
        }
        
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex > 0) {
          const key = trimmed.substring(0, colonIndex).trim();
          const value = trimmed.substring(colonIndex + 1).trim();
          
          // Handle date parsing for published_at
          if (key === 'published_at') {
            result[key] = new Date(value);
          } else if (value === '' || value === null) {
            // This might be the start of an array
            currentArrayKey = key;
            currentArray = [];
          } else {
            result[key] = value;
          }
        }
      }
    }
    
    // Finalize any remaining array
    if (currentArrayKey && currentArray.length > 0) {
      result[currentArrayKey] = [...currentArray];
    }
    
    return result;
  }
}

class SimpleMarkdownParser {
  private imagesToCopy: Array<{source: string, dest: string, relativePath: string}> = [];
  private codeBlockPlaceholders: Map<string, string> = new Map();
  private inlineCodePlaceholders: Map<string, string> = new Map();
  private htmlBlockPlaceholders: Map<string, string> = new Map();

  parse(markdown: string, sourceDir: string, outputPath: string): string {
    let result = markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        // Clean up the source path (remove quotes)
        const cleanSrc = src.replace(/["']/g, '');
        
        // Handle relative paths starting with ./ 
        if (cleanSrc.startsWith('./')) {
          const imageRelativePath = cleanSrc.substring(2); // Remove ./
          const sourcePath = join(sourceDir, imageRelativePath);
          
          // Check if the file is an HTML file
          if (extname(imageRelativePath).toLowerCase() === '.html') {
            // Include the HTML file contents directly
            if (existsSync(sourcePath)) {
              try {
                const htmlContent = readFileSync(sourcePath, 'utf-8');
                // Use placeholder to protect HTML from paragraph processing
                const placeholder = `ĦĦĦHTMLBLOCK${Date.now()}X${Math.random().toString(36).substr(2, 9)}ĦĦĦ`;
                this.htmlBlockPlaceholders.set(placeholder, htmlContent);
                return placeholder;
              } catch (error) {
                console.warn(`Warning: Could not read HTML file ${sourcePath}: ${error}`);
                return `<!-- Error: Could not include HTML file: ${imageRelativePath} -->`;
              }
            } else {
              console.warn(`Warning: HTML file not found: ${sourcePath}`);
              return `<!-- Error: HTML file not found: ${imageRelativePath} -->`;
            }
          }
          
          // Flatten directory structure for assets - use only the filename
          const imageName = basename(imageRelativePath);
          
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
      .replace(/```([\s\S]*?)```/g, (match, content) => {
        // Use placeholder to protect from paragraph processing - avoid underscores which trigger italic processing
        const placeholder = `ĦĦĦCODEBLOCK${Date.now()}X${Math.random().toString(36).substr(2, 9)}ĦĦĦ`;
        this.codeBlockPlaceholders.set(placeholder, `<pre><code>${content}</code></pre>`);
        return placeholder;
      })
      .replace(/`([^`]+)`/g, (match, content) => {
        // Use placeholder to protect inline code from formatting processing
        const placeholder = `ĦĦĦINLINECODE${Date.now()}X${Math.random().toString(36).substr(2, 9)}ĦĦĦ`;
        this.inlineCodePlaceholders.set(placeholder, `<code>${content}</code>`);
        return placeholder;
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/^> (.+)$/gm, '<blockquote-line>$1</blockquote-line>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .split('\n')
      .map(line => line.trim() ? `<p>${line}</p>` : '')
      .join('\n')
      .replace(/<p><h([1-6])>/g, '<h$1>')
      .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
      .replace(/<p><img/g, '<img')
      .replace(/><\/p>/g, '>')
      .replace(/<p><pre>/g, '<pre>')
      .replace(/<\/pre><\/p>/g, '</pre>')
      .replace(/<p><blockquote-line>/g, '<blockquote-line>')
      .replace(/<\/blockquote-line><\/p>/g, '</blockquote-line>')
      .replace(/<p><li>/g, '<li>')
      .replace(/<\/li><\/p>/g, '</li>')
      .split('\n')
      .reduce((acc, line) => {
        if (line.includes('<blockquote-line>')) {
          // Start of a blockquote
          if (acc.length > 0 && !acc[acc.length - 1].includes('<blockquote>')) {
            acc.push('<blockquote>');
          } else if (acc.length === 0) {
            acc.push('<blockquote>');
          }
          const content = line.replace(/<\/?blockquote-line>/g, '');
          if (acc[acc.length - 1] === '<blockquote>') {
            acc[acc.length - 1] = '<blockquote>' + content;
          } else {
            acc[acc.length - 1] += '<br>' + content;
          }
        } else if (acc.length > 0 && acc[acc.length - 1].startsWith('<blockquote>') && !acc[acc.length - 1].endsWith('</blockquote>')) {
          // End the current blockquote
          acc[acc.length - 1] += '</blockquote>';
          acc.push(line);
        } else {
          acc.push(line);
        }
        return acc;
      }, [] as string[])
      .reduce((acc, line) => {
        // Handle list items
        if (line.includes('<li>')) {
          // Check if we're already in a list
          if (acc.length > 0 && (acc[acc.length - 1].includes('<ul>') || acc[acc.length - 1].includes('<ol>'))) {
            // Add to existing list
            acc[acc.length - 1] = acc[acc.length - 1].replace('</ul>', line + '</ul>').replace('</ol>', line + '</ol>');
          } else {
            // Start a new list - default to unordered list
            acc.push('<ul>' + line + '</ul>');
          }
        } else if (acc.length > 0 && (acc[acc.length - 1].includes('<ul>') || acc[acc.length - 1].includes('<ol>')) && line.trim() === '') {
          // End the current list on empty line
          acc.push(line);
        } else {
          acc.push(line);
        }
        return acc;
      }, [] as string[])
      .map(line => {
        // Clean up any unclosed blockquotes
        if (line.startsWith('<blockquote>') && !line.endsWith('</blockquote>')) {
          return line + '</blockquote>';
        }
        return line;
      })
      .join('\n')
      .replace(/<p><\/p>/g, '');

    // Restore code block placeholders
    if (this.codeBlockPlaceholders) {
      for (const [placeholder, content] of this.codeBlockPlaceholders) {
        result = result.replace(new RegExp(placeholder, 'g'), content);
      }
      this.codeBlockPlaceholders.clear();
    }

    // Restore inline code placeholders
    if (this.inlineCodePlaceholders) {
      for (const [placeholder, content] of this.inlineCodePlaceholders) {
        result = result.replace(new RegExp(placeholder, 'g'), content);
      }
      this.inlineCodePlaceholders.clear();
    }

    // Restore HTML block placeholders
    if (this.htmlBlockPlaceholders) {
      for (const [placeholder, content] of this.htmlBlockPlaceholders) {
        result = result.replace(new RegExp(placeholder, 'g'), content);
      }
      this.htmlBlockPlaceholders.clear();
    }

    // Clean up paragraph tags around pre blocks
    result = result.replace(/<p><pre>/g, '<pre>').replace(/<\/pre><\/p>/g, '</pre>');

    return result;
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

  buildRSSFeed() {
    const blogPosts = this.getBlogPosts();
    const photoGalleries = this.getPhotoGalleries();
    
    // Load existing feed to preserve publication dates for items that don't have metadata
    const existingPubDates = this.loadExistingPubDates();
    
    // Combine and sort all content by date (newest first)
    const allContent = [
      ...blogPosts.map(post => ({
        type: 'blog',
        title: post.title,
        slug: post.slug,
        url: `/blog/${post.slug}`,
        content: post.content.substring(0, 500) + '...',
        date: post.publishedAt || post.lastUpdated || new Date(),
        pubDate: post.publishedAt || existingPubDates.get(`/blog/${post.slug}`) || new Date()
      })),
      ...photoGalleries.map(gallery => ({
        type: 'gallery',
        title: `Photo Gallery: ${gallery.displayName}`,
        slug: gallery.name,
        url: `/photos/${gallery.name}`,
        content: gallery.description || `New photo gallery with ${gallery.imageCount} images.`,
        date: gallery.publishedAt || new Date(),
        pubDate: gallery.publishedAt || existingPubDates.get(`/photos/${gallery.name}`) || new Date()
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    const rssXml = this.generateRSSXML(allContent);
    writeFileSync(join(this.distDir, 'feed.xml'), rssXml);
  }

  loadExistingPubDates(): Map<string, Date> {
    const feedPath = join(this.distDir, 'feed.xml');
    const pubDates = new Map<string, Date>();
    
    try {
      if (existsSync(feedPath)) {
        const feedContent = readFileSync(feedPath, 'utf-8');
        
        // Simple regex-based parsing to extract link and pubDate pairs
        const itemRegex = /<item>[\s\S]*?<link>([^<]+)<\/link>[\s\S]*?<pubDate>([^<]+)<\/pubDate>[\s\S]*?<\/item>/g;
        let match;
        
        while ((match = itemRegex.exec(feedContent)) !== null) {
          const [, link, pubDateStr] = match;
          const cleanLink = link.replace('https://jackratner.com', ''); // Remove domain to get relative URL
          pubDates.set(cleanLink, new Date(pubDateStr));
        }
      }
    } catch (error) {
      console.warn('Could not parse existing RSS feed:', error);
    }
    
    return pubDates;
  }

  getFileDate(filePath: string): Date {
    try {
      return statSync(filePath).mtime;
    } catch {
      return new Date();
    }
  }


  generateRSSXML(items: Array<{type: string, title: string, slug: string, url: string, content: string, date: Date, pubDate: Date}>): string {
    const now = new Date().toUTCString();
    const baseUrl = 'https://jackratner.com'; // Update this to your actual domain
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Jack Ratner</title>
    <description>Personal blog and photo galleries</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${now}</lastBuildDate>
    <language>en-us</language>
    <generator>Custom Static Site Generator</generator>
    
${items.map(item => `    <item>
      <title>${this.escapeXML(item.title)}</title>
      <link>${baseUrl}${item.url}</link>
      <guid>${baseUrl}${item.url}</guid>
      <pubDate>${item.pubDate.toUTCString()}</pubDate>
      <description>${this.escapeXML(item.content)}</description>
      <category>${item.type}</category>
    </item>`).join('\n')}
  </channel>
</rss>`;
  }

  escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
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

  private copyProjectDependencies(projectSlug: string, dependencies: string[]) {
    const projectSourceDir = join('content/projects');
    const projectDestDir = join(this.distDir, 'projects');
    
    dependencies.forEach(dependency => {
      // Handle relative paths starting with ./
      const cleanDependency = dependency.startsWith('./') ? dependency.substring(2) : dependency;
      const sourcePath = join(projectSourceDir, cleanDependency);
      const destPath = join(projectDestDir, basename(cleanDependency));
      
      if (existsSync(sourcePath)) {
        try {
          // Ensure destination directory exists
          const destDir = dirname(destPath);
          if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
          }
          copyFileSync(sourcePath, destPath);
          console.log(`Copied dependency: ${sourcePath} -> ${destPath}`);
        } catch (error) {
          console.warn(`Warning: Could not copy dependency ${sourcePath} to ${destPath}: ${error}`);
        }
      } else {
        console.warn(`Warning: Dependency not found: ${sourcePath}`);
      }
    });
  }

  private createTemplate(title: string, content: string, cssPath = './styles.css', scriptPath = './script.js'): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link rel="stylesheet" href="${cssPath}">
    <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml">
</head>
<body>
    <header>
        <nav class="nav">
            <div class="nav-header">
                <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu">
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                    <span class="hamburger-line"></span>
                </button>
                <div class="nav-brand">
                    <a href="/">Jack Ratner</a>
                </div>
                <div class="nav-desktop">
                    <a href="/" class="nav-link">Home</a>
                    <a href="/updates" class="nav-link">Blog</a>
                    <a href="/photos" class="nav-link">Photos</a>
                    <button id="theme-toggle" class="nav-link theme-toggle" aria-label="Toggle dark/light theme">🌓</button>
                </div>
            </div>
            <div class="nav-menu" id="nav-menu">
                <a href="/" class="nav-link">Home</a>
                <a href="/updates" class="nav-link">Blog</a>
                <a href="/photos" class="nav-link">Photos</a>
                <button id="theme-toggle-mobile" class="nav-link theme-toggle" aria-label="Toggle dark/light theme">🌓</button>
            </div>
        </nav>
    </header>
    <main>
        ${content}
    </main>
    <footer>
        <div class="footer-content">
            <div class="footer-links">
                <a href="/about-this-site">About</a>
            </div>
        <div class="rc-scout-wrapper"><div class="rc-scout" data-scout-rendered="true"><p class="rc-scout__text"><i class="rc-scout__logo"></i> Want to become a better programmer? <a class="rc-scout__link" href="https://www.recurse.com/scout/click?t=fcb671e7d2cd4a03b8d7db0250815675">Join the Recurse Center!</a></p></div> <style class="rc-scout__style" type="text/css">.rc-scout { display: block; padding: 0; border: 0; margin: 0; } .rc-scout__text { display: block; padding: 0; border: 0; margin: 0; height: 100%; font-size: 100%; } .rc-scout__logo { display: inline-block; padding: 0; border: 0; margin: 0; width: 0.85em; height: 0.85em; background: no-repeat center url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2012%2015%22%3E%3Crect%20x%3D%220%22%20y%3D%220%22%20width%3D%2212%22%20height%3D%2210%22%20fill%3D%22%23000%22%3E%3C%2Frect%3E%3Crect%20x%3D%221%22%20y%3D%221%22%20width%3D%2210%22%20height%3D%228%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3Crect%20x%3D%222%22%20y%3D%222%22%20width%3D%228%22%20height%3D%226%22%20fill%3D%22%23000%22%3E%3C%2Frect%3E%3Crect%20x%3D%222%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%233dc06c%22%3E%3C%2Frect%3E%3Crect%20x%3D%224%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%233dc06c%22%3E%3C%2Frect%3E%3Crect%20x%3D%226%22%20y%3D%223%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%233dc06c%22%3E%3C%2Frect%3E%3Crect%20x%3D%223%22%20y%3D%225%22%20width%3D%222%22%20height%3D%221%22%20fill%3D%22%233dc06c%22%3E%3C%2Frect%3E%3Crect%20x%3D%226%22%20y%3D%225%22%20width%3D%222%22%20height%3D%221%22%20fill%3D%22%233dc06c%22%3E%3C%2Frect%3E%3Crect%20x%3D%224%22%20y%3D%229%22%20width%3D%224%22%20height%3D%223%22%20fill%3D%22%23000%22%3E%3C%2Frect%3E%3Crect%20x%3D%221%22%20y%3D%2211%22%20width%3D%2210%22%20height%3D%224%22%20fill%3D%22%23000%22%3E%3C%2Frect%3E%3Crect%20x%3D%220%22%20y%3D%2212%22%20width%3D%2212%22%20height%3D%223%22%20fill%3D%22%23000%22%3E%3C%2Frect%3E%3Crect%20x%3D%222%22%20y%3D%2213%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3Crect%20x%3D%223%22%20y%3D%2212%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3Crect%20x%3D%224%22%20y%3D%2213%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3Crect%20x%3D%225%22%20y%3D%2212%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3Crect%20x%3D%226%22%20y%3D%2213%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3Crect%20x%3D%227%22%20y%3D%2212%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3Crect%20x%3D%228%22%20y%3D%2213%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3Crect%20x%3D%229%22%20y%3D%2212%22%20width%3D%221%22%20height%3D%221%22%20fill%3D%22%23fff%22%3E%3C%2Frect%3E%3C%2Fsvg%3E'); } .rc-scout__link:link, .rc-scout__link:visited { color: #3dc06c; text-decoration: underline; } .rc-scout__link:hover, .rc-scout__link:active { color: #4e8b1d; }</style></div>
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
                <a href="https://bsky.app/profile/rackjatner.bsky.social" aria-label="Bluesky" target="_blank" rel="noopener noreferrer">
                    <svg width="24" height="24" viewBox="0 0 600 530" fill="currentColor">
                        <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" fill="currentColor"/>
                    </svg>
                </a>
            </div>
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
        <ul>
          ${recentPosts.map(post => `
            <li><a href="/updates/${post.slug}">${post.title}</a></li>
          `).join('')}
        </ul>
        <a href="/updates">View all posts →</a>
      </section>
    `;

    // Add photos section
    const galleries = this.getPhotoGalleries();
    const photosSection = `
      <section class="photos">
        <h2>Photo Galleries</h2>
        ${galleries.length > 0 ? `
          <ul>
            ${galleries.slice(0, 3).map(gallery => `
              <li><a href="/photos/${gallery.name}">${gallery.displayName}</a> (${gallery.imageCount} images)</li>
            `).join('')}
          </ul>
        ` : '<p>Photo galleries will be available soon.</p>'}
        <a href="/photos">View all galleries →</a>
      </section>
    `;

    // Add projects section
    const projects = this.getProjects();
    const projectsSection = `
      <section class="projects">
        <h2>Projects</h2>
        ${projects.length > 0 ? `
          <ul>
            ${projects.map(project => `
              <li><a href="/projects/${project.slug}">${project.title}</a></li>
            `).join('')}
          </ul>
        ` : '<p>Projects will be available soon.</p>'}
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
      ${blogPosts.length > 0 ? `
        <ul>
          ${blogPosts.map(post => `
            <li><a href="/updates/${post.slug}">${post.title}</a></li>
          `).join('')}
        </ul>
      ` : '<p>No blog posts available.</p>'}
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
      // Append additional HTML to content if it exists
      let projectContent = project.content;
      if (project.additionalHtml) {
        projectContent += '\n\n' + project.additionalHtml;
      }
      
      const html = this.createTemplate(project.title, projectContent, '../styles.css', '../script.js');
      writeFileSync(join(this.distDir, 'projects', `${project.slug}.html`), html);
      
      // Copy dependencies if they exist
      if (project.dependencies && project.dependencies.length > 0) {
        this.copyProjectDependencies(project.slug, project.dependencies);
      }
    });
  }

  buildAboutPage() {
    const about = this.parser.parseFile('content/about.md', 'dist/about-this-site.html');
    const html = this.createTemplate(about.title, about.content, './styles.css', './script.js');
    writeFileSync(join(this.distDir, 'about-this-site.html'), html);
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

  buildPhotoGalleries(galleries: Array<{name: string, displayName: string, images: string[], imageCount: number, publishedAt?: Date, description?: string}>) {
    galleries.forEach(gallery => {
      const galleryContent = `
        <h1>${gallery.displayName}</h1>
        ${gallery.description ? `<p class="gallery-description">${gallery.description}</p>` : ''}
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
          // Read metadata from meta.yaml file
          const metaPath = join(galleryPath, 'meta.yaml');
          let meta: GalleryMeta = {};
          
          if (existsSync(metaPath)) {
            try {
              const metaContent = readFileSync(metaPath, 'utf-8');
              const parsedMeta = SimpleYamlParser.parseSimple(metaContent);
              meta = {
                publishedAt: parsedMeta.published_at,
                description: parsedMeta.description
              };
            } catch (error) {
              console.warn(`Could not parse metadata for gallery ${entry.name}:`, error);
            }
          }
          
          galleries.push({
            name: entry.name,
            displayName: entry.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            images,
            imageCount: images.length,
            previewImage: images[0], // Use first image as preview
            publishedAt: meta.publishedAt || this.getFileDate(galleryPath),
            description: meta.description
          });
        }
      }
    }
    
    return galleries.sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0));
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

      .nav {
        max-width: 1200px;
        margin: 0 auto;
        position: relative;
      }

      .nav-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .nav-brand a {
        color: var(--text-color);
        text-decoration: none;
        font-weight: bold;
        font-size: 1.2rem;
      }

      .nav-toggle {
        display: none;
        flex-direction: column;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
        margin-right: 1rem;
      }

      .hamburger-line {
        width: 25px;
        height: 3px;
        background-color: var(--text-color);
        margin: 3px 0;
        transition: 0.3s;
      }

      .nav-desktop {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .nav-menu {
        display: none;
        padding: 1rem 0;
        border-top: 1px solid var(--border-color);
        margin-top: 1rem;
      }

      .nav-link {
        color: var(--link-color);
        text-decoration: none;
        font-weight: 500;
        padding: 0.5rem;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .nav-link:hover {
        background-color: var(--border-color);
        text-decoration: none;
      }

      .theme-toggle {
        background: none;
        border: 1px solid var(--border-color);
        color: var(--text-color);
        cursor: pointer;
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

      pre {
        background: var(--border-color);
        border-radius: 8px;
        padding: 1rem;
        margin: 1rem 0;
        overflow-x: auto;
        max-width: 100%;
      }

      code {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 0.9em;
      }

      pre code {
        background: none;
        padding: 0;
        white-space: pre;
      }

      :not(pre) > code {
        background: var(--border-color);
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-size: 0.85em;
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

      .gallery-description {
        font-size: 1.1rem;
        color: var(--text-color);
        margin: 1rem 0 2rem 0;
        line-height: 1.5;
        font-style: italic;
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

      .footer-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1200px;
        margin: 0 auto;
      }

      .footer-links a {
        color: var(--link-color);
        text-decoration: none;
        font-weight: 500;
      }

      .footer-links a:hover {
        text-decoration: underline;
      }

      .social-links {
        display: flex;
        gap: 1.5rem;
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

        .footer-content {
          flex-direction: column;
          gap: 1rem;
        }

        .social-links {
          gap: 1rem;
        }

        .social-links svg {
          width: 20px;
          height: 20px;
        }
      }

      /* Mobile Navigation */
      @media (max-width: 768px) {
        .nav-toggle {
          display: flex;
        }

        .nav-desktop {
          display: none;
        }

        .nav-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background-color: var(--bg-color);
          border-top: 1px solid var(--border-color);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          transform: translateY(-100%);
          opacity: 0;
          visibility: hidden;
          transition: transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 1rem 0;
        }

        .nav-menu.active {
          transform: translateY(0);
          opacity: 1;
          visibility: visible;
        }

        .nav-menu .nav-link {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          text-align: left;
          width: 100%;
          display: block;
        }

        .nav-menu .nav-link:last-child {
          border-bottom: none;
        }

        /* Hamburger animation */
        .nav-toggle.active .hamburger-line:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .nav-toggle.active .hamburger-line:nth-child(2) {
          opacity: 0;
        }

        .nav-toggle.active .hamburger-line:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }
      }
    `;
    
    writeFileSync(join(this.distDir, 'styles.css'), css);
  }

  buildScript() {
    const js = `
      // Theme toggle functionality
      const themeToggle = document.getElementById('theme-toggle');
      const themeToggleMobile = document.getElementById('theme-toggle-mobile');
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

      function toggleTheme() {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
      }

      if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
      }
      
      if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', toggleTheme);
      }

      // Mobile navigation menu toggle
      const navToggle = document.getElementById('nav-toggle');
      const navMenu = document.getElementById('nav-menu');

      if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
          navToggle.classList.toggle('active');
          navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('.nav-link:not(.theme-toggle)');
        navLinks.forEach(link => {
          link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
          });
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
          if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
          }
        });
      }

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

        // Touch/swipe navigation
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        photoViewer.addEventListener('touchstart', (event) => {
          startX = event.touches[0].clientX;
          startY = event.touches[0].clientY;
        }, { passive: true });

        photoViewer.addEventListener('touchend', (event) => {
          endX = event.changedTouches[0].clientX;
          endY = event.changedTouches[0].clientY;

          const deltaX = endX - startX;
          const deltaY = endY - startY;
          const minSwipeDistance = 50;

          // Check if horizontal swipe is greater than vertical swipe
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
              // Swipe right - go to previous image
              if (prevUrl) {
                window.location.href = prevUrl;
              }
            } else {
              // Swipe left - go to next image
              if (nextUrl) {
                window.location.href = nextUrl;
              }
            }
          }
        }, { passive: true });
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
        const parsed = this.parser.parseFile(join(blogDir, file), outputPath);
        
        // Read metadata from yaml file
        const metaPath = join(blogDir, `${slug}.meta.yaml`);
        let publishedAt: Date | undefined;
        
        if (existsSync(metaPath)) {
          try {
            const metaContent = readFileSync(metaPath, 'utf-8');
            const meta = SimpleYamlParser.parseSimple(metaContent);
            publishedAt = meta.published_at;
          } catch (error) {
            console.warn(`Could not parse metadata for ${slug}:`, error);
          }
        }
        
        // Extract "Last updated" date from content as fallback
        const lastUpdatedMatch = parsed.content.match(/_Last updated ([^_]+)_/);
        const lastUpdated = lastUpdatedMatch ? new Date(lastUpdatedMatch[1]) : new Date(0);
        
        return {
          ...parsed,
          lastUpdated,
          publishedAt: publishedAt || lastUpdated
        };
      })
      .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)); // Most recent first
    
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
        const parsed = this.parser.parseFile(join(projectsDir, file), outputPath);
        
        // Read metadata from yaml file
        const metaPath = join(projectsDir, `${slug}.meta.yaml`);
        let publishedAt: Date | undefined;
        let dependencies: string[] | undefined;
        let additionalHtml: string | undefined;
        
        if (existsSync(metaPath)) {
          try {
            const metaContent = readFileSync(metaPath, 'utf-8');
            const meta = SimpleYamlParser.parseSimple(metaContent);
            publishedAt = meta.published_at;
            dependencies = meta.dependencies;
            
            // Read additional HTML file if specified
            if (meta.additional_html) {
              const cleanPath = meta.additional_html.startsWith('./') ? meta.additional_html.substring(2) : meta.additional_html;
              const additionalHtmlPath = join(projectsDir, cleanPath);
              
              if (existsSync(additionalHtmlPath)) {
                try {
                  additionalHtml = readFileSync(additionalHtmlPath, 'utf-8');
                } catch (error) {
                  console.warn(`Could not read additional HTML file for project ${slug}: ${additionalHtmlPath}`, error);
                }
              } else {
                console.warn(`Additional HTML file not found for project ${slug}: ${additionalHtmlPath}`);
              }
            }
          } catch (error) {
            console.warn(`Could not parse metadata for project ${slug}:`, error);
          }
        }
        
        return {
          ...parsed,
          publishedAt: publishedAt || this.getFileDate(join(projectsDir, file)),
          dependencies,
          additionalHtml
        };
      })
      .sort((a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)); // Most recent first
    
    return files;
  }

  cleanupOrphanedFiles() {
    if (!existsSync(this.distDir)) return;
    
    // Get all current content sources
    const expectedFiles = new Set<string>();
    
    // Core files
    expectedFiles.add('index.html');
    expectedFiles.add('about-this-site.html');
    expectedFiles.add('feed.xml');
    expectedFiles.add('styles.css');
    expectedFiles.add('script.js');
    
    // Blog posts
    const blogPosts = this.getBlogPosts();
    expectedFiles.add('updates/index.html');
    blogPosts.forEach(post => {
      expectedFiles.add(`updates/${post.slug}.html`);
    });
    
    // Projects
    const projects = this.getProjects();
    projects.forEach(project => {
      expectedFiles.add(`projects/${project.slug}.html`);
      
      // Include project dependencies
      if (project.dependencies) {
        project.dependencies.forEach(dependency => {
          const cleanDependency = dependency.startsWith('./') ? dependency.substring(2) : dependency;
          expectedFiles.add(`projects/${basename(cleanDependency)}`);
        });
      }
    });
    
    // Photo galleries
    const galleries = this.getPhotoGalleries();
    expectedFiles.add('photos/index.html');
    galleries.forEach(gallery => {
      expectedFiles.add(`photos/${gallery.name}/index.html`);
      gallery.images.forEach(image => {
        expectedFiles.add(`photos/${gallery.name}/${image}`);
        expectedFiles.add(`photos/${gallery.name}/${basename(image, extname(image))}.html`);
      });
    });
    
    // Remove orphaned files
    this.removeOrphanedFilesRecursive(this.distDir, expectedFiles, '');
  }
  
  private removeOrphanedFilesRecursive(dirPath: string, expectedFiles: Set<string>, relativePath: string) {
    if (!existsSync(dirPath)) return;
    
    const entries = readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      const relativeFilePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Skip assets directory (managed separately)
        if (entry.name === 'assets') continue;
        
        this.removeOrphanedFilesRecursive(fullPath, expectedFiles, relativeFilePath);
        
        // Remove empty directories
        try {
          const remainingEntries = readdirSync(fullPath);
          if (remainingEntries.length === 0) {
            rmSync(fullPath, { recursive: true });
            console.log(`Removed empty directory: ${relativeFilePath}`);
          }
        } catch (error) {
          // Directory might have been removed already
        }
      } else {
        // Remove orphaned files
        if (!expectedFiles.has(relativeFilePath)) {
          rmSync(fullPath);
          console.log(`Removed orphaned file: ${relativeFilePath}`);
        }
      }
    }
  }

  build() {
    console.log('Building static site...');
    
    // Clean up orphaned files first
    this.cleanupOrphanedFiles();
    
    this.buildHomepage();
    this.buildBlogIndex();
    this.buildBlogPosts();
    this.buildProjects();
    this.buildAboutPage();
    this.buildPhotosIndex();
    this.buildRSSFeed();
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
