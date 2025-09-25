import { z } from 'zod'
import { NoteSchema } from './Note'

// Zod schemas for validation
export const PerformanceFeedbackSchema = z.object({
  id: z.string(),
  rating: z.number().min(1).max(5),
  notes: z.string(),
  audienceResponse: z.enum(['excellent', 'good', 'mixed', 'poor']),
  createdAt: z.date(),
})

export const SetListSchema = z.object({
  id: z.string(),
  name: z.string(),
  notes: z.array(NoteSchema),
  totalDuration: z.number(), // calculated total duration in seconds
  venue: z.string().optional(), // venue ID reference
  performanceDate: z.date().optional(),
  feedback: z.array(PerformanceFeedbackSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// TypeScript interfaces
export type PerformanceFeedback = z.infer<typeof PerformanceFeedbackSchema>
export type SetList = z.infer<typeof SetListSchema>

// Utility types
export type CreateSetListInput = Omit<SetList, 'id' | 'createdAt' | 'updatedAt' | 'totalDuration' | 'feedback'> & {
  id?: string
}

export type UpdateSetListInput = Partial<Omit<SetList, 'id' | 'createdAt'>> & {
  id: string
}