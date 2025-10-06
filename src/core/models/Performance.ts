import { z } from 'zod'

// Performance feedback schema
export const PerformanceFeedbackSchema = z.object({
  id: z.string(),
  performanceId: z.string(),
  rating: z.number().min(1).max(5), // 1-5 star rating
  audienceSize: z.number().optional(),
  audienceResponse: z.enum(['poor', 'fair', 'good', 'great', 'excellent']).optional(),
  notes: z.string().optional(),
  highlights: z.array(z.string()).default([]), // What went well
  improvements: z.array(z.string()).default([]), // What could be better
  materialFeedback: z.array(z.object({
    noteId: z.string(),
    rating: z.number().min(1).max(5),
    notes: z.string().optional(),
  })).default([]),
  createdAt: z.date(),
})

export type PerformanceFeedback = z.infer<typeof PerformanceFeedbackSchema>

// Performance record schema
export const PerformanceSchema = z.object({
  id: z.string(),
  setListId: z.string(),
  venueId: z.string(),
  date: z.date(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  actualDuration: z.number().optional(), // in seconds
  feedback: PerformanceFeedbackSchema.optional(),
  notes: z.string().optional(), // General performance notes
  status: z.enum(['scheduled', 'completed', 'cancelled']).default('scheduled'),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Performance = z.infer<typeof PerformanceSchema>

// Create performance input schema
export const CreatePerformanceInputSchema = z.object({
  id: z.string().optional(),
  setListId: z.string(),
  venueId: z.string(),
  date: z.date(),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled']).optional(),
})

export type CreatePerformanceInput = z.infer<typeof CreatePerformanceInputSchema>

// Performance analytics types (from PerformanceTypes.ts but specific to actual performances)
export const PerformanceStatsSchema = z.object({
  totalPerformances: z.number(),
  averageRating: z.number(),
  totalStageTime: z.number(), // total time performed in seconds
  bestVenue: z.object({
    venueId: z.string(),
    venueName: z.string(),
    averageRating: z.number(),
    performanceCount: z.number(),
  }).optional(),
  topMaterial: z.array(z.object({
    noteId: z.string(),
    noteContent: z.string().max(100), // truncated for display
    timesPerformed: z.number(),
    averageRating: z.number(),
  })),
  recentTrend: z.object({
    direction: z.enum(['improving', 'declining', 'stable']),
    ratingChange: z.number(), // change in average rating over last 5 performances
  }),
  monthlyBreakdown: z.array(z.object({
    month: z.string(), // YYYY-MM format
    performanceCount: z.number(),
    averageRating: z.number(),
    totalDuration: z.number(),
  })),
})

export type PerformanceStats = z.infer<typeof PerformanceStatsSchema>

// Validation functions
export function validatePerformance(data: unknown): Performance {
  return PerformanceSchema.parse(data)
}

export function validateCreatePerformanceInput(data: unknown): CreatePerformanceInput {
  return CreatePerformanceInputSchema.parse(data)
}

export function validatePerformanceFeedback(data: unknown): PerformanceFeedback {
  return PerformanceFeedbackSchema.parse(data)
}