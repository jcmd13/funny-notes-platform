import type { StorageService } from '../core/storage'

/**
 * Seed sample data for new users to get started
 */
export async function seedSampleData(storageService: StorageService): Promise<boolean> {
  try {
    // Sample notes with different capture methods and content
    const sampleNotes = [
      {
        content: "Why do they call it rush hour when nobody's moving? It's more like 'crush hour' - because that's what it does to your soul.",
        captureMethod: 'text' as const,
        tags: ['observational', 'traffic', 'daily life'],
        metadata: { duration: 45 }
      },
      {
        content: "I tried to be a morning person once. Turns out I'm more of a 'mourning person' - mourning the loss of my sleep.",
        captureMethod: 'text' as const,
        tags: ['self-deprecating', 'sleep', 'lifestyle'],
        metadata: { duration: 30 }
      },
      {
        content: "My phone battery lasts longer than most of my relationships. At least when my phone dies, I know exactly what went wrong.",
        captureMethod: 'text' as const,
        tags: ['relationships', 'technology', 'modern life'],
        metadata: { duration: 35 }
      },
      {
        content: "I love how GPS says 'turn right in 500 feet' like I have any idea what 500 feet looks like. Just tell me 'turn right after the Starbucks.'",
        captureMethod: 'text' as const,
        tags: ['technology', 'navigation', 'observational'],
        metadata: { duration: 40 }
      },
      {
        content: "Social media has ruined us. Now we can't even eat a meal without photographing it first. I saw someone take a picture of their cereal. CEREAL!",
        captureMethod: 'text' as const,
        tags: ['social media', 'food', 'modern life'],
        metadata: { duration: 50 }
      },
      {
        content: "I went to a restaurant that said 'farm to table.' Turns out it was just a really long table.",
        captureMethod: 'text' as const,
        tags: ['food', 'restaurants', 'wordplay'],
        metadata: { duration: 25 }
      },
      {
        content: "My doctor told me I need to exercise more. So I started running... late to everything.",
        captureMethod: 'text' as const,
        tags: ['health', 'exercise', 'procrastination'],
        metadata: { duration: 30 }
      },
      {
        content: "I'm not saying I'm old, but I remember when emojis were called 'emotions' and you had to use your face to make them.",
        captureMethod: 'text' as const,
        tags: ['age', 'technology', 'nostalgia'],
        metadata: { duration: 35 }
      }
    ]

    // Create the sample notes
    for (const noteData of sampleNotes) {
      await storageService.createNote({
        ...noteData,
        attachments: [] // Add required attachments property
      })
    }

    // Create a sample venue
    await storageService.createVenue({
      name: "The Laugh Track",
      location: "Downtown Comedy District",
      characteristics: {
        audienceSize: 150,
        audienceType: "General",
        acoustics: "good",
        lighting: "professional",
        capacity: 150,
        stage: "Traditional Stage",
        soundSystem: "Professional",
        notes: "Great venue for new material. Supportive crowd."
      }
    })

    // Create a sample contact
    await storageService.createContact({
      name: "Mike Johnson",
      role: "Booker",
      venue: "The Laugh Track",
      contactInfo: {
        email: "mike@laughtrack.com",
        phone: "(555) 123-4567"
      }
    })

    return true
  } catch (error) {
    console.error('Failed to seed sample data:', error)
    return false
  }
}