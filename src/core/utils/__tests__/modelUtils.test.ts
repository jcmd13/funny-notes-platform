import { describe, it, expect } from 'vitest'
import {
  generateId,
  estimateNoteDuration,
  categorizeDuration,
  calculateSetListTiming,
  formatDuration,
  createNote,
} from '../modelUtils'
import type { Note } from '../../models'

describe('modelUtils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('estimateNoteDuration', () => {
    it('should estimate duration based on word count', () => {
      const shortText = 'Hello world'
      const longText = 'This is a much longer piece of text that should take more time to say when performing on stage in front of an audience. It contains many more words and should definitely result in a longer estimated duration than the short text. We need to make sure this text is long enough to exceed the minimum duration threshold so that we can properly test the word count calculation algorithm.'
      
      const shortDuration = estimateNoteDuration(shortText)
      const longDuration = estimateNoteDuration(longText)
      
      expect(shortDuration).toBeGreaterThanOrEqual(10) // minimum 10 seconds
      expect(longDuration).toBeGreaterThan(shortDuration)
    })
  })

  describe('categorizeDuration', () => {
    it('should categorize durations correctly', () => {
      expect(categorizeDuration(60)).toBe('short') // 1 minute
      expect(categorizeDuration(180)).toBe('medium') // 3 minutes
      expect(categorizeDuration(400)).toBe('long') // 6+ minutes
    })
  })

  describe('formatDuration', () => {
    it('should format durations correctly', () => {
      expect(formatDuration(30)).toBe('30s')
      expect(formatDuration(90)).toBe('1m 30s')
      expect(formatDuration(3661)).toBe('1h 1m')
    })
  })

  describe('createNote', () => {
    it('should create a note with default values', () => {
      const content = 'Test joke content'
      const note = createNote(content)
      
      expect(note.content).toBe(content)
      expect(note.captureMethod).toBe('text')
      expect(note.tags).toEqual([])
      expect(note.attachments).toEqual([])
      expect(note.metadata.duration).toBeGreaterThan(0)
      expect(note.createdAt).toBeInstanceOf(Date)
      expect(note.updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('calculateSetListTiming', () => {
    it('should calculate timing for a set list', () => {
      const notes: Note[] = [
        {
          id: '1',
          content: 'Short joke',
          captureMethod: 'text',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { duration: 30 },
          attachments: [],
        },
        {
          id: '2',
          content: 'Longer story that takes more time to tell',
          captureMethod: 'text',
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { duration: 120 },
          attachments: [],
        },
      ]

      const timing = calculateSetListTiming(notes)
      
      expect(timing.noteCount).toBe(2)
      expect(timing.totalDuration).toBe(150) // 30 + 120
      expect(timing.averageNoteLength).toBe(75) // 150 / 2
      expect(timing.breakdown).toHaveLength(2)
    })
  })
})