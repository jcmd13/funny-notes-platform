/**
 * Cross-platform file system adapter interface
 * Abstracts file operations, directory management, and file sharing
 */
export interface IFileSystemAdapter {
  // File operations
  readFile(path: string): Promise<FileReadResult>
  writeFile(path: string, data: Blob | string, options?: WriteFileOptions): Promise<FileWriteResult>
  deleteFile(path: string): Promise<FileOperationResult>
  copyFile(sourcePath: string, destinationPath: string): Promise<FileOperationResult>
  moveFile(sourcePath: string, destinationPath: string): Promise<FileOperationResult>
  
  // Directory operations
  createDirectory(path: string): Promise<FileOperationResult>
  deleteDirectory(path: string, recursive?: boolean): Promise<FileOperationResult>
  listDirectory(path: string): Promise<DirectoryListResult>
  
  // File information
  getFileInfo(path: string): Promise<FileInfo | null>
  exists(path: string): Promise<boolean>
  
  // File sharing and export
  shareFile(path: string, options?: ShareOptions): Promise<ShareResult>
  exportFile(data: Blob, filename: string, mimeType?: string): Promise<ExportResult>
  importFile(options?: ImportOptions): Promise<ImportResult>
  
  // Storage management
  getStorageInfo(): Promise<StorageInfo>
  getAvailableSpace(): Promise<number>
  
  // Path utilities
  joinPath(...segments: string[]): string
  getBasename(path: string): string
  getDirname(path: string): string
  getExtension(path: string): string
  
  // Platform-specific paths
  getDocumentsPath(): Promise<string>
  getCachePath(): Promise<string>
  getTempPath(): Promise<string>
}

export interface FileReadResult {
  success: boolean
  data?: Blob | string
  error?: string
  metadata?: FileMetadata
}

export interface FileWriteResult {
  success: boolean
  path?: string
  bytesWritten?: number
  error?: string
}

export interface FileOperationResult {
  success: boolean
  error?: string
}

export interface DirectoryListResult {
  success: boolean
  entries?: DirectoryEntry[]
  error?: string
}

export interface ShareResult {
  success: boolean
  error?: string
}

export interface ExportResult {
  success: boolean
  path?: string
  error?: string
}

export interface ImportResult {
  success: boolean
  files?: ImportedFile[]
  error?: string
}

export interface WriteFileOptions {
  encoding?: 'utf8' | 'base64' | 'binary'
  createDirectories?: boolean
  overwrite?: boolean
}

export interface ShareOptions {
  title?: string
  message?: string
  mimeType?: string
  excludedActivityTypes?: string[]
}

export interface ImportOptions {
  allowMultiple?: boolean
  mimeTypes?: string[]
  maxFileSize?: number
}

export interface FileInfo {
  path: string
  name: string
  size: number
  type: 'file' | 'directory'
  mimeType?: string
  createdAt: Date
  modifiedAt: Date
  isReadable: boolean
  isWritable: boolean
}

export interface DirectoryEntry {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  modifiedAt?: Date
}

export interface ImportedFile {
  name: string
  data: Blob
  mimeType: string
  size: number
}

export interface FileMetadata {
  size: number
  mimeType?: string
  encoding?: string
  createdAt?: Date
  modifiedAt?: Date
}

export interface StorageInfo {
  totalSpace: number
  availableSpace: number
  usedSpace: number
  platform: string
}

// File system events
export interface FileSystemEvent {
  type: 'created' | 'modified' | 'deleted' | 'moved'
  path: string
  timestamp: Date
  metadata?: Record<string, any>
}

export interface FileWatcher {
  path: string
  callback: (event: FileSystemEvent) => void
  stop(): void
}