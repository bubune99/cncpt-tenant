/**
 * Booking System Types
 */

export interface BookingService {
  id: string
  name: string
  slug: string
  description: string | null
  durationMinutes: number
  priceCents: number
  bufferMinutes: number
  isActive: boolean
  sortOrder: number
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface BookingAvailability {
  id: string
  dayOfWeek: number // 0=Sunday, 6=Saturday
  startTime: string // HH:MM format
  endTime: string
  isActive: boolean
}

export interface BookingBlockedDate {
  id: string
  blockedDate: string // YYYY-MM-DD
  reason: string | null
}

export type BookingStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'
  | 'rescheduled'

export interface Booking {
  id: string
  serviceId: string | null
  service?: BookingService

  // Client info
  clientName: string
  clientEmail: string
  clientPhone: string | null
  companyName: string | null
  websiteUrl: string | null

  // Appointment
  scheduledAt: Date
  endAt: Date
  durationMinutes: number
  timezone: string

  // Intake form
  projectType: string | null
  projectDescription: string | null
  budgetRange: string | null
  howDidYouHear: string | null
  intakeResponses: Record<string, unknown>

  // Status
  status: BookingStatus
  cancelledAt: Date | null
  cancelledBy: 'client' | 'admin' | null
  cancellationReason: string | null

  // Rescheduling
  rescheduledFrom: string | null
  rescheduleCount: number

  // Meeting
  meetingLink: string | null
  meetingPassword: string | null

  // Notes
  adminNotes: string | null
  followUpNotes: string | null

  // Email tracking
  confirmationSentAt: Date | null
  reminder24hSentAt: Date | null
  reminder1hSentAt: Date | null
  followUpSentAt: Date | null

  createdAt: Date
  updatedAt: Date
}

export interface BookingSettings {
  timezone: string
  minNoticeHours: number
  maxAdvanceDays: number
  confirmationEmailEnabled: boolean
  reminder24hEnabled: boolean
  reminder1hEnabled: boolean
  adminNotificationEmail: string
  bookingPageTitle: string
  bookingPageDescription: string
  cancellationPolicy: string
}

export interface TimeSlot {
  time: string // HH:MM format
  datetime: Date
  available: boolean
}

export interface AvailableDate {
  date: string // YYYY-MM-DD
  dayOfWeek: number
  slots: TimeSlot[]
}

export interface CreateBookingInput {
  serviceId: string
  scheduledAt: string // ISO datetime
  timezone: string
  clientName: string
  clientEmail: string
  clientPhone?: string
  companyName?: string
  websiteUrl?: string
  projectType?: string
  projectDescription?: string
  budgetRange?: string
  howDidYouHear?: string
}

export interface BookingEmailData {
  booking: Booking
  service: BookingService
  formattedDate: string
  formattedTime: string
  meetingLink?: string
  cancellationLink?: string
  rescheduleLink?: string
}

export type BookingEmailType =
  | 'confirmation'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'cancelled'
  | 'rescheduled'
  | 'follow_up'
  | 'admin_notification'
