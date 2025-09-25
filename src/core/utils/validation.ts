import { z } from 'zod'
import {
  NoteSchema,
  SetListSchema,
  VenueSchema,
  ContactSchema,
} from '../models'
import type {
  Note,
  SetList,
  Venue,
  Contact,
  CreateNoteInput,
  CreateSetListInput,
  CreateVenueInput,
  CreateContactInput,
} from '../models'

/**
 * Validation result type
 */
export type ValidationResult<T> = {
  success: boolean
  data?: T
  errors?: string[]
}

/**
 * Generic validation function
 */
function validateWithSchema<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      return { success: false, errors }
    }
    return { success: false, errors: ['Unknown validation error'] }
  }
}

/**
 * Validate a complete Note object
 */
export function validateNote(data: unknown): ValidationResult<Note> {
  return validateWithSchema(NoteSchema, data)
}

/**
 * Validate Note creation input
 */
export function validateCreateNoteInput(data: unknown): ValidationResult<CreateNoteInput> {
  const CreateNoteInputSchema = NoteSchema.omit({ 
    id: true, 
    createdAt: true, 
    updatedAt: true 
  }).extend({
    id: z.string().optional(),
  })
  
  return validateWithSchema(CreateNoteInputSchema, data)
}

/**
 * Validate a complete SetList object
 */
export function validateSetList(data: unknown): ValidationResult<SetList> {
  return validateWithSchema(SetListSchema, data)
}

/**
 * Validate SetList creation input
 */
export function validateCreateSetListInput(data: unknown): ValidationResult<CreateSetListInput> {
  const CreateSetListInputSchema = SetListSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    totalDuration: true,
    feedback: true,
  }).extend({
    id: z.string().optional(),
  })
  
  return validateWithSchema(CreateSetListInputSchema, data)
}

/**
 * Validate a complete Venue object
 */
export function validateVenue(data: unknown): ValidationResult<Venue> {
  return validateWithSchema(VenueSchema, data)
}

/**
 * Validate Venue creation input
 */
export function validateCreateVenueInput(data: unknown): ValidationResult<CreateVenueInput> {
  const CreateVenueInputSchema = VenueSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    contacts: true,
    performanceHistory: true,
  }).extend({
    id: z.string().optional(),
  })
  
  return validateWithSchema(CreateVenueInputSchema, data)
}

/**
 * Validate a complete Contact object
 */
export function validateContact(data: unknown): ValidationResult<Contact> {
  return validateWithSchema(ContactSchema, data)
}

/**
 * Validate Contact creation input
 */
export function validateCreateContactInput(data: unknown): ValidationResult<CreateContactInput> {
  const CreateContactInputSchema = ContactSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    interactions: true,
    reminders: true,
  }).extend({
    id: z.string().optional(),
  })
  
  return validateWithSchema(CreateContactInputSchema, data)
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  return z.string().email().safeParse(email).success
}

/**
 * Validate that a string is not empty after trimming
 */
export function validateNonEmptyString(value: string): boolean {
  return value.trim().length > 0
}

/**
 * Validate that a number is within a specific range
 */
export function validateNumberRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}