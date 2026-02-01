/**
 * Support Ticket API Routes
 * CRUD operations for support tickets (in-house CRM)
 */

import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"
import { logPlatformActivity } from "@/lib/super-admin"

export const dynamic = "force-dynamic"

/**
 * GET /api/dashboard/support
 * List support tickets - for users (their own) or admins (all)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50", 10)
    const offset = parseInt(searchParams.get("offset") || "0", 10)
    const isAdmin = searchParams.get("admin") === "true"

    // Check if user is a super admin for admin view
    let isSuperAdmin = false
    if (isAdmin) {
      const adminCheck = await sql`
        SELECT is_super_admin FROM users WHERE id = ${user.id}
      `
      isSuperAdmin = adminCheck[0]?.is_super_admin === true
    }

    // Build query based on role
    let tickets
    if (isSuperAdmin) {
      // Admin sees all tickets
      if (status && status !== "all") {
        tickets = await sql`
          SELECT
            t.*,
            u.name as customer_name,
            u.email as customer_email,
            (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) as message_count
          FROM support_tickets t
          LEFT JOIN users u ON t.user_id = u.id
          WHERE t.status = ${status}
          ORDER BY
            CASE t.priority
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'normal' THEN 3
              ELSE 4
            END,
            t.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        tickets = await sql`
          SELECT
            t.*,
            u.name as customer_name,
            u.email as customer_email,
            (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) as message_count
          FROM support_tickets t
          LEFT JOIN users u ON t.user_id = u.id
          ORDER BY
            CASE t.priority
              WHEN 'critical' THEN 1
              WHEN 'high' THEN 2
              WHEN 'normal' THEN 3
              ELSE 4
            END,
            t.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
    } else {
      // Regular user sees only their tickets
      if (status && status !== "all") {
        tickets = await sql`
          SELECT
            t.*,
            (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) as message_count
          FROM support_tickets t
          WHERE t.user_id = ${user.id} AND t.status = ${status}
          ORDER BY t.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      } else {
        tickets = await sql`
          SELECT
            t.*,
            (SELECT COUNT(*) FROM support_messages WHERE ticket_id = t.id) as message_count
          FROM support_tickets t
          WHERE t.user_id = ${user.id}
          ORDER BY t.updated_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      }
    }

    // Get stats
    const statsQuery = isSuperAdmin
      ? await sql`
          SELECT
            COUNT(*) FILTER (WHERE status = 'open') as open_count,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
            COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
            COUNT(*) as total_count
          FROM support_tickets
        `
      : await sql`
          SELECT
            COUNT(*) FILTER (WHERE status = 'open') as open_count,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
            COUNT(*) FILTER (WHERE status = 'closed') as closed_count,
            COUNT(*) as total_count
          FROM support_tickets
          WHERE user_id = ${user.id}
        `

    const stats = statsQuery[0]

    return NextResponse.json({
      tickets: tickets.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        category: t.category,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
        userId: t.user_id,
        customerName: t.customer_name || "Unknown",
        customerEmail: t.customer_email || "",
        assignedTo: t.assigned_to,
        messageCount: parseInt(t.message_count as string, 10),
      })),
      stats: {
        open: parseInt(stats.open_count as string, 10),
        inProgress: parseInt(stats.in_progress_count as string, 10),
        resolved: parseInt(stats.resolved_count as string, 10),
        closed: parseInt(stats.closed_count as string, 10),
        total: parseInt(stats.total_count as string, 10),
      },
    })
  } catch (error) {
    console.error("[support-api] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
  }
}

/**
 * POST /api/dashboard/support
 * Create a new support ticket
 */
export async function POST(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, category, priority } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    if (!description?.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 })
    }

    // Create ticket
    const result = await sql`
      INSERT INTO support_tickets (
        user_id,
        title,
        description,
        category,
        priority,
        status
      )
      VALUES (
        ${user.id},
        ${title.trim()},
        ${description.trim()},
        ${category || "General"},
        ${priority || "normal"},
        'open'
      )
      RETURNING *
    `

    const ticket = result[0]

    // Create initial message from the description
    await sql`
      INSERT INTO support_messages (
        ticket_id,
        sender_id,
        sender_type,
        content
      )
      VALUES (
        ${ticket.id},
        ${user.id},
        'customer',
        ${description.trim()}
      )
    `

    // Log activity
    await logPlatformActivity(
      "support.ticket.create",
      { ticketId: ticket.id, title, category, priority },
      {
        actorId: user.id,
        actorEmail: user.primaryEmail || undefined,
        targetType: "support_ticket",
        targetId: ticket.id as string,
      }
    )

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
      },
    })
  } catch (error) {
    console.error("[support-api] POST error:", error)
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
  }
}

/**
 * PATCH /api/dashboard/support
 * Update a support ticket (status, priority, assignment)
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await stackServerApp.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { ticketId, status, priority, assignedTo } = body

    if (!ticketId) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 })
    }

    // Check access - user can update their own tickets, admins can update any
    const adminCheck = await sql`
      SELECT is_super_admin FROM users WHERE id = ${user.id}
    `
    const isSuperAdmin = adminCheck[0]?.is_super_admin === true

    const ticketCheck = await sql`
      SELECT user_id FROM support_tickets WHERE id = ${ticketId}
    `

    if (ticketCheck.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    if (!isSuperAdmin && ticketCheck[0].user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Build update query
    const updates: string[] = []
    const values: unknown[] = []

    if (status) {
      updates.push("status")
      values.push(status)
    }
    if (priority) {
      updates.push("priority")
      values.push(priority)
    }
    if (assignedTo !== undefined) {
      updates.push("assigned_to")
      values.push(assignedTo)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 })
    }

    // Update ticket
    const result = await sql`
      UPDATE support_tickets
      SET
        status = COALESCE(${status || null}, status),
        priority = COALESCE(${priority || null}, priority),
        assigned_to = COALESCE(${assignedTo || null}, assigned_to),
        updated_at = NOW()
      WHERE id = ${ticketId}
      RETURNING *
    `

    const ticket = result[0]

    // Log activity
    await logPlatformActivity(
      "support.ticket.update",
      { ticketId, status, priority, assignedTo },
      {
        actorId: user.id,
        actorEmail: user.primaryEmail || undefined,
        targetType: "support_ticket",
        targetId: ticketId,
      }
    )

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        assignedTo: ticket.assigned_to,
        updatedAt: ticket.updated_at,
      },
    })
  } catch (error) {
    console.error("[support-api] PATCH error:", error)
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 })
  }
}
