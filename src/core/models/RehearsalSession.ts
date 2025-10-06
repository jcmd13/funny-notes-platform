import { z } from 'zod'

// Zod schemas for validation
export const RehearsalSessionSchema = z.object({
  id: z.string(),
  setListId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  totalDuration: z.number().default(0), // in seconds
  currentNoteIndex: z.number().default(0),
  noteTimings: z.array(z.object({
    noteId: z.string(),
    startTime: z.number(), // seconds from session start
    endTime: z.number().optional(), // seconds from session start
    duration: z.number().optional(), // actual duration in seconds
  })).default([]),
  isCompleted: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// TypeScript interfaces
export type RehearsalSession = z.infer<typeof RehearsalSessionSchema>

export type CreateRehearsalSessionInput = Omit<RehearsalSession, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

export type UpdateRehearsalSessionInput = Partial<Omit<RehearsalSession, 'id' | 'createdAt'>> & {
  id: string
}

// Utility types for rehearsal timing
export type NoteTiming = RehearsalSession['noteTimings'][0]