import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ThemeProvider } from './core/theme'
import { AppLayout } from './components/layout'
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt'
import { ToastContainer } from './components/ui/Toast'
import { PWAStatusManager } from './components/ui'
import { CommandPalette } from './components/ui/CommandPalette'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { PageTransition } from './components/ui/PageTransition'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { useGlobalKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useCommandPalette } from './hooks/useCommandPalette'
import { useSkipLinks, useAriaLiveRegion } from './hooks/useFocusManagement'
import { initPerformanceMonitoring } from './utils/performance'
import './App.css'
import './styles/themes.css'

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  initPerformanceMonitoring()
}

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Capture = lazy(() => import('./pages/Capture'))
const Notes = lazy(() => import('./pages/Notes'))
const SetLists = lazy(() => import('./pages/SetLists'))
const Venues = lazy(() => import('./pages/Venues'))
const Contacts = lazy(() => import('./pages/Contacts'))
const Rehearsal = lazy(() => import('./pages/Rehearsal'))
const Performance = lazy(() => import('./pages/Performance'))
const UXDemo = lazy(() => import('./pages/UXDemo'))
const ThemeDemo = lazy(() => import('./pages/ThemeDemo'))

function AppContent() {
  // Initialize global keyboard shortcuts
  useGlobalKeyboardShortcuts()
  
  // Initialize command palette
  const { isOpen, close } = useCommandPalette()
  
  // Initialize accessibility features
  useSkipLinks()
  useAriaLiveRegion()

  return (
    <div className="theme-base">
      <PageTransition>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <LoadingSpinner size="lg" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="capture" element={<Capture />} />
              <Route path="notes" element={<Notes />} />
              <Route path="setlists" element={<SetLists />} />
              <Route path="venues" element={<Venues />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="performance" element={<Performance />} />
              <Route path="ux-demo" element={<UXDemo />} />
              <Route path="theme-demo" element={<ThemeDemo />} />
            </Route>
            <Route path="/rehearsal/:setListId" element={<Rehearsal />} />
          </Routes>
        </Suspense>
      </PageTransition>
      
      {/* Global UI Components */}
      <PWAInstallPrompt />
      <PWAStatusManager />
      <ToastContainer />
      <CommandPalette isOpen={isOpen} onClose={close} />
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
