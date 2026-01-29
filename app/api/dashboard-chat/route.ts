/**
 * Dashboard Chat API Route
 *
 * Handles chat messages for the dashboard AI assistant.
 * Uses streaming with tool execution for real-time responses.
 */

import { streamText, smoothStream } from "ai"
import { z } from "zod"
import { stackServerApp } from "@/stack"
import { getLanguageModel, DEFAULT_CHAT_MODEL } from "@/lib/ai/core"
import { dashboardTools } from "@/lib/ai/tools/dashboard"
import { buildDashboardSystemPrompt } from "@/lib/ai/prompts/dashboard-system-prompt"
import type { DashboardChatContext } from "@/lib/ai/core/types"

export const maxDuration = 60
export const dynamic = "force-dynamic"

// Rate limiting
const RATE_LIMIT_MESSAGES_PER_DAY = 100

// Request schema
const requestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().optional(),
      parts: z
        .array(
          z.object({
            type: z.string(),
            text: z.string().optional(),
          })
        )
        .optional(),
    })
  ),
  selectedChatModel: z.string().optional(),
  context: z
    .object({
      type: z.string(),
      subdomain: z.string().optional(),
      teamId: z.string().optional(),
      teamRole: z.enum(["owner", "admin", "member", "viewer"]).optional(),
      currentPage: z.string().optional(),
      section: z.string().optional(),
    })
    .optional(),
})

// Helper to extract text from message
function getMessageContent(message: {
  content?: string
  parts?: Array<{ type: string; text?: string }>
}): string {
  if (message.content) return message.content
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === "text" && p.text)
      .map((p) => p.text)
      .join("")
  }
  return ""
}

export async function POST(request: Request) {
  try {
    // Authenticate user
    const user = await stackServerApp.getUser()

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Parse and validate request
    const body = await request.json()
    const parseResult = requestSchema.safeParse(body)

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: parseResult.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    const { messages, selectedChatModel, context } = parseResult.data

    // Get the last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user")
    if (!lastUserMessage) {
      return new Response(JSON.stringify({ error: "No user message found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Build system prompt with context
    const systemPrompt = buildDashboardSystemPrompt(
      context as DashboardChatContext | undefined
    )

    // Select model
    const modelId = selectedChatModel || DEFAULT_CHAT_MODEL
    const model = getLanguageModel(modelId)

    // Convert messages to AI SDK format
    const aiMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: getMessageContent(m),
    }))

    // Create tools with user context injected
    const toolsWithContext = Object.fromEntries(
      Object.entries(dashboardTools).map(([name, toolDef]) => [
        name,
        {
          ...toolDef,
          execute: async (args: unknown) => {
            // Inject userId into the execution context
            return (toolDef as { execute: (args: unknown, context: { userId: string }) => Promise<unknown> }).execute(args, { userId: user.id })
          },
        },
      ])
    )

    // Stream the response with tools
    const result = streamText({
      model,
      system: systemPrompt,
      messages: aiMessages,
      tools: toolsWithContext,
      maxSteps: 5, // Allow multi-step tool usage
      experimental_transform: smoothStream(),
      experimental_toolCallStreaming: true,
      async onStepFinish({ toolCalls }) {
        // Log tool usage for debugging
        if (toolCalls && toolCalls.length > 0) {
          console.log(
            `[dashboard-chat] Tools called: ${toolCalls.map((t) => t.toolName).join(", ")}`
          )
        }
      },
    })

    // Return the stream with proper headers
    return result.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error("[dashboard-chat] Stream error:", error)
        if (error instanceof Error) {
          return error.message
        }
        return "An error occurred while processing your request"
      },
    })
  } catch (error) {
    console.error("[dashboard-chat] Error:", error)

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}

/**
 * GET endpoint for checking chat availability
 */
export async function GET() {
  const user = await stackServerApp.getUser()

  if (!user) {
    return new Response(JSON.stringify({ available: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  return new Response(
    JSON.stringify({
      available: true,
      userId: user.id,
      rateLimit: RATE_LIMIT_MESSAGES_PER_DAY,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  )
}
