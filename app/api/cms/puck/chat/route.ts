import { anthropic } from "@ai-sdk/anthropic";
import {
  streamText,
  createUIMessageStream,
  JsonToSseTransformStream,
  type ModelMessage,
} from "ai";
import type { NextRequest } from "next/server";
import { puckTools } from "@/lib/cms/puck/ai/tools/definitions";
import { buildSystemPrompt } from "@/lib/cms/puck/ai/prompts/puck-assistant";
import type { PuckEditorContext } from "@/lib/cms/puck/ai/types";
import { nanoid } from "nanoid";

// Type for UI message parts
interface UIPart {
  type: string;
  text?: string;
  toolName?: string;
  toolCallId?: string;
  args?: Record<string, unknown>;
  result?: unknown;
}

interface UIMessageInput {
  role: string;
  content?: string;
  parts?: UIPart[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, pageData, editorContext } = body as {
      messages: UIMessageInput[];
      pageData: unknown;
      editorContext?: PuckEditorContext;
    };

    // Build system prompt with current page context and editor context
    const systemMessage = buildSystemPrompt(pageData, editorContext);

    // Convert UI messages to ModelMessage format that streamText expects
    // This preserves tool calls and their results in the conversation
    const modelMessages: ModelMessage[] = [];

    for (const msg of (messages || []) as UIMessageInput[]) {
      if (msg.parts) {
        // Process UI message format with parts
        const textParts = msg.parts.filter(p => p.type === "text");
        const toolCallParts = msg.parts.filter(p => p.type === "tool-invocation" || p.type === "tool-call");
        const toolResultParts = msg.parts.filter(p => p.type === "tool-result");

        if (msg.role === "user") {
          // User messages: include text content
          const textContent = textParts.map(p => p.text || "").join("\n");
          if (textContent) {
            modelMessages.push({
              role: "user",
              content: textContent,
            });
          }
          // Include tool results if this user message has them
          if (toolResultParts.length > 0) {
            const toolResults = toolResultParts.map(p => ({
              type: "tool-result" as const,
              toolCallId: p.toolCallId || "",
              toolName: p.toolName || "",
              output: p.result,
            }));
            modelMessages.push({
              role: "tool",
              content: toolResults,
            } as ModelMessage);
          }
        } else if (msg.role === "assistant") {
          // Assistant messages: include both text and tool calls
          const content: (
            | { type: "text"; text: string }
            | { type: "tool-call"; toolCallId: string; toolName: string; args: Record<string, unknown> }
          )[] = [];

          for (const textPart of textParts) {
            if (textPart.text) {
              content.push({ type: "text", text: textPart.text });
            }
          }

          for (const toolPart of toolCallParts) {
            if (toolPart.toolCallId && toolPart.toolName) {
              content.push({
                type: "tool-call",
                toolCallId: toolPart.toolCallId,
                toolName: toolPart.toolName,
                args: toolPart.args || {},
              });
            }
          }

          if (content.length > 0) {
            modelMessages.push({
              role: "assistant",
              content: content,
            } as ModelMessage);
          }
        }
      } else if (msg.content) {
        // Simple message format
        modelMessages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    // Create UI message stream with proper AI SDK v6 pattern
    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        // Cast to support maxSteps (AI SDK v6 pattern)
        const result = (streamText as unknown as (...args: unknown[]) => ReturnType<typeof streamText>)({
          model: anthropic("claude-sonnet-4-20250514"),
          system: systemMessage,
          messages: modelMessages,
          tools: puckTools,
          maxSteps: 10,
          toolChoice: "auto",
        });

        // Merge the UI message stream with tool rendering
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );

        // Wait for stream to complete
        await result.consumeStream();
      },
      generateId: () => nanoid(),
      onError: (error) => {
        console.error("Puck AI stream error:", error);
        return error instanceof Error ? error.message : "Unknown streaming error";
      },
    });

    // Return as proper Response for Next.js route handler
    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Puck AI chat error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process AI request",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

export async function GET() {
  return new Response("Puck AI chat endpoint is ready (with tool support)", { status: 200 });
}
