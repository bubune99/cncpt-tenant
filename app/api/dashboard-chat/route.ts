/**
 * Dashboard Chat API Route
 *
 * Handles chat messages for the dashboard AI assistant.
 * Uses createUIMessageStream for proper AI SDK v6 chat compatibility.
 * Integrates with AI credits system for usage tracking.
 */

import {
  streamText,
  smoothStream,
  createUIMessageStream,
  JsonToSseTransformStream,
} from "ai"
import { z } from "zod"
import { nanoid } from "nanoid"
import { stackServerApp } from "@/stack"
import { getLanguageModel, DEFAULT_CHAT_MODEL } from "@/lib/ai/core"
import { createDashboardTools } from "@/lib/ai/tools/dashboard"
import { buildDashboardSystemPrompt } from "@/lib/ai/prompts/dashboard-system-prompt"
import { checkCredits, useCredits } from "@/lib/ai-credits"
import type { DashboardChatContext } from "@/lib/ai/core/types"

export const maxDuration = 60
export const dynamic = "force-dynamic"

// Message part schema for AI SDK v6
const messagePartSchema = z.union([
  z.object({ type: z.literal("text"), text: z.string() }),
  z.object({ type: z.literal("tool-invocation"), toolInvocation: z.any() }),
  z.object({ type: z.string(), text: z.string().optional() }).passthrough(),
])

// Request schema
const requestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      content: z.string().optional(),
      parts: z.array(messagePartSchema).optional(),
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

    // Select model and determine model tier for credit calculation
    const modelId = selectedChatModel || DEFAULT_CHAT_MODEL
    const model = getLanguageModel(modelId)

    // Determine model tier based on selected model
    let modelTierName = "pro" // Default tier
    if (modelId.includes("mini") || modelId.includes("haiku")) {
      modelTierName = "standard"
    } else if (modelId.includes("opus") || modelId.includes("turbo")) {
      modelTierName = "premium"
    }

    // Check if user has enough credits
    const creditCheck = await checkCredits({
      userId: user.id,
      subdomainId: context?.teamId,
      feature: "chat",
      modelTier: modelTierName,
    })

    if (!creditCheck.canUse) {
      return new Response(
        JSON.stringify({
          error: "Insufficient credits",
          creditCost: creditCheck.creditCost,
          totalBalance: creditCheck.totalBalance,
          deficit: creditCheck.deficit,
          message: `You need ${creditCheck.creditCost} credits for this request but only have ${creditCheck.totalBalance} available.`,
        }),
        {
          status: 402, // Payment Required
          headers: { "Content-Type": "application/json" },
        }
      )
    }

    // Build system prompt with context
    const systemPrompt = buildDashboardSystemPrompt(
      context as DashboardChatContext | undefined
    )

    // Convert messages to AI SDK format
    const aiMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant" | "system",
      content: getMessageContent(m),
    }))

    // Create tools with user context (userId captured in closure)
    const tools = createDashboardTools(user.id)

    // Track whether credits should be deducted
    let creditsDeducted = false
    const messageId = nanoid()

    // Create UI message stream for proper AI SDK v6 chat compatibility
    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model,
          system: systemPrompt,
          messages: aiMessages,
          tools,
          toolChoice: "auto",
          experimental_transform: smoothStream({ chunking: "word" }),
          onStepFinish: async ({ toolCalls }) => {
            if (toolCalls && toolCalls.length > 0) {
              console.log(
                `[dashboard-chat] Tools called: ${toolCalls.map((t) => t.toolName).join(", ")}`
              )
            }
          },
        })

        // Merge the UI message stream
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        )

        // Wait for stream to complete
        await result.consumeStream()

        // Deduct credits after successful completion
        if (!creditsDeducted) {
          creditsDeducted = true
          const creditResult = await useCredits({
            userId: user.id,
            subdomainId: context?.teamId,
            feature: "chat",
            modelTier: modelTierName,
            referenceId: messageId,
            description: `Chat message: ${getMessageContent(lastUserMessage).slice(0, 100)}`,
            metadata: {
              model: modelId,
              conversationLength: messages.length,
            },
          })

          if (!creditResult.success) {
            console.error("[dashboard-chat] Failed to deduct credits:", creditResult.error)
          } else {
            console.log(
              `[dashboard-chat] Credits used: ${creditResult.creditsUsed} (monthly: ${creditResult.monthlyUsed}, purchased: ${creditResult.purchasedUsed})`
            )
          }
        }
      },
      generateId: () => nanoid(),
      onError: (error) => {
        console.error("[dashboard-chat] Stream error:", error)
        return "An error occurred while processing your request. Please try again."
      },
    })

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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
 * GET endpoint for checking chat availability and credit balance
 */
export async function GET(request: Request) {
  const user = await stackServerApp.getUser()

  if (!user) {
    return new Response(JSON.stringify({ available: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  // Get team context from query params if provided
  const url = new URL(request.url)
  const teamId = url.searchParams.get("teamId") || undefined

  // Check credits for chat feature
  const creditCheck = await checkCredits({
    userId: user.id,
    subdomainId: teamId,
    feature: "chat",
    modelTier: "pro", // Default tier for estimation
  })

  return new Response(
    JSON.stringify({
      available: creditCheck.canUse,
      userId: user.id,
      credits: {
        canUse: creditCheck.canUse,
        cost: creditCheck.creditCost,
        monthly: creditCheck.monthlyBalance,
        purchased: creditCheck.purchasedBalance,
        teamPool: creditCheck.teamPoolBalance,
        total: creditCheck.totalBalance,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  )
}
