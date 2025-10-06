import type { IPlatformAdapter } from '../adapters/IPlatformAdapter'
import type { StorageService } from '../storage/StorageService'

/**
 * Platform-agnostic analytics and insights manager
 * Provides comprehensive analytics across all business domains
 */
export class AnalyticsManager {
  constructor(
    private platformAdapter: IPlatformAdapter,
    private storageService: StorageService
  ) {}

  /**
   * Get comprehensive dashboard analytics
   */
  async getDashboardAnalytics(): Promise<DashboardAnalytics> {
    const [
      contentStats,
      performanceStats,
      usageStats,
      trendAnalysis
    ] = await Promise.all([
      this.getContentStatistics(),
      this.getPerformanceStatistics(),
      this.getUsageStatistics(),
      this.getTrendAnalysis()
    ])

    return {
      contentStats,
      performanceStats,
      usageStats,
      trendAnalysis,
      insights: this.generateInsights(contentStats, performanceStats, usageStats),
      recommendations: this.generateRecommendations(contentStats, performanceStats, usageStats)
    }
  }

  /**
   * Get content creation and organization statistics
   */
  async getContentStatistics(): Promise<ContentStatistics> {
    const [notes, setlists, venues, contacts] = await Promise.all([
      this.storageService.listNotes(),
      this.storageService.listSetLists(),
      this.storageService.listVenues(),
      this.storageService.listContacts()
    ])

    // Calculate content metrics
    const totalContent = notes.length
    const totalDuration = notes.reduce((sum, note) => sum + (note.estimatedDuration || 0), 0)
    
    // Analyze capture methods
    const captureMethodBreakdown = this.analyzeCaptureMethodBreakdown(notes)
    
    // Analyze content growth over time
    const contentGrowth = this.analyzeContentGrowth(notes)
    
    // Analyze tag usage
    const tagAnalysis = this.analyzeTagUsage(notes)
    
    // Calculate content quality metrics
    const qualityMetrics = this.calculateContentQualityMetrics(notes)

    return {
      totalNotes: notes.length,
      totalSetLists: setlists.length,
      totalVenues: venues.length,
      totalContacts: contacts.length,
      totalDuration,
      averageNoteDuration: totalContent > 0 ? totalDuration / totalContent : 0,
      captureMethodBreakdown,
      contentGrowth,
      tagAnalysis,
      qualityMetrics,
      contentDistribution: this.analyzeContentDistribution(notes)
    }
  }

  /**
   * Get performance and rehearsal statistics
   */
  async getPerformanceStatistics(): Promise<PerformanceStatistics> {
    const [performances, rehearsalSessions] = await Promise.all([
      this.storageService.listPerformances(),
      this.storageService.listRehearsalSessions()
    ])

    const completedPerformances = performances.filter(p => p.status === 'completed')
    const completedRehearsals = rehearsalSessions.filter(r => r.isCompleted)

    // Calculate performance metrics
    const performanceMetrics = this.calculatePerformanceMetrics(completedPerformances)
    
    // Calculate rehearsal metrics
    const rehearsalMetrics = this.calculateRehearsalMetrics(completedRehearsals)
    
    // Analyze venue performance
    const venueAnalysis = await this.analyzeVenuePerformance(completedPerformances)
    
    // Calculate improvement trends
    const improvementTrends = this.calculateImprovementTrends(completedPerformances, completedRehearsals)

    return {
      totalPerformances: performances.length,
      completedPerformances: completedPerformances.length,
      totalRehearsals: rehearsalSessions.length,
      completedRehearsals: completedRehearsals.length,
      performanceMetrics,
      rehearsalMetrics,
      venueAnalysis,
      improvementTrends,
      upcomingPerformances: performances.filter(p => p.status === 'scheduled' && p.date > new Date()).length
    }
  }

  /**
   * Get app usage and engagement statistics
   */
  async getUsageStatistics(): Promise<UsageStatistics> {
    // This would typically integrate with platform analytics
    // For now, we'll calculate based on available data
    
    const [notes, setlists, performances, rehearsals] = await Promise.all([
      this.storageService.listNotes(),
      this.storageService.listSetLists(),
      this.storageService.listPerformances(),
      this.storageService.listRehearsalSessions()
    ])

    // Calculate usage patterns
    const dailyUsage = this.calculateDailyUsagePattern([...notes, ...setlists, ...performances, ...rehearsals])
    const featureUsage = this.calculateFeatureUsage(notes, setlists, performances, rehearsals)
    const engagementMetrics = this.calculateEngagementMetrics([...notes, ...setlists, ...performances, ...rehearsals])

    return {
      dailyUsage,
      featureUsage,
      engagementMetrics,
      platformInfo: {
        platform: this.platformAdapter.platform,
        capabilities: this.platformAdapter.capabilities
      }
    }
  }

  /**
   * Get trend analysis across all metrics
   */
  async getTrendAnalysis(): Promise<TrendAnalysis> {
    const timeRanges = {
      week: this.getDateRange(7),
      month: this.getDateRange(30),
      quarter: this.getDateRange(90),
      year: this.getDateRange(365)
    }

    const trends: TrendAnalysis = {}

    for (const [period, dateRange] of Object.entries(timeRanges)) {
      const periodData = await this.getDataForPeriod(dateRange.start, dateRange.end)
      trends[period as keyof TrendAnalysis] = {
        contentCreation: this.calculateTrend(periodData.notes, 'createdAt'),
        performanceActivity: this.calculateTrend(periodData.performances, 'date'),
        rehearsalActivity: this.calculateTrend(periodData.rehearsals, 'startTime'),
        overallEngagement: this.calculateOverallEngagementTrend(periodData)
      }
    }

    return trends
  }

  /**
   * Generate personalized insights
   */
  async getPersonalizedInsights(): Promise<PersonalizedInsight[]> {
    const analytics = await this.getDashboardAnalytics()
    const insights: PersonalizedInsight[] = []

    // Content creation insights
    if (analytics.contentStats.contentGrowth.length > 0) {
      const recentGrowth = analytics.contentStats.contentGrowth.slice(-4) // Last 4 periods
      const avgGrowth = recentGrowth.reduce((sum, period) => sum + period.count, 0) / recentGrowth.length
      
      if (avgGrowth > 10) {
        insights.push({
          type: 'positive',
          category: 'content',
          title: 'Strong Content Creation',
          description: `You've been consistently creating content with an average of ${Math.round(avgGrowth)} notes per month`,
          actionable: false
        })
      } else if (avgGrowth < 3) {
        insights.push({
          type: 'suggestion',
          category: 'content',
          title: 'Increase Content Creation',
          description: 'Your content creation has slowed down recently',
          actionable: true,
          suggestedAction: 'Set a daily goal to capture at least one new idea'
        })
      }
    }

    // Performance insights
    if (analytics.performanceStats.performanceMetrics.averageRating > 4.0) {
      insights.push({
        type: 'positive',
        category: 'performance',
        title: 'Excellent Performance Ratings',
        description: `Your average performance rating is ${analytics.performanceStats.performanceMetrics.averageRating.toFixed(1)}/5`,
        actionable: false
      })
    }

    // Usage pattern insights
    const mostActiveFeature = Object.entries(analytics.usageStats.featureUsage)
      .sort(([, a], [, b]) => b - a)[0]
    
    if (mostActiveFeature) {
      insights.push({
        type: 'informational',
        category: 'usage',
        title: 'Most Used Feature',
        description: `You use ${mostActiveFeature[0]} most frequently (${mostActiveFeature[1]} times)`,
        actionable: false
      })
    }

    return insights
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(format: 'json' | 'csv'): Promise<string> {
    const analytics = await this.getDashboardAnalytics()
    
    if (format === 'json') {
      return JSON.stringify(analytics, null, 2)
    } else {
      return this.convertAnalyticsToCSV(analytics)
    }
  }

  // Private helper methods

  private analyzeCaptureMethodBreakdown(notes: any[]): Record<string, number> {
    const breakdown: Record<string, number> = {}
    notes.forEach(note => {
      breakdown[note.captureMethod] = (breakdown[note.captureMethod] || 0) + 1
    })
    return breakdown
  }

  private analyzeContentGrowth(notes: any[]): ContentGrowthPeriod[] {
    const monthlyGrowth = new Map<string, number>()
    
    notes.forEach(note => {
      const monthKey = note.createdAt.toISOString().substring(0, 7) // YYYY-MM
      monthlyGrowth.set(monthKey, (monthlyGrowth.get(monthKey) || 0) + 1)
    })

    return Array.from(monthlyGrowth.entries())
      .map(([period, count]) => ({ period, count }))
      .sort((a, b) => a.period.localeCompare(b.period))
  }

  private analyzeTagUsage(notes: any[]): TagAnalysis {
    const tagCounts = new Map<string, number>()
    let totalTags = 0

    notes.forEach(note => {
      note.tags.forEach((tag: string) => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
        totalTags++
      })
    })

    const topTags = Array.from(tagCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)

    return {
      totalUniqueTags: tagCounts.size,
      totalTagUsage: totalTags,
      averageTagsPerNote: notes.length > 0 ? totalTags / notes.length : 0,
      topTags
    }
  }

  private calculateContentQualityMetrics(notes: any[]): ContentQualityMetrics {
    const notesWithDuration = notes.filter(note => note.estimatedDuration)
    const notesWithTags = notes.filter(note => note.tags.length > 0)
    const notesWithAttachments = notes.filter(note => note.attachments.length > 0)

    return {
      completenessScore: notes.length > 0 ? 
        (notesWithDuration.length + notesWithTags.length + notesWithAttachments.length) / (notes.length * 3) : 0,
      averageContentLength: notes.length > 0 ? 
        notes.reduce((sum, note) => sum + note.content.length, 0) / notes.length : 0,
      richContentPercentage: notes.length > 0 ? notesWithAttachments.length / notes.length : 0
    }
  }

  private analyzeContentDistribution(notes: any[]): ContentDistribution {
    const distribution = {
      byDuration: { short: 0, medium: 0, long: 0 },
      byVenue: new Map<string, number>(),
      byAudience: new Map<string, number>()
    }

    notes.forEach(note => {
      // Duration distribution
      const duration = note.estimatedDuration || 0
      if (duration < 60) distribution.byDuration.short++
      else if (duration < 300) distribution.byDuration.medium++
      else distribution.byDuration.long++

      // Venue distribution
      if (note.venue) {
        distribution.byVenue.set(note.venue, (distribution.byVenue.get(note.venue) || 0) + 1)
      }

      // Audience distribution
      if (note.audience) {
        distribution.byAudience.set(note.audience, (distribution.byAudience.get(note.audience) || 0) + 1)
      }
    })

    return {
      byDuration: distribution.byDuration,
      byVenue: Object.fromEntries(distribution.byVenue),
      byAudience: Object.fromEntries(distribution.byAudience)
    }
  }

  private calculatePerformanceMetrics(performances: any[]): PerformanceMetrics {
    if (performances.length === 0) {
      return {
        averageRating: 0,
        totalStageTime: 0,
        averagePerformanceDuration: 0,
        successRate: 0
      }
    }

    const ratingsSum = performances.reduce((sum, p) => sum + (p.feedback?.rating || 0), 0)
    const durationsSum = performances.reduce((sum, p) => sum + (p.actualDuration || 0), 0)
    const successfulPerformances = performances.filter(p => 
      p.feedback?.rating && p.feedback.rating >= 4
    ).length

    return {
      averageRating: ratingsSum / performances.length,
      totalStageTime: durationsSum,
      averagePerformanceDuration: durationsSum / performances.length,
      successRate: successfulPerformances / performances.length
    }
  }

  private calculateRehearsalMetrics(rehearsals: any[]): RehearsalMetrics {
    if (rehearsals.length === 0) {
      return {
        averageDuration: 0,
        totalRehearsalTime: 0,
        averageTimingAccuracy: 0,
        completionRate: 0
      }
    }

    const totalDuration = rehearsals.reduce((sum, r) => sum + (r.totalDuration || 0), 0)
    const completedRehearsals = rehearsals.filter(r => r.isCompleted).length

    return {
      averageDuration: totalDuration / rehearsals.length,
      totalRehearsalTime: totalDuration,
      averageTimingAccuracy: this.calculateAverageTimingAccuracy(rehearsals),
      completionRate: completedRehearsals / rehearsals.length
    }
  }

  private async analyzeVenuePerformance(performances: any[]): Promise<VenuePerformanceAnalysis[]> {
    const venueStats = new Map<string, { count: number, totalRating: number, name: string }>()
    
    for (const performance of performances) {
      if (performance.feedback?.rating) {
        const venue = await this.storageService.getVenue(performance.venueId)
        if (venue) {
          const existing = venueStats.get(performance.venueId) || 
            { count: 0, totalRating: 0, name: venue.name }
          existing.count++
          existing.totalRating += performance.feedback.rating
          venueStats.set(performance.venueId, existing)
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

  private calculateImprovementTrends(performances: any[], rehearsals: any[]): ImprovementTrends {
    // Calculate performance improvement over time
    const sortedPerformances = performances
      .filter(p => p.feedback?.rating)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    const performanceTrend = this.calculateLinearTrend(
      sortedPerformances.map(p => p.feedback.rating)
    )

    // Calculate rehearsal efficiency improvement
    const sortedRehearsals = rehearsals
      .filter(r => r.totalDuration)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

    const rehearsalTrend = this.calculateLinearTrend(
      sortedRehearsals.map(r => r.totalDuration)
    )

    return {
      performanceRatingTrend: performanceTrend,
      rehearsalEfficiencyTrend: -rehearsalTrend, // Negative because shorter is better
      overallImprovement: (performanceTrend - rehearsalTrend) / 2
    }
  }

  private calculateDailyUsagePattern(items: any[]): DailyUsagePattern {
    const hourlyUsage = new Array(24).fill(0)
    const dailyUsage = new Array(7).fill(0)

    items.forEach(item => {
      const date = item.createdAt || item.startTime || item.date
      if (date) {
        const hour = date.getHours()
        const day = date.getDay()
        hourlyUsage[hour]++
        dailyUsage[day]++
      }
    })

    return { hourlyUsage, dailyUsage }
  }

  private calculateFeatureUsage(notes: any[], setlists: any[], performances: any[], rehearsals: any[]): Record<string, number> {
    return {
      'note-capture': notes.length,
      'setlist-creation': setlists.length,
      'performance-logging': performances.length,
      'rehearsal-sessions': rehearsals.length,
      'voice-capture': notes.filter(n => n.captureMethod === 'voice').length,
      'image-capture': notes.filter(n => n.captureMethod === 'image').length
    }
  }

  private calculateEngagementMetrics(items: any[]): EngagementMetrics {
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const weeklyActivity = items.filter(item => {
      const date = item.createdAt || item.startTime || item.date
      return date && date >= lastWeek
    }).length

    const monthlyActivity = items.filter(item => {
      const date = item.createdAt || item.startTime || item.date
      return date && date >= lastMonth
    }).length

    return {
      weeklyActivity,
      monthlyActivity,
      averageDailyActivity: weeklyActivity / 7,
      engagementScore: this.calculateEngagementScore(weeklyActivity, monthlyActivity)
    }
  }

  private getDateRange(days: number): { start: Date; end: Date } {
    const end = new Date()
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
    return { start, end }
  }

  private async getDataForPeriod(start: Date, end: Date): Promise<{
    notes: any[]
    performances: any[]
    rehearsals: any[]
  }> {
    const [notes, performances, rehearsals] = await Promise.all([
      this.storageService.listNotes(),
      this.storageService.listPerformances(),
      this.storageService.listRehearsalSessions()
    ])

    return {
      notes: notes.filter(n => n.createdAt >= start && n.createdAt <= end),
      performances: performances.filter(p => p.date >= start && p.date <= end),
      rehearsals: rehearsals.filter(r => r.startTime >= start && r.startTime <= end)
    }
  }

  private calculateTrend(items: any[], dateField: string): TrendDirection {
    if (items.length < 2) return 'stable'

    const sortedItems = items.sort((a, b) => a[dateField].getTime() - b[dateField].getTime())
    const midpoint = Math.floor(sortedItems.length / 2)
    const firstHalf = sortedItems.slice(0, midpoint).length
    const secondHalf = sortedItems.slice(midpoint).length

    if (secondHalf > firstHalf * 1.1) return 'increasing'
    if (secondHalf < firstHalf * 0.9) return 'decreasing'
    return 'stable'
  }

  private calculateOverallEngagementTrend(data: any): TrendDirection {
    const totalActivity = data.notes.length + data.performances.length + data.rehearsals.length
    // This is simplified - in a real implementation, you'd compare with previous periods
    return totalActivity > 10 ? 'increasing' : totalActivity > 5 ? 'stable' : 'decreasing'
  }

  private generateInsights(
    contentStats: ContentStatistics,
    performanceStats: PerformanceStatistics,
    usageStats: UsageStatistics
  ): AnalyticsInsight[] {
    const insights: AnalyticsInsight[] = []

    // Content insights
    if (contentStats.qualityMetrics.completenessScore < 0.5) {
      insights.push({
        type: 'improvement',
        title: 'Content Quality',
        description: 'Many of your notes are missing tags, duration estimates, or attachments',
        impact: 'medium'
      })
    }

    // Performance insights
    if (performanceStats.performanceMetrics.averageRating > 4.0) {
      insights.push({
        type: 'success',
        title: 'Strong Performance',
        description: `Your average performance rating is ${performanceStats.performanceMetrics.averageRating.toFixed(1)}/5`,
        impact: 'high'
      })
    }

    return insights
  }

  private generateRecommendations(
    contentStats: ContentStatistics,
    performanceStats: PerformanceStatistics,
    usageStats: UsageStatistics
  ): AnalyticsRecommendation[] {
    const recommendations: AnalyticsRecommendation[] = []

    // Content recommendations
    if (contentStats.contentGrowth.length > 0) {
      const recentGrowth = contentStats.contentGrowth.slice(-3)
      const avgGrowth = recentGrowth.reduce((sum, period) => sum + period.count, 0) / recentGrowth.length
      
      if (avgGrowth < 5) {
        recommendations.push({
          category: 'content',
          priority: 'medium',
          title: 'Increase Content Creation',
          description: 'Set a daily goal to capture new ideas',
          expectedImpact: 'More material for performances'
        })
      }
    }

    return recommendations
  }

  private calculateAverageTimingAccuracy(rehearsals: any[]): number {
    // Simplified calculation - would need more detailed timing data
    return 0.85 // 85% accuracy placeholder
  }

  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0

    const n = values.length
    const sumX = (n * (n - 1)) / 2
    const sumY = values.reduce((sum, val) => sum + val, 0)
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0)
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  }

  private calculateEngagementScore(weekly: number, monthly: number): number {
    // Simple engagement score calculation
    const weeklyScore = Math.min(weekly / 7, 1) * 50 // Max 50 points for daily activity
    const monthlyScore = Math.min(monthly / 30, 1) * 50 // Max 50 points for monthly activity
    return weeklyScore + monthlyScore
  }

  private convertAnalyticsToCSV(analytics: DashboardAnalytics): string {
    // Simplified CSV conversion - would need more detailed implementation
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Notes', analytics.contentStats.totalNotes.toString()],
      ['Total Performances', analytics.performanceStats.totalPerformances.toString()],
      ['Average Rating', analytics.performanceStats.performanceMetrics.averageRating.toFixed(2)],
      ['Weekly Activity', analytics.usageStats.engagementMetrics.weeklyActivity.toString()]
    ]

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

// Types and interfaces

export interface DashboardAnalytics {
  contentStats: ContentStatistics
  performanceStats: PerformanceStatistics
  usageStats: UsageStatistics
  trendAnalysis: TrendAnalysis
  insights: AnalyticsInsight[]
  recommendations: AnalyticsRecommendation[]
}

export interface ContentStatistics {
  totalNotes: number
  totalSetLists: number
  totalVenues: number
  totalContacts: number
  totalDuration: number
  averageNoteDuration: number
  captureMethodBreakdown: Record<string, number>
  contentGrowth: ContentGrowthPeriod[]
  tagAnalysis: TagAnalysis
  qualityMetrics: ContentQualityMetrics
  contentDistribution: ContentDistribution
}

export interface PerformanceStatistics {
  totalPerformances: number
  completedPerformances: number
  totalRehearsals: number
  completedRehearsals: number
  performanceMetrics: PerformanceMetrics
  rehearsalMetrics: RehearsalMetrics
  venueAnalysis: VenuePerformanceAnalysis[]
  improvementTrends: ImprovementTrends
  upcomingPerformances: number
}

export interface UsageStatistics {
  dailyUsage: DailyUsagePattern
  featureUsage: Record<string, number>
  engagementMetrics: EngagementMetrics
  platformInfo: {
    platform: string
    capabilities: any
  }
}

export interface TrendAnalysis {
  week?: PeriodTrend
  month?: PeriodTrend
  quarter?: PeriodTrend
  year?: PeriodTrend
}

export interface ContentGrowthPeriod {
  period: string
  count: number
}

export interface TagAnalysis {
  totalUniqueTags: number
  totalTagUsage: number
  averageTagsPerNote: number
  topTags: [string, number][]
}

export interface ContentQualityMetrics {
  completenessScore: number
  averageContentLength: number
  richContentPercentage: number
}

export interface ContentDistribution {
  byDuration: { short: number; medium: number; long: number }
  byVenue: Record<string, number>
  byAudience: Record<string, number>
}

export interface PerformanceMetrics {
  averageRating: number
  totalStageTime: number
  averagePerformanceDuration: number
  successRate: number
}

export interface RehearsalMetrics {
  averageDuration: number
  totalRehearsalTime: number
  averageTimingAccuracy: number
  completionRate: number
}

export interface VenuePerformanceAnalysis {
  venueId: string
  venueName: string
  performanceCount: number
  averageRating: number
}

export interface ImprovementTrends {
  performanceRatingTrend: number
  rehearsalEfficiencyTrend: number
  overallImprovement: number
}

export interface DailyUsagePattern {
  hourlyUsage: number[]
  dailyUsage: number[]
}

export interface EngagementMetrics {
  weeklyActivity: number
  monthlyActivity: number
  averageDailyActivity: number
  engagementScore: number
}

export interface PeriodTrend {
  contentCreation: TrendDirection
  performanceActivity: TrendDirection
  rehearsalActivity: TrendDirection
  overallEngagement: TrendDirection
}

export interface PersonalizedInsight {
  type: 'positive' | 'suggestion' | 'warning' | 'informational'
  category: 'content' | 'performance' | 'usage' | 'general'
  title: string
  description: string
  actionable: boolean
  suggestedAction?: string
}

export interface AnalyticsInsight {
  type: 'success' | 'improvement' | 'warning'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
}

export interface AnalyticsRecommendation {
  category: 'content' | 'performance' | 'usage' | 'workflow'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  expectedImpact: string
}

export type TrendDirection = 'increasing' | 'decreasing' | 'stable'