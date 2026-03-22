#!/usr/bin/env bun
/**
 * Fetches photo galleries from a Photoprism server and writes them into
 * content/photos/ so the static site builder can pick them up.
 *
 * Required env vars:
 *   PHOTOPRISM_URL      e.g. https://photos.example.com
 *   PHOTOPRISM_API_KEY  an API key created in Photoprism Settings → API Keys
 *
 * Album configuration lives in photoprism.yaml.
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface AlbumConfig {
  uid: string;
  slug: string;
  name: string;
  description?: string;
}

interface PhotoprismConfig {
  albums: AlbumConfig[];
}

interface PhotoprismPhoto {
  UID: string;
  Hash: string;
  FileName: string;
  Title: string;
}

async function loadConfig(): Promise<PhotoprismConfig> {
  const configPath = 'photoprism.yaml';
  if (!existsSync(configPath)) {
    console.log('No photoprism.yaml found, skipping photo fetch.');
    return { albums: [] };
  }

  const text = await Bun.file(configPath).text();

  // Parse albums from YAML manually (keeps zero-dependency approach of the project)
  const albums: AlbumConfig[] = [];
  let current: Partial<AlbumConfig> | null = null;

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    if (line.trimStart().startsWith('#') || line.trim() === '') continue;

    const listItem = /^- uid:\s*(.+)$/.exec(line);
    if (listItem) {
      if (current?.uid && current?.slug && current?.name) albums.push(current as AlbumConfig);
      current = { uid: listItem[1].trim() };
      continue;
    }

    if (current) {
      const kv = /^\s+(\w+):\s*(.+)$/.exec(line);
      if (kv) {
        const [, key, value] = kv;
        (current as any)[key] = value.trim();
      }
    }
  }
  if (current?.uid && current?.slug && current?.name) albums.push(current as AlbumConfig);

  return { albums };
}

async function getPreviewToken(baseUrl: string, apiKey: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/v1/config`, {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (!res.ok) throw new Error(`Failed to fetch Photoprism config: ${res.status} ${res.statusText}`);
  const data = await res.json() as { previewToken?: string };
  if (!data.previewToken) throw new Error('No previewToken in Photoprism config response');
  return data.previewToken;
}

async function fetchAlbumPhotos(
  baseUrl: string,
  apiKey: string,
  albumUid: string,
): Promise<PhotoprismPhoto[]> {
  const url = `${baseUrl}/api/v1/albums/${albumUid}/photos?count=1000&offset=0`;
  const res = await fetch(url, {
    headers: { 'X-Auth-Token': apiKey },
  });
  if (!res.ok) throw new Error(`Failed to fetch album ${albumUid}: ${res.status} ${res.statusText}`);

  const data = await res.json() as Array<{ Photo: PhotoprismPhoto }>;
  return data.map(item => item.Photo);
}

async function downloadPhoto(
  baseUrl: string,
  previewToken: string,
  photo: PhotoprismPhoto,
  destPath: string,
): Promise<void> {
  // Use the "fit_2048" tile for good quality without fetching originals
  const url = `${baseUrl}/api/v1/t/${photo.Hash}/${previewToken}/fit_2048`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download photo ${photo.Hash}: ${res.status}`);

  const buffer = await res.arrayBuffer();
  writeFileSync(destPath, Buffer.from(buffer));
}

async function main() {
  const baseUrl = process.env.PHOTOPRISM_URL?.replace(/\/$/, '');
  const apiKey = process.env.PHOTOPRISM_API_KEY;

  if (!baseUrl || !apiKey) {
    console.log('PHOTOPRISM_URL or PHOTOPRISM_API_KEY not set — skipping photo fetch.');
    return;
  }

  const config = await loadConfig();
  if (config.albums.length === 0) {
    console.log('No albums configured in photoprism.yaml — skipping photo fetch.');
    return;
  }

  console.log(`Fetching ${config.albums.length} album(s) from ${baseUrl}…`);

  let previewToken: string;
  try {
    previewToken = await getPreviewToken(baseUrl, apiKey);
  } catch (err) {
    console.error('Could not get Photoprism preview token:', err);
    process.exit(1);
  }

  for (const album of config.albums) {
    const galleryDir = join('content', 'photos', album.slug);
    mkdirSync(galleryDir, { recursive: true });

    // Write meta.yaml so the builder picks up the display name / description
    const metaLines = [
      `name: ${album.name}`,
      album.description ? `description: "${album.description.replace(/"/g, '\\"')}"` : null,
      `published_at: ${new Date().toISOString().split('T')[0]}`,
    ].filter(Boolean);
    writeFileSync(join(galleryDir, 'meta.yaml'), metaLines.join('\n') + '\n');

    let photos: PhotoprismPhoto[];
    try {
      photos = await fetchAlbumPhotos(baseUrl, apiKey, album.uid);
    } catch (err) {
      console.error(`Failed to fetch album "${album.name}":`, err);
      continue;
    }

    console.log(`  ${album.name}: ${photos.length} photo(s)`);

    // Track which files we expect so we can skip already-downloaded ones
    const existing = new Set(
      existsSync(galleryDir)
        ? readdirSync(galleryDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
        : [],
    );

    let downloaded = 0;
    let skipped = 0;

    for (const photo of photos) {
      const ext = photo.FileName?.split('.').pop()?.toLowerCase() || 'jpg';
      const filename = `${photo.Hash}.${ext}`;
      const destPath = join(galleryDir, filename);

      if (existing.has(filename)) {
        skipped++;
        continue;
      }

      try {
        await downloadPhoto(baseUrl, previewToken, photo, destPath);
        downloaded++;
      } catch (err) {
        console.warn(`    Could not download ${photo.Hash}:`, err);
      }
    }

    console.log(`    Downloaded ${downloaded}, skipped ${skipped} already-cached.`);
  }

  console.log('Done fetching photos.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
