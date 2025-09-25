import { describe, it, expect } from 'vitest'
import {
  validateNote,
  validateCreateNoteInput,
  validateEmail,
  validateNonEmptyString,
  validateNumberRange,
} from '../validation'

describe('validation', () => {
  describe('validateNote', () => {
    it('should validate a correct note', () => {
      const validNote = {
        id: 'test-id',
        content: 'Test content',
        type: 'text',
        tags: ['comedy', 'observational'],
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          duration: 60,
        },
        attachments: [],
      }

      const result = validateNote(validNote)
      expect(result.success).toBe(true)
      expect(result.data).toEqual(validNote)
    })

    it('should reject invalid note data', () => {
      const invalidNote = {
        id: 'test-id',
        content: '', // empty content
        type: 'invalid-type', // invalid type
        tags: 'not-an-array', // should be array
      }

      const result = validateNote(invalidNote)
      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
      expect(result.errors!.length).toBeGreaterThan(0)
    })
  })

  describe('validateCreateNoteInput', () => {
    it('should validate note creation input', () => {
      const validInput = {
        content: 'Test content',
        type: 'text',
        tags: [],
        metadata: {},
        attachments: [],
      }

      const result = validateCreateNoteInput(validInput)
      expect(result.success).toBe(true)
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@domain.com')).toBe(false)
    })
  })

  describe('validateNonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(validateNonEmptyString('hello')).toBe(true)
      expect(validateNonEmptyString('  hello  ')).toBe(true)
    })

    it('should reject empty strings', () => {
      expect(validateNonEmptyString('')).toBe(false)
      expect(validateNonEmptyString('   ')).toBe(false)
    })
  })

  describe('validateNumberRange', () => {
    it('should validate numbers within range', () => {
      expect(validateNumberRange(5, 1, 10)).toBe(true)
      expect(validateNumberRange(1, 1, 10)).toBe(true)
      expect(validateNumberRange(10, 1, 10)).toBe(true)
    })

    it('should reject numbers outside range', () => {
      expect(validateNumberRange(0, 1, 10)).toBe(false)
      expect(validateNumberRange(11, 1, 10)).toBe(false)
    })
  })
})