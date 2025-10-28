import { useState, useCallback, createContext, useContext } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    // Fallback implementation when not in provider
    return {
      toasts: [],
      addToast: () => '',
      removeToast: () => {},
      success: (title: string) => { console.log('Success:', title); return '' },
      error: (title: string) => { console.error('Error:', title); return '' },
      warning: (title: string) => { console.warn('Warning:', title); return '' },
      info: (title: string) => { console.info('Info:', title); return '' }
    }
  }
  return context
}

export function useToastProvider(): ToastContextValue {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    const newToast: Toast = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    // Auto-remove after duration
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => 
    addToast({ type: 'success', title, message }), [addToast])

  const error = useCallback((title: string, message?: string) => 
    addToast({ type: 'error', title, message }), [addToast])

  const warning = useCallback((title: string, message?: string) => 
    addToast({ type: 'warning', title, message }), [addToast])

  const info = useCallback((title: string, message?: string) => 
    addToast({ type: 'info', title, message }), [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}

export { ToastContext }