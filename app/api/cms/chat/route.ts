/**
 * Admin Chat API Route
 *
 * Handles chat messages with streaming, tool execution, and context awareness.
 * Uses the configured AI provider from settings.
 * Uses createUIMessageStream for proper AI SDK v6 chat compatibility.
 */

import {
  streamText,
  smoothStream,
  generateText,
  createUIMessageStream,
  JsonToSseTransformStream,
  type ModelMessage,
  type LanguageModel,
} from 'ai';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { stackServerApp } from '../../../lib/stack';
import { prisma } from '../../../lib/db';
import { isAiAvailable } from '../../../lib/ai';
import { getAiSettings } from '../../../lib/settings';
import { myProvider } from '../../../lib/ai/providers';
import { ChatSDKError } from '../../../lib/ai/errors';
import { adminTools, walkthroughTools, helpManagementTools, entityTools } from '../../../lib/ai/tools';
import { getMcpTools } from '../../../lib/mcp';
import { getAllVmcpTools } from '../../../lib/vmcp';
import type { ChatContext } from '../../../lib/ai/chat-store';
import { nanoid } from 'nanoid';
import type { EntityContext } from '../../../lib/socket/types';

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

// Entity context schema (matches EntityContext from socket types)
// Using passthrough to allow extra fields and handle type coercion
const entityContextSchema = z.object({
  route: z.string().optional(),
  section: z.string().optional(),
  entityType: z.string().nullable().optional(),
  entityId: z.string().nullable().optional(),
  parentContext: z.object({
    entityType: z.string(),
    entityId: z.string(),
  }).optional(),
  selectedIds: z.array(z.string()).optional(),
  filters: z.record(z.string(), z.unknown()).optional(),
  searchQuery: z.string().optional(),
  modalOpen: z.string().optional(),
  tabActive: z.string().optional(),
  timestamp: z.number().optional(),
  sessionId: z.string().optional(),
}).passthrough();

// Help click context (for help mode integration)
const helpClickSchema = z.object({
  helpKey: z.string(),
  context: entityContextSchema.optional(),
});

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
  selectedChatModel: z.string().optional(), // Model selected in chat UI
  // Legacy context format (for backwards compatibility)
  context: z
    .object({
      type: z.enum(['general', 'product', 'order', 'page', 'user', 'blog']),
      id: z.string().optional(),
      title: z.string().optional(),
      data: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  // New entity context format (from EntityContextProvider)
  entityContext: entityContextSchema.optional(),
  // Last help click (from help mode)
  lastHelpClick: helpClickSchema.optional(),
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
function buildSystemPrompt(
  context?: ChatContext,
  vmcpToolCount?: number,
  mcpToolCount?: number,
  entityContext?: Partial<EntityContext>,
  lastHelpClick?: { helpKey: string }
): string {
  let capabilities = `You have access to tools that allow you to:
- **Navigate**: Direct users to specific pages in the admin panel
- **Search**: Find products, orders, and content
- **Analytics**: Provide dashboard statistics and insights
- **Activity**: Show recent store activity
- **Entity Tools**: Fetch details about what the user is viewing
  - Use \`getEntityDetails\` to fetch detailed info about a product, order, customer, etc.
  - Use \`searchEntities\` to find entities by name or title
  - Use \`getEntityStats\` to get aggregate statistics
- **Walkthroughs**: Create and start guided tours to teach users the admin interface
  - Use \`suggestWalkthroughs\` when users ask "how do I..." or need help learning
  - Use \`generateWalkthrough\` to create custom step-by-step tours
  - Use \`startWalkthrough\` to launch an existing tour
  - Use \`explainElement\` to explain what UI elements do
- **Help Management**: Manage help content lifecycle and coverage
  - Use \`listHelpKeys\` to discover available help keys
  - Use \`getHelpContent\` to read existing help content before editing
  - Use \`updateHelpContent\` to create or update help for a specific element
  - Use \`scanForMissingHelp\` to audit which UI elements lack documentation
  - Use \`batchGenerateHelp\` to create help for multiple elements at once
  - Use \`generateEntityHelp\` to create context-specific help for individual records`;

  if (vmcpToolCount && vmcpToolCount > 0) {
    capabilities += `
- **VMCP Tools**: ${vmcpToolCount} dynamic tools you can create, edit, and manage
  - Use \`vmcp_create_tool\` to create new tools for tasks you need to perform
  - Use \`vmcp_list_tools\` to see available dynamic tools
  - Use \`vmcp_iterate_tool\` to improve existing tools
  - Dynamic tools have access to the database (products, orders, customers, pages, blog posts)`;
  }

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
6. **If you don't have a tool for something, CREATE ONE using vmcp_create_tool**
7. For dynamic tools, test them first with vmcp_test_tool before using in production
8. Iterate on tools using vmcp_iterate_tool if they don't work as expected
9. **ALWAYS complete multi-step workflows** - don't stop after the first tool call

## Multi-Step Tool Execution (CRITICAL)

You MUST use multiple tools in sequence to complete tasks. NEVER stop after a single tool call when the task requires multiple steps.

**Key behaviors:**
- After each tool call, check if more steps are needed to complete the user's request
- Always report your progress after completing each step
- If a user's request implies multiple steps (list → read → update), execute ALL steps
- Provide a summary at the end showing what was accomplished

### Help Content Workflows

**Pattern A - Discovery and Update:**
When users ask to "demonstrate", "show how to", or "update help content":
\`\`\`
Step 1: listHelpKeys({ category: "..." }) → Get available keys
Step 2: getHelpContent({ elementKey: "..." }) → Read current content
Step 3: updateHelpContent({ elementKey, title, summary, details }) → Update it
Step 4: Report all actions taken
\`\`\`

**Pattern B - Direct Creation:**
When users say "create help for X" with specific content:
\`\`\`
Step 1: updateHelpContent({ elementKey, title, summary, details }) → Create/update
Step 2: Confirm the contentId and success
\`\`\`

**Pattern C - Coverage Audit:**
When users ask about "help coverage" or "missing help":
\`\`\`
Step 1: listHelpKeys({ category, missingOnly: true }) → Find gaps
Step 2: batchGenerateHelp({ entries: [...] }) → Fill gaps (max 20 at a time)
Step 3: Report coverage improvement
\`\`\`

### Entity Workflows

**Pattern A - Stats Overview:**
\`\`\`
Step 1: getEntityStats({ entityType }) → Get aggregate stats
Step 2: Report insights from the data
\`\`\`

**Pattern B - Search and Detail:**
\`\`\`
Step 1: searchEntities({ entityType, query }) → Find matching records
Step 2: getEntityDetails({ entityType, entityId }) → Get full details for one
Step 3: Provide analysis or recommendations
\`\`\`

**Pattern C - Context-Aware (when user is viewing something):**
\`\`\`
Step 1: getEntityDetails({ entityType, entityId }) → Fetch what they're viewing
Step 2: Answer their question using the data
Step 3: Suggest relevant actions
\`\`\`

## Dynamic Tool Creation

When you need functionality that doesn't exist, create a new tool:
1. Design the input schema with clear parameter descriptions
2. Write a handler that uses context.db for database access
3. Test the tool with sample input
4. Use the tool to complete the user's request

Example handler structure:
\`\`\`javascript
// Access input parameters
const { param1, param2 } = input;

// Use context.db for database operations
const data = await context.db.products.findMany({ where: { status: 'ACTIVE' } });

// Use context.utils for formatting
const formatted = context.utils.formatCurrency(data[0].basePrice);

// Return structured result
return { success: true, data, formatted };
\`\`\`

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

  // Add entity context if available (new format from EntityContextProvider)
  if (entityContext) {
    contextPrompt += '\n\n## Real-time Entity Context\n\n';
    contextPrompt += `The user is currently at: **${entityContext.route || '/admin'}**\n`;
    contextPrompt += `Section: **${entityContext.section || 'dashboard'}**\n`;

    if (entityContext.entityType && entityContext.entityId) {
      contextPrompt += `\n**Currently viewing**: ${entityContext.entityType} (ID: ${entityContext.entityId})\n`;
      contextPrompt += `Use \`getEntityDetails\` to fetch more information about this ${entityContext.entityType} if needed.\n`;
    }

    if (entityContext.parentContext) {
      contextPrompt += `Parent context: ${entityContext.parentContext.entityType} (ID: ${entityContext.parentContext.entityId})\n`;
    }

    if (entityContext.selectedIds && entityContext.selectedIds.length > 0) {
      contextPrompt += `\nUser has **${entityContext.selectedIds.length} item(s) selected** in the current view.\n`;
    }

    if (entityContext.searchQuery) {
      contextPrompt += `Current search query: "${entityContext.searchQuery}"\n`;
    }

    if (entityContext.filters && Object.keys(entityContext.filters).length > 0) {
      contextPrompt += `Active filters: ${JSON.stringify(entityContext.filters)}\n`;
    }
  }

  // Add help click context if user came from help mode
  if (lastHelpClick) {
    contextPrompt += '\n\n## Recent Help Request\n\n';
    contextPrompt += `The user recently clicked help on: **${lastHelpClick.helpKey}**\n`;
    contextPrompt += `Consider this when answering - they may be asking about this specific UI element.\n`;
    contextPrompt += `You can use \`getHelpContent\` to see existing help for this element, or \`updateHelpContent\` to improve it.\n`;
  }

  return contextPrompt;
}

// Generate a title from the first user message
async function generateChatTitle(
  userMessage: string,
  model: LanguageModel
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

// Compaction settings
const COMPACTION_THRESHOLD = 20; // Number of messages before compaction
const KEEP_RECENT_MESSAGES = 6; // Keep last N messages uncompacted

/**
 * Compact conversation history by summarizing older messages
 * This prevents context from growing too large while preserving key information
 */
async function compactConversation(
  messages: ModelMessage[],
  model: LanguageModel
): Promise<ModelMessage[]> {
  // Don't compact if below threshold
  if (messages.length <= COMPACTION_THRESHOLD) {
    return messages;
  }

  // Separate older messages from recent ones
  const recentMessages = messages.slice(-KEEP_RECENT_MESSAGES);
  const olderMessages = messages.slice(0, -KEEP_RECENT_MESSAGES);

  // If we already have a summary at the start, update it
  const existingSummary = olderMessages[0]?.role === 'system' &&
    olderMessages[0]?.content?.startsWith('[Conversation Summary]')
    ? olderMessages[0]
    : null;

  const messagesToSummarize = existingSummary
    ? olderMessages.slice(1)
    : olderMessages;

  // Only summarize if there are enough older messages
  if (messagesToSummarize.length < 5) {
    return messages;
  }

  try {
    // Generate a summary of older messages
    const conversationText = messagesToSummarize
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    const { text: summary } = await generateText({
      model,
      system: `You are summarizing a conversation for context preservation.
Create a concise summary of the key topics, decisions, and important information.
Focus on: what was discussed, any decisions made, important data or IDs mentioned, and the overall progress.
Keep it under 500 words. Be factual and preserve specific details like IDs, names, and numbers.`,
      prompt: existingSummary
        ? `Previous summary:\n${existingSummary.content}\n\nNew messages to incorporate:\n${conversationText}`
        : `Summarize this conversation:\n${conversationText}`,
    });

    // Create the compacted message array
    const summaryMessage: ModelMessage = {
      role: 'system',
      content: `[Conversation Summary]\n${summary}\n\n[The above summarizes ${messagesToSummarize.length} earlier messages. Recent messages follow.]`,
    };

    console.log(`[Chat] Compacted ${messagesToSummarize.length} messages into summary`);

    return [summaryMessage, ...recentMessages];
  } catch (error) {
    console.warn('[Chat] Failed to compact conversation:', error);
    // Return original messages if compaction fails
    return messages;
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

    const { messages, context, selectedChatModel, entityContext, lastHelpClick } = parsed.data;
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

    // Get AI settings
    const settings = await getAiSettings();

    // Use the model selected in the chat UI, or fall back to first enabled model
    const modelId = selectedChatModel || settings.enabledModels?.[0] || 'anthropic/claude-sonnet-4.5';
    console.log('[Chat] Using model:', modelId);
    const model = myProvider.languageModel(modelId);

    // Convert messages to ModelMessage format for AI SDK v6
    let modelMessages: ModelMessage[] = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: getMessageContent(m),
    }));

    // Apply conversation compaction if needed
    modelMessages = await compactConversation(modelMessages, model);

    // Get all tools: admin + walkthrough + help management + entity + VMCP + MCP
    let allTools = { ...adminTools, ...walkthroughTools, ...helpManagementTools, ...entityTools };
    let vmcpToolCount = 0;
    let mcpToolCount = 0;

    // Load VMCP tools (database-driven dynamic tools)
    try {
      const vmcpTools = await getAllVmcpTools();
      vmcpToolCount = Object.keys(vmcpTools).length;
      allTools = { ...allTools, ...vmcpTools };
      console.log(`[Chat] Loaded ${vmcpToolCount} VMCP tools`);
    } catch (vmcpError) {
      console.warn('[Chat] Failed to load VMCP tools:', vmcpError);
    }

    // Load MCP tools (external MCP servers)
    try {
      const mcpTools = await getMcpTools();
      mcpToolCount = Object.keys(mcpTools).length;
      allTools = { ...allTools, ...mcpTools };
      console.log(`[Chat] Loaded ${mcpToolCount} MCP tools`);
    } catch (mcpError) {
      console.warn('[Chat] Failed to load MCP tools:', mcpError);
    }

    // Build system prompt with context, tool counts, and entity context
    // Cast entityContext to the expected type (the schema validation ensures it's valid)
    const systemPrompt = buildSystemPrompt(
      context,
      vmcpToolCount,
      mcpToolCount,
      entityContext as Partial<EntityContext> | undefined,
      lastHelpClick
    );

    // Promise to track onFinish completion
    let onFinishResolve: () => void;
    const onFinishPromise = new Promise<void>((resolve) => {
      onFinishResolve = resolve;
    });

    // Create UI message stream for proper ChatSDK compatibility
    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        // Cast to any for maxSteps support (AI SDK v6 pattern)
        const result = (streamText as unknown as (...args: unknown[]) => ReturnType<typeof streamText>)({
          model,
          system: systemPrompt,
          messages: modelMessages,
          tools: allTools,
          maxSteps: 10, // Allow multi-step tool execution
          toolChoice: 'auto',
          temperature: settings.temperature,
          maxOutputTokens: settings.maxTokens,
          experimental_transform: smoothStream({ chunking: 'word' }),
          onStepFinish: async ({ toolCalls, toolResults }: { toolCalls?: unknown[]; toolResults?: unknown[] }) => {
            // Log each step for debugging multi-step execution
            console.log('[Chat] Step finished:', {
              toolCallCount: toolCalls?.length || 0,
              toolResultCount: toolResults?.length || 0,
            });
          },
          onFinish: async (event: {
            text?: string;
            toolCalls?: unknown;
            toolResults?: unknown;
            usage?: unknown;
            finishReason?: string;
          }) => {
            try {
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
                    } as Prisma.InputJsonValue,
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
            } finally {
              onFinishResolve();
            }
          },
        });

        // Merge the UI message stream with proper tool rendering
        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );

        // Wait for stream to complete
        await result.consumeStream();
        await onFinishPromise;
      },
      generateId: () => nanoid(),
      onError: (error) => {
        console.error('[Chat] Stream error:', error);
        return 'An error occurred while processing your request. Please try again.';
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        'X-Conversation-Id': id,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
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
