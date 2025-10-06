import type { IPlatformAdapter } from '../adapters/IPlatformAdapter'
import type { StorageService } from '../storage/StorageService'
import type { 
  SetList, 
  RehearsalSession, 
  Performance, 
  CreateRehearsalSessionInput,
  CreatePerformanceInput,
  PerformanceStats
} from '../models'

/**
 * Platform-agnostic performance management
 * Handles rehearsals, performances, and analytics
 */
export class PerformanceManager {
  constructor(
    private platformAdapter: IPlatformAdapter,
    private storageService: StorageService
  ) {}

  /**
   * Start a rehearsal session
   */
  async startRehearsal(setListId: string, options?: RehearsalOptions): Promise<RehearsalController> {
    const setList = await this.storageService.getSetList(setListId)
    if (!setList) {
      throw new Error('Set list not found')
    }

    const sessionInput: CreateRehearsalSessionInput = {
      setListId,
      startTime: new Date(),
      currentNoteIndex: 0,
      noteTimings: [],
      isCompleted: false
    }

    const session = await this.storageService.createRehearsalSession(sessionInput)

    return new RehearsalController(
      session,
      setList,
      this.platformAdapter,
      this.storageService,
      options
    )
  }

  /**
   * Get rehearsal history for a set list
   */
  async getRehearsalHistory(setListId: string): Promise<RehearsalSession[]> {
    return await this.storageService.listRehearsalSessions({
      setListId,
      sortBy: 'startTime',
      sortOrder: 'desc'
    })
  }

  /**
   * Analyze rehearsal performance
   */
  async analyzeRehearsalPerformance(sessionId: string): Promise<RehearsalAnalysis> {
    const session = await this.storageService.getRehearsalSession(sessionId)
    if (!session) {
      throw new Error('Rehearsal session not found')
    }

    const setList = await this.storageService.getSetList(session.setListId)
    if (!setList) {
      throw new Error('Set list not found')
    }

    // Calculate timing analysis
    const timingAnalysis = this.analyzeTimings(session, setList)
    
    // Get historical data for comparison
    const historicalSessions = await this.getRehearsalHistory(session.setListId)
    const progressAnalysis = this.analyzeProgress(session, historicalSessions)

    return {
      session,
      setList,
      timingAnalysis,
      progressAnalysis,
      recommendations: this.generateRehearsalRecommendations(timingAnalysis, progressAnalysis)
    }
  }

  /**
   * Log a performance
   */
  async logPerformance(input: LogPerformanceInput): Promise<Performance> {
    const performanceInput: CreatePerformanceInput = {
      setListId: input.setListId,
      venueId: input.venueId,
      date: input.date,
      startTime: input.startTime,
      endTime: input.endTime,
      notes: input.notes,
      status: 'completed'
    }

    const performance = await this.storageService.createPerformance(performanceInput)

    // Link performance to venue
    if (input.venueId) {
      await this.storageService.linkPerformanceToVenue(performance.id, input.venueId)
    }

    // Send performance notification if enabled
    if (this.platformAdapter.getFeatureSupport('notifications')) {
      await this.sendPerformanceNotification(performance)
    }

    return performance
  }

  /**
   * Get performance statistics
   */
  async getPerformanceStats(): Promise<PerformanceStats> {
    return await this.storageService.getPerformanceStats()
  }

  /**
   * Get performance insights
   */
  async getPerformanceInsights(): Promise<PerformanceInsights> {
    const stats = await this.getPerformanceStats()
    const performances = await this.storageService.listPerformances({
      status: 'completed',
      sortBy: 'date',
      sortOrder: 'desc',
      limit: 50
    })

    return {
      overallStats: stats,
      trends: this.analyzeTrends(performances),
      venueInsights: await this.analyzeVenuePerformance(performances),
      materialInsights: await this.analyzeMaterialPerformance(performances),
      recommendations: this.generatePerformanceRecommendations(stats, performances)
    }
  }

  /**
   * Schedule performance reminders
   */
  async schedulePerformanceReminders(performanceId: string): Promise<void> {
    const performance = await this.storageService.getPerformance(performanceId)
    if (!performance || !this.platformAdapter.getFeatureSupport('notifications')) {
      return
    }

    const performanceDate = performance.date
    const now = new Date()

    // Schedule reminders at different intervals
    const reminderIntervals = [
      { days: 7, title: 'Performance in 1 week' },
      { days: 1, title: 'Performance tomorrow' },
      { hours: 2, title: 'Performance in 2 hours' }
    ]

    for (const interval of reminderIntervals) {
      const reminderTime = new Date(performanceDate)
      
      if ('days' in interval) {
        reminderTime.setDate(reminderTime.getDate() - interval.days)
      } else if ('hours' in interval) {
        reminderTime.setHours(reminderTime.getHours() - interval.hours)
      }

      if (reminderTime > now) {
        await this.platformAdapter.notifications.scheduleLocalNotification({
          title: interval.title,
          body: `Don't forget your performance at ${performance.venueId}`,
          scheduledTime: reminderTime,
          data: {
            type: 'performance-reminder',
            performanceId: performance.id
          }
        })
      }
    }
  }

  // Private helper methods

  private analyzeTimings(session: RehearsalSession, setList: SetList): TimingAnalysis {
    const noteTimings = session.noteTimings || []
    const totalActualTime = session.totalDuration || 0
    const totalEstimatedTime = setList.totalDuration

    const noteAnalysis = setList.notes.map((note, index) => {
      const timing = noteTimings[index]
      const estimatedDuration = note.estimatedDuration || 0
      const actualDuration = timing?.duration || 0
      
      return {
        noteId: note.id,
        noteContent: note.content.substring(0, 50),
        estimatedDuration,
        actualDuration,
        variance: actualDuration - estimatedDuration,
        variancePercentage: estimatedDuration > 0 ? 
          ((actualDuration - estimatedDuration) / estimatedDuration) * 100 : 0
      }
    })

    return {
      totalEstimatedTime,
      totalActualTime,
      totalVariance: totalActualTime - totalEstimatedTime,
      noteAnalysis,
      averageVariance: noteAnalysis.reduce((sum, note) => sum + note.variance, 0) / noteAnalysis.length,
      problematicNotes: noteAnalysis.filter(note => Math.abs(note.variancePercentage) > 20)
    }
  }

  private analyzeProgress(current: RehearsalSession, historical: RehearsalSession[]): ProgressAnalysis {
    if (historical.length < 2) {
      return {
        trend: 'insufficient-data',
        improvementAreas: [],
        strengths: []
      }
    }

    const recentSessions = historical.slice(0, 5)
    const durations = recentSessions.map(s => s.totalDuration || 0)
    
    // Calculate trend
    const avgRecent = durations.slice(0, 3).reduce((sum, d) => sum + d, 0) / 3
    const avgOlder = durations.slice(3).reduce((sum, d) => sum + d, 0) / (durations.length - 3)
    
    let trend: ProgressTrend = 'stable'
    if (avgRecent < avgOlder * 0.95) {
      trend = 'improving'
    } else if (avgRecent > avgOlder * 1.05) {
      trend = 'declining'
    }

    return {
      trend,
      improvementAreas: this.identifyImprovementAreas(current, recentSessions),
      strengths: this.identifyStrengths(current, recentSessions)
    }
  }

  private generateRehearsalRecommendations(
    timing: TimingAnalysis, 
    progress: ProgressAnalysis
  ): string[] {
    const recommendations: string[] = []

    if (timing.totalVariance > 60) { // More than 1 minute over
      recommendations.push('Consider trimming material or improving pacing')
    }

    if (timing.problematicNotes.length > 0) {
      recommendations.push(`Focus on timing for: ${timing.problematicNotes.map(n => n.noteContent).join(', ')}`)
    }

    if (progress.trend === 'declining') {
      recommendations.push('Recent rehearsals show increased duration - review pacing')
    }

    if (progress.improvementAreas.length > 0) {
      recommendations.push(`Work on: ${progress.improvementAreas.join(', ')}`)
    }

    return recommendations
  }

  private async sendPerformanceNotification(performance: Performance): Promise<void> {
    try {
      await this.platformAdapter.notifications.scheduleLocalNotification({
        title: 'Performance Logged',
        body: `Your performance has been recorded successfully`,
        data: {
          type: 'performance-logged',
          performanceId: performance.id
        }
      })
    } catch (error) {
      console.warn('Failed to send performance notification:', error)
    }
  }

  private analyzeTrends(performances: Performance[]): PerformanceTrend[] {
    // Analyze trends over time
    const monthlyData = new Map<string, { count: number, totalRating: number }>()
    
    performances.forEach(perf => {
      if (perf.feedback?.rating) {
        const monthKey = perf.date.toISOString().substring(0, 7)
        const existing = monthlyData.get(monthKey) || { count: 0, totalRating: 0 }
        existing.count++
        existing.totalRating += perf.feedback.rating
        monthlyData.set(monthKey, existing)
      }
    })

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      period: month,
      performanceCount: data.count,
      averageRating: data.totalRating / data.count
    }))
  }

  private async analyzeVenuePerformance(performances: Performance[]): Promise<VenueInsight[]> {
    const venueStats = new Map<string, { count: number, totalRating: number, name: string }>()
    
    for (const perf of performances) {
      if (perf.feedback?.rating) {
        const venue = await this.storageService.getVenue(perf.venueId)
        if (venue) {
          const existing = venueStats.get(perf.venueId) || { count: 0, totalRating: 0, name: venue.name }
          existing.count++
          existing.totalRating += perf.feedback.rating
          venueStats.set(perf.venueId, existing)
        }
      }
    }

    return Array.from(venueStats.entries()).map(([venueId, stats]) => ({
      venueId,
      venueName: stats.name,
      performanceCount: stats.count,
      averageRating: stats.totalRating / stats.count
    }))
  }

  private async analyzeMaterialPerformance(performances: Performance[]): Promise<MaterialInsight[]> {
    const materialStats = new Map<string, { count: number, totalRating: number, content: string }>()
    
    for (const perf of performances) {
      if (perf.feedback?.materialFeedback) {
        const setList = await this.storageService.getSetList(perf.setListId)
        if (setList) {
          for (const materialFeedback of perf.feedback.materialFeedback) {
            const note = setList.notes.find(n => n.id === materialFeedback.noteId)
            if (note) {
              const existing = materialStats.get(materialFeedback.noteId) || 
                { count: 0, totalRating: 0, content: note.content.substring(0, 100) }
              existing.count++
              existing.totalRating += materialFeedback.rating
              materialStats.set(materialFeedback.noteId, existing)
            }
          }
        }
      }
    }

    return Array.from(materialStats.entries()).map(([noteId, stats]) => ({
      noteId,
      noteContent: stats.content,
      performanceCount: stats.count,
      averageRating: stats.totalRating / stats.count
    }))
  }

  private generatePerformanceRecommendations(
    stats: PerformanceStats, 
    performances: Performance[]
  ): string[] {
    const recommendations: string[] = []

    if (stats.averageRating < 3.5) {
      recommendations.push('Consider working on material quality and delivery')
    }

    if (stats.recentTrend.direction === 'declining') {
      recommendations.push('Recent performances show declining ratings - review recent changes')
    }

    if (stats.topMaterial.length > 0) {
      const topMaterial = stats.topMaterial[0]
      recommendations.push(`Your strongest material: "${topMaterial.noteContent}" - consider building similar content`)
    }

    return recommendations
  }

  private identifyImprovementAreas(current: RehearsalSession, historical: RehearsalSession[]): string[] {
    // Analyze patterns to identify areas needing work
    return ['pacing', 'transitions'] // Simplified for now
  }

  private identifyStrengths(current: RehearsalSession, historical: RehearsalSession[]): string[] {
    // Analyze patterns to identify strengths
    return ['consistency', 'timing'] // Simplified for now
  }
}

/**
 * Rehearsal controller for managing active rehearsal sessions
 */
export class RehearsalController {
  private currentNoteIndex = 0
  private startTime: Date
  private noteStartTime?: Date
  private isActive = false

  constructor(
    private session: RehearsalSession,
    private setList: SetList,
    private platformAdapter: IPlatformAdapter,
    private storageService: StorageService,
    private options?: RehearsalOptions
  ) {
    this.currentNoteIndex = session.currentNoteIndex
    this.startTime = session.startTime
  }

  /**
   * Start the rehearsal
   */
  async start(): Promise<void> {
    this.isActive = true
    this.noteStartTime = new Date()
    
    // Enable keep screen on if supported
    if (this.platformAdapter.getFeatureSupport('system-integration')) {
      await this.platformAdapter.device.keepScreenOn(true)
    }

    // Start haptic feedback if enabled
    if (this.options?.hapticFeedback && this.platformAdapter.getFeatureSupport('haptics')) {
      await this.platformAdapter.device.triggerHaptic('light')
    }
  }

  /**
   * Move to next note
   */
  async nextNote(): Promise<boolean> {
    if (!this.isActive) return false

    // Record timing for current note
    if (this.noteStartTime) {
      const duration = (new Date().getTime() - this.noteStartTime.getTime()) / 1000
      await this.recordNoteTiming(this.currentNoteIndex, duration)
    }

    // Move to next note
    this.currentNoteIndex++
    if (this.currentNoteIndex >= this.setList.notes.length) {
      await this.complete()
      return false
    }

    this.noteStartTime = new Date()
    await this.updateSession()
    return true
  }

  /**
   * Move to previous note
   */
  async previousNote(): Promise<boolean> {
    if (!this.isActive || this.currentNoteIndex <= 0) return false

    this.currentNoteIndex--
    this.noteStartTime = new Date()
    await this.updateSession()
    return true
  }

  /**
   * Pause the rehearsal
   */
  async pause(): Promise<void> {
    this.isActive = false
    await this.updateSession()
  }

  /**
   * Resume the rehearsal
   */
  async resume(): Promise<void> {
    this.isActive = true
    this.noteStartTime = new Date()
    await this.updateSession()
  }

  /**
   * Complete the rehearsal
   */
  async complete(): Promise<RehearsalSession> {
    this.isActive = false
    
    const endTime = new Date()
    const totalDuration = (endTime.getTime() - this.startTime.getTime()) / 1000

    const updatedSession = await this.storageService.updateRehearsalSession(this.session.id, {
      endTime,
      totalDuration,
      isCompleted: true,
      currentNoteIndex: this.currentNoteIndex
    })

    // Disable keep screen on
    if (this.platformAdapter.getFeatureSupport('system-integration')) {
      await this.platformAdapter.device.keepScreenOn(false)
    }

    return updatedSession
  }

  /**
   * Get current rehearsal state
   */
  getState(): RehearsalState {
    return {
      currentNoteIndex: this.currentNoteIndex,
      currentNote: this.setList.notes[this.currentNoteIndex],
      totalNotes: this.setList.notes.length,
      isActive: this.isActive,
      progress: this.currentNoteIndex / this.setList.notes.length,
      elapsedTime: (new Date().getTime() - this.startTime.getTime()) / 1000
    }
  }

  private async recordNoteTiming(noteIndex: number, duration: number): Promise<void> {
    const noteTimings = [...(this.session.noteTimings || [])]
    noteTimings[noteIndex] = {
      noteId: this.setList.notes[noteIndex].id,
      duration,
      timestamp: new Date()
    }

    this.session.noteTimings = noteTimings
    await this.updateSession()
  }

  private async updateSession(): Promise<void> {
    await this.storageService.updateRehearsalSession(this.session.id, {
      currentNoteIndex: this.currentNoteIndex,
      noteTimings: this.session.noteTimings,
      updatedAt: new Date()
    })
  }
}

// Types and interfaces

export interface RehearsalOptions {
  hapticFeedback?: boolean
  autoAdvance?: boolean
  showTimings?: boolean
}

export interface RehearsalState {
  currentNoteIndex: number
  currentNote: any
  totalNotes: number
  isActive: boolean
  progress: number
  elapsedTime: number
}

export interface RehearsalAnalysis {
  session: RehearsalSession
  setList: SetList
  timingAnalysis: TimingAnalysis
  progressAnalysis: ProgressAnalysis
  recommendations: string[]
}

export interface TimingAnalysis {
  totalEstimatedTime: number
  totalActualTime: number
  totalVariance: number
  noteAnalysis: NoteTimingAnalysis[]
  averageVariance: number
  problematicNotes: NoteTimingAnalysis[]
}

export interface NoteTimingAnalysis {
  noteId: string
  noteContent: string
  estimatedDuration: number
  actualDuration: number
  variance: number
  variancePercentage: number
}

export interface ProgressAnalysis {
  trend: ProgressTrend
  improvementAreas: string[]
  strengths: string[]
}

export interface LogPerformanceInput {
  setListId: string
  venueId: string
  date: Date
  startTime?: Date
  endTime?: Date
  notes?: string
}

export interface PerformanceInsights {
  overallStats: PerformanceStats
  trends: PerformanceTrend[]
  venueInsights: VenueInsight[]
  materialInsights: MaterialInsight[]
  recommendations: string[]
}

export interface PerformanceTrend {
  period: string
  performanceCount: number
  averageRating: number
}

export interface VenueInsight {
  venueId: string
  venueName: string
  performanceCount: number
  averageRating: number
}

export interface MaterialInsight {
  noteId: string
  noteContent: string
  performanceCount: number
  averageRating: number
}

export type ProgressTrend = 'improving' | 'declining' | 'stable' | 'insufficient-data'