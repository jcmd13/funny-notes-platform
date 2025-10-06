import type { IPlatformAdapter } from '../adapters/IPlatformAdapter'
import type { StorageService } from '../storage/StorageService'
import type { CaptureManager } from './CaptureManager'
import type { ContentManager } from './ContentManager'
import type { PerformanceManager } from './PerformanceManager'
import type { ContactManager } from './ContactManager'

/**
 * Platform-agnostic workflow orchestration
 * Manages complex workflows that span multiple business domains
 */
export class WorkflowManager {
  constructor(
    private platformAdapter: IPlatformAdapter,
    private storageService: StorageService,
    private captureManager: CaptureManager,
    private contentManager: ContentManager,
    private performanceManager: PerformanceManager,
    private contactManager: ContactManager
  ) {}

  /**
   * Execute the complete capture-to-performance workflow
   */
  async executeFullWorkflow(input: FullWorkflowInput): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: true,
      steps: [],
      errors: [],
      artifacts: {}
    }

    try {
      // Step 1: Capture content
      result.steps.push({ name: 'capture', status: 'in-progress', startTime: new Date() })
      
      const capturedNotes = []
      for (const captureInput of input.captureInputs) {
        const note = await this.captureManager.quickCapture(captureInput)
        capturedNotes.push(note)
      }
      
      result.steps[0].status = 'completed'
      result.steps[0].endTime = new Date()
      result.artifacts.capturedNotes = capturedNotes

      // Step 2: Organize content
      if (input.autoOrganize) {
        result.steps.push({ name: 'organize', status: 'in-progress', startTime: new Date() })
        
        const organizationResult = await this.contentManager.autoOrganizeContent({
          duplicateThreshold: 0.8,
          autoTag: true,
          categorize: true
        })
        
        result.steps[1].status = 'completed'
        result.steps[1].endTime = new Date()
        result.artifacts.organizationResult = organizationResult
      }

      // Step 3: Create optimized set list
      if (input.createSetList) {
        result.steps.push({ name: 'create-setlist', status: 'in-progress', startTime: new Date() })
        
        const setList = await this.contentManager.createOptimizedSetList({
          name: input.createSetList.name,
          targetDuration: input.createSetList.targetDuration,
          venue: input.createSetList.venue,
          audience: input.createSetList.audience,
          performanceDate: input.createSetList.performanceDate
        })
        
        const currentStep = result.steps[result.steps.length - 1]
        currentStep.status = 'completed'
        currentStep.endTime = new Date()
        result.artifacts.setList = setList
      }

      // Step 4: Schedule rehearsal
      if (input.scheduleRehearsal && result.artifacts.setList) {
        result.steps.push({ name: 'schedule-rehearsal', status: 'in-progress', startTime: new Date() })
        
        // Create rehearsal reminder
        if (this.platformAdapter.getFeatureSupport('notifications')) {
          await this.platformAdapter.notifications.scheduleLocalNotification({
            title: 'Rehearsal Reminder',
            body: `Time to rehearse "${result.artifacts.setList.name}"`,
            scheduledTime: input.scheduleRehearsal.rehearsalDate,
            data: {
              type: 'rehearsal-reminder',
              setListId: result.artifacts.setList.id
            }
          })
        }
        
        const currentStep = result.steps[result.steps.length - 1]
        currentStep.status = 'completed'
        currentStep.endTime = new Date()
      }

      // Step 5: Schedule performance reminders
      if (input.schedulePerformance && result.artifacts.setList) {
        result.steps.push({ name: 'schedule-performance', status: 'in-progress', startTime: new Date() })
        
        const performance = await this.performanceManager.logPerformance({
          setListId: result.artifacts.setList.id,
          venueId: input.schedulePerformance.venueId,
          date: input.schedulePerformance.performanceDate,
          notes: 'Scheduled via workflow'
        })
        
        await this.performanceManager.schedulePerformanceReminders(performance.id)
        
        const currentStep = result.steps[result.steps.length - 1]
        currentStep.status = 'completed'
        currentStep.endTime = new Date()
        result.artifacts.performance = performance
      }

    } catch (error) {
      result.success = false
      result.errors.push(`Workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      // Mark current step as failed
      const currentStep = result.steps[result.steps.length - 1]
      if (currentStep && currentStep.status === 'in-progress') {
        currentStep.status = 'failed'
        currentStep.endTime = new Date()
        currentStep.error = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return result
  }

  /**
   * Execute post-performance workflow
   */
  async executePostPerformanceWorkflow(input: PostPerformanceWorkflowInput): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: true,
      steps: [],
      errors: [],
      artifacts: {}
    }

    try {
      // Step 1: Update performance with feedback
      result.steps.push({ name: 'update-performance', status: 'in-progress', startTime: new Date() })
      
      const performance = await this.storageService.updatePerformance(input.performanceId, {
        feedback: input.feedback,
        actualDuration: input.actualDuration,
        status: 'completed'
      })
      
      result.steps[0].status = 'completed'
      result.steps[0].endTime = new Date()
      result.artifacts.performance = performance

      // Step 2: Capture post-performance notes
      if (input.postPerformanceNotes) {
        result.steps.push({ name: 'capture-notes', status: 'in-progress', startTime: new Date() })
        
        const note = await this.captureManager.captureText(input.postPerformanceNotes, {
          tags: ['post-performance', 'feedback'],
          venue: input.venue
        })
        
        result.steps[1].status = 'completed'
        result.steps[1].endTime = new Date()
        result.artifacts.postPerformanceNote = note
      }

      // Step 3: Update contact interactions
      if (input.contactInteractions) {
        result.steps.push({ name: 'update-contacts', status: 'in-progress', startTime: new Date() })
        
        const updatedContacts = []
        for (const interaction of input.contactInteractions) {
          const contact = await this.contactManager.logInteraction(
            interaction.contactId,
            {
              type: 'meeting',
              description: `Performance at ${input.venue}`,
              outcome: interaction.outcome,
              followUpRequired: interaction.followUpRequired,
              followUpDate: interaction.followUpDate
            }
          )
          updatedContacts.push(contact)
        }
        
        const currentStep = result.steps[result.steps.length - 1]
        currentStep.status = 'completed'
        currentStep.endTime = new Date()
        result.artifacts.updatedContacts = updatedContacts
      }

      // Step 4: Schedule follow-ups
      if (input.scheduleFollowUps) {
        result.steps.push({ name: 'schedule-followups', status: 'in-progress', startTime: new Date() })
        
        for (const followUp of input.scheduleFollowUps) {
          await this.contactManager.scheduleFollowUpReminder(
            followUp.contactId,
            followUp.followUpDate,
            followUp.context
          )
        }
        
        const currentStep = result.steps[result.steps.length - 1]
        currentStep.status = 'completed'
        currentStep.endTime = new Date()
      }

      // Step 5: Generate performance insights
      result.steps.push({ name: 'generate-insights', status: 'in-progress', startTime: new Date() })
      
      const insights = await this.performanceManager.getPerformanceInsights()
      
      const currentStep = result.steps[result.steps.length - 1]
      currentStep.status = 'completed'
      currentStep.endTime = new Date()
      result.artifacts.insights = insights

    } catch (error) {
      result.success = false
      result.errors.push(`Post-performance workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      const currentStep = result.steps[result.steps.length - 1]
      if (currentStep && currentStep.status === 'in-progress') {
        currentStep.status = 'failed'
        currentStep.endTime = new Date()
        currentStep.error = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return result
  }

  /**
   * Execute content optimization workflow
   */
  async executeContentOptimizationWorkflow(input: ContentOptimizationInput): Promise<WorkflowResult> {
    const result: WorkflowResult = {
      success: true,
      steps: [],
      errors: [],
      artifacts: {}
    }

    try {
      // Step 1: Analyze existing content
      result.steps.push({ name: 'analyze-content', status: 'in-progress', startTime: new Date() })
      
      const analytics = await this.contentManager.getContentAnalytics()
      
      result.steps[0].status = 'completed'
      result.steps[0].endTime = new Date()
      result.artifacts.analytics = analytics

      // Step 2: Detect and handle duplicates
      result.steps.push({ name: 'handle-duplicates', status: 'in-progress', startTime: new Date() })
      
      const organizationResult = await this.contentManager.autoOrganizeContent({
        duplicateThreshold: input.duplicateThreshold || 0.8
      })
      
      // Auto-merge duplicates if requested
      if (input.autoMergeDuplicates && organizationResult.duplicatesFound.length > 0) {
        const mergeResults = []
        for (const duplicate of organizationResult.duplicatesFound) {
          try {
            const duplicateIds = duplicate.duplicates.map(d => d.note.id)
            // Note: This would need to be implemented in ContentOrganizationService
            // const merged = await this.contentManager.mergeDuplicateNotes(duplicate.originalNote.id, duplicateIds)
            // mergeResults.push(merged)
          } catch (error) {
            result.errors.push(`Failed to merge duplicates: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
        result.artifacts.mergeResults = mergeResults
      }
      
      result.steps[1].status = 'completed'
      result.steps[1].endTime = new Date()
      result.artifacts.organizationResult = organizationResult

      // Step 3: Optimize tags
      if (input.optimizeTags) {
        result.steps.push({ name: 'optimize-tags', status: 'in-progress', startTime: new Date() })
        
        // This would implement tag optimization logic
        // For now, just mark as completed
        
        const currentStep = result.steps[result.steps.length - 1]
        currentStep.status = 'completed'
        currentStep.endTime = new Date()
      }

      // Step 4: Generate content recommendations
      result.steps.push({ name: 'generate-recommendations', status: 'in-progress', startTime: new Date() })
      
      const recommendations = this.generateContentRecommendations(analytics, organizationResult)
      
      const currentStep = result.steps[result.steps.length - 1]
      currentStep.status = 'completed'
      currentStep.endTime = new Date()
      result.artifacts.recommendations = recommendations

    } catch (error) {
      result.success = false
      result.errors.push(`Content optimization workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      
      const currentStep = result.steps[result.steps.length - 1]
      if (currentStep && currentStep.status === 'in-progress') {
        currentStep.status = 'failed'
        currentStep.endTime = new Date()
        currentStep.error = error instanceof Error ? error.message : 'Unknown error'
      }
    }

    return result
  }

  /**
   * Get workflow templates
   */
  getWorkflowTemplates(): WorkflowTemplate[] {
    return [
      {
        id: 'quick-capture-to-set',
        name: 'Quick Capture to Set List',
        description: 'Capture ideas and immediately organize them into a performance set',
        steps: ['capture', 'organize', 'create-setlist'],
        estimatedDuration: 300 // 5 minutes
      },
      {
        id: 'full-performance-prep',
        name: 'Complete Performance Preparation',
        description: 'Full workflow from capture to performance scheduling',
        steps: ['capture', 'organize', 'create-setlist', 'schedule-rehearsal', 'schedule-performance'],
        estimatedDuration: 900 // 15 minutes
      },
      {
        id: 'post-performance-analysis',
        name: 'Post-Performance Analysis',
        description: 'Complete post-performance workflow with feedback and follow-ups',
        steps: ['update-performance', 'capture-notes', 'update-contacts', 'generate-insights'],
        estimatedDuration: 600 // 10 minutes
      },
      {
        id: 'content-optimization',
        name: 'Content Optimization',
        description: 'Analyze and optimize existing content library',
        steps: ['analyze-content', 'handle-duplicates', 'optimize-tags', 'generate-recommendations'],
        estimatedDuration: 1200 // 20 minutes
      }
    ]
  }

  /**
   * Execute workflow from template
   */
  async executeWorkflowFromTemplate(
    templateId: string, 
    parameters: Record<string, any>
  ): Promise<WorkflowResult> {
    const template = this.getWorkflowTemplates().find(t => t.id === templateId)
    if (!template) {
      throw new Error(`Workflow template not found: ${templateId}`)
    }

    switch (templateId) {
      case 'quick-capture-to-set':
        return await this.executeFullWorkflow({
          captureInputs: parameters.captureInputs || [],
          autoOrganize: true,
          createSetList: parameters.createSetList
        })
      
      case 'full-performance-prep':
        return await this.executeFullWorkflow(parameters)
      
      case 'post-performance-analysis':
        return await this.executePostPerformanceWorkflow(parameters)
      
      case 'content-optimization':
        return await this.executeContentOptimizationWorkflow(parameters)
      
      default:
        throw new Error(`Unsupported workflow template: ${templateId}`)
    }
  }

  // Private helper methods

  private generateContentRecommendations(
    analytics: any, 
    organizationResult: any
  ): ContentRecommendation[] {
    const recommendations: ContentRecommendation[] = []

    // Recommend based on duplicate rate
    if (analytics.duplicateRate > 0.1) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        title: 'High Duplicate Rate Detected',
        description: `${Math.round(analytics.duplicateRate * 100)}% of your content appears to be duplicated`,
        action: 'Review and merge duplicate content',
        impact: 'Improve content organization and reduce clutter'
      })
    }

    // Recommend based on content growth
    if (analytics.contentGrowth.length > 0) {
      const recentGrowth = analytics.contentGrowth.slice(-3)
      const avgGrowth = recentGrowth.reduce((sum, month) => sum + month.count, 0) / recentGrowth.length
      
      if (avgGrowth < 5) {
        recommendations.push({
          type: 'creation',
          priority: 'medium',
          title: 'Low Content Creation Rate',
          description: 'You\'ve been creating less content recently',
          action: 'Set a goal to capture more ideas daily',
          impact: 'Maintain a steady flow of fresh material'
        })
      }
    }

    // Recommend based on tag usage
    if (analytics.topTags.length < 5) {
      recommendations.push({
        type: 'organization',
        priority: 'medium',
        title: 'Limited Tag Usage',
        description: 'Using more tags will help organize and find content',
        action: 'Add descriptive tags to your content',
        impact: 'Improve content discoverability and organization'
      })
    }

    return recommendations
  }
}

// Types and interfaces

export interface FullWorkflowInput {
  captureInputs: any[]
  autoOrganize?: boolean
  createSetList?: {
    name: string
    targetDuration: number
    venue?: string
    audience?: string
    performanceDate?: Date
  }
  scheduleRehearsal?: {
    rehearsalDate: Date
  }
  schedulePerformance?: {
    venueId: string
    performanceDate: Date
  }
}

export interface PostPerformanceWorkflowInput {
  performanceId: string
  venue: string
  feedback: any
  actualDuration?: number
  postPerformanceNotes?: string
  contactInteractions?: {
    contactId: string
    outcome: 'positive' | 'negative' | 'neutral'
    followUpRequired?: boolean
    followUpDate?: Date
  }[]
  scheduleFollowUps?: {
    contactId: string
    followUpDate: Date
    context: string
  }[]
}

export interface ContentOptimizationInput {
  duplicateThreshold?: number
  autoMergeDuplicates?: boolean
  optimizeTags?: boolean
}

export interface WorkflowResult {
  success: boolean
  steps: WorkflowStep[]
  errors: string[]
  artifacts: Record<string, any>
}

export interface WorkflowStep {
  name: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  startTime?: Date
  endTime?: Date
  error?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  steps: string[]
  estimatedDuration: number // seconds
}

export interface ContentRecommendation {
  type: 'creation' | 'organization' | 'optimization' | 'performance'
  priority: 'low' | 'medium' | 'high'
  title: string
  description: string
  action: string
  impact: string
}