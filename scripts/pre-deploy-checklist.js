#!/usr/bin/env node

/**
 * Pre-deployment checklist - ensures everything is ready for production
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function checkPreDeployment() {
  console.log('🚀 Running pre-deployment checklist...\n')
  
  const checks = []
  
  // Check 1: Package.json has correct scripts
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'))
  checks.push({
    name: 'Build scripts configured',
    passed: packageJson.scripts.build && packageJson.scripts['build:validate'],
    details: 'package.json has build and validation scripts'
  })
  
  // Check 2: Deployment configs exist
  const deploymentConfigs = ['vercel.json', 'netlify.toml', '.github/workflows/deploy.yml']
  const existingConfigs = deploymentConfigs.filter(config => 
    fs.existsSync(path.join(__dirname, '..', config))
  )
  checks.push({
    name: 'Deployment configurations',
    passed: existingConfigs.length > 0,
    details: `Found: ${existingConfigs.join(', ')}`
  })
  
  // Check 3: Read vite config first
  const viteConfig = fs.readFileSync(path.join(__dirname, '..', 'vite.config.ts'), 'utf8')
  
  // Check 4: PWA manifest configuration
  const manifestConfigured = viteConfig.includes('manifest:') && viteConfig.includes('name:')
  checks.push({
    name: 'PWA manifest',
    passed: manifestConfigured,
    details: 'PWA manifest configured in vite.config.ts'
  })
  
  // Check 6: Service worker config
  const hasPWAPlugin = viteConfig.includes('VitePWA')
  checks.push({
    name: 'Service Worker configuration',
    passed: hasPWAPlugin,
    details: 'VitePWA plugin configured in vite.config.ts'
  })
  
  // Check 8: Code splitting implemented
  const appTsx = fs.readFileSync(path.join(__dirname, '..', 'src', 'App.tsx'), 'utf8')
  const hasLazyLoading = appTsx.includes('lazy(') && appTsx.includes('Suspense')
  checks.push({
    name: 'Code splitting',
    passed: hasLazyLoading,
    details: 'Lazy loading and Suspense implemented'
  })
  
  // Check 10: Performance monitoring
  const performanceUtils = fs.existsSync(path.join(__dirname, '..', 'src', 'utils', 'performance.ts'))
  checks.push({
    name: 'Performance monitoring',
    passed: performanceUtils,
    details: 'Performance utilities implemented'
  })
  
  // Check 12: Security headers
  const hasSecurityHeaders = existingConfigs.some(config => {
    const configPath = path.join(__dirname, '..', config)
    const content = fs.readFileSync(configPath, 'utf8')
    return content.includes('X-Frame-Options') || content.includes('headers')
  })
  checks.push({
    name: 'Security headers',
    passed: hasSecurityHeaders,
    details: 'Security headers configured in deployment files'
  })
  
  // Check 14: Bundle optimization
  const viteConfigHasOptimization = viteConfig.includes('rollupOptions') && viteConfig.includes('manualChunks')
  checks.push({
    name: 'Bundle optimization',
    passed: viteConfigHasOptimization,
    details: 'Rollup optimization and manual chunks configured'
  })
  
  // Display results
  console.log('📋 Checklist Results:\n')
  
  let allPassed = true
  checks.forEach((check, index) => {
    const status = check.passed ? '✅' : '❌'
    console.log(`${index + 1}. ${status} ${check.name}`)
    console.log(`   ${check.details}\n`)
    if (!check.passed) allPassed = false
  })
  
  // Summary
  const passedCount = checks.filter(c => c.passed).length
  console.log(`\n📊 Summary: ${passedCount}/${checks.length} checks passed`)
  
  if (allPassed) {
    console.log('\n🎉 All checks passed! Ready for deployment!')
    console.log('\nNext steps:')
    console.log('1. Run: npm run build:validate')
    console.log('2. Choose your deployment platform from DEPLOYMENT.md')
    console.log('3. Deploy using the platform-specific instructions')
  } else {
    console.log('\n⚠️  Some checks failed. Please address the issues above before deploying.')
    process.exit(1)
  }
}

checkPreDeployment()