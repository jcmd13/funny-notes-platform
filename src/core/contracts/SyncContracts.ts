/**
 * Synchronization contracts for cross-platform data consistency
 * Defines how data synchronization should work across all platforms
 */

// Core sync interfaces
export interface SyncManager {
  // Sync lifecycle
  initialize(config: SyncConfig): Promise<void>
  start(): Promise<void>
  stop(): Promise<void>
  pause(): Promise<void>
  resume(): Promise<void>
  
  // Sync operations
  sync(options?: SyncOptions): Promise<SyncResult>
  forcePush(entityType?: string): Promise<SyncResult>
  forcePull(entityType?: string): Promise<SyncResult>
  
  // Conflict resolution
  resolveConflicts(resolutions: ConflictResolution[]): Promise<void>
  getConflicts(): Promise<SyncConflict[]>
  
  // Status and monitoring
  getStatus(): SyncStatus
  getLastSyncTime(): Date | null
  onStatusChange(callback: (status: SyncStatus) => void): void
  onConflict(callback: (conflict: SyncConflict) => void): void
  onProgress(callback: (progress: SyncProgress) => void): void
}

export interface SyncConfig {
  // Connection settings
  serverUrl: string
  apiKey: string
  clientId: string
  
  // Sync behavior
  autoSync: boolean
  syncInterval: number // milliseconds
  batchSize: number
  maxRetries: number
  retryDelay: number
  
  // Conflict resolution
  defaultResolution: ConflictResolutionStrategy
  customResolvers: Record<string, ConflictResolver>
  
  // Performance settings
  compressionEnabled: boolean
  encryptionEnabled: boolean
  deltaSync: boolean
  
  // Entity configuration
  entityConfigs: Record<string, EntitySyncConfig>
}

export interface EntitySyncConfig {
  enabled: boolean
  priority: number
  conflictResolution: ConflictResolutionStrategy
  customFields?: string[]
  excludeFields?: string[]
  transformers?: DataTransformer[]
}

export interface SyncOptions {
  entityTypes?: string[]
  force?: boolean
  direction?: SyncDirection
  since?: Date
  limit?: number
}

export type SyncDirection = 'push' | 'pull' | 'bidirectional'

// Sync results and status
export interface SyncResult {
  success: boolean
  startTime: Date
  endTime: Date
  duration: number
  
  // Statistics
  pushed: SyncStats
  pulled: SyncStats
  conflicts: number
  errors: SyncError[]
  
  // Details
  entityResults: Record<string, EntitySyncResult>
  nextSyncTime?: Date
}

export interface SyncStats {
  created: number
  updated: number
  deleted: number
  total: number
  bytes: number
}

export interface EntitySyncResult {
  entityType: string
  pushed: SyncStats
  pulled: SyncStats
  conflicts: SyncConflict[]
  errors: SyncError[]
}

export interface SyncError {
  type: SyncErrorType
  message: string
  entityType?: string
  entityId?: string
  details?: any
  timestamp: Date
  retryable: boolean
}

export type SyncErrorType = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'conflict'
  | 'storage'
  | 'transformation'
  | 'unknown'

export interface SyncStatus {
  state: SyncState
  progress?: SyncProgress
  lastSync?: Date
  nextSync?: Date
  pendingChanges: number
  conflicts: number
  errors: SyncError[]
}

export type SyncState = 
  | 'idle'
  | 'syncing'
  | 'paused'
  | 'error'
  | 'offline'
  | 'conflict'

export interface SyncProgress {
  phase: SyncPhase
  entityType?: string
  current: number
  total: number
  percentage: number
  estimatedTimeRemaining?: number
}

export type SyncPhase = 
  | 'preparing'
  | 'pushing'
  | 'pulling'
  | 'resolving-conflicts'
  | 'finalizing'

// Conflict resolution
export interface SyncConflict {
  id: string
  entityType: string
  entityId: string
  field?: string
  
  // Conflict details
  localValue: any
  remoteValue: any
  baseValue?: any
  
  // Metadata
  localTimestamp: Date
  remoteTimestamp: Date
  conflictType: ConflictType
  
  // Resolution
  resolution?: ConflictResolution
  resolvedAt?: Date
  resolvedBy?: string
}

export type ConflictType = 
  | 'update-update'
  | 'update-delete'
  | 'delete-update'
  | 'create-create'

export interface ConflictResolution {
  conflictId: string
  strategy: ConflictResolutionStrategy
  value?: any
  reason?: string
}

export type ConflictResolutionStrategy = 
  | 'local-wins'
  | 'remote-wins'
  | 'latest-wins'
  | 'merge'
  | 'manual'
  | 'custom'

export interface ConflictResolver {
  canResolve(conflict: SyncConflict): boolean
  resolve(conflict: SyncConflict): Promise<ConflictResolution>
  priority: number
}

// Change tracking
export interface ChangeTracker {
  // Track changes
  trackCreate(entityType: string, entity: any): void
  trackUpdate(entityType: string, entityId: string, changes: any): void
  trackDelete(entityType: string, entityId: string): void
  
  // Get changes
  getChanges(since?: Date): Change[]
  getChangesByEntity(entityType: string, since?: Date): Change[]
  getPendingChanges(): Change[]
  
  // Manage changes
  markSynced(changeIds: string[]): void
  clearChanges(entityType?: string): void
  
  // Change metadata
  getChangeCount(entityType?: string): number
  getOldestChange(): Change | null
}

export interface Change {
  id: string
  entityType: string
  entityId: string
  operation: ChangeOperation
  data?: any
  timestamp: Date
  synced: boolean
  attempts: number
  lastAttempt?: Date
  error?: string
}

export type ChangeOperation = 'create' | 'update' | 'delete'

// Sync adapters for different backends
export interface SyncAdapter {
  // Connection management
  connect(config: SyncConfig): Promise<void>
  disconnect(): Promise<void>
  isConnected(): boolean
  
  // Data operations
  push(changes: Change[]): Promise<PushResult>
  pull(since?: Date, entityTypes?: string[]): Promise<PullResult>
  
  // Metadata operations
  getServerTime(): Promise<Date>
  getEntityVersion(entityType: string, entityId: string): Promise<number>
  
  // Batch operations
  batchPush(batches: Change[][]): Promise<PushResult[]>
  batchPull(requests: PullRequest[]): Promise<PullResult[]>
}

export interface PushResult {
  success: boolean
  accepted: string[]
  rejected: RejectedChange[]
  conflicts: SyncConflict[]
  serverTimestamp: Date
}

export interface RejectedChange {
  changeId: string
  reason: string
  retryable: boolean
}

export interface PullResult {
  success: boolean
  changes: RemoteChange[]
  hasMore: boolean
  nextToken?: string
  serverTimestamp: Date
}

export interface RemoteChange {
  entityType: string
  entityId: string
  operation: ChangeOperation
  data?: any
  version: number
  timestamp: Date
}

export interface PullRequest {
  entityTypes?: string[]
  since?: Date
  limit?: number
  token?: string
}

// Offline sync support
export interface OfflineSyncManager {
  // Queue management
  queueChange(change: Change): void
  getQueuedChanges(): Change[]
  clearQueue(): void
  
  // Offline detection
  isOnline(): boolean
  onOnline(callback: () => void): void
  onOffline(callback: () => void): void
  
  // Sync when online
  syncWhenOnline(): Promise<void>
  
  // Conflict prevention
  enableOptimisticLocking(): void
  disableOptimisticLocking(): void
}

// Real-time sync
export interface RealtimeSyncManager {
  // Connection management
  connect(): Promise<void>
  disconnect(): Promise<void>
  
  // Subscriptions
  subscribe(entityTypes: string[]): Promise<void>
  unsubscribe(entityTypes?: string[]): Promise<void>
  
  // Event handling
  onRemoteChange(callback: (change: RemoteChange) => void): void
  onConnectionChange(callback: (connected: boolean) => void): void
  
  // Presence
  updatePresence(data: any): Promise<void>
  onPresenceChange(callback: (presence: PresenceUpdate) => void): void
}

export interface PresenceUpdate {
  userId: string
  data: any
  timestamp: Date
  online: boolean
}

// Sync middleware and plugins
export interface SyncMiddleware {
  name: string
  priority: number
  
  // Hooks
  beforeSync?(context: SyncContext): Promise<void>
  afterSync?(context: SyncContext, result: SyncResult): Promise<void>
  beforePush?(changes: Change[]): Promise<Change[]>
  afterPush?(changes: Change[], result: PushResult): Promise<void>
  beforePull?(request: PullRequest): Promise<PullRequest>
  afterPull?(result: PullResult): Promise<RemoteChange[]>
  onConflict?(conflict: SyncConflict): Promise<ConflictResolution | null>
  onError?(error: SyncError): Promise<boolean> // return true to retry
}

export interface SyncContext {
  config: SyncConfig
  options: SyncOptions
  startTime: Date
  metadata: Record<string, any>
}

// Data transformation for sync
export interface DataTransformer {
  name: string
  entityTypes: string[]
  
  // Transform data before sending
  transformOutbound(data: any, entityType: string): Promise<any>
  
  // Transform data after receiving
  transformInbound(data: any, entityType: string): Promise<any>
  
  // Validate transformed data
  validate(data: any, entityType: string): Promise<boolean>
}

// Sync encryption
export interface SyncEncryption {
  // Encrypt data before sync
  encrypt(data: any): Promise<EncryptedData>
  
  // Decrypt data after sync
  decrypt(encryptedData: EncryptedData): Promise<any>
  
  // Key management
  generateKey(): Promise<string>
  rotateKey(): Promise<void>
  
  // Verification
  verify(data: any, signature: string): Promise<boolean>
  sign(data: any): Promise<string>
}

export interface EncryptedData {
  data: string
  algorithm: string
  keyId: string
  iv?: string
  signature?: string
}

// Sync analytics and monitoring
export interface SyncAnalytics {
  // Record events
  recordSyncStart(options: SyncOptions): void
  recordSyncComplete(result: SyncResult): void
  recordConflict(conflict: SyncConflict): void
  recordError(error: SyncError): void
  
  // Get metrics
  getSyncMetrics(period: TimePeriod): SyncMetrics
  getConflictMetrics(period: TimePeriod): ConflictMetrics
  getPerformanceMetrics(period: TimePeriod): SyncPerformanceMetrics
  
  // Export data
  exportMetrics(format: 'json' | 'csv'): Promise<string>
}

export interface SyncMetrics {
  totalSyncs: number
  successfulSyncs: number
  failedSyncs: number
  averageDuration: number
  totalDataTransferred: number
  syncFrequency: number
}

export interface ConflictMetrics {
  totalConflicts: number
  resolvedConflicts: number
  pendingConflicts: number
  conflictsByType: Record<ConflictType, number>
  averageResolutionTime: number
}

export interface SyncPerformanceMetrics {
  averageLatency: number
  throughput: number
  errorRate: number
  retryRate: number
  compressionRatio?: number
}

export type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'year'

// Sync testing and validation
export interface SyncTester {
  // Test sync functionality
  testBasicSync(): Promise<TestResult>
  testConflictResolution(): Promise<TestResult>
  testOfflineSync(): Promise<TestResult>
  testPerformance(): Promise<PerformanceTestResult>
  
  // Validate sync state
  validateDataConsistency(): Promise<ConsistencyTestResult>
  validateSyncIntegrity(): Promise<IntegrityTestResult>
  
  // Simulate scenarios
  simulateNetworkFailure(): Promise<void>
  simulateConflicts(count: number): Promise<SyncConflict[]>
  simulateHighLoad(): Promise<void>
}

export interface TestResult {
  passed: boolean
  duration: number
  errors: string[]
  warnings: string[]
  details: Record<string, any>
}

export interface PerformanceTestResult extends TestResult {
  throughput: number
  latency: number
  memoryUsage: number
  cpuUsage: number
}

export interface ConsistencyTestResult extends TestResult {
  inconsistencies: DataInconsistency[]
  totalEntities: number
  consistentEntities: number
}

export interface DataInconsistency {
  entityType: string
  entityId: string
  field: string
  localValue: any
  remoteValue: any
  severity: 'error' | 'warning'
}

export interface IntegrityTestResult extends TestResult {
  corruptedEntities: string[]
  missingEntities: string[]
  orphanedEntities: string[]
  duplicateEntities: string[]
}

// Sync configuration presets
export const SyncPresets = {
  // Real-time sync for collaborative features
  realtime: {
    autoSync: true,
    syncInterval: 1000, // 1 second
    batchSize: 10,
    deltaSync: true,
    defaultResolution: 'latest-wins' as ConflictResolutionStrategy
  },
  
  // Balanced sync for general use
  balanced: {
    autoSync: true,
    syncInterval: 30000, // 30 seconds
    batchSize: 50,
    deltaSync: true,
    defaultResolution: 'manual' as ConflictResolutionStrategy
  },
  
  // Battery-optimized sync for mobile
  batteryOptimized: {
    autoSync: true,
    syncInterval: 300000, // 5 minutes
    batchSize: 100,
    deltaSync: true,
    compressionEnabled: true,
    defaultResolution: 'local-wins' as ConflictResolutionStrategy
  },
  
  // Manual sync for full control
  manual: {
    autoSync: false,
    syncInterval: 0,
    batchSize: 200,
    deltaSync: true,
    defaultResolution: 'manual' as ConflictResolutionStrategy
  }
}

// Sync event types for monitoring
export type SyncEventType = 
  | 'sync-started'
  | 'sync-completed'
  | 'sync-failed'
  | 'sync-paused'
  | 'sync-resumed'
  | 'conflict-detected'
  | 'conflict-resolved'
  | 'connection-lost'
  | 'connection-restored'
  | 'data-corrupted'
  | 'quota-exceeded'

export interface SyncEvent {
  type: SyncEventType
  timestamp: Date
  data?: any
  error?: SyncError
}