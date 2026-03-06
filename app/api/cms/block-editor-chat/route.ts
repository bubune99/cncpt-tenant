/**
 * Block Editor Chat API Route — "Kofi" AI Page Builder Tutor
 *
 * Kofi helps users create, modify, and understand web pages using HTML
 * elements and Tailwind CSS classes. Beyond building, Kofi teaches design
 * decisions, highlights blocks on the canvas, and guides walkthroughs.
 *
 * Tools:
 *  - setPageBlocks, addBlock, updateBlock, removeBlock, moveBlock (building)
 *  - spotlightBlock, explainDesign, suggestImprovement, showDesignError (teaching)
 */

import {
  streamText,
  smoothStream,
  createUIMessageStream,
  JsonToSseTransformStream,
  stepCountIs,
  tool,
  type ModelMessage,
} from 'ai';
import { z } from 'zod';
import { getLanguageModel } from '@/lib/cms/ai/providers';
import { DEFAULT_CHAT_MODEL } from '@/lib/cms/ai/models';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';
import { getAiSettings } from '@/lib/cms/settings';
import { ChatSDKError } from '@/lib/cms/ai/errors';
import { checkCredits, useCredits } from '@/lib/ai-credits';
import { isSuperAdmin } from '@/lib/super-admin';
import { NextRequest } from 'next/server';
import { withTenant } from '@/lib/cms/api/tenant';
import {
  extractImportNames,
  formatDepsForPrompt,
  formatImportNamesForPrompt,
  type SourceDeps,
} from '@/lib/cms/block-editor/dependency-context';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ */
/*  Block manipulation tools (building)                                */
/* ------------------------------------------------------------------ */

const buildingTools = {
  setPageBlocks: tool({
    description: 'Replace the entire page content with new blocks. Use this to build a full page from scratch or completely rebuild it.',
    inputSchema: z.object({
      blocks: z.array(z.any()).describe('Array of blocks that make up the page. Each block has: tag (HTML element), className (Tailwind classes), textContent (inner text), attrs (HTML attributes), children (nested blocks), animation (optional), label (optional).'),
    }),
    execute: async ({ blocks }: { blocks: unknown[] }) => {
      return { blocks };
    },
  }),

  addBlock: tool({
    description: 'Add a single new block to the page. You can specify a parent block ID to nest it, and an index for position.',
    inputSchema: z.object({
      block: z.any().describe('The block to add. Must have: tag (string), className (string). Optional: textContent, attrs, children, animation, label, id.'),
      parentId: z.string().nullable().optional().describe('ID of the parent block to nest into (null for root level)'),
      index: z.number().optional().describe('Position index within the parent (appends to end if omitted)'),
    }),
    execute: async ({ block, parentId, index }: { block: unknown; parentId?: string | null; index?: number }) => {
      return { block, parentId: parentId ?? null, index };
    },
  }),

  updateBlock: tool({
    description: 'Update properties of an existing block by its ID. Only include the properties you want to change.',
    inputSchema: z.object({
      blockId: z.string().describe('ID of the block to update'),
      className: z.string().optional().describe('New Tailwind class string'),
      textContent: z.string().optional().describe('New text content'),
      tag: z.string().optional().describe('New HTML tag'),
      attrs: z.record(z.string(), z.string()).optional().describe('New HTML attributes'),
      animation: z.any().optional().describe('Animation config: { type, trigger, duration, delay }'),
    }),
    execute: async (params: Record<string, unknown>) => {
      return params;
    },
  }),

  removeBlock: tool({
    description: 'Remove a block from the page by its ID.',
    inputSchema: z.object({
      blockId: z.string().describe('ID of the block to remove'),
    }),
    execute: async ({ blockId }: { blockId: string }) => {
      return { blockId };
    },
  }),

  moveBlock: tool({
    description: 'Move a block to a new position. Can move between parents or reorder within the same parent.',
    inputSchema: z.object({
      blockId: z.string().describe('ID of the block to move'),
      targetParentId: z.string().nullable().describe('ID of the target parent (null for root level)'),
      targetIndex: z.number().describe('Position index within the target parent'),
    }),
    execute: async ({ blockId, targetParentId, targetIndex }: { blockId: string; targetParentId: string | null; targetIndex: number }) => {
      return { blockId, targetParentId, targetIndex };
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  Teaching tools (Kofi-specific)                                     */
/* ------------------------------------------------------------------ */

const teachingTools = {
  spotlightBlock: tool({
    description:
      'Highlight a block on the canvas with a colored ring and annotation tooltip. Use this EVERY TIME you reference a specific block — it visually points the user to what you\'re talking about. Multiple spotlights per message create a navigable walkthrough.',
    inputSchema: z.object({
      blockId: z.string().describe('ID of the block to highlight on the canvas'),
      annotation: z.string().describe('Short annotation text shown near the block (1-2 sentences max)'),
      color: z
        .enum(['purple', 'teal', 'blue', 'orange', 'green'])
        .optional()
        .describe('Highlight ring color. Auto-assigned if omitted. Use different colors to distinguish multiple spotlights.'),
    }),
    execute: async ({ blockId, annotation, color }: { blockId: string; annotation: string; color?: string }) => {
      return { blockId, annotation, color };
    },
  }),

  explainDesign: tool({
    description:
      'Create a multi-step guided explanation of the page structure or a section. Each step spotlights a block and provides a detailed explanation. Use this when the user asks "walk me through this" or "explain the structure".',
    inputSchema: z.object({
      title: z.string().describe('Title for the explanation walkthrough'),
      steps: z.array(
        z.object({
          blockId: z.string().describe('Block ID to spotlight in this step'),
          annotation: z.string().describe('Short label for this step'),
          detail: z.string().describe('Detailed explanation of what this block does and why it\'s structured this way'),
        })
      ).describe('Ordered steps — each step spotlights a block and explains its role'),
    }),
    execute: async ({ title, steps }: { title: string; steps: Array<{ blockId: string; annotation: string; detail: string }> }) => {
      return { title, steps };
    },
  }),

  suggestImprovement: tool({
    description:
      'Suggest a specific improvement to a block, showing the issue and a proposed fix. The user can choose to apply the fix or dismiss it. Use this for design, UX, or code quality suggestions.',
    inputSchema: z.object({
      blockId: z.string().describe('ID of the block to improve'),
      issue: z.string().describe('What\'s currently wrong or could be better'),
      suggestion: z.string().describe('What to change and why'),
      fix: z
        .record(z.string(), z.any())
        .optional()
        .describe('Partial block updates to apply if user accepts. Keys: className, textContent, tag, attrs'),
    }),
    execute: async (params: { blockId: string; issue: string; suggestion: string; fix?: Record<string, unknown> }) => {
      return params;
    },
  }),

  showDesignError: tool({
    description:
      'Flag an accessibility, responsive, UX, performance, or SEO issue on a specific block. Shows as a warning card. Use this when reviewing page quality or when the user asks about accessibility/best practices.',
    inputSchema: z.object({
      blockId: z.string().describe('ID of the block with the issue'),
      severity: z.enum(['warning', 'error']).describe('"error" for critical issues, "warning" for improvements'),
      category: z
        .enum(['accessibility', 'responsive', 'ux', 'performance', 'seo'])
        .describe('Category of the design issue'),
      message: z.string().describe('Clear description of the issue'),
      suggestion: z.string().optional().describe('How to fix the issue'),
    }),
    execute: async (params: { blockId: string; severity: string; category: string; message: string; suggestion?: string }) => {
      return params;
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  All tools combined                                                  */
/* ------------------------------------------------------------------ */

const kofiTools = { ...buildingTools, ...teachingTools };

/* ------------------------------------------------------------------ */
/*  Kofi system prompt                                                  */
/* ------------------------------------------------------------------ */

function buildKofiPrompt(pageState: unknown[], selectedBlockId?: string | null, hasSourceCode?: boolean): string {
  const blockCount = Array.isArray(pageState) ? pageState.length : 0;

  return `You are **Kofi** — an AI page builder tutor. You help users create, understand, and improve web pages using HTML elements and Tailwind CSS classes.

## Core Principles
1. **Ground every answer in actual blocks.** Reference blocks by their IDs from the page state. Never invent block IDs.
2. **Explain WHY, not just WHAT.** The blocks show what exists. Your job is the design decision, the trade-off, the architectural intent.
3. **Use tools to show, not just tell.** Call \`spotlightBlock\` to point at blocks on the canvas. Use \`explainDesign\` for walkthroughs. Use \`suggestImprovement\` and \`showDesignError\` for reviews.
4. **One concept at a time.** Don't overload. Build understanding in layers.
5. **Spotlight liberally.** EVERY TIME you reference a specific block, call \`spotlightBlock\` to highlight it on the canvas. Multiple spotlights per message create a navigable sequence.

## Block Reference Rules
1. **ALWAYS use spotlightBlock** when referring to a block that exists on the page. Every time you mention a section, heading, button, or component — spotlight it.
2. **Use inline backticks** only for short identifiers: \`block-id\`, \`className\`, \`tag\`. These are fine in prose.
3. **Multiple spotlights per answer.** If your explanation touches 3 parts of the page, make 3 spotlightBlock calls. This creates a navigable joyride the user can step through.
4. **Spotlight BEFORE explaining.** Call spotlightBlock first, then provide your prose explanation.

## Block System
Each block is an HTML element with:
- \`tag\` — the HTML element (div, section, h1, p, button, img, nav, etc.)
- \`className\` — Tailwind CSS classes for styling
- \`textContent\` — inner text for leaf elements
- \`attrs\` — HTML attributes (href, src, alt, etc.)
- \`children\` — nested child blocks
- \`animation\` — optional framer-motion animation
- \`label\` — optional human-readable label for the editor outline

## Current Page State
The page currently has ${blockCount} top-level block${blockCount !== 1 ? 's' : ''}.
${blockCount > 0 ? 'The current blocks are provided in the conversation context.' : 'The page is empty — help the user get started!'}
${selectedBlockId ? `The user has selected block \`${selectedBlockId}\`. Prioritize questions about this block.` : ''}

## Design Quality Guidelines
- Create modern, professional designs with good visual hierarchy
- Use a consistent color scheme (prefer dark themes with slate-900/950 backgrounds unless asked otherwise)
- Ensure responsive design: use \`md:\` and \`lg:\` breakpoints
- Add hover states on interactive elements
- Use proper spacing, \`text-balance\` for headings, \`leading-relaxed\` for body text

## Block Structure Guidelines
- Use semantic HTML tags: section for page sections, nav for navigation, footer for footers
- Nest blocks properly: section → div (container) → content blocks
- Container elements should have \`children\`, leaf elements should have \`textContent\`
- Always generate unique descriptive IDs ("hero-section", "nav-logo", "cta-button")

## Tool Usage
- **Building**: "build me a page" → \`setPageBlocks\`; "add a section" → \`addBlock\`; "change the color" → \`updateBlock\`; "remove the footer" → \`removeBlock\`; "move X above Y" → \`moveBlock\`
- **Teaching**: "explain this layout" → \`spotlightBlock\` + prose; "walk me through" → \`explainDesign\`; "how to improve" → \`suggestImprovement\`; "check accessibility" → \`showDesignError\`
- When building, always use tools to make changes — never just describe what to do
- When teaching, always spotlight the blocks you're discussing

## Personality
- Friendly and encouraging — celebrate good design choices
- Concise but thorough — explain design decisions without rambling
- Proactive — if you see a potential issue while building, mention it
- Use Markdown formatting for prose (bold, lists, headings)${hasSourceCode ? `

## Source Code Reference
This page was imported from a React project. The original source code is provided for context.
1. The source is READ-ONLY reference — never output source code modifications
2. Use it to understand the INTENT and structure the user wanted
3. Map React components to equivalent block structures
4. Preserve the visual hierarchy and layout patterns from the source
5. When the source uses Tailwind classes, carry them over to blocks directly
6. Translate JSX composition (nested components) into nested block trees
7. When component dependency information is provided, use it to translate imported components into concrete HTML blocks. For example, if the deps say Button renders as \`<button>\` with specific Tailwind classes, use those exact classes when building the block equivalent` : ''}`;
}

/* ------------------------------------------------------------------ */
/*  Request schema                                                     */
/* ------------------------------------------------------------------ */

const requestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system']),
      parts: z.array(z.any()).optional(),
      content: z.union([z.string(), z.array(z.any())]).optional(),
    })
  ),
  pageState: z.array(z.any()).optional(),
  selectedBlockId: z.string().nullable().optional(),
  sourceCode: z.string().nullable().optional(),
  sourceDeps: z.any().nullable().optional(),
});

/* ------------------------------------------------------------------ */
/*  POST handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  return withTenant(request, async () => {
  try {
    // --- Auth: require authenticated user ---
    const user = await stackServerApp.getUser();
    if (!user) {
      return ChatSDKError.unauthorized().toResponse();
    }

    const dbUser = await prisma.user.findFirst({
      where: { stackAuthId: user.id },
    });

    // Check CMS role first, then fall back to platform super admin
    let hasAccess = false;
    if (dbUser) {
      const role = (dbUser.role as string)?.toUpperCase();
      hasAccess = role === 'ADMIN' || role === 'EDITOR';
    }

    if (!hasAccess) {
      // Fallback: platform super admins always have access
      hasAccess = await isSuperAdmin(user.id);
    }

    if (!hasAccess) {
      return ChatSDKError.forbidden('Block editor AI requires editor or admin role').toResponse();
    }

    // --- Settings: check if block editor AI is enabled ---
    const aiSettings = await getAiSettings();
    if (!aiSettings.enabled) {
      return ChatSDKError.aiDisabled().toResponse();
    }
    if (!aiSettings.blockEditorChat.enabled) {
      return ChatSDKError.aiDisabled('Block editor AI chat is disabled').toResponse();
    }

    // --- Credit check (tenant-specific) ---
    const modelId = DEFAULT_CHAT_MODEL;
    let modelTierName = 'pro';
    if (modelId.includes('haiku')) modelTierName = 'standard';
    else if (modelId.includes('opus')) modelTierName = 'premium';

    const creditCheck = await checkCredits({
      userId: user.id,
      feature: 'block_editor_chat',
      modelTier: modelTierName,
    });

    if (!creditCheck.canUse) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          creditCost: creditCheck.creditCost,
          totalBalance: creditCheck.totalBalance,
          message: `You need ${creditCheck.creditCost} credits but only have ${creditCheck.totalBalance} available.`,
        }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // --- Rate limiting: per-user requests/hour ---
    const hourlyLimit = aiSettings.blockEditorChat.rateLimitPerHour;
    if (hourlyLimit > 0 && dbUser) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentCount = await prisma.aiMessage.count({
        where: {
          conversation: { userId: dbUser.id, contextType: 'block-editor' },
          role: 'user',
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recentCount >= hourlyLimit) {
        return ChatSDKError.rateLimit(
          `Block editor AI rate limit reached (${hourlyLimit} requests/hour).`
        ).toResponse();
      }
    }

    // --- Parse request ---
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, pageState, selectedBlockId, sourceCode, sourceDeps } = parsed.data;

    // Build model messages for AI SDK
    const modelMessages: ModelMessage[] = messages.map((m) => {
      let text = '';
      if (m.parts && Array.isArray(m.parts)) {
        text = m.parts
          .filter((p: { type: string }) => p.type === 'text')
          .map((p: { text: string }) => p.text)
          .join('');
      } else if (typeof m.content === 'string') {
        text = m.content;
      }
      return {
        role: m.role as 'user' | 'assistant' | 'system',
        content: text,
      };
    });

    // Inject page state context into the conversation
    if (pageState && Array.isArray(pageState) && pageState.length > 0) {
      const pageContext: ModelMessage = {
        role: 'system' as const,
        content: `Current page blocks (JSON):\n${JSON.stringify(pageState, null, 2)}`,
      };
      modelMessages.splice(Math.min(1, modelMessages.length), 0, pageContext);
    }

    // Inject component dependency context
    if (sourceDeps || sourceCode) {
      let depsContext: string | undefined
      if (sourceDeps) {
        depsContext = formatDepsForPrompt(sourceDeps as SourceDeps)
      } else if (sourceCode) {
        depsContext = formatImportNamesForPrompt(extractImportNames(sourceCode))
      }
      if (depsContext) {
        modelMessages.splice(Math.min(3, modelMessages.length), 0, {
          role: 'system' as const,
          content: depsContext,
        })
      }
    }

    const model = getLanguageModel(DEFAULT_CHAT_MODEL);
    const systemPrompt = buildKofiPrompt(pageState || [], selectedBlockId, !!(sourceCode || sourceDeps));

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          tools: kofiTools,
          toolChoice: 'auto',
          stopWhen: stepCountIs(8),
          maxOutputTokens: aiSettings.blockEditorChat.maxTokensPerRequest,
          experimental_transform: smoothStream({ chunking: 'word' }),
          onFinish: async (event: { usage?: { totalTokens?: number } }) => {
            // Deduct credits after successful completion
            try {
              await useCredits({
                userId: user.id,
                feature: 'block_editor_chat',
                modelTier: modelTierName,
                description: 'Block editor AI chat message',
                metadata: {
                  model: modelId,
                  tokens: event.usage?.totalTokens,
                },
              });
            } catch (e) {
              console.error('[Kofi] Failed to deduct credits:', e);
            }
          },
        });

        dataStream.merge(
          result.toUIMessageStream({
            sendReasoning: true,
          })
        );

        await result.consumeStream();
      },
      onError: (error) => {
        console.error('[Kofi] Stream error:', error);
        return 'An error occurred while processing your request. Please try again.';
      },
    });

    return new Response(stream.pipeThrough(new JsonToSseTransformStream()), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[Kofi] Error:', error);
    if (error instanceof ChatSDKError) {
      return error.toResponse();
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  })
}
