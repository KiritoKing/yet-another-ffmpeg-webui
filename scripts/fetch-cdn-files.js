#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CDN_BASE_URL = 'https://unpkg.com/@ffmpeg';
const VERSION = '0.12.10';
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Files to download for local CDN
const FILES_TO_DOWNLOAD = [
  {
    package: 'core',
    files: [
      'package.json',
      'dist/esm/ffmpeg-core.js',
      'dist/esm/ffmpeg-core.wasm'
    ]
  },
  {
    package: 'core-mt',
    files: [
      'dist/esm/ffmpeg-core.js',
      'dist/esm/ffmpeg-core.worker.js'
    ]
  }
];

/**
 * Create directory recursively if it doesn't exist
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Download a file from URL to local path
 */
async function downloadFile(url, localPath) {
  try {
    console.log(`Downloading: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    // Ensure directory exists
    ensureDir(path.dirname(localPath));

    // Write file
    fs.writeFileSync(localPath, Buffer.from(buffer));
    console.log(`✓ Downloaded: ${localPath}`);

    return true;
  } catch (error) {
    console.error(`✗ Failed to download ${url}:`, error.message);
    return false;
  }
}

/**
 * Main download function
 */
async function downloadCDNFiles() {
  console.log('🚀 Starting FFmpeg CDN files download...\n');
  console.log(`Target version: ${VERSION}`);
  console.log(`Target directory: ${PUBLIC_DIR}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const pkg of FILES_TO_DOWNLOAD) {
    console.log(`📦 Processing package: ${pkg.package}`);

    for (const file of pkg.files) {
      const url = `${CDN_BASE_URL}/${pkg.package}@${VERSION}/${file}`;
      const localPath = path.join(PUBLIC_DIR, pkg.package, `@${VERSION}`, file);

      const success = await downloadFile(url, localPath);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(''); // Empty line for readability
  }

  console.log('📊 Download Summary:');
  console.log(`✓ Successfully downloaded: ${successCount} files`);
  console.log(`✗ Failed downloads: ${failCount} files`);

  if (failCount === 0) {
    console.log('\n🎉 All CDN files downloaded successfully!');
    console.log('\nLocal CDN structure created:');
    console.log('public/');
    console.log('├── core@0.12.10/');
    console.log('│   ├── package.json');
    console.log('│   └── dist/esm/');
    console.log('│       ├── ffmpeg-core.js');
    console.log('│       └── ffmpeg-core.wasm');
    console.log('└── core-mt@0.12.10/');
    console.log('    └── dist/esm/');
    console.log('        ├── ffmpeg-core.js');
    console.log('        └── ffmpeg-core.worker.js');
  } else {
    console.log('\n⚠️  Some downloads failed. Please check the errors above.');
    process.exit(1);
  }
}

/**
 * Check if local CDN files already exist
 */
function checkExistingFiles() {
  const coreDir = path.join(PUBLIC_DIR, 'core', `@${VERSION}`);
  const coreMtDir = path.join(PUBLIC_DIR, 'core-mt', `@${VERSION}`);

  const coreExists = fs.existsSync(coreDir);
  const coreMtExists = fs.existsSync(coreMtDir);

  if (coreExists || coreMtExists) {
    console.log('⚠️  Local CDN files already detected:');
    if (coreExists) console.log(`  - ${coreDir}`);
    if (coreMtExists) console.log(`  - ${coreMtDir}`);
    console.log('');

    // You could add a prompt here to confirm overwrite
    // For now, we'll proceed with downloading
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  checkExistingFiles();
  downloadCDNFiles().catch(error => {
    console.error('❌ Download failed:', error);
    process.exit(1);
  });
}

export { downloadCDNFiles };