#!/usr/bin/env node

/**
 * Simple PWA icon generator script
 * This creates placeholder icons for development
 * In production, you would use proper icon generation tools
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple SVG icon that can be converted to PNG
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1a1a1a"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size/3}" fill="#fbbf24"/>
  <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" fill="#1a1a1a" font-size="${size/8}" font-family="Arial">🎤</text>
</svg>
`;

// For now, we'll create SVG versions and note that PNG conversion is needed
const sizes = [64, 192, 512];
const publicDir = path.join(__dirname, '../public');

sizes.forEach(size => {
  const svgContent = createSVGIcon(size);
  fs.writeFileSync(path.join(publicDir, `pwa-${size}x${size}.svg`), svgContent);
  console.log(`Created pwa-${size}x${size}.svg`);
});

// Create apple-touch-icon
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), createSVGIcon(180));
console.log('Created apple-touch-icon.svg');

// Create favicon
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createSVGIcon(32));
console.log('Created favicon.svg');

console.log('\nNote: For production, convert SVG files to PNG using a tool like:');
console.log('- ImageMagick: convert icon.svg icon.png');
console.log('- Online converters');
console.log('- Design tools like Figma or Sketch');