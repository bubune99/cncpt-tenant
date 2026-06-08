import { NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { sql } from "@/lib/neon"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"
import { getLanguageModel, DEFAULT_CHAT_MODEL } from "@/lib/ai/core"

export const dynamic = "force-dynamic"

/**
 * AI-drafted support reply — REAL generation from the ticket's actual message
 * thread. Replaces the former "preview" card. The draft is a suggestion the
 * agent edits/sends; it is never auto-sent.
 *
 * Auth: the ticket owner or a super admin. The thread is re-read server-side
 * (not trusted from the client) before generation.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const user = await stackServerApp.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ticketId } = await params

  try {
    const ticketRows = await sql`
      SELECT user_id, title, status, category
      FROM support_tickets
      WHERE id = ${ticketId}
      LIMIT 1
    `
    if (ticketRows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }
    const ticket = ticketRows[0]

    const isAdmin = await isSuperAdmin(user.id)
    if (!isAdmin && ticket.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const messages = await sql`
      SELECT sender_type, content, created_at
      FROM support_messages
      WHERE ticket_id = ${ticketId}
      ORDER BY created_at ASC
      LIMIT 40
    `

    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages to reply to" }, { status: 400 })
    }

    const transcript = messages
      .map((m: any) => `${m.sender_type === "support" ? "Support" : "Customer"}: ${m.content}`)
      .join("\n")

    const prompt = [
      `You are a helpful, professional customer-support agent.`,
      `Ticket: "${ticket.title}"${ticket.category ? ` (category: ${ticket.category})` : ""}.`,
      ``,
      `Conversation so far:`,
      transcript,
      ``,
      `Draft the next reply FROM Support to the customer. Be concise, warm, and specific to their issue. Do not invent facts, order numbers, or policies you don't have. If you need more information, ask for it clearly. Output only the reply text — no preamble, no signature placeholder.`,
    ].join("\n")

    const { text } = await generateText({
      model: getLanguageModel(DEFAULT_CHAT_MODEL),
      prompt,
      maxOutputTokens: 400,
      temperature: 0.5,
    })

    return NextResponse.json({ draft: text.trim() })
  } catch (error) {
    console.error("[support/suggest-reply] Error:", error)
    return NextResponse.json(
      { error: "Failed to generate a reply suggestion" },
      { status: 500 }
    )
  }
}
