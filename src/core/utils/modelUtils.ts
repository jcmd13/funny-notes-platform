import type { Note, SetList, PerformanceTiming, DurationCategory } from '../models'
import { DURATION_CATEGORIES } from '../models'

/**
 * Generate a unique ID for new entities
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Calculate the estimated duration category for a note based on content length
 */
export function estimateNoteDuration(content: string): number {
    // Simple heuristic: ~150 words per minute speaking rate
    const wordCount = content.trim().split(/\s+/).length
    const estimatedSeconds = (wordCount / 150) * 60
    return Math.max(estimatedSeconds, 10) // minimum 10 seconds
}

/**
 * Categorize a duration into short/medium/long
 */
export function categorizeDuration(durationSeconds: number): DurationCategory {
    if (durationSeconds <= DURATION_CATEGORIES.short.max) {
        return 'short'
    } else if (durationSeconds <= DURATION_CATEGORIES.medium.max) {
        return 'medium'
    } else {
        return 'long'
    }
}

/**
 * Calculate total performance timing for a set list
 */
export function calculateSetListTiming(notes: Note[]): PerformanceTiming {
    const breakdown = notes.map(note => {
        const estimatedDuration = note.metadata.duration || estimateNoteDuration(note.content)
        return {
            noteId: note.id,
            estimatedDuration,
        }
    })

    const totalDuration = breakdown.reduce((sum, item) => sum + item.estimatedDuration, 0)
    const averageNoteLength = notes.length > 0 ? totalDuration / notes.length : 0

    return {
        totalDuration,
        noteCount: notes.length,
        averageNoteLength,
        breakdown,
    }
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)

    if (minutes === 0) {
        return `${remainingSeconds}s`
    } else if (minutes < 60) {
        return `${minutes}m ${remainingSeconds}s`
    } else {
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60
        return `${hours}h ${remainingMinutes}m`
    }
}

/**
 * Create a new note with default values
 */
export function createNote(content: string, captureMethod: Note['captureMethod'] = 'text'): Omit<Note, 'id'> {
    const now = new Date()
    return {
        content,
        captureMethod,
        tags: [],
        createdAt: now,
        updatedAt: now,
        metadata: {
            duration: estimateNoteDuration(content),
        },
        attachments: [],
    }
}

/**
 * Create a new set list with default values
 */
export function createSetList(name: string, notes: Note[] = []): Omit<SetList, 'id'> {
    const now = new Date()
    const timing = calculateSetListTiming(notes)

    return {
        name,
        notes,
        totalDuration: timing.totalDuration,
        feedback: [],
        createdAt: now,
        updatedAt: now,
    }
}