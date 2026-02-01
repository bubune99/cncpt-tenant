/**
 * Support Ticket Messages API
 * Get and post messages for a specific ticket
 */

import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"
import { logPlatformActivity } from "@/lib/super-admin"

export const dynamic = "force-dynamic"

/**
 * GET /api/dashboard/support/[ticketId]/messages
 * Get all messages for a ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params

    // Check access
    const adminCheck = await sql`
      SELECT is_super_admin FROM users WHERE id = ${user.id}
    `
    const isSuperAdmin = adminCheck[0]?.is_super_admin === true

    const ticketCheck = await sql`
      SELECT user_id, title, status, priority, category, created_at
      FROM support_tickets
      WHERE id = ${ticketId}
    `

    if (ticketCheck.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = ticketCheck[0]

    if (!isSuperAdmin && ticket.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Get messages with sender info
    const messages = await sql`
      SELECT
        m.*,
        CASE
          WHEN m.sender_type = 'customer' THEN u.name
          WHEN m.sender_type = 'support' THEN COALESCE(s.name, 'Support Team')
          ELSE 'System'
        END as sender_name
      FROM support_messages m
      LEFT JOIN users u ON m.sender_type = 'customer' AND m.sender_id = u.id
      LEFT JOIN users s ON m.sender_type = 'support' AND m.sender_id = s.id
      WHERE m.ticket_id = ${ticketId}
      ORDER BY m.created_at ASC
    `

    // Get customer info
    const customerInfo = await sql`
      SELECT name, email
      FROM users
      WHERE id = ${ticket.user_id}
    `

    return NextResponse.json({
      ticket: {
        id: ticketId,
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.created_at,
        customerId: ticket.user_id,
        customerName: customerInfo[0]?.name || "Unknown",
        customerEmail: customerInfo[0]?.email || "",
      },
      messages: messages.map((m) => ({
        id: m.id,
        content: m.content,
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderType: m.sender_type,
        createdAt: m.created_at,
      })),
    })
  } catch (error) {
    console.error("[support-messages-api] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

/**
 * POST /api/dashboard/support/[ticketId]/messages
 * Send a new message to a ticket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params
    const body = await request.json()
    const { content } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 })
    }

    // Check access and determine sender type
    const adminCheck = await sql`
      SELECT is_super_admin FROM users WHERE id = ${user.id}
    `
    const isSuperAdmin = adminCheck[0]?.is_super_admin === true

    const ticketCheck = await sql`
      SELECT user_id, status FROM support_tickets WHERE id = ${ticketId}
    `

    if (ticketCheck.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = ticketCheck[0]
    const isOwner = ticket.user_id === user.id

    if (!isSuperAdmin && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Determine sender type
    const senderType = isOwner ? "customer" : "support"

    // Create message
    const result = await sql`
      INSERT INTO support_messages (
        ticket_id,
        sender_id,
        sender_type,
        content
      )
      VALUES (
        ${ticketId},
        ${user.id},
        ${senderType},
        ${content.trim()}
      )
      RETURNING *
    `

    const message = result[0]

    // Update ticket timestamp and status if needed
    const newStatus =
      ticket.status === "open" && senderType === "support"
        ? "in_progress"
        : ticket.status === "resolved" && senderType === "customer"
          ? "open"
          : null

    if (newStatus) {
      await sql`
        UPDATE support_tickets
        SET status = ${newStatus}, updated_at = NOW()
        WHERE id = ${ticketId}
      `
    } else {
      await sql`
        UPDATE support_tickets
        SET updated_at = NOW()
        WHERE id = ${ticketId}
      `
    }

    // Log activity
    await logPlatformActivity(
      "support.message.send",
      { ticketId, senderType, messageId: message.id },
      {
        actorId: user.id,
        actorEmail: user.primaryEmail || undefined,
        targetType: "support_ticket",
        targetId: ticketId,
      }
    )

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        content: message.content,
        senderId: message.sender_id,
        senderType: message.sender_type,
        createdAt: message.created_at,
      },
      ticketStatus: newStatus || ticket.status,
    })
  } catch (error) {
    console.error("[support-messages-api] POST error:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
