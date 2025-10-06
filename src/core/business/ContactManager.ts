import type { IPlatformAdapter } from '../adapters/IPlatformAdapter'
import type { StorageService } from '../storage/StorageService'
import type { Contact, CreateContactInput, Interaction, Reminder } from '../models'

/**
 * Platform-agnostic contact and relationship management
 * Handles contacts, interactions, and follow-up reminders
 */
export class ContactManager {
  constructor(
    private platformAdapter: IPlatformAdapter,
    private storageService: StorageService
  ) {}

  /**
   * Create a new contact with smart data extraction
   */
  async createContact(input: SmartContactInput): Promise<Contact> {
    // Extract additional info if provided
    const contactInfo = await this.extractContactInfo(input)
    
    const contactInput: CreateContactInput = {
      name: input.name,
      role: input.role,
      venue: input.venue,
      contactInfo
    }

    const contact = await this.storageService.createContact(contactInput)

    // Schedule follow-up reminder if requested
    if (input.scheduleFollowUp) {
      await this.scheduleFollowUpReminder(contact.id, input.followUpDate)
    }

    return contact
  }

  /**
   * Log interaction with a contact
   */
  async logInteraction(contactId: string, interaction: LogInteractionInput): Promise<Contact> {
    const interactionData: Omit<Interaction, 'id' | 'createdAt'> = {
      type: interaction.type,
      description: interaction.description,
      outcome: interaction.outcome,
      followUpRequired: interaction.followUpRequired,
      followUpDate: interaction.followUpDate,
      metadata: {
        platform: this.platformAdapter.platform,
        location: interaction.location,
        duration: interaction.duration
      }
    }

    const updatedContact = await this.storageService.addInteractionToContact(contactId, interactionData)

    // Schedule follow-up if required
    if (interaction.followUpRequired && interaction.followUpDate) {
      await this.scheduleFollowUpReminder(contactId, interaction.followUpDate, interaction.followUpContext)
    }

    // Send notification if enabled
    if (this.platformAdapter.getFeatureSupport('notifications')) {
      await this.sendInteractionNotification(updatedContact, interaction)
    }

    return updatedContact
  }

  /**
   * Schedule a follow-up reminder
   */
  async scheduleFollowUpReminder(
    contactId: string, 
    followUpDate?: Date, 
    context?: string
  ): Promise<Contact> {
    const contact = await this.storageService.getContact(contactId)
    if (!contact) {
      throw new Error('Contact not found')
    }

    const reminderDate = followUpDate || this.calculateDefaultFollowUpDate(contact)
    
    const reminder: Omit<Reminder, 'id' | 'createdAt'> = {
      type: 'follow-up',
      title: `Follow up with ${contact.name}`,
      description: context || 'Scheduled follow-up',
      dueDate: reminderDate,
      completed: false,
      priority: this.calculateReminderPriority(contact)
    }

    const updatedContact = await this.storageService.addReminderToContact(contactId, reminder)

    // Schedule platform notification
    if (this.platformAdapter.getFeatureSupport('notifications')) {
      await this.scheduleReminderNotification(updatedContact, reminder)
    }

    return updatedContact
  }

  /**
   * Get contact insights and relationship analysis
   */
  async getContactInsights(contactId: string): Promise<ContactInsights> {
    const contact = await this.storageService.getContact(contactId)
    if (!contact) {
      throw new Error('Contact not found')
    }

    const interactions = contact.interactions
    const reminders = contact.reminders

    // Analyze interaction patterns
    const interactionAnalysis = this.analyzeInteractions(interactions)
    
    // Analyze reminder completion
    const reminderAnalysis = this.analyzeReminders(reminders)
    
    // Calculate relationship strength
    const relationshipStrength = this.calculateRelationshipStrength(contact)
    
    // Generate recommendations
    const recommendations = this.generateContactRecommendations(contact, interactionAnalysis)

    return {
      contact,
      interactionAnalysis,
      reminderAnalysis,
      relationshipStrength,
      recommendations,
      nextSuggestedAction: this.suggestNextAction(contact)
    }
  }

  /**
   * Get networking opportunities
   */
  async getNetworkingOpportunities(): Promise<NetworkingOpportunity[]> {
    const contacts = await this.storageService.listContacts()
    const opportunities: NetworkingOpportunity[] = []

    // Find contacts who haven't been contacted recently
    const staleContacts = contacts.filter(contact => {
      const lastInteraction = contact.interactions[contact.interactions.length - 1]
      if (!lastInteraction) return true
      
      const daysSinceLastContact = (Date.now() - lastInteraction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastContact > 30 // More than 30 days
    })

    staleContacts.forEach(contact => {
      opportunities.push({
        type: 'reconnect',
        contact,
        priority: this.calculateOpportunityPriority(contact),
        reason: 'No recent contact',
        suggestedAction: 'Send a check-in message'
      })
    })

    // Find contacts with pending reminders
    const contactsWithReminders = contacts.filter(contact => 
      contact.reminders.some(reminder => !reminder.completed && reminder.dueDate <= new Date())
    )

    contactsWithReminders.forEach(contact => {
      const overdueReminders = contact.reminders.filter(
        reminder => !reminder.completed && reminder.dueDate <= new Date()
      )
      
      opportunities.push({
        type: 'follow-up',
        contact,
        priority: 'high',
        reason: `${overdueReminders.length} overdue reminder(s)`,
        suggestedAction: overdueReminders[0].description
      })
    })

    return opportunities.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
  }

  /**
   * Export contacts for external use
   */
  async exportContacts(format: 'csv' | 'vcard' | 'json'): Promise<string> {
    const contacts = await this.storageService.listContacts()

    switch (format) {
      case 'csv':
        return this.exportToCSV(contacts)
      case 'vcard':
        return this.exportToVCard(contacts)
      case 'json':
        return JSON.stringify(contacts, null, 2)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  /**
   * Import contacts from external sources
   */
  async importContacts(data: string, format: 'csv' | 'vcard' | 'json'): Promise<ImportResult> {
    let contacts: Partial<Contact>[]

    try {
      switch (format) {
        case 'csv':
          contacts = this.parseCSV(data)
          break
        case 'vcard':
          contacts = this.parseVCard(data)
          break
        case 'json':
          contacts = JSON.parse(data)
          break
        default:
          throw new Error(`Unsupported import format: ${format}`)
      }
    } catch (error) {
      return {
        success: false,
        imported: 0,
        errors: [`Failed to parse ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`]
      }
    }

    const result: ImportResult = {
      success: true,
      imported: 0,
      errors: []
    }

    for (const contactData of contacts) {
      try {
        if (contactData.name && contactData.role) {
          await this.createContact({
            name: contactData.name,
            role: contactData.role,
            venue: contactData.venue,
            email: contactData.contactInfo?.email,
            phone: contactData.contactInfo?.phone
          })
          result.imported++
        }
      } catch (error) {
        result.errors.push(`Failed to import ${contactData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    result.success = result.errors.length === 0
    return result
  }

  // Private helper methods

  private async extractContactInfo(input: SmartContactInput): Promise<Contact['contactInfo']> {
    const contactInfo: Contact['contactInfo'] = {}

    if (input.email) {
      contactInfo.email = input.email
    }

    if (input.phone) {
      contactInfo.phone = input.phone
    }

    if (input.social) {
      contactInfo.social = input.social
    }

    // Extract from text if provided
    if (input.rawText) {
      const extracted = this.extractInfoFromText(input.rawText)
      Object.assign(contactInfo, extracted)
    }

    return contactInfo
  }

  private extractInfoFromText(text: string): Partial<Contact['contactInfo']> {
    const info: Partial<Contact['contactInfo']> = {}

    // Email regex
    const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
    if (emailMatch) {
      info.email = emailMatch[0]
    }

    // Phone regex (simple)
    const phoneMatch = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/)
    if (phoneMatch) {
      info.phone = phoneMatch[0]
    }

    return info
  }

  private calculateDefaultFollowUpDate(contact: Contact): Date {
    const now = new Date()
    const followUpDate = new Date(now)
    
    // Default follow-up based on role
    switch (contact.role.toLowerCase()) {
      case 'booker':
      case 'agent':
        followUpDate.setDate(now.getDate() + 7) // 1 week
        break
      case 'venue owner':
      case 'manager':
        followUpDate.setDate(now.getDate() + 14) // 2 weeks
        break
      default:
        followUpDate.setDate(now.getDate() + 30) // 1 month
    }

    return followUpDate
  }

  private calculateReminderPriority(contact: Contact): 'low' | 'medium' | 'high' {
    // High priority for bookers and agents
    if (['booker', 'agent'].includes(contact.role.toLowerCase())) {
      return 'high'
    }

    // Medium priority for venue owners
    if (contact.role.toLowerCase().includes('owner') || contact.role.toLowerCase().includes('manager')) {
      return 'medium'
    }

    return 'low'
  }

  private analyzeInteractions(interactions: Interaction[]): InteractionAnalysis {
    if (interactions.length === 0) {
      return {
        totalInteractions: 0,
        averageFrequency: 0,
        lastInteractionDate: null,
        interactionTypes: {},
        successRate: 0
      }
    }

    const now = new Date()
    const firstInteraction = interactions[0].createdAt
    const lastInteraction = interactions[interactions.length - 1].createdAt
    const daysSinceFirst = (now.getTime() - firstInteraction.getTime()) / (1000 * 60 * 60 * 24)
    
    const typeCount = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const successfulInteractions = interactions.filter(i => 
      i.outcome === 'positive' || i.outcome === 'booked'
    ).length

    return {
      totalInteractions: interactions.length,
      averageFrequency: daysSinceFirst > 0 ? interactions.length / daysSinceFirst * 30 : 0, // per month
      lastInteractionDate: lastInteraction,
      interactionTypes: typeCount,
      successRate: interactions.length > 0 ? successfulInteractions / interactions.length : 0
    }
  }

  private analyzeReminders(reminders: Reminder[]): ReminderAnalysis {
    if (reminders.length === 0) {
      return {
        totalReminders: 0,
        completedReminders: 0,
        completionRate: 0,
        overdueReminders: 0
      }
    }

    const completed = reminders.filter(r => r.completed).length
    const overdue = reminders.filter(r => !r.completed && r.dueDate < new Date()).length

    return {
      totalReminders: reminders.length,
      completedReminders: completed,
      completionRate: completed / reminders.length,
      overdueReminders: overdue
    }
  }

  private calculateRelationshipStrength(contact: Contact): RelationshipStrength {
    let score = 0
    let factors: string[] = []

    // Interaction frequency
    const interactionAnalysis = this.analyzeInteractions(contact.interactions)
    if (interactionAnalysis.averageFrequency > 2) { // More than 2 per month
      score += 30
      factors.push('Regular communication')
    }

    // Success rate
    if (interactionAnalysis.successRate > 0.5) {
      score += 25
      factors.push('Positive interactions')
    }

    // Recent contact
    if (interactionAnalysis.lastInteractionDate) {
      const daysSinceLastContact = (Date.now() - interactionAnalysis.lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastContact < 30) {
        score += 20
        factors.push('Recent contact')
      }
    }

    // Complete contact info
    if (contact.contactInfo.email && contact.contactInfo.phone) {
      score += 15
      factors.push('Complete contact information')
    }

    // Venue association
    if (contact.venue) {
      score += 10
      factors.push('Venue association')
    }

    let level: 'weak' | 'moderate' | 'strong'
    if (score >= 70) level = 'strong'
    else if (score >= 40) level = 'moderate'
    else level = 'weak'

    return { level, score, factors }
  }

  private generateContactRecommendations(contact: Contact, analysis: InteractionAnalysis): string[] {
    const recommendations: string[] = []

    if (analysis.totalInteractions === 0) {
      recommendations.push('Schedule an initial meeting or call')
    }

    if (analysis.lastInteractionDate) {
      const daysSinceLastContact = (Date.now() - analysis.lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastContact > 60) {
        recommendations.push('Reach out - it\'s been over 2 months since last contact')
      }
    }

    if (analysis.successRate < 0.3 && analysis.totalInteractions > 3) {
      recommendations.push('Consider adjusting approach - low success rate')
    }

    if (!contact.contactInfo.email && !contact.contactInfo.phone) {
      recommendations.push('Collect contact information for better communication')
    }

    return recommendations
  }

  private suggestNextAction(contact: Contact): string {
    const analysis = this.analyzeInteractions(contact.interactions)
    
    if (analysis.totalInteractions === 0) {
      return 'Send introduction message'
    }

    if (analysis.lastInteractionDate) {
      const daysSinceLastContact = (Date.now() - analysis.lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLastContact > 30) {
        return 'Send check-in message'
      }
    }

    const overdueReminders = contact.reminders.filter(r => 
      !r.completed && r.dueDate < new Date()
    )

    if (overdueReminders.length > 0) {
      return overdueReminders[0].description
    }

    return 'Maintain regular contact'
  }

  private calculateOpportunityPriority(contact: Contact): 'low' | 'medium' | 'high' {
    const strength = this.calculateRelationshipStrength(contact)
    
    if (strength.level === 'strong') return 'high'
    if (strength.level === 'moderate') return 'medium'
    return 'low'
  }

  private async sendInteractionNotification(contact: Contact, interaction: LogInteractionInput): Promise<void> {
    try {
      await this.platformAdapter.notifications.scheduleLocalNotification({
        title: 'Interaction Logged',
        body: `Recorded ${interaction.type} with ${contact.name}`,
        data: {
          type: 'interaction-logged',
          contactId: contact.id
        }
      })
    } catch (error) {
      console.warn('Failed to send interaction notification:', error)
    }
  }

  private async scheduleReminderNotification(contact: Contact, reminder: Omit<Reminder, 'id' | 'createdAt'>): Promise<void> {
    try {
      await this.platformAdapter.notifications.scheduleLocalNotification({
        title: reminder.title,
        body: reminder.description,
        scheduledTime: reminder.dueDate,
        data: {
          type: 'contact-reminder',
          contactId: contact.id
        }
      })
    } catch (error) {
      console.warn('Failed to schedule reminder notification:', error)
    }
  }

  private exportToCSV(contacts: Contact[]): string {
    const headers = ['Name', 'Role', 'Venue', 'Email', 'Phone', 'Interactions', 'Last Contact']
    
    const rows = contacts.map(contact => [
      contact.name,
      contact.role,
      contact.venue || '',
      contact.contactInfo.email || '',
      contact.contactInfo.phone || '',
      contact.interactions.length.toString(),
      contact.interactions.length > 0 ? 
        contact.interactions[contact.interactions.length - 1].createdAt.toISOString() : ''
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  private exportToVCard(contacts: Contact[]): string {
    return contacts.map(contact => {
      let vcard = 'BEGIN:VCARD\nVERSION:3.0\n'
      vcard += `FN:${contact.name}\n`
      vcard += `TITLE:${contact.role}\n`
      
      if (contact.contactInfo.email) {
        vcard += `EMAIL:${contact.contactInfo.email}\n`
      }
      
      if (contact.contactInfo.phone) {
        vcard += `TEL:${contact.contactInfo.phone}\n`
      }
      
      if (contact.venue) {
        vcard += `ORG:${contact.venue}\n`
      }
      
      vcard += 'END:VCARD\n'
      return vcard
    }).join('\n')
  }

  private parseCSV(data: string): Partial<Contact>[] {
    const lines = data.split('\n')
    const headers = lines[0].split(',')
    
    return lines.slice(1).map(line => {
      const values = line.split(',')
      const contact: Partial<Contact> = {}
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim()
        if (value) {
          switch (header.toLowerCase()) {
            case 'name':
              contact.name = value
              break
            case 'role':
              contact.role = value
              break
            case 'venue':
              contact.venue = value
              break
            case 'email':
              contact.contactInfo = { ...contact.contactInfo, email: value }
              break
            case 'phone':
              contact.contactInfo = { ...contact.contactInfo, phone: value }
              break
          }
        }
      })
      
      return contact
    }).filter(contact => contact.name && contact.role)
  }

  private parseVCard(data: string): Partial<Contact>[] {
    const vcards = data.split('BEGIN:VCARD')
    
    return vcards.slice(1).map(vcard => {
      const contact: Partial<Contact> = { contactInfo: {} }
      const lines = vcard.split('\n')
      
      lines.forEach(line => {
        if (line.startsWith('FN:')) {
          contact.name = line.substring(3)
        } else if (line.startsWith('TITLE:')) {
          contact.role = line.substring(6)
        } else if (line.startsWith('EMAIL:')) {
          contact.contactInfo!.email = line.substring(6)
        } else if (line.startsWith('TEL:')) {
          contact.contactInfo!.phone = line.substring(4)
        } else if (line.startsWith('ORG:')) {
          contact.venue = line.substring(4)
        }
      })
      
      return contact
    }).filter(contact => contact.name && contact.role)
  }
}

// Types and interfaces

export interface SmartContactInput {
  name: string
  role: string
  venue?: string
  email?: string
  phone?: string
  social?: Record<string, string>
  rawText?: string
  scheduleFollowUp?: boolean
  followUpDate?: Date
}

export interface LogInteractionInput {
  type: 'call' | 'email' | 'meeting' | 'text' | 'social' | 'other'
  description: string
  outcome?: 'positive' | 'negative' | 'neutral' | 'booked' | 'rejected'
  followUpRequired?: boolean
  followUpDate?: Date
  followUpContext?: string
  location?: string
  duration?: number
}

export interface ContactInsights {
  contact: Contact
  interactionAnalysis: InteractionAnalysis
  reminderAnalysis: ReminderAnalysis
  relationshipStrength: RelationshipStrength
  recommendations: string[]
  nextSuggestedAction: string
}

export interface InteractionAnalysis {
  totalInteractions: number
  averageFrequency: number // interactions per month
  lastInteractionDate: Date | null
  interactionTypes: Record<string, number>
  successRate: number
}

export interface ReminderAnalysis {
  totalReminders: number
  completedReminders: number
  completionRate: number
  overdueReminders: number
}

export interface RelationshipStrength {
  level: 'weak' | 'moderate' | 'strong'
  score: number
  factors: string[]
}

export interface NetworkingOpportunity {
  type: 'reconnect' | 'follow-up' | 'introduction'
  contact: Contact
  priority: 'low' | 'medium' | 'high'
  reason: string
  suggestedAction: string
}

export interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
}