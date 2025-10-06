import { useState } from 'react'
import {
  Button,
  Modal,
  EmptyState,
  EmptyStates,
  SkeletonList,
  SkeletonDashboard,
  SkeletonForm,
  useToast,
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../components/ui'
import { useAsyncOperation } from '../hooks/useErrorHandler'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'

/**
 * Demo page showcasing all the new UX features
 */
function UXDemo() {
  const [showModal, setShowModal] = useState(false)
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [showSkeletons, setShowSkeletons] = useState(false)
  const [demoError, setDemoError] = useState<Error | null>(null)
  
  const { success, error, warning, info } = useToast()

  // Demo async operation with error handling
  const {
    execute: demoAsyncOperation,
    isLoading: demoLoading
  } = useAsyncOperation(
    async (shouldFail: boolean = false) => {
      await new Promise(resolve => setTimeout(resolve, 2000))
      if (shouldFail) {
        throw new Error('This is a demo error to show retry functionality')
      }
      return 'Operation completed successfully!'
    },
    {
      context: 'demo operation',
      onSuccess: (result) => success('Success!', result),
      onError: (error) => setDemoError(error)
    }
  )

  // Demo keyboard shortcuts
  const demoShortcuts = [
    {
      key: 'm',
      ctrlKey: true,
      callback: () => {
        setShowModal(true)
        info('Keyboard shortcut', 'Modal opened with Ctrl+M')
      },
      description: 'Open modal (Ctrl+M)'
    },
    {
      key: 't',
      ctrlKey: true,
      callback: () => {
        success('Toast demo', 'This toast was triggered with Ctrl+T')
      },
      description: 'Show toast (Ctrl+T)'
    }
  ]

  useKeyboardShortcuts(demoShortcuts)

  const handleToastDemo = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: 'Success!', message: 'Everything worked perfectly' },
      error: { title: 'Error occurred', message: 'Something went wrong, but we\'ll handle it' },
      warning: { title: 'Warning', message: 'Please pay attention to this' },
      info: { title: 'Information', message: 'Here\'s something you should know' }
    }
    
    const toast = messages[type]
    switch (type) {
      case 'success': success(toast.title, toast.message); break
      case 'error': error(toast.title, toast.message); break
      case 'warning': warning(toast.title, toast.message); break
      case 'info': info(toast.title, toast.message); break
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-yellow-400 mb-2">
          UX Features Demo 🎭
        </h1>
        <p className="text-gray-300">
          Showcase of all the new user experience enhancements
        </p>
      </div>

      {/* Keyboard Shortcuts Info */}
      <Card>
        <CardHeader>
          <CardTitle>🎹 Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-gray-300 mb-4">Try these keyboard shortcuts:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span className="text-gray-300">Open Command Palette</span>
                <kbd className="px-2 py-1 bg-gray-600 rounded text-sm">Ctrl+K</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span className="text-gray-300">New Note</span>
                <kbd className="px-2 py-1 bg-gray-600 rounded text-sm">Ctrl+N</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span className="text-gray-300">Open Modal (Demo)</span>
                <kbd className="px-2 py-1 bg-gray-600 rounded text-sm">Ctrl+M</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                <span className="text-gray-300">Show Toast (Demo)</span>
                <kbd className="px-2 py-1 bg-gray-600 rounded text-sm">Ctrl+T</kbd>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>🍞 Toast Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={() => handleToastDemo('success')} variant="outline">
              Success Toast
            </Button>
            <Button onClick={() => handleToastDemo('error')} variant="outline">
              Error Toast
            </Button>
            <Button onClick={() => handleToastDemo('warning')} variant="outline">
              Warning Toast
            </Button>
            <Button onClick={() => handleToastDemo('info')} variant="outline">
              Info Toast
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Handling & Retry */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 Error Handling & Retry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex space-x-3">
              <Button 
                onClick={() => demoAsyncOperation(false)}
                loading={demoLoading}
                disabled={demoLoading}
              >
                {demoLoading ? 'Processing...' : 'Success Operation'}
              </Button>
              <Button 
                onClick={() => demoAsyncOperation(true)}
                loading={demoLoading}
                disabled={demoLoading}
                variant="outline"
              >
                {demoLoading ? 'Processing...' : 'Failing Operation'}
              </Button>
            </div>
            {demoError && (
              <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg">
                <p className="text-red-400">
                  <strong>Error:</strong> {demoError.message}
                </p>
                <Button 
                  onClick={() => {
                    setDemoError(null)
                    demoAsyncOperation(false)
                  }}
                  size="sm"
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle>⏳ Loading States & Skeletons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={() => setShowSkeletons(!showSkeletons)}
              variant="outline"
            >
              {showSkeletons ? 'Hide' : 'Show'} Skeleton Loading
            </Button>
            
            {showSkeletons && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">List Skeleton</h4>
                  <SkeletonList items={3} />
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Dashboard Skeleton</h4>
                  <SkeletonDashboard />
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Form Skeleton</h4>
                  <SkeletonForm fields={3} />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Empty States */}
      <Card>
        <CardHeader>
          <CardTitle>📭 Empty States</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={() => setShowEmptyState(!showEmptyState)}
              variant="outline"
            >
              {showEmptyState ? 'Hide' : 'Show'} Empty State Examples
            </Button>
            
            {showEmptyState && (
              <div className="space-y-8">
                <div>
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Notes Empty State</h4>
                  <EmptyStates.Notes />
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Search Results Empty State</h4>
                  {EmptyStates.SearchResults(
                    "nonexistent content",
                    {
                      action: {
                        label: "Clear Search",
                        onClick: () => info('Search cleared', 'Try a different search term')
                      }
                    }
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Error State</h4>
                  {EmptyStates.Error(
                    "This is a demo error message",
                    () => success('Retry clicked', 'This would retry the failed operation')
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-200 mb-3">Custom Empty State</h4>
                  <EmptyState
                    icon="🎪"
                    title="No performances yet"
                    description="Start tracking your shows to build your performance history and improve your craft."
                    action={{
                      label: "Log First Performance",
                      onClick: () => success('Performance logged', 'This would open the performance form')
                    }}
                    secondaryAction={{
                      label: "Learn More",
                      onClick: () => info('Help opened', 'This would show help documentation')
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Demo */}
      <Card>
        <CardHeader>
          <CardTitle>🪟 Enhanced Modal</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setShowModal(true)}>
            Open Modal Demo
          </Button>
        </CardContent>
      </Card>

      {/* Accessibility Features */}
      <Card>
        <CardHeader>
          <CardTitle>♿ Accessibility Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">Focus Management</h4>
                <p className="text-gray-300 text-sm">
                  Modals trap focus and restore it when closed. Tab navigation works throughout the app.
                </p>
              </div>
              
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">Screen Reader Support</h4>
                <p className="text-gray-300 text-sm">
                  ARIA labels, live regions, and semantic HTML ensure compatibility with assistive technologies.
                </p>
              </div>
              
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">Keyboard Navigation</h4>
                <p className="text-gray-300 text-sm">
                  All interactive elements are keyboard accessible. Use Tab, Enter, Space, and arrow keys.
                </p>
              </div>
              
              <div className="p-4 bg-gray-700 rounded-lg">
                <h4 className="font-semibold text-gray-200 mb-2">Reduced Motion</h4>
                <p className="text-gray-300 text-sm">
                  Respects user's motion preferences and provides appropriate alternatives.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Enhanced Modal Demo"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            This modal demonstrates the enhanced accessibility features:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 text-sm">
            <li>Focus is trapped within the modal</li>
            <li>Pressing Escape closes the modal</li>
            <li>Focus returns to the trigger button when closed</li>
            <li>Screen readers announce the modal properly</li>
            <li>Background content is hidden from screen readers</li>
          </ul>
          
          <div className="flex space-x-3 pt-4">
            <Button onClick={() => setShowModal(false)}>
              Close Modal
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                success('Action completed', 'This demonstrates an action within a modal')
              }}
            >
              Demo Action
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default UXDemo