import { z } from 'zod'

// Zod schemas for validation
export const ContactInfoSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  social: z.record(z.string(), z.string()).optional(), // e.g., { twitter: "@handle", instagram: "@handle" }
})

export const InteractionSchema = z.object({
  id: z.string(),
  type: z.enum(['email', 'phone', 'meeting', 'performance', 'social']),
  subject: z.string(),
  notes: z.string().optional(),
  date: z.date(),
  createdAt: z.date(),
})

export const ReminderSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.date(),
  completed: z.boolean().default(false),
  context: z.string().optional(), // additional context about why this reminder was created
  createdAt: z.date(),
})

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(), // e.g., "Booking Manager", "Venue Owner", "Fellow Comedian"
  venue: z.string().optional(), // venue ID reference
  contactInfo: ContactInfoSchema,
  interactions: z.array(InteractionSchema),
  reminders: z.array(ReminderSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// TypeScript interfaces
export type ContactInfo = z.infer<typeof ContactInfoSchema>
export type Interaction = z.infer<typeof InteractionSchema>
export type Reminder = z.infer<typeof ReminderSchema>
export type Contact = z.infer<typeof ContactSchema>

// Utility types
export type CreateContactInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'interactions' | 'reminders'> & {
  id?: string
}

export type UpdateContactInput = Partial<Omit<Contact, 'id' | 'createdAt'>> & {
  id: string
}

export type CreateInteractionInput = Omit<Interaction, 'id' | 'createdAt'> & {
  id?: string
}

export type CreateReminderInput = Omit<Reminder, 'id' | 'createdAt'> & {
  id?: string
}