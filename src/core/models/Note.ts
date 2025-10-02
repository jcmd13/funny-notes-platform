import { z } from 'zod'

// Zod schemas for validation
export const AttachmentSchema = z.object({
  id: z.string(),
  type: z.enum(['audio', 'image']),
  filename: z.string(),
  size: z.number(),
  mimeType: z.string(),
  url: z.string().optional(), // For blob URLs or file paths
})

export const NoteMetadataSchema = z.object({
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
  }).optional(),
  duration: z.number().optional(), // for timed material in seconds
  confidence: z.number().min(0).max(1).optional(), // AI confidence in transcription/OCR
})

export const NoteSchema = z.object({
  id: z.string(),
  content: z.string(),
  captureMethod: z.enum(['text', 'voice', 'image', 'mixed']),
  tags: z.array(z.string()).default([]),
  venue: z.string().optional(), // Performance venue context
  audience: z.string().optional(), // Audience type/size context
  estimatedDuration: z.number().optional(), // Performance duration in seconds
  createdAt: z.date(),
  updatedAt: z.date(),
  metadata: NoteMetadataSchema,
  attachments: z.array(AttachmentSchema),
})

// TypeScript interfaces derived from Zod schemas
export type Attachment = z.infer<typeof AttachmentSchema>
export type NoteMetadata = z.infer<typeof NoteMetadataSchema>
export type Note = z.infer<typeof NoteSchema>

// Type alias for capture method
export type CaptureMethod = Note['captureMethod']

// Utility types for note creation
export type CreateNoteInput = Omit<Note, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

export type UpdateNoteInput = Partial<Omit<Note, 'id' | 'createdAt'>> & {
  id: string
}