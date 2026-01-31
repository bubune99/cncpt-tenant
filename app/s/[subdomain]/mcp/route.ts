/**
 * MCP Server Route for CMS
 * Exposes CMS content and e-commerce data to AI agents via Model Context Protocol
 *
 * Authentication: Per-user API keys (cms_*) with strict data isolation
 * Rate Limiting: Sliding window rate limiter with tiered limits
 * Scopes: Granular permission scopes (resource:action pattern)
 *
 * Following the pattern from vercel-labs/mcp-for-next.js
 */

import { createMcpHandler } from "mcp-handler"
import { z } from "zod"
import { NextRequest } from "next/server"
import { prisma } from "@/lib/cms/db"
import {
  validateMcpApiKey,
  runWithMcpContext,
  getMcpUserId,
  getMcpTenantId,
  getMcpApiKeyId,
  getMcpScopes,
  mcpResponse,
  mcpError,
  truncate,
  normalizePagination,
  type McpContext
} from "@/lib/cms/mcp"
import { canAccessSubdomain } from "@/lib/team-auth"
import {
  checkRateLimit,
  getRateLimitHeaders,
  createRateLimitResponse,
  type RateLimitTier
} from "@/lib/cms/mcp/rate-limit"
import {
  scopeGrantsPermission,
  TOOL_SCOPES
} from "@/lib/cms/mcp/scopes"
import { trackUsage } from "@/lib/cms/mcp/analytics"

// ==========================================
// Authentication
// ==========================================

/**
 * Resolve subdomain to tenant ID
 */
async function resolveTenantId(subdomain: string): Promise<number | null> {
  try {
    const tenant = await prisma.subdomain.findUnique({
      where: { subdomain },
      select: { id: true }
    })
    return tenant?.id ?? null
  } catch (error) {
    console.error("[MCP] Error resolving tenant:", error)
    return null
  }
}

/**
 * Verify user has access to subdomain via ownership or team membership
 * Returns the access type and level if authorized
 */
async function verifySubdomainAccess(
  userId: string,
  subdomain: string,
  scopes: string[]
): Promise<{ authorized: boolean; accessType?: "owner" | "team"; accessLevel?: string }> {
  // Determine required access level based on scopes
  // Write scope requires at least "edit" access, read-only requires "view"
  const requiredLevel = scopes.includes("write") ? "edit" : "view"

  try {
    const access = await canAccessSubdomain(userId, subdomain, requiredLevel as "view" | "edit" | "admin")

    if (!access.hasAccess) {
      console.warn(`[MCP] User ${userId} denied access to subdomain ${subdomain} (required: ${requiredLevel})`)
      return { authorized: false }
    }

    return {
      authorized: true,
      accessType: access.accessType ?? undefined,
      accessLevel: access.accessLevel
    }
  } catch (error) {
    console.error("[MCP] Error verifying subdomain access:", error)
    return { authorized: false }
  }
}

async function authenticateRequest(
  request: NextRequest,
  subdomain: string
): Promise<(McpContext & { rateLimitTier: RateLimitTier }) | null> {
  // Resolve subdomain to tenantId first
  const tenantId = await resolveTenantId(subdomain)
  if (tenantId === null) {
    console.warn(`[MCP] Unknown subdomain: ${subdomain}`)
    return null
  }

  let context: McpContext | null = null
  let rateLimitTier: RateLimitTier = "free"

  // Check Authorization header first (preferred)
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    context = await validateMcpApiKey(authHeader)
  }

  // Fall back to X-API-Key header
  if (!context) {
    const xApiKey = request.headers.get("x-api-key")
    if (xApiKey) {
      context = await validateMcpApiKey(xApiKey)
    }
  }

  // Dev mode fallback
  if (!context && process.env.NODE_ENV === "development" && process.env.MCP_API_KEY) {
    const devKey = process.env.MCP_API_KEY
    if (authHeader === `Bearer ${devKey}` || request.headers.get("x-api-key") === devKey) {
      console.warn("MCP: Using deprecated MCP_API_KEY env var")
      context = {
        userId: "dev-user",
        apiKeyId: "dev-key",
        scopes: ["read", "write", "*"] // Full access in dev mode
      }
    }
  }

  if (!context) {
    return null
  }

  // Fetch rate limit tier from API key record
  if (context.apiKeyId && context.apiKeyId !== "dev-key") {
    try {
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: context.apiKeyId },
        select: { rateLimitTier: true }
      })
      if (apiKey?.rateLimitTier) {
        rateLimitTier = apiKey.rateLimitTier as RateLimitTier
      }
    } catch (error) {
      console.warn("[MCP] Error fetching rate limit tier:", error)
    }
  }

  // Verify user has access to this subdomain via ownership or team membership
  const access = await verifySubdomainAccess(context.userId, subdomain, context.scopes)
  if (!access.authorized) {
    console.warn(`[MCP] User ${context.userId} not authorized for subdomain ${subdomain}`)
    return null
  }

  // Return context enriched with tenant info and access details
  return {
    ...context,
    tenantId,
    subdomain,
    rateLimitTier
  }
}

/**
 * Check if the current context has permission for a specific tool
 */
function requireToolScope(toolName: string): void {
  const scopes = getMcpScopes()
  const requiredScope = TOOL_SCOPES[toolName]

  if (!requiredScope) {
    // No scope defined for tool = allow (backward compat)
    return
  }

  if (!scopeGrantsPermission(scopes, requiredScope)) {
    throw new Error(`Missing required scope: ${requiredScope}`)
  }
}

/**
 * Track tool usage for analytics
 */
function trackToolUsage(toolName: string): void {
  try {
    const apiKeyId = getMcpApiKeyId()
    trackUsage({
      apiKeyId,
      eventType: "tool_call",
      toolName
    })
  } catch {
    // Silently ignore if context not available
  }
}

// ==========================================
// MCP Handler
// ==========================================

const handler = createMcpHandler(
  async (server) => {
    // ==========================================
    // Products
    // ==========================================
    server.tool(
      "list_products",
      "List products in the CMS. Supports pagination and filtering.",
      {
        status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional().describe("Filter by status"),
        limit: z.number().optional().describe("Max results (default 20, max 100)"),
        offset: z.number().optional().describe("Skip N results"),
        brief: z.boolean().optional().describe("Return minimal fields only")
      },
      async ({ status, limit, offset, brief }) => {
        try {
          requireToolScope("list_products")
          trackToolUsage("list_products")
          const tenantId = getMcpTenantId()
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const products = await prisma.product.findMany({
            where: { tenantId, ...(status ? { status } : {}) },
            take: l,
            skip: o,
            orderBy: { createdAt: "desc" },
            include: brief ? undefined : {
              variants: { take: 5 },
              _count: { select: { variants: true } }
            }
          })

          const count = await prisma.product.count({
            where: { tenantId, ...(status ? { status } : {}) }
          })

          const data = brief
            ? products.map(p => ({
                id: p.id,
                title: p.title,
                status: p.status,
                price: p.basePrice
              }))
            : products.map(p => ({
                ...p,
                description: truncate(p.description, 200)
              }))

          return mcpResponse({ products: data, total: count, limit: l, offset: o })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_product",
      "Get a single product by ID with full details",
      {
        id: z.string().describe("Product ID")
      },
      async ({ id }) => {
        try {
          requireToolScope("get_product")
          trackToolUsage("get_product")
          const tenantId = getMcpTenantId()
          const product = await prisma.product.findFirst({
            where: { id, tenantId },
            include: {
              variants: true,
              categories: true,
              images: true,
              reviews: { take: 5, orderBy: { createdAt: "desc" } }
            }
          })

          if (!product) return mcpError("Product not found")

          return mcpResponse({ product })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Orders
    // ==========================================
    server.tool(
      "list_orders",
      "List orders with pagination and status filtering",
      {
        status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        brief: z.boolean().optional()
      },
      async ({ status, limit, offset, brief }) => {
        try {
          requireToolScope("list_orders")
          trackToolUsage("list_orders")
          const tenantId = getMcpTenantId()
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const orders = await prisma.order.findMany({
            where: { tenantId, ...(status ? { status } : {}) },
            take: l,
            skip: o,
            orderBy: { createdAt: "desc" },
            include: brief ? undefined : {
              items: { take: 3 },
              customer: { select: { email: true, firstName: true, lastName: true } }
            }
          })

          const count = await prisma.order.count({
            where: { tenantId, ...(status ? { status } : {}) }
          })

          const data = brief
            ? orders.map(o => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                total: o.total
              }))
            : orders

          return mcpResponse({ orders: data, total: count, limit: l, offset: o })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_order",
      "Get a single order by ID or order number",
      {
        id: z.string().optional().describe("Order ID"),
        orderNumber: z.string().optional().describe("Order number (alternative)")
      },
      async ({ id, orderNumber }) => {
        try {
          requireToolScope("get_order")
          trackToolUsage("get_order")
          const tenantId = getMcpTenantId()
          if (!id && !orderNumber) {
            return mcpError("Provide either id or orderNumber")
          }

          const order = await prisma.order.findFirst({
            where: { tenantId, ...(id ? { id } : { orderNumber }) },
            include: {
              items: { include: { variant: true } },
              customer: true,
              shippingAddress: true,
              billingAddress: true,
              shipments: true
            }
          })

          if (!order) return mcpError("Order not found")

          return mcpResponse({ order })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Blog
    // ==========================================
    server.tool(
      "list_blog_posts",
      "List blog posts with pagination",
      {
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
        categoryId: z.string().optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        brief: z.boolean().optional()
      },
      async ({ status, categoryId, limit, offset, brief }) => {
        try {
          requireToolScope("list_blog_posts")
          trackToolUsage("list_blog_posts")
          const tenantId = getMcpTenantId()
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const posts = await prisma.blogPost.findMany({
            where: {
              tenantId,
              ...(status ? { status } : {}),
              ...(categoryId ? { categories: { some: { categoryId } } } : {})
            },
            take: l,
            skip: o,
            orderBy: { publishedAt: "desc" },
            include: brief ? undefined : {
              categories: { include: { category: true } },
              tags: { include: { tag: true } },
              author: { select: { name: true, email: true } }
            }
          })

          const count = await prisma.blogPost.count({
            where: {
              tenantId,
              ...(status ? { status } : {}),
              ...(categoryId ? { categories: { some: { categoryId } } } : {})
            }
          })

          const data = brief
            ? posts.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                status: p.status
              }))
            : posts.map(p => ({
                ...p,
                // content is JSON (TipTap), use contentHtml for text preview
                contentPreview: truncate(p.contentHtml, 500),
                excerpt: truncate(p.excerpt, 200)
              }))

          return mcpResponse({ posts: data, total: count, limit: l, offset: o })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_blog_post",
      "Get a blog post by ID or slug",
      {
        id: z.string().optional(),
        slug: z.string().optional()
      },
      async ({ id, slug }) => {
        try {
          requireToolScope("get_blog_post")
          trackToolUsage("get_blog_post")
          const tenantId = getMcpTenantId()
          if (!id && !slug) {
            return mcpError("Provide either id or slug")
          }

          const post = await prisma.blogPost.findFirst({
            where: { tenantId, ...(id ? { id } : { slug }) },
            include: {
              categories: { include: { category: true } },
              tags: { include: { tag: true } },
              author: { select: { id: true, name: true, email: true } }
            }
          })

          if (!post) return mcpError("Blog post not found")

          return mcpResponse({ post })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "create_blog_post",
      "Create a new blog post",
      {
        title: z.string().describe("Post title"),
        slug: z.string().describe("URL slug"),
        content: z.string().describe("Post content (markdown or HTML)"),
        excerpt: z.string().optional().describe("Short excerpt"),
        status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("DRAFT"),
        categoryId: z.string().optional(),
        tagIds: z.array(z.string()).optional()
      },
      async ({ title, slug, content, excerpt, status, categoryId, tagIds }) => {
        try {
          requireToolScope("create_blog_post")
          trackToolUsage("create_blog_post")
          const userId = getMcpUserId()
          const tenantId = getMcpTenantId()

          const post = await prisma.blogPost.create({
            data: {
              title,
              slug,
              content,
              excerpt,
              status: status || "DRAFT",
              authorId: userId,
              tenantId,
              publishedAt: status === "PUBLISHED" ? new Date() : null,
              // Many-to-many through join tables
              categories: categoryId ? { create: [{ categoryId }] } : undefined,
              tags: tagIds ? { create: tagIds.map(tagId => ({ tagId })) } : undefined
            }
          })

          return mcpResponse({ created: true, id: post.id, slug: post.slug })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Pages
    // ==========================================
    server.tool(
      "list_pages",
      "List CMS pages",
      {
        status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional(),
        brief: z.boolean().optional()
      },
      async ({ status, limit, offset, brief }) => {
        try {
          requireToolScope("list_pages")
          trackToolUsage("list_pages")
          const tenantId = getMcpTenantId()
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const pages = await prisma.page.findMany({
            where: { tenantId, ...(status ? { status } : {}) },
            take: l,
            skip: o,
            orderBy: { updatedAt: "desc" }
          })

          const count = await prisma.page.count({
            where: { tenantId, ...(status ? { status } : {}) }
          })

          const data = brief
            ? pages.map(p => ({
                id: p.id,
                title: p.title,
                slug: p.slug,
                status: p.status
              }))
            : pages.map(p => ({
                ...p,
                // Don't include full Puck content in list
                content: undefined,
                hasContent: !!p.content
              }))

          return mcpResponse({ pages: data, total: count, limit: l, offset: o })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_page",
      "Get a page by ID or slug",
      {
        id: z.string().optional(),
        slug: z.string().optional()
      },
      async ({ id, slug }) => {
        try {
          requireToolScope("get_page")
          trackToolUsage("get_page")
          const tenantId = getMcpTenantId()
          if (!id && !slug) {
            return mcpError("Provide either id or slug")
          }

          const page = await prisma.page.findFirst({
            where: { tenantId, ...(id ? { id } : { slug }) }
          })

          if (!page) return mcpError("Page not found")

          return mcpResponse({ page })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Puck Page Editor Tools
    // ==========================================
    server.tool(
      "get_page_puck_data",
      "Get a page's Puck editor data for visual editing. Returns the page content in Puck-compatible JSON format.",
      {
        id: z.string().optional().describe("Page ID"),
        slug: z.string().optional().describe("Page slug (alternative to ID)")
      },
      async ({ id, slug }) => {
        try {
          requireToolScope("get_page_puck_data")
          trackToolUsage("get_page_puck_data")
          const tenantId = getMcpTenantId()
          if (!id && !slug) {
            return mcpError("Provide either id or slug")
          }

          const page = await prisma.page.findFirst({
            where: { tenantId, ...(id ? { id } : { slug }) },
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              content: true,
              headerMode: true,
              footerMode: true,
              customHeader: true,
              customFooter: true,
              updatedAt: true
            }
          })

          if (!page) return mcpError("Page not found")

          // Parse Puck content if it's a string
          let puckData = page.content
          if (typeof puckData === "string") {
            try {
              puckData = JSON.parse(puckData)
            } catch {
              puckData = null
            }
          }

          return mcpResponse({
            page: {
              id: page.id,
              title: page.title,
              slug: page.slug,
              status: page.status,
              updatedAt: page.updatedAt
            },
            puckContent: puckData,
            layoutConfig: {
              headerMode: page.headerMode,
              footerMode: page.footerMode,
              customHeader: page.customHeader,
              customFooter: page.customFooter
            },
            hint: "Use update_page_puck_content to modify the puckContent. The content follows Puck's Data format with 'content' (array of components), 'root' (page-level props), and 'zones' (nested component areas)."
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "update_page_puck_content",
      "Update a page's visual content using Puck editor data. Accepts Puck-compatible JSON with components and zones.",
      {
        id: z.string().describe("Page ID to update"),
        content: z.any().describe("Puck Data object with 'content' (component array), 'root' (page props), and optional 'zones' (nested areas)"),
        status: z.enum(["DRAFT", "PUBLISHED"]).optional().describe("Optionally update page status"),
        title: z.string().optional().describe("Optionally update page title")
      },
      async ({ id, content, status, title }) => {
        try {
          requireToolScope("update_page_puck_content")
          trackToolUsage("update_page_puck_content")
          const tenantId = getMcpTenantId()

          // Verify page exists and belongs to tenant
          const existingPage = await prisma.page.findFirst({
            where: { id, tenantId },
            select: { id: true, title: true, status: true }
          })

          if (!existingPage) {
            return mcpError("Page not found or access denied")
          }

          // Validate Puck content structure
          if (!content || typeof content !== "object") {
            return mcpError("Invalid content: must be a Puck Data object")
          }

          // Puck Data typically has: content (array), root (object), zones (object)
          if (!Array.isArray(content.content) && content.content !== undefined) {
            return mcpError("Invalid content.content: must be an array of components")
          }

          const updateData: Record<string, unknown> = {
            content: content // Store as JSON
          }

          if (title) {
            updateData.title = title.trim()
          }

          if (status) {
            updateData.status = status.toUpperCase()
            if (status === "PUBLISHED" && existingPage.status !== "PUBLISHED") {
              updateData.publishedAt = new Date()
            }
          }

          const updatedPage = await prisma.page.update({
            where: { id },
            data: updateData,
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
              updatedAt: true
            }
          })

          return mcpResponse({
            updated: true,
            page: updatedPage,
            message: "Page content updated successfully"
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Settings
    // ==========================================
    server.tool(
      "get_settings",
      "Get CMS settings by group",
      {
        group: z.string().optional().describe("Setting group (e.g., 'general', 'shipping', 'payment')")
      },
      async ({ group }) => {
        try {
          requireToolScope("get_settings")
          trackToolUsage("get_settings")
          const tenantId = getMcpTenantId()
          const settings = await prisma.setting.findMany({
            where: { tenantId, ...(group ? { group } : {}) },
            select: {
              key: true,
              value: true,
              group: true,
              // Don't expose encrypted values
              encrypted: true
            }
          })

          // Mask encrypted values
          const data = settings.map(s => ({
            key: s.key,
            group: s.group,
            value: s.encrypted ? "***ENCRYPTED***" : s.value
          }))

          return mcpResponse({ settings: data })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "update_setting",
      "Update a CMS setting",
      {
        key: z.string().describe("Setting key"),
        value: z.string().describe("New value")
      },
      async ({ key, value }) => {
        try {
          requireToolScope("update_setting")
          trackToolUsage("update_setting")
          const tenantId = getMcpTenantId()

          const existing = await prisma.setting.findFirst({ where: { key, tenantId } })
          if (!existing) {
            return mcpError(`Setting '${key}' not found`)
          }

          if (existing.encrypted) {
            return mcpError("Cannot update encrypted settings via MCP")
          }

          await prisma.setting.update({
            where: { id: existing.id },
            data: { value }
          })

          return mcpResponse({ updated: true, key })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Media
    // ==========================================
    server.tool(
      "list_media",
      "List media files",
      {
        folderId: z.string().optional(),
        type: z.enum(["image", "video", "document", "audio"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional()
      },
      async ({ folderId, type, limit, offset }) => {
        try {
          requireToolScope("list_media")
          trackToolUsage("list_media")
          const tenantId = getMcpTenantId()
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          // Convert type filter to mimeType pattern
          const mimeTypeFilter = type ? {
            mimeType: { startsWith: type === "document" ? "application/" : `${type}/` }
          } : {}

          const media = await prisma.media.findMany({
            where: {
              tenantId,
              ...(folderId ? { folderId } : {}),
              ...mimeTypeFilter
            },
            take: l,
            skip: o,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              filename: true,
              mimeType: true,
              size: true,
              url: true,
              alt: true,
              createdAt: true
            }
          })

          const count = await prisma.media.count({
            where: {
              tenantId,
              ...(folderId ? { folderId } : {}),
              ...mimeTypeFilter
            }
          })

          return mcpResponse({ media, total: count, limit: l, offset: o })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Users (Admin only)
    // ==========================================
    server.tool(
      "list_users",
      "List CMS users (admin only)",
      {
        role: z.enum(["ADMIN", "EDITOR", "VIEWER", "CUSTOMER"]).optional(),
        limit: z.number().optional(),
        offset: z.number().optional()
      },
      async ({ role, limit, offset }) => {
        try {
          requireToolScope("list_users")
          trackToolUsage("list_users")
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const users = await prisma.user.findMany({
            where: role ? { role } : undefined,
            take: l,
            skip: o,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
              _count: { select: { blogPosts: true } }
            }
          })

          const count = await prisma.user.count({
            where: role ? { role } : undefined
          })

          return mcpResponse({ users, total: count, limit: l, offset: o })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Analytics (Read summary)
    // ==========================================
    server.tool(
      "get_analytics_summary",
      "Get analytics summary for dashboard",
      {
        days: z.number().optional().default(30).describe("Number of days to look back")
      },
      async ({ days }) => {
        try {
          requireToolScope("get_analytics_summary")
          trackToolUsage("get_analytics_summary")
          const tenantId = getMcpTenantId()
          const since = new Date()
          since.setDate(since.getDate() - (days || 30))

          const [orderCount, orderTotal, productCount, customerCount, postCount] = await Promise.all([
            prisma.order.count({ where: { tenantId, createdAt: { gte: since } } }),
            prisma.order.aggregate({
              where: { tenantId, createdAt: { gte: since } },
              _sum: { total: true }
            }),
            prisma.product.count({ where: { tenantId, status: "ACTIVE" } }),
            prisma.customer.count({ where: { tenantId } }),
            prisma.blogPost.count({ where: { tenantId, status: "PUBLISHED" } })
          ])

          return mcpResponse({
            period: `${days} days`,
            orders: orderCount,
            revenue: orderTotal._sum.total || 0,
            activeProducts: productCount,
            totalCustomers: customerCount,
            publishedPosts: postCount
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Customers
    // ==========================================
    server.tool(
      "list_customers",
      "List customers with purchase stats",
      {
        limit: z.number().optional(),
        offset: z.number().optional(),
        brief: z.boolean().optional()
      },
      async ({ limit, offset, brief }) => {
        try {
          requireToolScope("list_customers")
          trackToolUsage("list_customers")
          const tenantId = getMcpTenantId()
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const customers = await prisma.customer.findMany({
            where: { tenantId },
            take: l,
            skip: o,
            orderBy: { createdAt: "desc" },
            select: brief ? {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              totalOrders: true,
              totalSpent: true
            } : {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              totalOrders: true,
              totalSpent: true,
              lastOrderAt: true,
              acceptsMarketing: true,
              createdAt: true
            }
          })

          const count = await prisma.customer.count({ where: { tenantId } })

          return mcpResponse({ customers, total: count, limit: l, offset: o })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_customer",
      "Get customer details including orders",
      {
        id: z.string().optional(),
        email: z.string().optional()
      },
      async ({ id, email }) => {
        try {
          requireToolScope("get_customer")
          trackToolUsage("get_customer")
          const tenantId = getMcpTenantId()
          if (!id && !email) {
            return mcpError("Provide either id or email")
          }

          const customer = await prisma.customer.findFirst({
            where: { tenantId, ...(id ? { id } : { email }) },
            include: {
              orders: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  total: true,
                  createdAt: true
                }
              },
              addresses: true
            }
          })

          if (!customer) return mcpError("Customer not found")

          return mcpResponse({ customer })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )
  },
  {},
  {
    basePath: "",
    verboseLogs: process.env.NODE_ENV === "development",
    maxDuration: 60,
    disableSse: true
  }
)

// ==========================================
// Route Handlers
// ==========================================

interface RouteContext {
  params: Promise<{ subdomain: string }>
}

async function handleWithAuth(request: NextRequest, routeContext: RouteContext) {
  const startTime = Date.now()
  const { subdomain } = await routeContext.params

  if (!subdomain) {
    return new Response(
      JSON.stringify({
        error: "Bad Request",
        message: "Missing subdomain parameter"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    )
  }

  const context = await authenticateRequest(request, subdomain)

  if (!context) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Invalid or missing API key, or unknown subdomain.",
        hint: "Generate an API key from your CMS dashboard settings."
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    )
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(context.apiKeyId, context.rateLimitTier)
  if (!rateLimitResult.allowed) {
    // Track rate limited request
    trackUsage({
      apiKeyId: context.apiKeyId,
      eventType: "rate_limited",
      statusCode: 429
    })

    return createRateLimitResponse(rateLimitResult)
  }

  // Execute the request with MCP context
  const response = await runWithMcpContext(context, () => handler(request))

  // Calculate response time
  const durationMs = Date.now() - startTime

  // Track request usage
  trackUsage({
    apiKeyId: context.apiKeyId,
    eventType: "request",
    statusCode: response.status,
    durationMs,
    metadata: {
      subdomain,
      method: request.method,
      path: request.nextUrl.pathname
    }
  })

  // Add rate limit headers to response
  const rateLimitHeaders: Record<string, string> = getRateLimitHeaders(rateLimitResult)
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(rateLimitHeaders)) {
    headers.set(key, value as string)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

export const GET = handleWithAuth
export const POST = handleWithAuth
export const DELETE = handleWithAuth
