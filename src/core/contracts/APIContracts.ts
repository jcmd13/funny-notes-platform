/**
 * API contracts for cross-platform communication
 * Defines the interface between client applications and backend services
 */

// Base API response structure
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: APIError
  metadata?: APIMetadata
}

export interface APIError {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: string
}

export interface APIMetadata {
  requestId: string
  timestamp: string
  version: string
  pagination?: PaginationMetadata
}

export interface PaginationMetadata {
  page: number
  limit: number
  total: number
  hasNext: boolean
  hasPrevious: boolean
}

// Authentication contracts
export interface AuthenticationRequest {
  method: 'email' | 'oauth' | 'biometric' | 'anonymous'
  credentials: Record<string, any>
  deviceInfo?: DeviceInfo
}

export interface AuthenticationResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: UserProfile
}

export interface UserProfile {
  id: string
  email?: string
  name?: string
  preferences: UserPreferences
  subscription?: SubscriptionInfo
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  notifications: NotificationPreferences
  privacy: PrivacyPreferences
  performance: PerformancePreferences
}

export interface NotificationPreferences {
  enabled: boolean
  types: NotificationType[]
  schedule: NotificationSchedule
}

export interface PrivacyPreferences {
  analytics: boolean
  crashReporting: boolean
  dataSharing: boolean
}

export interface PerformancePreferences {
  autoSync: boolean
  offlineMode: boolean
  compressionLevel: 'low' | 'medium' | 'high'
}

export interface SubscriptionInfo {
  tier: 'free' | 'premium' | 'professional'
  expiresAt?: string
  features: string[]
}

// Content API contracts
export interface ContentAPI {
  // Notes
  createNote: (request: CreateNoteRequest) => Promise<APIResponse<NoteResponse>>
  getNote: (id: string) => Promise<APIResponse<NoteResponse>>
  updateNote: (id: string, request: UpdateNoteRequest) => Promise<APIResponse<NoteResponse>>
  deleteNote: (id: string) => Promise<APIResponse<void>>
  listNotes: (request: ListNotesRequest) => Promise<APIResponse<NoteResponse[]>>
  searchNotes: (request: SearchNotesRequest) => Promise<APIResponse<SearchResponse<NoteResponse>>>

  // Set Lists
  createSetList: (request: CreateSetListRequest) => Promise<APIResponse<SetListResponse>>
  getSetList: (id: string) => Promise<APIResponse<SetListResponse>>
  updateSetList: (id: string, request: UpdateSetListRequest) => Promise<APIResponse<SetListResponse>>
  deleteSetList: (id: string) => Promise<APIResponse<void>>
  listSetLists: (request: ListSetListsRequest) => Promise<APIResponse<SetListResponse[]>>

  // Venues
  createVenue: (request: CreateVenueRequest) => Promise<APIResponse<VenueResponse>>
  getVenue: (id: string) => Promise<APIResponse<VenueResponse>>
  updateVenue: (id: string, request: UpdateVenueRequest) => Promise<APIResponse<VenueResponse>>
  deleteVenue: (id: string) => Promise<APIResponse<void>>
  listVenues: (request: ListVenuesRequest) => Promise<APIResponse<VenueResponse[]>>

  // Contacts
  createContact: (request: CreateContactRequest) => Promise<APIResponse<ContactResponse>>
  getContact: (id: string) => Promise<APIResponse<ContactResponse>>
  updateContact: (id: string, request: UpdateContactRequest) => Promise<APIResponse<ContactResponse>>
  deleteContact: (id: string) => Promise<APIResponse<void>>
  listContacts: (request: ListContactsRequest) => Promise<APIResponse<ContactResponse[]>>
}

// Media API contracts
export interface MediaAPI {
  uploadMedia: (request: UploadMediaRequest) => Promise<APIResponse<MediaResponse>>
  getMedia: (id: string) => Promise<APIResponse<MediaResponse>>
  deleteMedia: (id: string) => Promise<APIResponse<void>>
  processMedia: (request: ProcessMediaRequest) => Promise<APIResponse<ProcessedMediaResponse>>
}

export interface UploadMediaRequest {
  file: Blob | File
  type: 'image' | 'audio' | 'video'
  metadata?: MediaMetadata
}

export interface MediaResponse {
  id: string
  url: string
  thumbnailUrl?: string
  type: 'image' | 'audio' | 'video'
  size: number
  metadata: MediaMetadata
  createdAt: string
}

export interface MediaMetadata {
  filename?: string
  mimeType?: string
  duration?: number
  dimensions?: { width: number; height: number }
  location?: GeolocationData
}

export interface ProcessMediaRequest {
  mediaId: string
  operations: MediaOperation[]
}

export interface MediaOperation {
  type: 'transcribe' | 'ocr' | 'compress' | 'thumbnail'
  parameters?: Record<string, any>
}

export interface ProcessedMediaResponse {
  mediaId: string
  results: ProcessingResult[]
}

export interface ProcessingResult {
  operation: string
  success: boolean
  data?: any
  error?: string
}

// Analytics API contracts
export interface AnalyticsAPI {
  getDashboardAnalytics: () => Promise<APIResponse<DashboardAnalyticsResponse>>
  getContentAnalytics: () => Promise<APIResponse<ContentAnalyticsResponse>>
  getPerformanceAnalytics: () => Promise<APIResponse<PerformanceAnalyticsResponse>>
  getUsageAnalytics: () => Promise<APIResponse<UsageAnalyticsResponse>>
  recordEvent: (request: RecordEventRequest) => Promise<APIResponse<void>>
}

export interface RecordEventRequest {
  event: string
  properties?: Record<string, any>
  timestamp?: string
}

// Sync API contracts
export interface SyncAPI {
  getChanges: (request: GetChangesRequest) => Promise<APIResponse<ChangesResponse>>
  pushChanges: (request: PushChangesRequest) => Promise<APIResponse<PushChangesResponse>>
  resolveConflicts: (request: ResolveConflictsRequest) => Promise<APIResponse<void>>
  getStatus: () => Promise<APIResponse<SyncStatusResponse>>
}

export interface GetChangesRequest {
  lastSyncTimestamp?: string
  entityTypes?: string[]
  limit?: number
}

export interface ChangesResponse {
  changes: EntityChange[]
  nextSyncTimestamp: string
  hasMore: boolean
}

export interface EntityChange {
  id: string
  entityType: string
  operation: 'create' | 'update' | 'delete'
  data?: any
  timestamp: string
  version: number
}

export interface PushChangesRequest {
  changes: EntityChange[]
  clientId: string
}

export interface PushChangesResponse {
  accepted: string[]
  rejected: ConflictInfo[]
  serverTimestamp: string
}

export interface ConflictInfo {
  changeId: string
  reason: string
  serverVersion: any
  clientVersion: any
}

export interface ResolveConflictsRequest {
  resolutions: ConflictResolution[]
}

export interface ConflictResolution {
  changeId: string
  resolution: 'accept-server' | 'accept-client' | 'merge'
  mergedData?: any
}

export interface SyncStatusResponse {
  lastSyncTimestamp: string
  pendingChanges: number
  conflicts: number
  status: 'idle' | 'syncing' | 'error'
}

// Request/Response types for content operations
export interface CreateNoteRequest {
  content: string
  captureMethod: 'text' | 'voice' | 'image'
  tags?: string[]
  venue?: string
  audience?: string
  estimatedDuration?: number
  metadata?: Record<string, any>
  attachments?: AttachmentRequest[]
}

export interface AttachmentRequest {
  type: 'image' | 'audio' | 'video' | 'file'
  mediaId?: string
  url?: string
  metadata?: Record<string, any>
}

export interface UpdateNoteRequest extends Partial<CreateNoteRequest> {
  version: number
}

export interface NoteResponse {
  id: string
  content: string
  captureMethod: 'text' | 'voice' | 'image'
  tags: string[]
  venue?: string
  audience?: string
  estimatedDuration?: number
  metadata: Record<string, any>
  attachments: AttachmentResponse[]
  createdAt: string
  updatedAt: string
  version: number
}

export interface AttachmentResponse {
  id: string
  type: 'image' | 'audio' | 'video' | 'file'
  url: string
  thumbnailUrl?: string
  metadata: Record<string, any>
}

export interface ListNotesRequest {
  page?: number
  limit?: number
  tags?: string[]
  captureMethod?: string
  venue?: string
  audience?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'content'
  sortOrder?: 'asc' | 'desc'
  dateRange?: DateRange
}

export interface SearchNotesRequest {
  query: string
  filters?: SearchFilters
  page?: number
  limit?: number
}

export interface SearchFilters {
  tags?: string[]
  captureMethod?: string[]
  venue?: string
  audience?: string
  dateRange?: DateRange
  durationRange?: { min: number; max: number }
}

export interface DateRange {
  start: string
  end: string
}

export interface SearchResponse<T> {
  results: T[]
  total: number
  query: string
  facets?: SearchFacets
}

export interface SearchFacets {
  tags: FacetCount[]
  captureMethod: FacetCount[]
  venue: FacetCount[]
  audience: FacetCount[]
}

export interface FacetCount {
  value: string
  count: number
}

// Set List API types
export interface CreateSetListRequest {
  name: string
  noteIds: string[]
  venue?: string
  performanceDate?: string
  description?: string
}

export interface UpdateSetListRequest extends Partial<CreateSetListRequest> {
  version: number
}

export interface SetListResponse {
  id: string
  name: string
  notes: NoteResponse[]
  totalDuration: number
  venue?: string
  performanceDate?: string
  description?: string
  createdAt: string
  updatedAt: string
  version: number
}

export interface ListSetListsRequest {
  page?: number
  limit?: number
  venue?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'performanceDate'
  sortOrder?: 'asc' | 'desc'
}

// Venue API types
export interface CreateVenueRequest {
  name: string
  location: string
  characteristics: VenueCharacteristics
  description?: string
}

export interface VenueCharacteristics {
  audienceSize?: number
  audienceType?: string
  acoustics?: 'excellent' | 'good' | 'poor'
  lighting?: 'professional' | 'basic' | 'minimal'
  stageSize?: 'large' | 'medium' | 'small'
  microphoneType?: string
}

export interface UpdateVenueRequest extends Partial<CreateVenueRequest> {
  version: number
}

export interface VenueResponse {
  id: string
  name: string
  location: string
  characteristics: VenueCharacteristics
  description?: string
  performanceHistory: PerformanceHistoryItem[]
  createdAt: string
  updatedAt: string
  version: number
}

export interface PerformanceHistoryItem {
  id: string
  date: string
  duration: number
  rating?: number
  notes?: string
}

export interface ListVenuesRequest {
  page?: number
  limit?: number
  location?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'location'
  sortOrder?: 'asc' | 'desc'
}

// Contact API types
export interface CreateContactRequest {
  name: string
  role: string
  venue?: string
  contactInfo: ContactInfo
  notes?: string
}

export interface ContactInfo {
  email?: string
  phone?: string
  social?: Record<string, string>
  address?: string
}

export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  version: number
}

export interface ContactResponse {
  id: string
  name: string
  role: string
  venue?: string
  contactInfo: ContactInfo
  notes?: string
  interactions: InteractionResponse[]
  reminders: ReminderResponse[]
  createdAt: string
  updatedAt: string
  version: number
}

export interface InteractionResponse {
  id: string
  type: string
  description: string
  outcome?: string
  createdAt: string
}

export interface ReminderResponse {
  id: string
  type: string
  title: string
  description: string
  dueDate: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  createdAt: string
}

export interface ListContactsRequest {
  page?: number
  limit?: number
  role?: string
  venue?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'role'
  sortOrder?: 'asc' | 'desc'
}

// Analytics response types
export interface DashboardAnalyticsResponse {
  contentStats: ContentStatsResponse
  performanceStats: PerformanceStatsResponse
  usageStats: UsageStatsResponse
  insights: InsightResponse[]
  recommendations: RecommendationResponse[]
}

export interface ContentStatsResponse {
  totalNotes: number
  totalSetLists: number
  totalVenues: number
  totalContacts: number
  contentGrowth: ContentGrowthResponse[]
  topTags: TagStatsResponse[]
}

export interface ContentGrowthResponse {
  period: string
  count: number
}

export interface TagStatsResponse {
  tag: string
  count: number
}

export interface PerformanceStatsResponse {
  totalPerformances: number
  averageRating: number
  totalStageTime: number
  upcomingPerformances: number
  recentTrend: TrendResponse
}

export interface TrendResponse {
  direction: 'improving' | 'declining' | 'stable'
  change: number
}

export interface UsageStatsResponse {
  dailyActivity: number[]
  weeklyActivity: number
  monthlyActivity: number
  featureUsage: Record<string, number>
}

export interface InsightResponse {
  type: 'positive' | 'suggestion' | 'warning'
  title: string
  description: string
  actionable: boolean
}

export interface RecommendationResponse {
  category: string
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  action?: string
}

export interface ContentAnalyticsResponse {
  // Detailed content analytics
  captureMethodBreakdown: Record<string, number>
  tagAnalysis: TagAnalysisResponse
  qualityMetrics: QualityMetricsResponse
  duplicateAnalysis: DuplicateAnalysisResponse
}

export interface TagAnalysisResponse {
  totalUniqueTags: number
  averageTagsPerNote: number
  topTags: TagStatsResponse[]
  unusedTags: string[]
}

export interface QualityMetricsResponse {
  completenessScore: number
  averageContentLength: number
  richContentPercentage: number
}

export interface DuplicateAnalysisResponse {
  duplicateRate: number
  potentialDuplicates: DuplicateGroupResponse[]
}

export interface DuplicateGroupResponse {
  originalId: string
  duplicateIds: string[]
  similarity: number
}

export interface PerformanceAnalyticsResponse {
  // Detailed performance analytics
  venueAnalysis: VenueAnalysisResponse[]
  materialAnalysis: MaterialAnalysisResponse[]
  improvementTrends: ImprovementTrendsResponse
  rehearsalMetrics: RehearsalMetricsResponse
}

export interface VenueAnalysisResponse {
  venueId: string
  venueName: string
  performanceCount: number
  averageRating: number
  bestMaterial: string[]
}

export interface MaterialAnalysisResponse {
  noteId: string
  noteContent: string
  performanceCount: number
  averageRating: number
  venues: string[]
}

export interface ImprovementTrendsResponse {
  performanceRating: TrendResponse
  rehearsalEfficiency: TrendResponse
  materialQuality: TrendResponse
}

export interface RehearsalMetricsResponse {
  totalRehearsals: number
  averageDuration: number
  completionRate: number
  timingAccuracy: number
}

// Common types
export interface DeviceInfo {
  platform: string
  version: string
  model?: string
  id: string
}

export interface GeolocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: string
}

export type NotificationType = 
  | 'performance-reminder'
  | 'rehearsal-reminder'
  | 'follow-up-reminder'
  | 'content-suggestion'
  | 'sync-complete'
  | 'backup-complete'

export interface NotificationSchedule {
  quiet_hours: {
    start: string // HH:MM format
    end: string   // HH:MM format
  }
  days: number[] // 0-6, Sunday = 0
}