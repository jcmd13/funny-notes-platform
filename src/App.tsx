import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { ThemeProvider } from './core/theme'
import { AppLayout } from './components/layout'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { LoadingSpinner } from './components/ui/LoadingSpinner'
import { ToastContainer } from './components/ui/Toast'
import { CommandPalette } from './components/ui/CommandPalette'
import { PWAInstallPrompt } from './components/ui/PWAInstallPrompt'
import { PWAStatusManager } from './components/ui/PWAStatusManager'
import { useCommandPalette } from './hooks/useCommandPalette'
import { useToastProvider, ToastContext } from './hooks/useToast'
import './App.css'

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
  const { isOpen, close } = useCommandPalette()

  return (
    <div className="theme-base">
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
      
      {/* Global UI Components */}
      <ToastContainer />
      <CommandPalette isOpen={isOpen} onClose={close} />
      
      {/* PWA Components */}
      <PWAInstallPrompt />
      <PWAStatusManager />
    </div>
  )
}

function App() {
  const toastProvider = useToastProvider()

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastContext.Provider value={toastProvider}>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </ToastContext.Provider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
