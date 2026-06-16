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
  convertToModelMessages,
  type ModelMessage,
} from 'ai';
import { z } from 'zod';
import { getLanguageModel } from '@/lib/cms/ai/providers';
import { DEFAULT_CHAT_MODEL } from '@/lib/cms/ai/models';
import { stackServerApp } from '@/lib/cms/stack';
import { prisma } from '@/lib/cms/db';
import { getAiSettings, getAgentSettings } from '@/lib/cms/settings';
import { resolveAgentPolicy, guardTools } from '@/lib/cms/ai/governance';
import { getUserPermissions } from '@/lib/cms/permissions';
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
import {
  searchMediaLibrary,
  generateAndUploadImage,
  importFromSource,
} from '@/lib/cms/block-editor/kofi-skills';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ */
/*  Block schema for AI tools (strict recursive Zod schemas)           */
/* ------------------------------------------------------------------ */

// Accept any tag — known HTML tags plus custom component tags (e.g., "MyButton")
const TagEnum = z.string().describe("HTML tag or custom component name");

const AnimationSchema = z.object({
  type: z.enum([
    "fadeIn","slideUp","slideDown","slideLeft","slideRight","scale",
    "tilt3d","mouseGlow","magnetic","spotlight","parallaxDepth",
    "floatIdle","morphBlob","marquee",
    "textReveal","countUp","textPath",
    "custom",
  ]).nullable().describe("Animation preset"),
  trigger: z.enum(["onMount","inView","hover"]).nullable().describe("When to animate (only for simple presets)"),
  duration: z.number().nullable().describe("Duration in seconds (only for simple presets)"),
  delay: z.number().nullable().describe("Delay in seconds (only for simple presets)"),
  custom: z.object({
    initial: z.record(z.string(), z.unknown()).optional(),
    animate: z.record(z.string(), z.unknown()).optional(),
    whileInView: z.record(z.string(), z.unknown()).optional(),
    whileHover: z.record(z.string(), z.unknown()).optional(),
    transition: z.record(z.string(), z.unknown()).optional(),
  }).nullable().optional().describe("Custom framer-motion properties (only with type='custom')"),
  interactiveConfig: z.record(z.string(), z.unknown()).nullable().optional()
    .describe("Config for interactive presets. tilt3d: {maxTilt, perspective, scale}. mouseGlow: {color, size, opacity}. magnetic: {strength, radius}. spotlight: {size, opacity}. parallaxDepth: {intensity}. floatIdle: {amplitude, rotation, speed}. morphBlob: {intensity, speed}. marquee: {speed, direction, pauseOnHover, gap}. textReveal: {by, staggerDelay}. countUp: {duration, prefix, suffix}. textPath: {path, letterSpacing}."),
}).nullable().describe("Framer-motion animation (optional)");

const BackgroundSchema = z.object({
  url: z.string(),
  size: z.enum(["cover","contain","auto"]).optional(),
  position: z.enum(["center","top","bottom","left","right"]).optional(),
  attachment: z.enum(["scroll","fixed"]).optional(),
  overlay: z.string().optional(),
}).nullable().optional().describe("Background image configuration");

/** CMS-specific fields shared across all block nesting levels */
const cmsBlockFields = {
  label: z.string().nullable().optional().describe("Human-readable label for the editor outline"),
  hidden: z.boolean().nullable().optional().describe("Hidden from canvas rendering"),
  locked: z.boolean().nullable().optional().describe("Locked from editing"),
  background: BackgroundSchema,
  componentName: z.string().nullable().optional().describe("Smart block component reference"),
  partialId: z.string().nullable().optional().describe("ID of the shared Partial this block references"),
  partialOverrides: z.record(z.string(), z.object({
    textContent: z.string().optional(),
    className: z.string().optional(),
    attrs: z.record(z.string(), z.string()).optional(),
  })).nullable().optional().describe("Per-block overrides for partial references"),
  commerce: z.object({
    type: z.enum(["product","collection","cart","customer","checkout","price"]),
    provider: z.enum(["generic","shopify","stripe","paypal","snipcart","medusa","saleor"]).optional(),
    handle: z.string().optional(),
    limit: z.number().optional(),
    sortKey: z.enum(["BEST_SELLING","CREATED_AT","PRICE","TITLE"]).optional(),
    reverse: z.boolean().optional(),
    stripePriceId: z.string().optional(),
    stripeMode: z.enum(["payment","subscription"]).optional(),
  }).nullable().optional().describe("Commerce binding (for e-commerce blocks)"),
} as const;

// Recursive block schema (unlimited depth via z.lazy)
const BlockSchema: z.ZodType<unknown> = z.object({
  id: z.string(),
  tag: TagEnum,
  className: z.string().describe("Tailwind CSS classes"),
  textContent: z.string().nullable().optional().describe("Inner text for leaf elements. Expression values like {product.title} are preserved with braces."),
  attrs: z.record(z.string(), z.string()).nullable().optional().describe("HTML attributes like src, href, alt, placeholder, type. Expression values are stored with braces: {expr}"),
  animation: AnimationSchema.optional(),
  children: z.lazy(() => z.array(BlockSchema)).nullable().optional().describe("Nested child blocks (unlimited depth)"),
  ...cmsBlockFields,
});

/* ------------------------------------------------------------------ */
/*  Block manipulation tools (building)                                */
/* ------------------------------------------------------------------ */

const buildingTools = {
  setPageBlocks: tool({
    description:
      'Replace the ENTIRE page with a new block tree. Use for building a full page or major restructure. ' +
      'Container elements (div, section, header, footer, nav, etc.) have `children` arrays. ' +
      'Leaf elements (h1-h6, p, span, a, button, img, hr, input, etc.) have `textContent`. ' +
      'Every block MUST have a unique human-readable id (e.g. "hero-section", "cta-button").',
    inputSchema: z.object({
      blocks: z.array(BlockSchema).describe('Complete block tree for the page'),
    }),
    execute: async ({ blocks }) => {
      return { blocks };
    },
  }),

  addBlock: tool({
    description:
      'Add a SINGLE block to the page. Use parentId to nest it inside a container. Use index for position (null = append to end).',
    inputSchema: z.object({
      block: BlockSchema.describe('The block to add'),
      parentId: z.string().nullable().optional().describe('Parent container id, or null for root level'),
      index: z.number().nullable().optional().describe('Position index, or null for end'),
    }),
    execute: async ({ block, parentId, index }) => {
      return { block, parentId: parentId ?? null, index: index ?? undefined };
    },
  }),

  updateBlock: tool({
    description:
      'Update properties of an EXISTING block. The blockId MUST be one of the IDs from the current page state. ' +
      'Only include fields you want to change. Use this to change classes, text, attributes, or even the tag.',
    inputSchema: z.object({
      blockId: z.string().describe('Exact block ID from the current page state'),
      className: z.string().nullable().optional().describe('New Tailwind classes (replaces all classes)'),
      textContent: z.string().nullable().optional().describe('New text content'),
      attrs: z.record(z.string(), z.string()).nullable().optional().describe('Attributes to set/update'),
      tag: TagEnum.nullable().optional().describe('Change the HTML tag'),
      animation: AnimationSchema.optional().describe('Animation config'),
      label: z.string().nullable().optional().describe('Update editor label'),
      background: BackgroundSchema.describe('Update background image'),
    }),
    execute: async (params) => {
      return params;
    },
  }),

  removeBlock: tool({
    description: 'Remove a block by its ID. If it is a container, all children are removed too.',
    inputSchema: z.object({
      blockId: z.string().describe('Block ID from current page state'),
    }),
    execute: async ({ blockId }) => {
      return { blockId };
    },
  }),

  moveBlock: tool({
    description: 'Move a block to a different parent or position.',
    inputSchema: z.object({
      blockId: z.string(),
      targetParentId: z.string().nullable(),
      targetIndex: z.number(),
    }),
    execute: async ({ blockId, targetParentId, targetIndex }) => {
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

  analyzeDesign: tool({
    description:
      'REQUIRED before building from a reference image or URL. Performs a structured decomposition of a design ' +
      'before generating any blocks. You MUST call this tool FIRST whenever the user provides a screenshot, ' +
      'reference image, or asks you to recreate/clone a design. Never skip this step — rushing to setPageBlocks ' +
      'without analysis produces poor results.',
    inputSchema: z.object({
      sections: z.array(z.object({
        name: z.string().describe('Section name (e.g. "Hero", "Features Grid", "Testimonials")'),
        layout: z.string().describe('Layout pattern: grid columns, flex direction, nesting depth'),
        spacing: z.string().describe('Spacing rhythm: padding, gaps, margins observed'),
        elements: z.array(z.string()).describe('Key elements in this section (heading, subtext, image, cards, buttons)'),
      })).describe('Each distinct section identified in the design'),
      colorPalette: z.object({
        background: z.string().describe('Primary background color/gradient'),
        foreground: z.string().describe('Primary text color'),
        accent: z.string().describe('Accent/CTA color or gradient'),
        secondary: z.string().describe('Secondary/muted text color'),
        surfaces: z.string().describe('Card/panel surface colors'),
      }).describe('Color system extracted from the design'),
      typography: z.object({
        headingScale: z.string().describe('Heading sizes observed (e.g. "6xl → 4xl → 2xl → xl")'),
        bodySize: z.string().describe('Body text size'),
        fontWeight: z.string().describe('Weight patterns (e.g. "bold headings, normal body, medium labels")'),
      }),
      effects: z.array(z.string()).describe('Visual effects observed: shadows, blurs, gradients, borders, glassmorphism, animations'),
      motionPresets: z.array(z.string()).optional().describe('Suggested interactive motion presets from our system (tilt3d, mouseGlow, floatIdle, etc.)'),
      buildOrder: z.array(z.string()).describe('Recommended order to build sections (top to bottom, outer to inner)'),
    }),
    execute: async (analysis) => {
      return { analysis, instruction: 'Analysis complete. Now build section by section following your buildOrder. Reference this analysis for every block you create.' };
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
/*  Agent tools (media library + image generation)                      */
/* ------------------------------------------------------------------ */

const agentTools = {
  searchMedia: tool({
    description:
      'Search the CMS media library for existing images and videos. Use this to find real images for hero sections, ' +
      'backgrounds, team photos, product images, etc. Returns URLs you can use in block attrs.src. ' +
      'ALWAYS prefer real images over placeholder URLs.',
    inputSchema: z.object({
      query: z.string().optional().describe('Search term (filename, title, alt text)'),
      type: z.enum(['image', 'video']).optional().default('image'),
      limit: z.number().optional().default(8).describe('Max results (default 8)'),
    }),
    execute: async (params) => {
      try {
        return await searchMediaLibrary(params)
      } catch (e) {
        return { media: [], error: e instanceof Error ? e.message : 'Media search failed' }
      }
    },
  }),

  generateImage: tool({
    description:
      'Generate a custom AI image, upload it to the media library, and place it on the page as an img block. ' +
      'This is an all-in-one tool: generates → saves to media → adds to page. ' +
      'Be VERY specific in prompts: subject, composition, lighting, mood, colors, style. ' +
      'Optionally wrap the image in a container with className for layout (e.g. hero section background).',
    inputSchema: z.object({
      prompt: z.string().describe('Detailed image description'),
      style: z.string().optional().describe('Style: photo, illustration, 3d-render, abstract, flat-design, watercolor, cinematic'),
      aspectRatio: z.string().optional().default('16:9').describe('Ratio: 16:9, 1:1, 4:3, 9:16'),
      blockId: z.string().describe('Unique id for the img block (e.g. "hero-image", "feature-photo")'),
      className: z.string().optional().default('w-full h-auto object-cover').describe('Tailwind classes for the img block'),
      alt: z.string().optional().describe('Alt text for the image (defaults to prompt)'),
      parentId: z.string().nullable().optional().describe('Parent container id to place the image inside, or null for root'),
      index: z.number().nullable().optional().describe('Position index within parent, or null for end'),
    }),
    execute: async (params) => {
      try {
        const result = await generateAndUploadImage(params)
        return {
          _action: 'addBlock' as const,
          block: {
            id: params.blockId,
            tag: 'img',
            className: params.className || 'w-full h-auto object-cover',
            attrs: {
              src: result.url,
              alt: params.alt || params.prompt.slice(0, 200),
              loading: 'lazy',
            },
          },
          parentId: params.parentId ?? null,
          index: params.index ?? null,
          url: result.url,
          mediaId: result.mediaId,
          prompt: params.prompt,
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Image generation failed'
        const stack = e instanceof Error ? e.stack : ''
        console.error('[Kofi] generateImage error:', msg, stack)
        return {
          _action: 'error' as const,
          url: '',
          mediaId: '',
          prompt: params.prompt,
          error: `IMAGE GENERATION FAILED: ${msg}. Tell the user this error so they can debug it.`,
        }
      }
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  Import & repair tools                                               */
/* ------------------------------------------------------------------ */

const importTools = {
  importAndAnalyze: tool({
    description:
      'Import external React code into CMS blocks and analyze what needs repair. ' +
      'Accepts THREE input modes (provide exactly one):\n' +
      '1. `githubUrl` — A GitHub URL to a repo, folder, or single file\n' +
      '2. `localPath` — A local filesystem path to a file or directory\n' +
      '3. `code` — Raw JSX/TSX source code pasted directly\n' +
      'Parses all .tsx/.jsx files found, merges into Block[] format, and returns a repair report.',
    inputSchema: z.object({
      githubUrl: z.string().nullable().optional(),
      localPath: z.string().nullable().optional(),
      code: z.string().nullable().optional(),
      autoPlace: z.boolean().optional().default(true),
    }),
    execute: async ({ githubUrl, localPath, code, autoPlace }) => {
      try {
        const analysis = await importFromSource({
          githubUrl: githubUrl || undefined,
          localPath: localPath || undefined,
          code: code || undefined,
        })

        if (analysis.blocks.length === 0) {
          return {
            success: false,
            error: 'No blocks could be extracted from the source.',
            source: analysis.source,
            parserErrors: analysis.errors,
            ...(analysis.fileResults ? { fileResults: analysis.fileResults } : {}),
          }
        }

        return {
          success: true,
          source: analysis.source,
          ...(autoPlace ? { _action: 'setPageBlocks' as const, blocks: analysis.blocks } : {}),
          analysis: {
            totalBlocks: analysis.totalBlocks,
            topLevelBlocks: analysis.blocks.length,
            errors: analysis.errors,
            repairItems: analysis.repairItems,
            summary: analysis.summary,
          },
          ...(analysis.fileResults ? {
            fileResults: analysis.fileResults.map(f => ({
              path: f.path,
              blocks: f.blocksExtracted,
              ok: f.success,
              errors: f.errors,
            })),
          } : {}),
          ...(!autoPlace ? { importedBlocks: analysis.blocks } : {}),
        }
      } catch (e) {
        return {
          success: false,
          error: e instanceof Error ? e.message : 'Import failed',
        }
      }
    },
  }),

  repairBlock: tool({
    description:
      'Apply a specific CMS repair to an imported block. Use this after importAndAnalyze to fix issues.',
    inputSchema: z.object({
      blockId: z.string().describe('ID of the block to repair'),
      action: z.enum(['remove', 'setCommerce', 'setPartial', 'setSmartBlock', 'replaceContent']),
      commerce: z.object({
        type: z.enum(["product", "collection", "cart", "customer", "checkout", "price"]),
        provider: z.enum(["generic", "shopify", "stripe", "paypal", "snipcart", "medusa", "saleor"]).optional(),
        handle: z.string().optional(),
        limit: z.number().optional(),
        sortKey: z.enum(["BEST_SELLING", "CREATED_AT", "PRICE", "TITLE"]).optional(),
        reverse: z.boolean().optional(),
        stripePriceId: z.string().optional(),
        stripeMode: z.enum(["payment", "subscription"]).optional(),
      }).nullable().optional(),
      partialId: z.string().nullable().optional(),
      partialSlug: z.string().nullable().optional(),
      componentName: z.string().nullable().optional(),
      newContent: z.string().nullable().optional(),
    }),
    execute: async ({ blockId, action, commerce, partialId, partialSlug, componentName, newContent }) => {
      let resolvedPartialId = partialId
      if (action === 'setPartial' && partialSlug && !partialId) {
        try {
          const partial = await prisma.partial.findFirst({
            where: { slug: partialSlug },
            select: { id: true },
          })
          if (partial) {
            resolvedPartialId = partial.id
          } else {
            return { success: false, blockId, error: `No partial found with slug "${partialSlug}"` }
          }
        } catch {
          return { success: false, blockId, error: `Failed to look up partial "${partialSlug}"` }
        }
      }

      switch (action) {
        case 'remove':
          return { _action: 'removeBlock' as const, blockId }
        case 'setCommerce':
          return { _action: 'updateBlock' as const, blockId, commerce: commerce || null }
        case 'setPartial':
          return {
            _action: 'updateBlock' as const,
            blockId,
            partialId: resolvedPartialId || null,
            tag: 'div',
            componentName: 'PartialReference',
          }
        case 'setSmartBlock':
          return {
            _action: 'updateBlock' as const,
            blockId,
            componentName: componentName || null,
          }
        case 'replaceContent':
          return {
            _action: 'updateBlock' as const,
            blockId,
            textContent: newContent || '',
          }
        default:
          return { success: false, blockId, error: `Unknown action: ${action}` }
      }
    },
  }),
};

/* ------------------------------------------------------------------ */
/*  All tools combined                                                  */
/* ------------------------------------------------------------------ */

const kofiTools = { ...buildingTools, ...teachingTools, ...agentTools, ...importTools };

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
Each block maps directly to a JSX element. Block[] and JSX are two syntaxes for the same data — parse/serialize are exact inverses.
- \`tag\` — any HTML element OR custom component name (div, section, h1, MyButton, ProductCard, etc.)
- \`className\` — Tailwind CSS classes for styling
- \`textContent\` — inner text for leaf elements. Expressions are preserved with braces: \`{product.title}\`
- \`attrs\` — HTML attributes (href, src, alt, etc.). Expression values preserved with braces: \`{item.url}\`
- \`children\` — nested child blocks
- \`animation\` — optional framer-motion animation
- \`label\` — optional human-readable label for the editor outline
- \`componentName\` — set automatically for custom component tags (e.g., tag="MyButton" → componentName="MyButton")

### Expression Preservation
When code is imported, dynamic expressions like \`{product.title}\` or \`src={item.image}\` are preserved as-is in blocks:
- \`textContent: "{product.title}"\` — the braces indicate a dynamic expression
- \`attrs: { src: "{item.image}" }\` — braces in attr values indicate expressions
- When replacing expressions with static content, remove the braces: \`{product.title}\` → \`My Product\`
- When an expression references commerce data, map it to a Smart Block or commerce binding instead of replacing with static text

## Current Page State
The page currently has ${blockCount} top-level block${blockCount !== 1 ? 's' : ''}.
${blockCount > 0 ? 'The current blocks are provided in the conversation context.' : 'The page is empty — help the user get started!'}
${selectedBlockId ? `The user has selected block \`${selectedBlockId}\`. Prioritize questions about this block.` : ''}

## Design Quality — Professional Standards

### Visual Hierarchy & Layout
- Use semantic HTML: section, nav, header, footer, main, article, aside
- Containers: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Spacing scale: py-16 sm:py-20 lg:py-24 for sections, gap-6 lg:gap-8 for grids
- Bento grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with varied span sizes
- Z-layering: relative/absolute positioning with proper z-index stacking

### Color & Theming
- Dark themes: slate-950/slate-900 backgrounds, NOT pure black
- Accent gradients: bg-gradient-to-r from-violet-500 to-fuchsia-500 (or emerald, amber, cyan)
- Gradient text: bg-gradient-to-r bg-clip-text text-transparent
- Glass effects: backdrop-blur-xl bg-white/5 border border-white/10
- Subtle borders: border-white/10 or border-slate-800, never hard borders
- Color consistency: pick 1 primary gradient + 1 neutral scale per page

### Typography
- Headings: text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance
- Body: text-lg text-slate-400 leading-relaxed max-w-2xl
- Limit line length to 65-75 characters (max-w-prose or max-w-2xl)

### Interactive States
- Every button/link MUST have hover state: hover:bg-X transition-colors
- Cursor: cursor-pointer on all clickable elements
- Focus: focus-visible:ring-2 focus-visible:ring-offset-2 (never remove outline)
- Active: active:scale-95 for tactile press feedback
- Disabled: opacity-50 cursor-not-allowed pointer-events-none

### Animation (via animation field)
- Default to subtle: fadeIn with 0.4s duration for sections
- Stagger children: 0.1s delay increment for list items
- Hover micro-interactions: scale(1.02) + shadow elevation
- Use onMount for above-fold, inView for below-fold

### Interactive Motion Presets (via animation.type + animation.interactiveConfig)
These are advanced effects that respond to cursor, scroll, or run autonomously. No trigger/duration/delay needed — use interactiveConfig instead.

**Cursor-based:**
- \`tilt3d\` — 3D perspective tilt following cursor. Config: {maxTilt: 15, perspective: 1000, scale: 1.02}
- \`mouseGlow\` — Radial gradient spotlight follows cursor. Config: {color: "#8b5cf6", size: 200, opacity: 0.4}
- \`magnetic\` — Element pulls toward cursor within radius. Config: {strength: 0.3, radius: 200}
- \`spotlight\` — Light beam mask follows cursor, dims rest. Config: {size: 300, opacity: 0.15}
- \`parallaxDepth\` — Children shift at different rates on mouse. Config: {intensity: 0.5}

**Autonomous:**
- \`floatIdle\` — Gentle floating bob. Config: {amplitude: 10, rotation: 3, speed: 3}
- \`morphBlob\` — Morphing border-radius shape. Config: {intensity: 0.3, speed: 4}
- \`marquee\` — Continuous horizontal scroll. Config: {speed: 30, direction: "left", pauseOnHover: true, gap: 16}

**Text/Scroll:**
- \`textReveal\` — Staggered word/char reveal on scroll. Config: {by: "word", staggerDelay: 0.05}
- \`countUp\` — Numbers count up when visible. Config: {duration: 2, prefix: "", suffix: ""}
- \`textPath\` — Text along SVG path with scroll animation. Config: {path: "wave", letterSpacing: 4}

### Responsive Design
- Mobile-first: base → sm: → md: → lg: → xl:
- Grid breakpoints: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Stack on mobile: flex-col md:flex-row
- Hide/show: hidden md:block for desktop-only elements
- Touch targets: min-h-[44px] min-w-[44px] for mobile buttons

### Images & Media
- ALWAYS use searchMedia to find real images first
- If no suitable images found, use generateImage — it generates, saves to media, AND places the img block on the page in one step
- Never use placeholder.com or unsplash random URLs — use actual media library assets
- Hero images: use className "w-full h-auto object-cover" with aspect-ratio constraint

### Accessibility (CRITICAL)
- Icon-only buttons: MUST have aria-label in attrs
- Images: MUST have alt text in attrs
- Color contrast: minimum 4.5:1 for text, 3:1 for large text
- Semantic headings: h1 → h2 → h3 hierarchy, never skip levels

## Block Structure Guidelines
- Use semantic HTML tags: section for page sections, nav for navigation, footer for footers
- Nest blocks properly: section → div (container) → content blocks
- Container elements should have \`children\`, leaf elements should have \`textContent\`
- Always generate unique descriptive IDs ("hero-section", "nav-logo", "cta-button")

## Tool Usage
- **Building**: "build me a page" → \`setPageBlocks\`; "add a section" → \`addBlock\`; "change the color" → \`updateBlock\`; "remove the footer" → \`removeBlock\`; "move X above Y" → \`moveBlock\`
- **Teaching**: "explain this layout" → \`spotlightBlock\` + prose; "walk me through" → \`explainDesign\`; "how to improve" → \`suggestImprovement\`; "check accessibility" → \`showDesignError\`
- **Media**: "add a hero image" → \`searchMedia\` first, then \`updateBlock\` with attrs.src from results
- **Image Gen**: "generate a cosmic background" → \`generateImage\` (generates + saves + places the img block automatically)
- **Import & Repair**: "import this code" → \`importAndAnalyze\` → review repair report → \`repairBlock\` for each issue → \`updateBlock\` for polish
- When building, always use tools to make changes — never just describe what to do
- When teaching, always spotlight the blocks you're discussing

## Design Analysis (MANDATORY for reference images)
When the user includes a screenshot, reference image, or asks you to recreate/clone a design:
**You MUST call \`analyzeDesign\` FIRST. Never skip this step.**

## Personality
- Friendly and encouraging — celebrate good design choices
- Concise but thorough — explain design decisions without rambling
- Proactive — if you see a potential issue while building, mention it
- Creative and opinionated — don't settle for generic layouts, push for distinctive designs
- When building from scratch, default to dark themes with gradient accents and glass effects
- Use Markdown formatting for prose (bold, lists, headings)${hasSourceCode ? `

## Source Code Reference
This page was imported from React source code. The blocks now preserve the original structure including:
- **Custom component tags** — preserved as-is (e.g., tag="MyButton" with componentName="MyButton")
- **Dynamic expressions** — preserved with braces (e.g., textContent="{product.title}", attrs.src="{item.image}")
- **All HTML structure** — the block tree mirrors the original JSX tree

When the user asks to "fix", "rebuild", or "make it look like the code":
1. The blocks already contain the original structure — expressions, custom tags, and all
2. Focus on making expressions concrete: replace \`{product.title}\` with actual content, or map to commerce bindings
3. Map custom component tags to Smart Blocks or Partials where appropriate
4. When component dependency information is provided, use it to resolve component variants into concrete Tailwind classes
5. Work **section by section** for accuracy` : ''}`;
}

/* ------------------------------------------------------------------ */
/*  Request schema                                                     */
/* ------------------------------------------------------------------ */

const requestSchema = z.object({
  id: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.string(), // AI SDK may send 'user', 'assistant', 'system', 'data', 'tool'
      parts: z.array(z.any()).optional(),
      content: z.any().optional(),
      createdAt: z.any().optional(),
    }).passthrough()
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

    // Convert UI messages to model messages, preserving tool call/result pairs
    // so multi-turn tool usage works correctly
    const modelMessages: ModelMessage[] = await convertToModelMessages(
      messages as Parameters<typeof convertToModelMessages>[0],
      { tools: kofiTools, ignoreIncompleteToolCalls: true }
    );

    // Inject page state context into the conversation (compact JSON to save tokens)
    if (pageState && Array.isArray(pageState) && pageState.length > 0) {
      const pageJson = JSON.stringify(pageState);
      const pageContext: ModelMessage = {
        role: 'system' as const,
        content: `Current page blocks (JSON):\n${pageJson}`,
      };
      modelMessages.splice(Math.min(1, modelMessages.length), 0, pageContext);
    }

    // Inject original source code as design reference (when available)
    if (sourceCode) {
      const sourceContext: ModelMessage = {
        role: 'system' as const,
        content: `Original React source code for this page (supplementary reference):\n\`\`\`tsx\n${sourceCode}\n\`\`\`\nThe blocks already preserve the original structure losslessly (expressions, custom tags, hierarchy). Use this source as supplementary context for imports, hooks, and logic that blocks don't capture.`,
      };
      modelMessages.splice(Math.min(2, modelMessages.length), 0, sourceContext);
    }

    // Inject component dependency context (helps Kofi translate imported components)
    if (sourceDeps || sourceCode) {
      let depsContext: string | undefined
      if (sourceDeps) {
        depsContext = formatDepsForPrompt(sourceDeps as SourceDeps)
      } else if (sourceCode) {
        // Fallback: extract import names from the source string
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
    const systemPrompt = buildKofiPrompt(pageState || [], selectedBlockId, !!sourceCode);

    // Agent governance: filter/wrap building tools by the admin policy + this
    // user's RBAC (audited, needsApproval per mode). Super-admins without a CMS
    // user row bypass. Full kofiTools are still used above for message parsing.
    let toolsForRun: typeof kofiTools = kofiTools;
    if (dbUser) {
      const agentPolicy = resolveAgentPolicy(await getAgentSettings());
      const userPerms = agentPolicy.respectRbac ? await getUserPermissions(dbUser.id) : null;
      toolsForRun = guardTools(kofiTools, {
        userId: dbUser.id,
        policy: agentPolicy,
        userPerms,
      }).tools as typeof kofiTools;
    }

    const stream = createUIMessageStream({
      execute: async ({ writer: dataStream }) => {
        const result = streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          tools: toolsForRun,
          toolChoice: 'auto',
          stopWhen: stepCountIs(20),
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
