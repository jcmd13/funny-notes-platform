import { z } from 'zod'

// Capture method types
export const CaptureMethodSchema = z.enum(['text', 'voice', 'image', 'mixed'])
export type CaptureMethod = z.infer<typeof CaptureMethodSchema>

// Voice capture specific types
export const VoiceCaptureDataSchema = z.object({
  audioBlob: z.instanceof(Blob),
  duration: z.number(), // duration in seconds
  mimeType: z.string(),
  sampleRate: z.number().optional(),
})

export type VoiceCaptureData = z.infer<typeof VoiceCaptureDataSchema>

// Image capture specific types
export const ImageCaptureDataSchema = z.object({
  imageBlob: z.instanceof(Blob),
  width: z.number(),
  height: z.number(),
  mimeType: z.string(),
  size: z.number(), // file size in bytes
})

export type ImageCaptureData = z.infer<typeof ImageCaptureDataSchema>

// Geolocation types
export const GeolocationDataSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number().optional(),
  altitude: z.number().optional(),
  altitudeAccuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
  timestamp: z.number(),
})

export type GeolocationData = z.infer<typeof GeolocationDataSchema>

// Capture context - additional metadata about when/where content was captured
export const CaptureContextSchema = z.object({
  method: CaptureMethodSchema,
  location: GeolocationDataSchema.optional(),
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    language: z.string().optional(),
  }).optional(),
  timestamp: z.date(),
})

export type CaptureContext = z.infer<typeof CaptureContextSchema>