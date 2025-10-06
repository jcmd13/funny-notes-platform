#!/usr/bin/env node

/**
 * Generate placeholder splash screen images for iOS PWA
 * In production, you would use proper image generation tools
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG splash screen
const createSplashSVG = (width, height) => `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#0f0f0f"/>
  <g transform="translate(${width/2}, ${height/2})">
    <circle r="60" fill="#fbbf24"/>
    <text y="10" text-anchor="middle" fill="#1a1a1a" font-size="24" font-family="Arial">🎤</text>
    <text y="100" text-anchor="middle" fill="#fbbf24" font-size="32" font-family="Arial, sans-serif" font-weight="bold">Funny Notes</text>
    <text y="130" text-anchor="middle" fill="#9ca3af" font-size="16" font-family="Arial, sans-serif">Comedy Material Manager</text>
  </g>
</svg>
`;

// Common iOS splash screen sizes
const splashSizes = [
  { name: 'splash-640x1136', width: 640, height: 1136 },
  { name: 'splash-750x1334', width: 750, height: 1334 },
  { name: 'splash-1125x2436', width: 1125, height: 2436 },
  { name: 'splash-1242x2208', width: 1242, height: 2208 },
  { name: 'splash-1536x2048', width: 1536, height: 2048 },
  { name: 'splash-1668x2224', width: 1668, height: 2224 },
  { name: 'splash-2048x2732', width: 2048, height: 2732 }
];

const publicDir = path.join(__dirname, '../public');

splashSizes.forEach(({ name, width, height }) => {
  const svgContent = createSplashSVG(width, height);
  fs.writeFileSync(path.join(publicDir, `${name}.svg`), svgContent);
  console.log(`Created ${name}.svg (${width}x${height})`);
});

// Create screenshot placeholders
const screenshotWide = createSplashSVG(1280, 720);
const screenshotNarrow = createSplashSVG(750, 1334);

fs.writeFileSync(path.join(publicDir, 'screenshot-wide.svg'), screenshotWide);
fs.writeFileSync(path.join(publicDir, 'screenshot-narrow.svg'), screenshotNarrow);

console.log('Created screenshot-wide.svg (1280x720)');
console.log('Created screenshot-narrow.svg (750x1334)');

console.log('\nNote: For production, convert SVG files to PNG using a tool like:');
console.log('- ImageMagick: convert splash.svg splash.png');
console.log('- Online converters');
console.log('- Design tools like Figma or Sketch');