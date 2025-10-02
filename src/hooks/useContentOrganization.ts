import { useState, useCallback, useMemo } from 'react'
import { useStorage } from './useStorage'
import { ContentOrganizationService } from '@core/services'
import type {
  ContentSimilarity,
  BulkOperationResult,
  ExportData,
  ImportResult
} from '@core/services'
import type { Note } from '@core/models'

interface UseContentOrganizationReturn {
  // Duplicate detection
  duplicates: ContentSimilarity[]
  detectingDuplicates: boolean
  detectDuplicates: (threshold?: number) => Promise<void>
  mergeDuplicates: (originalId: string, duplicateIds: string[]) => Promise<Note | null>
  
  // Content categorization
  categorizedContent: {
    short: Note[]
    medium: Note[]
    long: Note[]
  } | null
  categorizingContent: boolean
  categorizeByDuration: () => Promise<void>
  
  // Bulk operations
  bulkOperationInProgress: boolean
  bulkDeleteNotes: (noteIds: string[]) => Promise<BulkOperationResult>
  bulkAddTags: (noteIds: string[], tags: string[]) => Promise<BulkOperationResult>
  bulkRemoveTags: (noteIds: string[], tags: string[]) => Promise<BulkOperationResult>
  
  // Export/Import
  exportInProgress: boolean
  importInProgress: boolean
  exportToJSON: () => Promise<ExportData>
  exportToCSV: (type: 'notes' | 'setlists' | 'venues' | 'contacts') => Promise<string>
  importFromJSON: (data: ExportData, options?: { skipDuplicates?: boolean }) => Promise<ImportResult>
  downloadFile: (content: string, filename: string, mimeType?: string) => void
  
  // Error handling
  error: Error | null
  clearError: () => void
}

/**
 * Hook for content organization features including duplicate detection,
 * bulk operations, and import/export functionality
 */
export function useContentOrganization(): UseContentOrganizationReturn {
  const { storageService, isInitialized } = useStorage()
  const [duplicates, setDuplicates] = useState<ContentSimilarity[]>([])
  const [categorizedContent, setCategorizedContent] = useState<{
    short: Note[]
    medium: Note[]
    long: Note[]
  } | null>(null)
  const [detectingDuplicates, setDetectingDuplicates] = useState(false)
  const [categorizingContent, setCategorizingContent] = useState(false)
  const [bulkOperationInProgress, setBulkOperationInProgress] = useState(false)
  const [exportInProgress, setExportInProgress] = useState(false)
  const [importInProgress, setImportInProgress] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Create organization service instance
  const organizationService = useMemo(() => {
    if (!storageService || !isInitialized) return null
    return new ContentOrganizationService(storageService)
  }, [storageService, isInitialized])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Duplicate detection
  const detectDuplicates = useCallback(async (threshold: number = 0.8) => {
    if (!organizationService) return

    try {
      setDetectingDuplicates(true)
      setError(null)
      const similarities = await organizationService.detectDuplicates(threshold)
      setDuplicates(similarities)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to detect duplicates'))
    } finally {
      setDetectingDuplicates(false)
    }
  }, [organizationService])

  const mergeDuplicates = useCallback(async (originalId: string, duplicateIds: string[]): Promise<Note | null> => {
    if (!organizationService) return null

    try {
      setError(null)
      const mergedNote = await organizationService.mergeDuplicateNotes(originalId, duplicateIds)
      
      // Remove merged duplicates from the duplicates list
      setDuplicates(prev => prev.filter(similarity => 
        similarity.originalNote.id !== originalId &&
        !duplicateIds.includes(similarity.originalNote.id)
      ))
      
      return mergedNote
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to merge duplicates'))
      return null
    }
  }, [organizationService])

  // Content categorization
  const categorizeByDuration = useCallback(async () => {
    if (!organizationService) return

    try {
      setCategorizingContent(true)
      setError(null)
      const categorized = await organizationService.categorizeByDuration()
      setCategorizedContent(categorized)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to categorize content'))
    } finally {
      setCategorizingContent(false)
    }
  }, [organizationService])

  // Bulk operations
  const bulkDeleteNotes = useCallback(async (noteIds: string[]): Promise<BulkOperationResult> => {
    if (!organizationService) {
      return { success: false, processedCount: 0, errors: ['Service not available'] }
    }

    try {
      setBulkOperationInProgress(true)
      setError(null)
      return await organizationService.bulkDeleteNotes(noteIds)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete notes')
      setError(error)
      return { success: false, processedCount: 0, errors: [error.message] }
    } finally {
      setBulkOperationInProgress(false)
    }
  }, [organizationService])

  const bulkAddTags = useCallback(async (noteIds: string[], tags: string[]): Promise<BulkOperationResult> => {
    if (!organizationService) {
      return { success: false, processedCount: 0, errors: ['Service not available'] }
    }

    try {
      setBulkOperationInProgress(true)
      setError(null)
      return await organizationService.bulkAddTags(noteIds, tags)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add tags')
      setError(error)
      return { success: false, processedCount: 0, errors: [error.message] }
    } finally {
      setBulkOperationInProgress(false)
    }
  }, [organizationService])

  const bulkRemoveTags = useCallback(async (noteIds: string[], tags: string[]): Promise<BulkOperationResult> => {
    if (!organizationService) {
      return { success: false, processedCount: 0, errors: ['Service not available'] }
    }

    try {
      setBulkOperationInProgress(true)
      setError(null)
      return await organizationService.bulkRemoveTags(noteIds, tags)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to remove tags')
      setError(error)
      return { success: false, processedCount: 0, errors: [error.message] }
    } finally {
      setBulkOperationInProgress(false)
    }
  }, [organizationService])

  // Export operations
  const exportToJSON = useCallback(async (): Promise<ExportData> => {
    if (!organizationService) {
      throw new Error('Service not available')
    }

    try {
      setExportInProgress(true)
      setError(null)
      return await organizationService.exportToJSON()
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to export data')
      setError(error)
      throw error
    } finally {
      setExportInProgress(false)
    }
  }, [organizationService])

  const exportToCSV = useCallback(async (type: 'notes' | 'setlists' | 'venues' | 'contacts'): Promise<string> => {
    if (!organizationService) {
      throw new Error('Service not available')
    }

    try {
      setExportInProgress(true)
      setError(null)
      return await organizationService.exportToCSV(type)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to export CSV')
      setError(error)
      throw error
    } finally {
      setExportInProgress(false)
    }
  }, [organizationService])

  // Import operations
  const importFromJSON = useCallback(async (
    data: ExportData, 
    options?: { skipDuplicates?: boolean }
  ): Promise<ImportResult> => {
    if (!organizationService) {
      throw new Error('Service not available')
    }

    try {
      setImportInProgress(true)
      setError(null)
      return await organizationService.importFromJSON(data, options)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to import data')
      setError(error)
      throw error
    } finally {
      setImportInProgress(false)
    }
  }, [organizationService])

  // File download helper
  const downloadFile = useCallback((content: string, filename: string, mimeType?: string) => {
    if (!organizationService) return
    organizationService.downloadFile(content, filename, mimeType)
  }, [organizationService])

  return {
    // Duplicate detection
    duplicates,
    detectingDuplicates,
    detectDuplicates,
    mergeDuplicates,
    
    // Content categorization
    categorizedContent,
    categorizingContent,
    categorizeByDuration,
    
    // Bulk operations
    bulkOperationInProgress,
    bulkDeleteNotes,
    bulkAddTags,
    bulkRemoveTags,
    
    // Export/Import
    exportInProgress,
    importInProgress,
    exportToJSON,
    exportToCSV,
    importFromJSON,
    downloadFile,
    
    // Error handling
    error,
    clearError
  }
}