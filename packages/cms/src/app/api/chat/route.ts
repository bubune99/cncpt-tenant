/**
 * Admin Chat API Route
 *
 * Handles chat messages with streaming, tool execution, and context awareness.
 * Uses the configured AI provider from settings.
 */

import { streamText, smoothStream, generateText, stepCountIs, type ModelMessage } from 'ai';
import { z } from 'zod';
import { stackServerApp } from '../../../lib/stack';
import { prisma } from '../../../lib/db';
import { createModelFromSettings, isAiAvailable } from '../../../lib/ai';
import { ChatSDKError } from '../../../lib/ai/errors';
import { adminTools } from '../../../lib/ai/tools';
import { getMcpTools } from '../../../lib/mcp';
import type { ChatContext } from '../../../lib/ai/chat-store';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Rate limiting
const RATE_LIMIT_MESSAGES_PER_DAY = 200;

// Message part schema for AI SDK v6
const messagePartSchema = z.union([
  z.object({ type: z.literal('text'), text: z.string() }),
  z.object({ type: z.literal('tool-invocation'), toolInvocation: z.any() }),
  z.object({ type: z.string(), text: z.string().optional() }).passthrough(),
]);

// Request schema for AI SDK v6
const requestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      // AI SDK v6 uses parts instead of content
      parts: z.array(messagePartSchema).optional(),
      content: z.string().optional(), // Fallback for simpler format
    })
  ),
  context: z
    .object({
      type: z.enum(['general', 'product', 'order', 'page', 'user', 'blog']),
      id: z.string().optional(),
      title: z.string().optional(),
      data: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

// Helper to extract text from message parts
function extractTextFromParts(parts?: Array<{ type: string; text?: string }>): string {
  if (!parts) return '';
  return parts
    .filter((p) => p.type === 'text' && p.text)
    .map((p) => p.text)
    .join('');
}

// Helper to get content from message (v6 format or fallback)
function getMessageContent(message: { parts?: Array<{ type: string; text?: string }>; content?: string }): string {
  if (message.content) return message.content;
  return extractTextFromParts(message.parts);
}

// Build system prompt based on context
function buildSystemPrompt(context?: ChatContext, mcpToolCount?: number): string {
  let capabilities = `You have access to tools that allow you to:
- **Navigate**: Direct users to specific pages in the admin panel
- **Search**: Find products, orders, and content
- **Analytics**: Provide dashboard statistics and insights
- **Activity**: Show recent store activity`;

  if (mcpToolCount && mcpToolCount > 0) {
    capabilities += `
- **MCP Tools**: ${mcpToolCount} additional tools from connected MCP servers (prefixed with mcp_)`;
  }

  const basePrompt = `You are an intelligent AI assistant for the admin panel of a headless CMS with e-commerce capabilities. You help administrators manage their store, products, orders, content, and more.

## Your Capabilities

${capabilities}

## Guidelines

1. Be helpful, concise, and professional
2. When users ask about data, use the appropriate search or stats tools
3. If a user wants to go somewhere, use the navigation tool
4. Provide actionable insights and suggestions
5. When showing results, include links to relevant admin pages
6. If you don't have a tool for something, explain what the user can do manually
7. For MCP tools (prefixed with mcp_), use them when they provide relevant functionality

## Response Format

- Keep responses focused and scannable
- Use bullet points for lists
- Include relevant links when mentioning entities (products, orders, etc.)
- Suggest next actions when appropriate`;

  if (!context || context.type === 'general') {
    return basePrompt;
  }

  // Add context-specific information
  let contextPrompt = basePrompt + '\n\n## Current Context\n\n';

  switch (context.type) {
    case 'product':
      contextPrompt += `The user is currently viewing a **Product** page.
- Product ID: ${context.id || 'Unknown'}
- Product Name: ${context.title || 'Unknown'}
${context.data ? `- Additional data: ${JSON.stringify(context.data)}` : ''}

You can help with product-specific questions, suggest edits, or navigate to related pages.`;
      break;

    case 'order':
      contextPrompt += `The user is currently viewing an **Order** page.
- Order ID: ${context.id || 'Unknown'}
- Order Info: ${context.title || 'Unknown'}
${context.data ? `- Additional data: ${JSON.stringify(context.data)}` : ''}

You can help with order management, status updates, or customer inquiries.`;
      break;

    case 'page':
      contextPrompt += `The user is currently editing a **Page** in the CMS.
- Page ID: ${context.id || 'Unknown'}
- Page Title: ${context.title || 'Unknown'}
${context.data ? `- Additional data: ${JSON.stringify(context.data)}` : ''}

You can help with content suggestions, SEO, or page structure.`;
      break;

    case 'blog':
      contextPrompt += `The user is currently working on a **Blog Post**.
- Post ID: ${context.id || 'Unknown'}
- Post Title: ${context.title || 'Unknown'}
${context.data ? `- Additional data: ${JSON.stringify(context.data)}` : ''}

You can help with writing, SEO optimization, or content structure.`;
      break;

    case 'user':
      contextPrompt += `The user is viewing a **Customer/User** profile.
- User ID: ${context.id || 'Unknown'}
- User Info: ${context.title || 'Unknown'}
${context.data ? `- Additional data: ${JSON.stringify(context.data)}` : ''}

You can help with user management or order history lookups.`;
      break;
  }

  return contextPrompt;
}

// Generate a title from the first user message
async function generateChatTitle(
  userMessage: string,
  model: Awaited<ReturnType<typeof createModelFromSettings>>['model']
): Promise<string> {
  try {
    const { text } = await generateText({
      model,
      system: `Generate a very short (3-6 words) title summarizing this message. Do not use quotes or punctuation. Just output the title.`,
      prompt: userMessage.slice(0, 500),
    });
    return text.trim() || 'New Chat';
  } catch (error) {
    console.warn('[Chat] Failed to generate title:', error);
    return 'New Chat';
  }
}

export async function POST(request: Request) {
  try {
    // Parse request
    const json = await request.json();
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return ChatSDKError.badRequest('Invalid request format').toResponse();
    }

    const { messages, context } = parsed.data;
    // Use provided id or generate one
    const id = parsed.data.id || crypto.randomUUID();

    // Check if AI is available
    if (!(await isAiAvailable())) {
      return ChatSDKError.aiDisabled().toResponse();
    }

    // Get current user from Stack Auth
    const user = await stackServerApp.getUser();

    if (!user) {
      return ChatSDKError.unauthorized().toResponse();
    }

    // Find the user in our database
    const dbUser = await prisma.user.findFirst({
      where: { stackAuthId: user.id },
    });

    if (!dbUser) {
      return ChatSDKError.unauthorized('User not found in database').toResponse();
    }

    // Rate limiting
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const messageCount = await prisma.aiMessage.count({
      where: {
        conversation: { userId: dbUser.id },
        createdAt: { gte: oneDayAgo },
      },
    });

    if (messageCount >= RATE_LIMIT_MESSAGES_PER_DAY) {
      return ChatSDKError.rateLimit().toResponse();
    }

    // Get or create conversation
    let conversation = await prisma.aiConversation.findUnique({
      where: { id },
    });

    const isNewConversation = !conversation;
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

    if (!conversation) {
      conversation = await prisma.aiConversation.create({
        data: {
          id,
          userId: dbUser.id,
          title: 'New Chat',
          contextType: context?.type || 'general',
          contextId: context?.id,
        },
      });
    }

    // Save user message
    if (lastUserMessage) {
      const userContent = getMessageContent(lastUserMessage);
      await prisma.aiMessage.create({
        data: {
          conversationId: id,
          role: 'user',
          content: userContent,
        },
      });
    }

    // Get AI model from settings
    const { model, settings } = await createModelFromSettings();

    // Convert messages to ModelMessage format for AI SDK v6
    const modelMessages: ModelMessage[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: getMessageContent(m),
    }));

    // Get MCP tools and merge with admin tools
    let allTools = { ...adminTools };
    let mcpToolCount = 0;
    try {
      const mcpTools = await getMcpTools();
      mcpToolCount = Object.keys(mcpTools).length;
      allTools = { ...adminTools, ...mcpTools };
      console.log(`[Chat] Loaded ${mcpToolCount} MCP tools`);
    } catch (mcpError) {
      console.warn('[Chat] Failed to load MCP tools:', mcpError);
      // Continue with just admin tools
    }

    // Build system prompt with context and MCP tool count
    const systemPrompt = buildSystemPrompt(context, mcpToolCount);

    // Stream the response
    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools: allTools,
      stopWhen: stepCountIs(5),
      temperature: settings.temperature,
      maxOutputTokens: settings.maxTokens,
      experimental_transform: smoothStream({ chunking: 'word' }),
      onFinish: async (event) => {
        // Save assistant message
        if (event.text) {
          await prisma.aiMessage.create({
            data: {
              conversationId: id,
              role: 'assistant',
              content: event.text,
              toolCalls: event.toolCalls ? JSON.parse(JSON.stringify(event.toolCalls)) : undefined,
              toolResults: event.toolResults ? JSON.parse(JSON.stringify(event.toolResults)) : undefined,
              metadata: {
                usage: event.usage,
                finishReason: event.finishReason,
              },
            },
          });
        }

        // Generate title for new conversations
        if (isNewConversation && lastUserMessage) {
          const userContent = getMessageContent(lastUserMessage);
          const title = await generateChatTitle(userContent, model);
          await prisma.aiConversation.update({
            where: { id },
            data: { title },
          });
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[Chat API] Error:', error);

    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }

    return ChatSDKError.internal().toResponse();
  }
}

// Get conversation history
export async function GET(request: Request) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return ChatSDKError.unauthorized().toResponse();
    }

    const dbUser = await prisma.user.findFirst({
      where: { stackAuthId: user.id },
    });

    if (!dbUser) {
      return ChatSDKError.unauthorized().toResponse();
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (conversationId) {
      // Get specific conversation with messages
      const conversation = await prisma.aiConversation.findFirst({
        where: { id: conversationId, userId: dbUser.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!conversation) {
        return ChatSDKError.notFound().toResponse();
      }

      return Response.json(conversation);
    }

    // Get conversation list
    const conversations = await prisma.aiConversation.findMany({
      where: { userId: dbUser.id, status: 'ACTIVE' },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        contextType: true,
        updatedAt: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true },
        },
      },
    });

    return Response.json({
      conversations: conversations.map((c) => ({
        id: c.id,
        title: c.title,
        contextType: c.contextType,
        updatedAt: c.updatedAt,
        lastMessage: c.messages[0]?.content?.slice(0, 100) || '',
      })),
    });
  } catch (error) {
    console.error('[Chat API] GET Error:', error);
    return ChatSDKError.internal().toResponse();
  }
}

// Delete conversation
export async function DELETE(request: Request) {
  try {
    const user = await stackServerApp.getUser();

    if (!user) {
      return ChatSDKError.unauthorized().toResponse();
    }

    const dbUser = await prisma.user.findFirst({
      where: { stackAuthId: user.id },
    });

    if (!dbUser) {
      return ChatSDKError.unauthorized().toResponse();
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return ChatSDKError.badRequest('Missing conversation ID').toResponse();
    }

    // Verify ownership
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: conversationId, userId: dbUser.id },
    });

    if (!conversation) {
      return ChatSDKError.notFound().toResponse();
    }

    // Delete conversation (cascade deletes messages)
    await prisma.aiConversation.delete({
      where: { id: conversationId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('[Chat API] DELETE Error:', error);
    return ChatSDKError.internal().toResponse();
  }
}
