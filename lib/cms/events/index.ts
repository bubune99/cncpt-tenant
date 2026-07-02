/**
 * Events Library
 *
 * Core functions for event, ticket, speaker, schedule, and registration management
 */

import { prisma } from '../db'
import type { Prisma, EventStatus, EventType, RegistrationStatus } from '@prisma/client'

// ============ SLUG UTILITIES ============

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = slug
  let counter = 1

  while (true) {
    const existing = await prisma.event.findFirst({ where: { slug: uniqueSlug } })

    if (!existing || existing.id === excludeId) {
      return uniqueSlug
    }

    uniqueSlug = `${slug}-${counter}`
    counter++
  }
}

// ============ EVENTS ============

export interface CreateEventInput {
  title: string
  slug?: string
  description?: string
  shortDescription?: string
  eventType?: EventType
  status?: EventStatus
  startDate: string | Date
  endDate: string | Date
  timezone?: string
  venueName?: string
  venueAddress?: string
  venueCity?: string
  venueState?: string
  venueCountry?: string
  venueZip?: string
  latitude?: number
  longitude?: number
  virtualUrl?: string
  virtualPlatform?: string
  featuredImageUrl?: string
  coverImageUrl?: string
  maxAttendees?: number
  organizerName?: string
  organizerEmail?: string
  metaTitle?: string
  metaDescription?: string
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

export interface ListEventsOptions {
  status?: string
  eventType?: string
  search?: string
  startAfter?: string | Date
  startBefore?: string | Date
  limit?: number
  offset?: number
  orderBy?: 'startDate' | 'createdAt' | 'title'
  orderDir?: 'asc' | 'desc'
}

export async function createEvent(input: CreateEventInput) {
  const slug = input.slug || generateSlug(input.title)
  const uniqueSlug = await ensureUniqueSlug(slug)

  return prisma.event.create({
    data: {
      title: input.title,
      slug: uniqueSlug,
      description: input.description,
      shortDescription: input.shortDescription,
      eventType: input.eventType ?? 'IN_PERSON',
      status: input.status ?? 'DRAFT',
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      timezone: input.timezone ?? 'UTC',
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      venueCity: input.venueCity,
      venueState: input.venueState,
      venueCountry: input.venueCountry,
      venueZip: input.venueZip,
      latitude: input.latitude,
      longitude: input.longitude,
      virtualUrl: input.virtualUrl,
      virtualPlatform: input.virtualPlatform,
      featuredImageUrl: input.featuredImageUrl,
      coverImageUrl: input.coverImageUrl,
      maxAttendees: input.maxAttendees ?? 0,
      organizerName: input.organizerName,
      organizerEmail: input.organizerEmail,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    },
    include: {
      ticketTypes: true,
      speakers: { orderBy: { position: 'asc' } },
      scheduleItems: { orderBy: [{ day: 'asc' }, { startTime: 'asc' }] },
      _count: { select: { registrations: true } },
    },
  })
}

export async function getEvent(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: {
      ticketTypes: { orderBy: { position: 'asc' } },
      speakers: { orderBy: { position: 'asc' } },
      scheduleItems: {
        orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
        include: { speaker: { select: { id: true, name: true } } },
      },
      _count: { select: { registrations: true } },
    },
  })
}

export async function getEventBySlug(slug: string) {
  return prisma.event.findFirst({
    where: { slug },
    include: {
      ticketTypes: { where: { isActive: true }, orderBy: { position: 'asc' } },
      speakers: { orderBy: { position: 'asc' } },
      scheduleItems: {
        orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
        include: { speaker: { select: { id: true, name: true } } },
      },
      _count: { select: { registrations: true } },
    },
  })
}

export async function listEvents(options: ListEventsOptions = {}) {
  const {
    status,
    eventType,
    search,
    startAfter,
    startBefore,
    limit = 20,
    offset = 0,
    orderBy = 'startDate',
    orderDir = 'desc',
  } = options

  const where: Prisma.EventWhereInput = {}

  if (status) {
    where.status = status as EventStatus
  }
  if (eventType) {
    where.eventType = eventType as EventType
  }
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }
  if (startAfter) {
    where.startDate = { ...where.startDate as object, gte: new Date(startAfter) }
  }
  if (startBefore) {
    where.startDate = { ...where.startDate as object, lte: new Date(startBefore) }
  }

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { [orderBy]: orderDir },
      include: {
        ticketTypes: {
          select: { id: true, name: true, price: true, sold: true, quantity: true },
        },
        _count: { select: { registrations: true } },
      },
    }),
    prisma.event.count({ where }),
  ])

  return { events, total, limit, offset }
}

export async function updateEvent(id: string, input: UpdateEventInput) {
  const existing = await prisma.event.findUnique({ where: { id } })
  if (!existing) {
    throw new Error('Event not found')
  }

  let slug = existing.slug
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, id)
  }

  return prisma.event.update({
    where: { id },
    data: {
      title: input.title,
      slug,
      description: input.description,
      shortDescription: input.shortDescription,
      eventType: input.eventType,
      status: input.status,
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      timezone: input.timezone,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      venueCity: input.venueCity,
      venueState: input.venueState,
      venueCountry: input.venueCountry,
      venueZip: input.venueZip,
      latitude: input.latitude,
      longitude: input.longitude,
      virtualUrl: input.virtualUrl,
      virtualPlatform: input.virtualPlatform,
      featuredImageUrl: input.featuredImageUrl,
      coverImageUrl: input.coverImageUrl,
      maxAttendees: input.maxAttendees,
      organizerName: input.organizerName,
      organizerEmail: input.organizerEmail,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
    },
    include: {
      ticketTypes: true,
      speakers: { orderBy: { position: 'asc' } },
      scheduleItems: { orderBy: [{ day: 'asc' }, { startTime: 'asc' }] },
      _count: { select: { registrations: true } },
    },
  })
}

export async function deleteEvent(id: string) {
  return prisma.event.delete({ where: { id } })
}

// ============ TICKET TYPES ============

export interface CreateTicketTypeInput {
  name: string
  description?: string
  price?: number
  currency?: string
  quantity?: number
  maxPerOrder?: number
  salesStart?: string | Date
  salesEnd?: string | Date
  isActive?: boolean
  position?: number
  stripeProductId?: string
  stripePriceId?: string
}

export interface UpdateTicketTypeInput extends Partial<CreateTicketTypeInput> {}

export async function listTicketTypes(eventId: string) {
  return prisma.eventTicketType.findMany({
    where: { eventId },
    orderBy: { position: 'asc' },
  })
}

export async function createTicketType(eventId: string, input: CreateTicketTypeInput) {
  return prisma.eventTicketType.create({
    data: {
      eventId,
      name: input.name,
      description: input.description,
      price: input.price ?? 0,
      currency: input.currency ?? 'usd',
      quantity: input.quantity,
      maxPerOrder: input.maxPerOrder ?? 10,
      salesStart: input.salesStart ? new Date(input.salesStart) : undefined,
      salesEnd: input.salesEnd ? new Date(input.salesEnd) : undefined,
      isActive: input.isActive ?? true,
      position: input.position ?? 0,
      stripeProductId: input.stripeProductId,
      stripePriceId: input.stripePriceId,
    },
  })
}

export async function updateTicketType(id: string, input: UpdateTicketTypeInput) {
  return prisma.eventTicketType.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      price: input.price,
      currency: input.currency,
      quantity: input.quantity,
      maxPerOrder: input.maxPerOrder,
      salesStart: input.salesStart ? new Date(input.salesStart) : undefined,
      salesEnd: input.salesEnd ? new Date(input.salesEnd) : undefined,
      isActive: input.isActive,
      position: input.position,
      stripeProductId: input.stripeProductId,
      stripePriceId: input.stripePriceId,
    },
  })
}

export async function deleteTicketType(id: string) {
  return prisma.eventTicketType.delete({ where: { id } })
}

// ============ SPEAKERS ============

export interface CreateSpeakerInput {
  name: string
  title?: string
  bio?: string
  avatarUrl?: string
  company?: string
  website?: string
  twitter?: string
  linkedin?: string
  position?: number
}

export interface UpdateSpeakerInput extends Partial<CreateSpeakerInput> {}

export async function listSpeakers(eventId: string) {
  return prisma.eventSpeaker.findMany({
    where: { eventId },
    orderBy: { position: 'asc' },
  })
}

export async function createSpeaker(eventId: string, input: CreateSpeakerInput) {
  return prisma.eventSpeaker.create({
    data: {
      eventId,
      name: input.name,
      title: input.title,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      company: input.company,
      website: input.website,
      twitter: input.twitter,
      linkedin: input.linkedin,
      position: input.position ?? 0,
    },
  })
}

export async function updateSpeaker(id: string, input: UpdateSpeakerInput) {
  return prisma.eventSpeaker.update({
    where: { id },
    data: {
      name: input.name,
      title: input.title,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
      company: input.company,
      website: input.website,
      twitter: input.twitter,
      linkedin: input.linkedin,
      position: input.position,
    },
  })
}

export async function deleteSpeaker(id: string) {
  return prisma.eventSpeaker.delete({ where: { id } })
}

// ============ SCHEDULE ITEMS ============

export interface CreateScheduleItemInput {
  title: string
  description?: string
  startTime: string | Date
  endTime: string | Date
  location?: string
  day?: number
  position?: number
  speakerId?: string
}

export interface UpdateScheduleItemInput extends Partial<CreateScheduleItemInput> {}

export async function listScheduleItems(eventId: string) {
  return prisma.eventScheduleItem.findMany({
    where: { eventId },
    orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    include: { speaker: { select: { id: true, name: true } } },
  })
}

export async function createScheduleItem(eventId: string, input: CreateScheduleItemInput) {
  return prisma.eventScheduleItem.create({
    data: {
      eventId,
      title: input.title,
      description: input.description,
      startTime: new Date(input.startTime),
      endTime: new Date(input.endTime),
      location: input.location,
      day: input.day ?? 1,
      position: input.position ?? 0,
      speakerId: input.speakerId,
    },
    include: { speaker: { select: { id: true, name: true } } },
  })
}

export async function updateScheduleItem(id: string, input: UpdateScheduleItemInput) {
  return prisma.eventScheduleItem.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      startTime: input.startTime ? new Date(input.startTime) : undefined,
      endTime: input.endTime ? new Date(input.endTime) : undefined,
      location: input.location,
      day: input.day,
      position: input.position,
      speakerId: input.speakerId,
    },
    include: { speaker: { select: { id: true, name: true } } },
  })
}

export async function deleteScheduleItem(id: string) {
  return prisma.eventScheduleItem.delete({ where: { id } })
}

// ============ REGISTRATIONS ============

export interface CreateRegistrationInput {
  ticketTypeId?: string
  attendeeName: string
  attendeeEmail: string
  attendeePhone?: string
  amount?: number
  currency?: string
  stripePaymentId?: string
  stripeSessionId?: string
  status?: RegistrationStatus
  notes?: string
}

export interface UpdateRegistrationInput {
  status?: RegistrationStatus
  checkedIn?: boolean
  checkedInAt?: string | Date
  notes?: string
  stripePaymentId?: string
  stripeSessionId?: string
}

export interface ListRegistrationsOptions {
  status?: string
  search?: string
  limit?: number
  offset?: number
}

export async function listRegistrations(eventId: string, options: ListRegistrationsOptions = {}) {
  const { status, search, limit = 50, offset = 0 } = options

  const where: Prisma.EventRegistrationWhereInput = { eventId }

  if (status) {
    where.status = status as RegistrationStatus
  }
  if (search) {
    where.OR = [
      { attendeeName: { contains: search, mode: 'insensitive' } },
      { attendeeEmail: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [registrations, total] = await Promise.all([
    prisma.eventRegistration.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        ticketType: { select: { id: true, name: true, price: true } },
      },
    }),
    prisma.eventRegistration.count({ where }),
  ])

  return { registrations, total, limit, offset }
}

export async function createRegistration(eventId: string, input: CreateRegistrationInput) {
  const registration = await prisma.$transaction(async (tx) => {
    // Increment registration count on event
    await tx.event.update({
      where: { id: eventId },
      data: { registrationCount: { increment: 1 } },
    })

    // Increment sold count on ticket type if provided
    if (input.ticketTypeId) {
      await tx.eventTicketType.update({
        where: { id: input.ticketTypeId },
        data: { sold: { increment: 1 } },
      })
    }

    return tx.eventRegistration.create({
      data: {
        eventId,
        ticketTypeId: input.ticketTypeId,
        status: input.status ?? 'PENDING',
        attendeeName: input.attendeeName,
        attendeeEmail: input.attendeeEmail,
        attendeePhone: input.attendeePhone,
        amount: input.amount ?? 0,
        currency: input.currency ?? 'usd',
        stripePaymentId: input.stripePaymentId,
        stripeSessionId: input.stripeSessionId,
        notes: input.notes,
      },
      include: {
        ticketType: { select: { id: true, name: true, price: true } },
      },
    })
  })

  return registration
}

export async function updateRegistration(id: string, input: UpdateRegistrationInput) {
  return prisma.eventRegistration.update({
    where: { id },
    data: {
      status: input.status,
      checkedIn: input.checkedIn,
      checkedInAt: input.checkedInAt ? new Date(input.checkedInAt) : input.checkedIn ? new Date() : undefined,
      notes: input.notes,
      stripePaymentId: input.stripePaymentId,
      stripeSessionId: input.stripeSessionId,
    },
    include: {
      ticketType: { select: { id: true, name: true, price: true } },
    },
  })
}

export async function cancelRegistration(id: string) {
  const registration = await prisma.eventRegistration.findUnique({
    where: { id },
    select: { eventId: true, ticketTypeId: true, status: true },
  })

  if (!registration) {
    throw new Error('Registration not found')
  }

  if (registration.status === 'CANCELLED' || registration.status === 'REFUNDED') {
    throw new Error('Registration is already cancelled')
  }

  return prisma.$transaction(async (tx) => {
    // Decrement registration count on event
    await tx.event.update({
      where: { id: registration.eventId },
      data: { registrationCount: { decrement: 1 } },
    })

    // Decrement sold count on ticket type if provided
    if (registration.ticketTypeId) {
      await tx.eventTicketType.update({
        where: { id: registration.ticketTypeId },
        data: { sold: { decrement: 1 } },
      })
    }

    return tx.eventRegistration.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        ticketType: { select: { id: true, name: true, price: true } },
      },
    })
  })
}
