// Export all custom hooks
export { useStorage } from './useStorage'
export { useNotes } from './useNotes'
export { useSetLists } from './useSetLists'
export { useVenues } from './useVenues'
export { useContacts } from './useContacts'
export { useSearch } from './useSearch'
export { useContentOrganization } from './useContentOrganization'
export { useRehearsalSessions } from './useRehearsalSessions'
export { usePerformances } from './usePerformances'
export { usePWA } from './usePWA'

// UX Enhancement hooks
export { useKeyboardShortcuts, useGlobalKeyboardShortcuts } from './useKeyboardShortcuts'
export { useCommandPalette } from './useCommandPalette'
export { useErrorHandler, useAsyncOperation } from './useErrorHandler'
export { 
  useFocusTrap, 
  useFocusAnnouncement, 
  useKeyboardNavigation, 
  useSkipLinks, 
  useReducedMotion, 
  useAriaLiveRegion 
} from './useFocusManagement'