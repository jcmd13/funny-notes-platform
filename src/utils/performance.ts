/**
 * Performance monitoring and optimization utilities
 */

// Performance metrics interface
export interface PerformanceMetrics {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
}

// Performance observer for Core Web Vitals
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.initializeObservers()
  }

  private initializeObservers() {
    // FCP and LCP observer
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.fcp = entry.startTime
            }
          })
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(paintObserver)

        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.metrics.lcp = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)

        // CLS observer
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          list.getEntries().forEach((entry) => {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          })
          this.metrics.cls = clsValue
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)

        // FID observer
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.metrics.fid = (entry as any).processingStart - entry.startTime
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (error) {
        console.warn('Performance observers not supported:', error)
      }
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Report metrics to analytics (placeholder)
  reportMetrics() {
    const metrics = this.getMetrics()
    console.log('Performance Metrics:', metrics)
    
    // In a real app, you would send these to your analytics service
    // analytics.track('performance_metrics', metrics)
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// Lazy loading utility for images
export const lazyLoadImage = (img: HTMLImageElement, src: string) => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src
          img.classList.remove('lazy')
          observer.unobserve(img)
        }
      })
    })
    observer.observe(img)
  } else {
    // Fallback for browsers without IntersectionObserver
    img.src = src
  }
}

// Resource preloading utility
export const preloadResource = (href: string, as: string) => {
  const link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  document.head.appendChild(link)
}

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development') {
    const resources = performance.getEntriesByType('resource')
    const jsResources = resources.filter(r => r.name.endsWith('.js'))
    const cssResources = resources.filter(r => r.name.endsWith('.css'))
    
    console.group('Bundle Analysis')
    console.log('JavaScript files:', jsResources.length)
    console.log('CSS files:', cssResources.length)
    
    const totalJsSize = jsResources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0)
    const totalCssSize = cssResources.reduce((sum, r) => sum + ((r as any).transferSize || 0), 0)
    
    console.log(`Total JS size: ${(totalJsSize / 1024).toFixed(2)} KB`)
    console.log(`Total CSS size: ${(totalCssSize / 1024).toFixed(2)} KB`)
    console.groupEnd()
  }
}

// Memory usage monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    }
  }
  return null
}

// Initialize performance monitoring
export const initPerformanceMonitoring = () => {
  const monitor = new PerformanceMonitor()
  
  // Report metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      monitor.reportMetrics()
      analyzeBundleSize()
    }, 1000)
  })
  
  // Report metrics before page unload
  window.addEventListener('beforeunload', () => {
    monitor.reportMetrics()
    monitor.disconnect()
  })
  
  return monitor
}