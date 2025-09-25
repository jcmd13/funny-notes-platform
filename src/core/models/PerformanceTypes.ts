import { z } from 'zod'

// Performance timing types
export const PerformanceTimingSchema = z.object({
  totalDuration: z.number(), // total estimated duration in seconds
  noteCount: z.number(),
  averageNoteLength: z.number(), // average duration per note in seconds
  breakdown: z.array(z.object({
    noteId: z.string(),
    estimatedDuration: z.number(),
    actualDuration: z.number().optional(), // if recorded during rehearsal/performance
  })),
})

export type PerformanceTiming = z.infer<typeof PerformanceTimingSchema>

// Rehearsal session types
export const RehearsalSessionSchema = z.object({
  id: z.string(),
  setListId: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  totalDuration: z.number().optional(), // actual rehearsal duration in seconds
  noteTiming: z.array(z.object({
    noteId: z.string(),
    startTime: z.number(), // relative to session start in seconds
    duration: z.number(), // actual duration in seconds
  })),
  notes: z.string().optional(), // rehearsal notes and observations
  createdAt: z.date(),
})

export type RehearsalSession = z.infer<typeof RehearsalSessionSchema>

// Performance analytics types
export const PerformanceAnalyticsSchema = z.object({
  totalPerformances: z.number(),
  averageRating: z.number(),
  totalStageTime: z.number(), // total time performed in seconds
  venueBreakdown: z.array(z.object({
    venueId: z.string(),
    venueName: z.string(),
    performanceCount: z.number(),
    averageRating: z.number(),
    lastPerformance: z.date(),
  })),
  materialSuccess: z.array(z.object({
    noteId: z.string(),
    noteContent: z.string().max(100), // truncated for display
    timesPerformed: z.number(),
    averageRating: z.number(),
    bestVenue: z.string().optional(),
  })),
  monthlyStats: z.array(z.object({
    month: z.string(), // YYYY-MM format
    performanceCount: z.number(),
    averageRating: z.number(),
    totalDuration: z.number(),
  })),
})

export type PerformanceAnalytics = z.infer<typeof PerformanceAnalyticsSchema>

// Duration estimation utilities
export const DurationCategory = z.enum(['short', 'medium', 'long'])
export type DurationCategory = z.infer<typeof DurationCategory>

export const DURATION_CATEGORIES = {
  short: { min: 0, max: 120 }, // 0-2 minutes
  medium: { min: 120, max: 300 }, // 2-5 minutes
  long: { min: 300, max: Infinity }, // 5+ minutes
} as const