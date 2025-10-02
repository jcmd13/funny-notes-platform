import React, { useState, useRef } from 'react'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'
import { Modal } from '@components/ui/Modal'
import { LoadingSpinner } from '@components/ui/LoadingSpinner'
import { useContentOrganization } from '../../hooks/useContentOrganization'
import type { ExportData, ImportResult } from '@core/services'

interface ImportExportProps {
  onImportComplete: () => void
}

export function ImportExport({ onImportComplete }: ImportExportProps) {
  const {
    exportToJSON,
    exportToCSV,
    importFromJSON,
    downloadFile,
    exportInProgress,
    importInProgress,
    error,
    clearError
  } = useContentOrganization()

  const [showImportModal, setShowImportModal] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExportJSON = async () => {
    try {
      clearError()
      const data = await exportToJSON()
      const content = JSON.stringify(data, null, 2)
      const filename = `funny-notes-backup-${new Date().toISOString().split('T')[0]}.json`
      downloadFile(content, filename, 'application/json')
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleExportCSV = async (type: 'notes' | 'setlists' | 'venues' | 'contacts') => {
    try {
      clearError()
      const csvContent = await exportToCSV(type)
      const filename = `${type}-${new Date().toISOString().split('T')[0]}.csv`
      downloadFile(csvContent, filename, 'text/csv')
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportResult(null)
    }
  }

  const handleImport = async () => {
    if (!importFile) return

    try {
      clearError()
      const fileContent = await importFile.text()
      const data: ExportData = JSON.parse(fileContent)
      
      const result = await importFromJSON(data, { skipDuplicates })
      setImportResult(result)
      
      if (result.success) {
        onImportComplete()
      }
    } catch (err) {
      console.error('Import failed:', err)
      setImportResult({
        success: false,
        imported: { notes: 0, setlists: 0, venues: 0, contacts: 0 },
        errors: [err instanceof Error ? err.message : 'Failed to parse import file'],
        duplicatesFound: 0
      })
    }
  }

  const resetImport = () => {
    setImportFile(null)
    setImportResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Import & Export</h2>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-700 dark:text-red-300 text-sm">{error.message}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Export Section */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Export Data</h3>
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Complete Backup</h4>
              <Button
                onClick={handleExportJSON}
                disabled={exportInProgress}
                className="w-full"
                size="sm"
              >
                {exportInProgress ? <LoadingSpinner size="sm" /> : 'Export All Data (JSON)'}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Includes all notes, setlists, venues, and contacts
              </p>
            </div>

            <div className="border-t pt-3">
              <h4 className="text-sm font-medium mb-2">Individual Exports (CSV)</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV('notes')}
                  disabled={exportInProgress}
                >
                  Notes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV('setlists')}
                  disabled={exportInProgress}
                >
                  Set Lists
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV('venues')}
                  disabled={exportInProgress}
                >
                  Venues
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExportCSV('contacts')}
                  disabled={exportInProgress}
                >
                  Contacts
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Import Section */}
        <Card className="p-4">
          <h3 className="font-medium mb-3">Import Data</h3>
          <div className="space-y-3">
            <Button
              onClick={() => setShowImportModal(true)}
              className="w-full"
              size="sm"
            >
              Import from Backup
            </Button>
            <p className="text-xs text-gray-500">
              Import data from a JSON backup file
            </p>
          </div>
        </Card>
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false)
          resetImport()
        }}
        title="Import Data"
        size="lg"
      >
        <div className="space-y-4">
          {!importResult && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select backup file (JSON format)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {importFile && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                  <p className="text-sm">
                    <strong>File:</strong> {importFile.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Size:</strong> {(importFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="skipDuplicates"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                />
                <label htmlFor="skipDuplicates" className="text-sm">
                  Skip duplicate content during import
                </label>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Warning:</strong> Importing will add new content to your existing data. 
                  Make sure to export a backup first if you want to preserve your current state.
                </p>
              </div>
            </>
          )}

          {importResult && (
            <div className="space-y-3">
              <div className={`p-3 rounded border ${
                importResult.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <h4 className={`font-medium ${
                  importResult.success 
                    ? 'text-green-800 dark:text-green-200' 
                    : 'text-red-800 dark:text-red-200'
                }`}>
                  {importResult.success ? 'Import Successful!' : 'Import Failed'}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Notes:</strong> {importResult.imported.notes}</p>
                  <p><strong>Set Lists:</strong> {importResult.imported.setlists}</p>
                </div>
                <div>
                  <p><strong>Venues:</strong> {importResult.imported.venues}</p>
                  <p><strong>Contacts:</strong> {importResult.imported.contacts}</p>
                </div>
              </div>

              {importResult.duplicatesFound > 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  Skipped {importResult.duplicatesFound} duplicate items
                </p>
              )}

              {importResult.errors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">Errors:</p>
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-600 dark:text-red-400">
                      • {error}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowImportModal(false)
                resetImport()
              }}
            >
              {importResult ? 'Close' : 'Cancel'}
            </Button>
            {!importResult && (
              <Button
                onClick={handleImport}
                disabled={!importFile || importInProgress}
              >
                {importInProgress ? <LoadingSpinner size="sm" /> : 'Import'}
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}