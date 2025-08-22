#!/usr/bin/env bun

import { readdirSync, copyFileSync, mkdirSync, existsSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { execSync } from 'child_process';

interface PhotoProcessorOptions {
  sourceDir: string;
  galleryName: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

class PhotoProcessor {
  private readonly supportedExtensions = ['.jpg', '.jpeg', '.JPG', '.JPEG'];
  
  async processPhotos(options: PhotoProcessorOptions) {
    const {
      sourceDir,
      galleryName,
      maxWidth = 1200,
      maxHeight = 800,
      quality = 85
    } = options;

    // Validate source directory exists
    if (!existsSync(sourceDir)) {
      throw new Error(`Source directory does not exist: ${sourceDir}`);
    }

    // Create destination directory
    const destDir = join('content', 'photos', galleryName);
    mkdirSync(destDir, { recursive: true });

    console.log(`Processing photos from: ${sourceDir}`);
    console.log(`Gallery: ${galleryName}`);
    console.log(`Destination: ${destDir}`);
    console.log(`Max dimensions: ${maxWidth}x${maxHeight}, Quality: ${quality}%`);
    console.log('---');

    // Get all JPEG files from source directory
    const files = readdirSync(sourceDir);
    const jpegFiles = files.filter(file => 
      this.supportedExtensions.includes(extname(file))
    );

    if (jpegFiles.length === 0) {
      console.log('No JPEG files found in source directory');
      return;
    }

    console.log(`Found ${jpegFiles.length} JPEG files:`);
    jpegFiles.forEach(file => console.log(`  - ${file}`));
    console.log('---');

    // Check if ImageMagick is available
    const hasImageMagick = this.checkImageMagick();
    if (!hasImageMagick) {
      console.log('Warning: ImageMagick not found. Images will be copied without resizing.');
      console.log('Install ImageMagick with: sudo apt-get install imagemagick (Ubuntu/Debian)');
      console.log('                    or: brew install imagemagick (macOS)');
      console.log('---');
    }

    // Process each JPEG file
    let processed = 0;
    let copied = 0;

    for (const file of jpegFiles) {
      const sourcePath = join(sourceDir, file);
      // Normalize the destination filename to lowercase extension
      const normalizedFileName = file.replace(/\.(JPG|JPEG)$/i, (match) => match.toLowerCase());
      const destPath = join(destDir, normalizedFileName);

      try {
        if (hasImageMagick) {
          // Resize and copy using ImageMagick
          const command = `magick "${sourcePath}" -resize ${maxWidth}x${maxHeight} -quality ${quality} "${destPath}"`;
          execSync(command, { stdio: 'pipe' });
          processed++;
          console.log(`✓ Resized: ${file} → ${normalizedFileName}`);
        } else {
          // Just copy without resizing
          copyFileSync(sourcePath, destPath);
          copied++;
          console.log(`✓ Copied: ${file} → ${normalizedFileName}`);
        }
      } catch (error) {
        console.error(`✗ Error processing ${file}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log('---');
    console.log(`Complete! Processed ${processed} images, copied ${copied} images to gallery: ${galleryName}`);
    
    if (hasImageMagick && processed > 0) {
      // Show size comparison
      this.showSizeComparison(sourceDir, destDir, jpegFiles.slice(0, 3));
    }

    console.log(`\nNext steps:`);
    console.log(`1. Run 'bun run build' to regenerate the site`);
    console.log(`2. Gallery will be available at /photos/${galleryName}`);
  }

  private checkImageMagick(): boolean {
    try {
      execSync('magick -version', { stdio: 'pipe' });
      return true;
    } catch {
      try {
        // Try older ImageMagick command
        execSync('convert -version', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    }
  }

  private showSizeComparison(sourceDir: string, destDir: string, sampleFiles: string[]) {
    console.log('\nSize comparison (first few files):');
    sampleFiles.forEach(file => {
      try {
        const sourceStats = statSync(join(sourceDir, file));
        const destStats = statSync(join(destDir, file));
        const sourceSize = (sourceStats.size / 1024 / 1024).toFixed(2);
        const destSize = (destStats.size / 1024 / 1024).toFixed(2);
        const reduction = ((1 - destStats.size / sourceStats.size) * 100).toFixed(1);
        console.log(`  ${file}: ${sourceSize}MB → ${destSize}MB (${reduction}% reduction)`);
      } catch (error) {
        console.log(`  ${file}: Could not compare sizes`);
      }
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: bun run process-photos.ts <source-directory> <gallery-name> [max-width] [max-height] [quality]');
    console.log('');
    console.log('Arguments:');
    console.log('  source-directory  Path to directory containing JPEG images');
    console.log('  gallery-name      Name for the photo gallery (will create content/photos/<gallery-name>)');
    console.log('  max-width         Maximum width in pixels (default: 1200)');
    console.log('  max-height        Maximum height in pixels (default: 800)'); 
    console.log('  quality           JPEG quality 1-100 (default: 85)');
    console.log('');
    console.log('Examples:');
    console.log('  bun run process-photos.ts ~/Photos/vacation-2024 vacation-2024');
    console.log('  bun run process-photos.ts /path/to/photos my-gallery 800 600 75');
    process.exit(1);
  }

  const [sourceDir, galleryName, maxWidth, maxHeight, quality] = args;

  const options: PhotoProcessorOptions = {
    sourceDir,
    galleryName,
    ...(maxWidth && { maxWidth: parseInt(maxWidth) }),
    ...(maxHeight && { maxHeight: parseInt(maxHeight) }),
    ...(quality && { quality: parseInt(quality) })
  };

  const processor = new PhotoProcessor();
  
  try {
    await processor.processPhotos(options);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.main) {
  main();
}