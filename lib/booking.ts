/**
 * Booking System Core Functions
 * Handles availability, slot generation, and booking management
 */

import { sql } from '@/lib/neon'
import { sendBookingEmail } from '@/lib/email'
import type {
  Booking,
  BookingService,
  BookingAvailability,
  BookingBlockedDate,
  BookingSettings,
  TimeSlot,
  AvailableDate,
  CreateBookingInput,
  BookingStatus,
  BookingEmailData,
} from '@/types/booking'

// ============================================
// SETTINGS
// ============================================

export async function getBookingSettings(): Promise<BookingSettings> {
  try {
    const rows = await sql`SELECT setting_key, setting_value FROM booking_settings`

    const settings: Record<string, string> = {}
    rows.forEach((row) => {
      settings[row.setting_key as string] = row.setting_value as string
    })

    return {
      timezone: settings.timezone || 'America/New_York',
      minNoticeHours: parseInt(settings.min_notice_hours || '24'),
      maxAdvanceDays: parseInt(settings.max_advance_days || '30'),
      confirmationEmailEnabled: settings.confirmation_email_enabled !== 'false',
      reminder24hEnabled: settings.reminder_24h_enabled !== 'false',
      reminder1hEnabled: settings.reminder_1h_enabled !== 'false',
      adminNotificationEmail: settings.admin_notification_email || '',
      bookingPageTitle: settings.booking_page_title || 'Book a Consultation',
      bookingPageDescription: settings.booking_page_description || '',
      cancellationPolicy: settings.cancellation_policy || '',
    }
  } catch (error) {
    console.error('[booking] Error getting settings:', error)
    return {
      timezone: 'America/New_York',
      minNoticeHours: 24,
      maxAdvanceDays: 30,
      confirmationEmailEnabled: true,
      reminder24hEnabled: true,
      reminder1hEnabled: true,
      adminNotificationEmail: '',
      bookingPageTitle: 'Book a Consultation',
      bookingPageDescription: '',
      cancellationPolicy: '',
    }
  }
}

export async function updateBookingSetting(key: string, value: string): Promise<boolean> {
  try {
    await sql`
      INSERT INTO booking_settings (setting_key, setting_value)
      VALUES (${key}, ${value})
      ON CONFLICT (setting_key) DO UPDATE SET
        setting_value = ${value},
        updated_at = NOW()
    `
    return true
  } catch (error) {
    console.error('[booking] Error updating setting:', error)
    return false
  }
}

// ============================================
// SERVICES
// ============================================

export async function getBookingServices(activeOnly = true): Promise<BookingService[]> {
  try {
    const rows = activeOnly
      ? await sql`SELECT * FROM booking_services WHERE is_active = true ORDER BY sort_order`
      : await sql`SELECT * FROM booking_services ORDER BY sort_order`

    return rows.map(mapRowToService)
  } catch (error) {
    console.error('[booking] Error getting services:', error)
    return []
  }
}

export async function getBookingServiceBySlug(slug: string): Promise<BookingService | null> {
  try {
    const rows = await sql`SELECT * FROM booking_services WHERE slug = ${slug} AND is_active = true`
    if (rows.length === 0) return null
    return mapRowToService(rows[0])
  } catch (error) {
    console.error('[booking] Error getting service:', error)
    return null
  }
}

export async function getBookingServiceById(id: string): Promise<BookingService | null> {
  try {
    const rows = await sql`SELECT * FROM booking_services WHERE id = ${id}::uuid`
    if (rows.length === 0) return null
    return mapRowToService(rows[0])
  } catch (error) {
    console.error('[booking] Error getting service:', error)
    return null
  }
}

function mapRowToService(row: Record<string, unknown>): BookingService {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    description: row.description as string | null,
    durationMinutes: row.duration_minutes as number,
    priceCents: row.price_cents as number,
    bufferMinutes: row.buffer_minutes as number,
    isActive: row.is_active as boolean,
    sortOrder: row.sort_order as number,
    color: row.color as string,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

// ============================================
// AVAILABILITY
// ============================================

export async function getBookingAvailability(): Promise<BookingAvailability[]> {
  try {
    const rows = await sql`
      SELECT * FROM booking_availability WHERE is_active = true ORDER BY day_of_week, start_time
    `
    return rows.map((row) => ({
      id: row.id as string,
      dayOfWeek: row.day_of_week as number,
      startTime: (row.start_time as string).slice(0, 5),
      endTime: (row.end_time as string).slice(0, 5),
      isActive: row.is_active as boolean,
    }))
  } catch (error) {
    console.error('[booking] Error getting availability:', error)
    return []
  }
}

export async function getBlockedDates(startDate: Date, endDate: Date): Promise<BookingBlockedDate[]> {
  try {
    const rows = await sql`
      SELECT * FROM booking_blocked_dates
      WHERE blocked_date >= ${startDate.toISOString().split('T')[0]}
        AND blocked_date <= ${endDate.toISOString().split('T')[0]}
    `
    return rows.map((row) => ({
      id: row.id as string,
      blockedDate: row.blocked_date as string,
      reason: row.reason as string | null,
    }))
  } catch (error) {
    console.error('[booking] Error getting blocked dates:', error)
    return []
  }
}

export async function addBlockedDate(date: string, reason?: string): Promise<boolean> {
  try {
    await sql`
      INSERT INTO booking_blocked_dates (blocked_date, reason)
      VALUES (${date}, ${reason || null})
      ON CONFLICT (blocked_date) DO NOTHING
    `
    return true
  } catch (error) {
    console.error('[booking] Error adding blocked date:', error)
    return false
  }
}

export async function removeBlockedDate(id: string): Promise<boolean> {
  try {
    await sql`DELETE FROM booking_blocked_dates WHERE id = ${id}::uuid`
    return true
  } catch (error) {
    console.error('[booking] Error removing blocked date:', error)
    return false
  }
}

// ============================================
// SLOT GENERATION
// ============================================

export async function getAvailableSlots(
  serviceId: string,
  startDate: Date,
  endDate: Date
): Promise<AvailableDate[]> {
  const service = await getBookingServiceById(serviceId)
  if (!service) return []

  const settings = await getBookingSettings()
  const availability = await getBookingAvailability()
  const blockedDates = await getBlockedDates(startDate, endDate)
  const existingBookings = await getBookingsInRange(startDate, endDate)

  const blockedDateSet = new Set(blockedDates.map((d) => d.blockedDate))
  const results: AvailableDate[] = []

  const minBookingTime = new Date()
  minBookingTime.setHours(minBookingTime.getHours() + settings.minNoticeHours)

  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayOfWeek = currentDate.getDay()

    // Check if date is blocked
    if (blockedDateSet.has(dateStr)) {
      currentDate.setDate(currentDate.getDate() + 1)
      continue
    }

    // Get availability for this day of week
    const dayAvailability = availability.filter((a) => a.dayOfWeek === dayOfWeek)
    if (dayAvailability.length === 0) {
      currentDate.setDate(currentDate.getDate() + 1)
      continue
    }

    const slots: TimeSlot[] = []

    for (const avail of dayAvailability) {
      const startMinutes = timeToMinutes(avail.startTime)
      const endMinutes = timeToMinutes(avail.endTime)
      const slotDuration = service.durationMinutes + service.bufferMinutes

      for (let minutes = startMinutes; minutes + service.durationMinutes <= endMinutes; minutes += 30) {
        const slotTime = minutesToTime(minutes)
        const slotDatetime = new Date(`${dateStr}T${slotTime}:00`)

        // Check if slot is in the past or within min notice period
        if (slotDatetime <= minBookingTime) {
          continue
        }

        // Check if slot conflicts with existing bookings
        const slotEnd = new Date(slotDatetime.getTime() + slotDuration * 60000)
        const hasConflict = existingBookings.some((booking) => {
          const bookingStart = new Date(booking.scheduledAt)
          const bookingEnd = new Date(booking.endAt)
          return slotDatetime < bookingEnd && slotEnd > bookingStart
        })

        slots.push({
          time: slotTime,
          datetime: slotDatetime,
          available: !hasConflict,
        })
      }
    }

    if (slots.length > 0) {
      results.push({
        date: dateStr,
        dayOfWeek,
        slots,
      })
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return results
}

function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number)
  return hours * 60 + mins
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

// ============================================
// BOOKINGS
// ============================================

export async function getBookingsInRange(startDate: Date, endDate: Date): Promise<Booking[]> {
  try {
    const rows = await sql`
      SELECT b.*, s.name as service_name, s.slug as service_slug, s.duration_minutes as service_duration
      FROM bookings b
      LEFT JOIN booking_services s ON b.service_id = s.id
      WHERE b.scheduled_at >= ${startDate.toISOString()}
        AND b.scheduled_at <= ${endDate.toISOString()}
        AND b.status NOT IN ('cancelled', 'rescheduled')
      ORDER BY b.scheduled_at
    `
    return rows.map(mapRowToBooking)
  } catch (error) {
    console.error('[booking] Error getting bookings:', error)
    return []
  }
}

export async function getBookingById(id: string): Promise<Booking | null> {
  try {
    const rows = await sql`
      SELECT b.*, s.name as service_name, s.slug as service_slug
      FROM bookings b
      LEFT JOIN booking_services s ON b.service_id = s.id
      WHERE b.id = ${id}::uuid
    `
    if (rows.length === 0) return null
    return mapRowToBooking(rows[0])
  } catch (error) {
    console.error('[booking] Error getting booking:', error)
    return null
  }
}

export async function getUpcomingBookings(limit = 10): Promise<Booking[]> {
  try {
    const rows = await sql`
      SELECT b.*, s.name as service_name, s.slug as service_slug
      FROM bookings b
      LEFT JOIN booking_services s ON b.service_id = s.id
      WHERE b.scheduled_at > NOW()
        AND b.status IN ('scheduled', 'confirmed')
      ORDER BY b.scheduled_at
      LIMIT ${limit}
    `
    return rows.map(mapRowToBooking)
  } catch (error) {
    console.error('[booking] Error getting upcoming bookings:', error)
    return []
  }
}

export async function getAllBookings(options?: {
  status?: BookingStatus
  limit?: number
  offset?: number
}): Promise<{ bookings: Booking[]; total: number }> {
  try {
    const limit = options?.limit || 50
    const offset = options?.offset || 0

    let rows
    let countRows

    if (options?.status) {
      rows = await sql`
        SELECT b.*, s.name as service_name, s.slug as service_slug
        FROM bookings b
        LEFT JOIN booking_services s ON b.service_id = s.id
        WHERE b.status = ${options.status}
        ORDER BY b.scheduled_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`SELECT COUNT(*) as count FROM bookings WHERE status = ${options.status}`
    } else {
      rows = await sql`
        SELECT b.*, s.name as service_name, s.slug as service_slug
        FROM bookings b
        LEFT JOIN booking_services s ON b.service_id = s.id
        ORDER BY b.scheduled_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
      countRows = await sql`SELECT COUNT(*) as count FROM bookings`
    }

    return {
      bookings: rows.map(mapRowToBooking),
      total: parseInt(countRows[0].count as string),
    }
  } catch (error) {
    console.error('[booking] Error getting all bookings:', error)
    return { bookings: [], total: 0 }
  }
}

export async function createBooking(input: CreateBookingInput): Promise<Booking | null> {
  try {
    const service = await getBookingServiceById(input.serviceId)
    if (!service) throw new Error('Service not found')

    const scheduledAt = new Date(input.scheduledAt)
    const endAt = new Date(scheduledAt.getTime() + service.durationMinutes * 60000)

    const rows = await sql`
      INSERT INTO bookings (
        service_id, scheduled_at, end_at, duration_minutes, timezone,
        client_name, client_email, client_phone, company_name, website_url,
        project_type, project_description, budget_range, how_did_you_hear
      ) VALUES (
        ${input.serviceId}::uuid, ${scheduledAt.toISOString()}, ${endAt.toISOString()},
        ${service.durationMinutes}, ${input.timezone},
        ${input.clientName}, ${input.clientEmail}, ${input.clientPhone || null},
        ${input.companyName || null}, ${input.websiteUrl || null},
        ${input.projectType || null}, ${input.projectDescription || null},
        ${input.budgetRange || null}, ${input.howDidYouHear || null}
      )
      RETURNING *
    `

    const booking = mapRowToBooking(rows[0])

    // Send confirmation emails
    const emailData = await buildEmailData(booking, service)

    // Send to client
    await sendBookingEmail('confirmation', emailData)

    // Update confirmation sent timestamp
    await sql`
      UPDATE bookings SET confirmation_sent_at = NOW() WHERE id = ${booking.id}::uuid
    `

    // Send to admin
    await sendBookingEmail('admin_notification', emailData)

    return booking
  } catch (error) {
    console.error('[booking] Error creating booking:', error)
    return null
  }
}

export async function updateBookingStatus(
  id: string,
  status: BookingStatus,
  options?: { cancelledBy?: 'client' | 'admin'; cancellationReason?: string }
): Promise<boolean> {
  try {
    if (status === 'cancelled') {
      await sql`
        UPDATE bookings SET
          status = ${status},
          cancelled_at = NOW(),
          cancelled_by = ${options?.cancelledBy || 'admin'},
          cancellation_reason = ${options?.cancellationReason || null},
          updated_at = NOW()
        WHERE id = ${id}::uuid
      `

      // Send cancellation email
      const booking = await getBookingById(id)
      if (booking) {
        const service = await getBookingServiceById(booking.serviceId || '')
        if (service) {
          const emailData = await buildEmailData(booking, service)
          await sendBookingEmail('cancelled', emailData)
        }
      }
    } else {
      await sql`
        UPDATE bookings SET status = ${status}, updated_at = NOW()
        WHERE id = ${id}::uuid
      `
    }
    return true
  } catch (error) {
    console.error('[booking] Error updating booking status:', error)
    return false
  }
}

export async function updateBookingNotes(id: string, adminNotes: string): Promise<boolean> {
  try {
    await sql`
      UPDATE bookings SET admin_notes = ${adminNotes}, updated_at = NOW()
      WHERE id = ${id}::uuid
    `
    return true
  } catch (error) {
    console.error('[booking] Error updating booking notes:', error)
    return false
  }
}

function mapRowToBooking(row: Record<string, unknown>): Booking {
  return {
    id: row.id as string,
    serviceId: row.service_id as string | null,
    service: row.service_name
      ? {
          id: row.service_id as string,
          name: row.service_name as string,
          slug: row.service_slug as string,
          description: null,
          durationMinutes: (row.service_duration as number) || (row.duration_minutes as number),
          priceCents: 0,
          bufferMinutes: 15,
          isActive: true,
          sortOrder: 0,
          color: '#3B82F6',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      : undefined,
    clientName: row.client_name as string,
    clientEmail: row.client_email as string,
    clientPhone: row.client_phone as string | null,
    companyName: row.company_name as string | null,
    websiteUrl: row.website_url as string | null,
    scheduledAt: new Date(row.scheduled_at as string),
    endAt: new Date(row.end_at as string),
    durationMinutes: row.duration_minutes as number,
    timezone: row.timezone as string,
    projectType: row.project_type as string | null,
    projectDescription: row.project_description as string | null,
    budgetRange: row.budget_range as string | null,
    howDidYouHear: row.how_did_you_hear as string | null,
    intakeResponses: (row.intake_responses as Record<string, unknown>) || {},
    status: row.status as BookingStatus,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at as string) : null,
    cancelledBy: row.cancelled_by as 'client' | 'admin' | null,
    cancellationReason: row.cancellation_reason as string | null,
    rescheduledFrom: row.rescheduled_from as string | null,
    rescheduleCount: (row.reschedule_count as number) || 0,
    meetingLink: row.meeting_link as string | null,
    meetingPassword: row.meeting_password as string | null,
    adminNotes: row.admin_notes as string | null,
    followUpNotes: row.follow_up_notes as string | null,
    confirmationSentAt: row.confirmation_sent_at ? new Date(row.confirmation_sent_at as string) : null,
    reminder24hSentAt: row.reminder_24h_sent_at ? new Date(row.reminder_24h_sent_at as string) : null,
    reminder1hSentAt: row.reminder_1h_sent_at ? new Date(row.reminder_1h_sent_at as string) : null,
    followUpSentAt: row.follow_up_sent_at ? new Date(row.follow_up_sent_at as string) : null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

// ============================================
// EMAIL HELPERS
// ============================================

async function buildEmailData(booking: Booking, service: BookingService): Promise<BookingEmailData> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const formattedDate = booking.scheduledAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedTime = booking.scheduledAt.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return {
    booking,
    service,
    formattedDate,
    formattedTime,
    meetingLink: booking.meetingLink || undefined,
    cancellationLink: `${appUrl}/book/cancel/${booking.id}`,
    rescheduleLink: `${appUrl}/book/reschedule/${booking.id}`,
  }
}

// ============================================
// REMINDER CRON HELPER
// ============================================

export async function sendPendingReminders(): Promise<{ sent24h: number; sent1h: number }> {
  const settings = await getBookingSettings()
  let sent24h = 0
  let sent1h = 0

  if (settings.reminder24hEnabled) {
    // Get bookings 23-25 hours from now that haven't had 24h reminder
    const in24h = await sql`
      SELECT b.*, s.name as service_name, s.slug as service_slug, s.duration_minutes as service_duration
      FROM bookings b
      LEFT JOIN booking_services s ON b.service_id = s.id
      WHERE b.scheduled_at BETWEEN NOW() + INTERVAL '23 hours' AND NOW() + INTERVAL '25 hours'
        AND b.status IN ('scheduled', 'confirmed')
        AND b.reminder_24h_sent_at IS NULL
    `

    for (const row of in24h) {
      const booking = mapRowToBooking(row)
      const service = await getBookingServiceById(booking.serviceId || '')
      if (service) {
        const emailData = await buildEmailData(booking, service)
        const sent = await sendBookingEmail('reminder_24h', emailData)
        if (sent) {
          await sql`UPDATE bookings SET reminder_24h_sent_at = NOW() WHERE id = ${booking.id}::uuid`
          sent24h++
        }
      }
    }
  }

  if (settings.reminder1hEnabled) {
    // Get bookings 50-70 minutes from now that haven't had 1h reminder
    const in1h = await sql`
      SELECT b.*, s.name as service_name, s.slug as service_slug, s.duration_minutes as service_duration
      FROM bookings b
      LEFT JOIN booking_services s ON b.service_id = s.id
      WHERE b.scheduled_at BETWEEN NOW() + INTERVAL '50 minutes' AND NOW() + INTERVAL '70 minutes'
        AND b.status IN ('scheduled', 'confirmed')
        AND b.reminder_1h_sent_at IS NULL
    `

    for (const row of in1h) {
      const booking = mapRowToBooking(row)
      const service = await getBookingServiceById(booking.serviceId || '')
      if (service) {
        const emailData = await buildEmailData(booking, service)
        const sent = await sendBookingEmail('reminder_1h', emailData)
        if (sent) {
          await sql`UPDATE bookings SET reminder_1h_sent_at = NOW() WHERE id = ${booking.id}::uuid`
          sent1h++
        }
      }
    }
  }

  return { sent24h, sent1h }
}
