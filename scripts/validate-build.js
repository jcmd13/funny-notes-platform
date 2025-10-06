#!/usr/bin/env node

/**
 * Build validation script - validates the production build without running dev server
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function validateBuild() {
  const distPath = path.join(__dirname, '..', 'dist')
  
  console.log('🔍 Validating production build...')
  
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build failed: dist directory not found')
    process.exit(1)
  }
  
  // Check for essential files
  const requiredFiles = [
    'index.html',
    'manifest.webmanifest',
    'sw.js'
  ]
  
  const missingFiles = requiredFiles.filter(file => 
    !fs.existsSync(path.join(distPath, file))
  )
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:', missingFiles)
    process.exit(1)
  }
  
  // Check for asset files
  const assetsPath = path.join(distPath, 'assets')
  if (!fs.existsSync(assetsPath)) {
    console.error('❌ Assets directory not found')
    process.exit(1)
  }
  
  const assets = fs.readdirSync(assetsPath)
  const jsFiles = assets.filter(file => file.endsWith('.js'))
  const cssFiles = assets.filter(file => file.endsWith('.css'))
  
  console.log('✅ Build validation successful!')
  console.log(`📦 Found ${jsFiles.length} JavaScript files`)
  console.log(`🎨 Found ${cssFiles.length} CSS files`)
  
  // Analyze bundle sizes
  let totalJsSize = 0
  let totalCssSize = 0
  
  jsFiles.forEach(file => {
    const filePath = path.join(assetsPath, file)
    const stats = fs.statSync(filePath)
    totalJsSize += stats.size
  })
  
  cssFiles.forEach(file => {
    const filePath = path.join(assetsPath, file)
    const stats = fs.statSync(filePath)
    totalCssSize += stats.size
  })
  
  console.log(`📊 Total JS size: ${(totalJsSize / 1024).toFixed(2)} KB`)
  console.log(`📊 Total CSS size: ${(totalCssSize / 1024).toFixed(2)} KB`)
  
  // Validate PWA manifest
  const manifestPath = path.join(distPath, 'manifest.webmanifest')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  
  if (!manifest.name || !manifest.short_name || !manifest.icons) {
    console.error('❌ Invalid PWA manifest')
    process.exit(1)
  }
  
  console.log('✅ PWA manifest is valid')
  console.log(`📱 App name: ${manifest.name}`)
  console.log(`🔗 Start URL: ${manifest.start_url}`)
  console.log(`🎯 Display mode: ${manifest.display}`)
  
  // Check for code splitting
  const chunkFiles = jsFiles.filter(file => 
    file.includes('vendor') || 
    file.includes('chunk') ||
    file.match(/^[A-Z][a-z]+-[A-Za-z0-9]+\.js$/) // Page chunks
  )
  
  console.log(`🧩 Found ${chunkFiles.length} code-split chunks`)
  
  if (chunkFiles.length > 0) {
    console.log('✅ Code splitting is working')
  } else {
    console.warn('⚠️  No code-split chunks detected')
  }
  
  console.log('\n🚀 Build is ready for deployment!')
}

validateBuild()