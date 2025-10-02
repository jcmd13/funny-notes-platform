import type { CreateNoteInput } from '../core/models'

/**
 * Sample notes for demonstrating different capture methods and features
 */
export const sampleNotes: CreateNoteInput[] = [
  // Text notes
  {
    content: "Why do they call it rush hour when nobody's moving? It's more like 'sit hour' or 'contemplate your life choices hour.' I spent 45 minutes in traffic today and had enough time to question every decision I've ever made, including the one to leave the house.",
    captureMethod: 'text',
    tags: ['observational', 'traffic', 'daily-life'],
    estimatedDuration: 25,
    venue: 'Comedy Club Downtown',
    audience: 'Mixed crowd, 30-50 age range',
    metadata: {},
    attachments: []
  },
  {
    content: "My phone's autocorrect is so aggressive, it's basically gaslighting me. I type 'duck' and it changes it to something else, then acts like I'm the crazy one. 'Are you sure you meant duck? Because based on your search history...' Mind your own business, phone!",
    captureMethod: 'text',
    tags: ['technology', 'observational', 'phone'],
    estimatedDuration: 30,
    metadata: {},
    attachments: []
  },
  {
    content: "I tried to be healthy and bought a salad for lunch. The cashier looked at me with such concern, like I was making a cry for help. 'Are you okay? Do you need someone to talk to?' Yes, I need to talk to someone about why this salad costs more than a burger.",
    captureMethod: 'text',
    tags: ['food', 'health', 'self-deprecating'],
    estimatedDuration: 28,
    metadata: {},
    attachments: []
  },

  // Voice note placeholder
  {
    content: "[Voice Recording] Bit about airplane food and how it's gotten so bad that even the peanuts are embarrassed to be there. The flight attendant apologized to the peanuts before serving them.",
    captureMethod: 'voice',
    tags: ['travel', 'airplane', 'food'],
    estimatedDuration: 45,
    venue: 'Open Mic Night',
    metadata: {
      duration: 45,
      confidence: 0.9
    },
    attachments: [{
      id: 'voice-sample-1',
      type: 'audio',
      filename: 'airplane-food-bit.webm',
      size: 1024000,
      mimeType: 'audio/webm',
      url: 'sample-audio-key-1'
    }]
  },

  // Image note placeholder
  {
    content: "[Image Note] Funny sign at coffee shop: 'Unattended children will be given espresso and taught to swear.' Perfect material for a bit about modern parenting and coffee shop policies.",
    captureMethod: 'image',
    tags: ['signs', 'parenting', 'coffee'],
    estimatedDuration: 20,
    metadata: {
      confidence: 0.8
    },
    attachments: [{
      id: 'image-sample-1',
      type: 'image',
      filename: 'coffee-shop-sign.jpg',
      size: 2048000,
      mimeType: 'image/jpeg',
      url: 'sample-image-key-1'
    }]
  },

  // Mixed content note
  {
    content: "Crowd work from last night: Asked a guy what he does for work, he said 'I'm a professional organizer.' I said, 'So you're like Marie Kondo but for people who can't fold a fitted sheet?' Turns out he organizes corporate events. The irony was not lost on anyone.",
    captureMethod: 'mixed',
    tags: ['crowd-work', 'callback', 'interaction'],
    estimatedDuration: 35,
    venue: 'Laugh Track Comedy Club',
    audience: 'Corporate crowd, very responsive',
    metadata: {},
    attachments: []
  },

  // Storytelling note
  {
    content: "My grandmother tried to use Siri for the first time. She held the phone like it was a walkie-talkie and said 'Hello Siri, over.' When Siri responded, she whispered to me, 'She seems nice, but why doesn't she say over?' I didn't have the heart to explain.",
    captureMethod: 'text',
    tags: ['family', 'storytelling', 'technology', 'grandmother'],
    estimatedDuration: 40,
    metadata: {},
    attachments: []
  },

  // One-liner
  {
    content: "I told my wife she was drawing her eyebrows too high. She looked surprised.",
    captureMethod: 'text',
    tags: ['one-liner', 'marriage', 'wordplay'],
    estimatedDuration: 8,
    metadata: {},
    attachments: []
  },

  // Self-deprecating
  {
    content: "I'm at that age where my back goes out more than I do. Last week I threw it out reaching for the TV remote. The remote was on the coffee table. I was sitting on the couch. The coffee table was right in front of me.",
    captureMethod: 'text',
    tags: ['self-deprecating', 'aging', 'physical-comedy'],
    estimatedDuration: 22,
    metadata: {},
    attachments: []
  }
]

/**
 * Seeds the database with sample notes if it's empty
 */
export async function seedSampleData(storageService: any): Promise<boolean> {
  try {
    // Check if we already have notes
    const existingNotes = await storageService.listNotes({ limit: 1 })
    
    if (existingNotes.length > 0) {
      console.log('Database already has notes, skipping seed data')
      return false
    }

    console.log('Seeding database with sample notes...')
    
    // Add sample notes with staggered timestamps to create realistic data
    for (let i = 0; i < sampleNotes.length; i++) {
      const note = sampleNotes[i]
      
      // Create notes with varied timestamps (newest first)
      const hoursAgo = [0.5, 2, 6, 12, 24, 48, 72, 96][i] || (i * 24) // Varied intervals
      const createdAt = new Date(Date.now() - (hoursAgo * 60 * 60 * 1000))
      
      // Create note with preserved timestamps
      await storageService.createNote({
        ...note,
        createdAt,
        updatedAt: createdAt
      } as any)
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    console.log(`Successfully seeded ${sampleNotes.length} sample notes`)
    return true
  } catch (error) {
    console.error('Failed to seed sample data:', error)
    return false
  }
}

/**
 * Clears all sample data (useful for testing)
 */
export async function clearSampleData(storageService: any): Promise<void> {
  try {
    const notes = await storageService.listNotes()
    const sampleNoteIds = notes
      .filter((note: any) => 
        sampleNotes.some(sample => sample.content === note.content)
      )
      .map((note: any) => note.id)
    
    if (sampleNoteIds.length > 0) {
      await storageService.deleteManyNotes(sampleNoteIds)
      console.log(`Cleared ${sampleNoteIds.length} sample notes`)
    }
  } catch (error) {
    console.error('Failed to clear sample data:', error)
  }
}

/**
 * Gets statistics about the current data
 */
export async function getDataStats(storageService: any) {
  try {
    const notes = await storageService.listNotes()
    
    const stats = {
      total: notes.length,
      byType: {
        text: notes.filter((n: any) => n.captureMethod === 'text').length,
        voice: notes.filter((n: any) => n.captureMethod === 'voice').length,
        image: notes.filter((n: any) => n.captureMethod === 'image').length,
        mixed: notes.filter((n: any) => n.captureMethod === 'mixed').length,
      },
      totalDuration: notes.reduce((sum: number, note: any) => sum + (note.estimatedDuration || 0), 0),
      uniqueTags: [...new Set(notes.flatMap((n: any) => n.tags || []))].length
    }
    
    return stats
  } catch (error) {
    console.error('Failed to get data stats:', error)
    return null
  }
}