import { z } from 'zod'

// Zod schemas for validation
export const VenueCharacteristicsSchema = z.object({
  audienceSize: z.number().min(0),
  audienceType: z.string(), // e.g., "comedy club regulars", "corporate", "college students"
  acoustics: z.enum(['excellent', 'good', 'poor']),
  lighting: z.enum(['professional', 'basic', 'minimal']),
})

export const PerformanceSchema = z.object({
  id: z.string(),
  setListId: z.string(),
  date: z.date(),
  duration: z.number(), // actual performance duration in seconds
  audienceSize: z.number().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  createdAt: z.date(),
})

export const VenueSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string(),
  characteristics: VenueCharacteristicsSchema,
  contacts: z.array(z.string()), // array of contact IDs
  performanceHistory: z.array(PerformanceSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// TypeScript interfaces
export type VenueCharacteristics = z.infer<typeof VenueCharacteristicsSchema>
export type Performance = z.infer<typeof PerformanceSchema>
export type Venue = z.infer<typeof VenueSchema>

// Utility types
export type CreateVenueInput = Omit<Venue, 'id' | 'createdAt' | 'updatedAt' | 'contacts' | 'performanceHistory'> & {
  id?: string
}

export type UpdateVenueInput = Partial<Omit<Venue, 'id' | 'createdAt'>> & {
  id: string
}

export type CreatePerformanceInput = Omit<Performance, 'id' | 'createdAt'> & {
  id?: string
}