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
                // Don't include full page content in list
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
    // Page Editor Tools
    // ==========================================
    server.tool(
      "get_page_content",
      "Get a page's editor data for visual editing. Returns the page content in JSON format.",
      {
        id: z.string().optional().describe("Page ID"),
        slug: z.string().optional().describe("Page slug (alternative to ID)")
      },
      async ({ id, slug }) => {
        try {
          requireToolScope("get_page_content")
          trackToolUsage("get_page_content")
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

          // Parse page content if it's a string
          let pageData = page.content
          if (typeof pageData === "string") {
            try {
              pageData = JSON.parse(pageData)
            } catch {
              pageData = null
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
            content: pageData,
            layoutConfig: {
              headerMode: page.headerMode,
              footerMode: page.footerMode,
              customHeader: page.customHeader,
              customFooter: page.customFooter
            },
            hint: "Use update_page_content to modify the content. The content follows the editor Data format with 'content' (array of components), 'root' (page-level props), and 'zones' (nested component areas)."
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "update_page_content",
      "Update a page's visual content using editor data. Accepts JSON with components and zones.",
      {
        id: z.string().describe("Page ID to update"),
        content: z.any().describe("Page Data object with 'content' (component array), 'root' (page props), and optional 'zones' (nested areas)"),
        status: z.enum(["DRAFT", "PUBLISHED"]).optional().describe("Optionally update page status"),
        title: z.string().optional().describe("Optionally update page title")
      },
      async ({ id, content, status, title }) => {
        try {
          requireToolScope("update_page_content")
          trackToolUsage("update_page_content")
          const tenantId = getMcpTenantId()

          // Verify page exists and belongs to tenant
          const existingPage = await prisma.page.findFirst({
            where: { id, tenantId },
            select: { id: true, title: true, status: true }
          })

          if (!existingPage) {
            return mcpError("Page not found or access denied")
          }

          // Validate page content structure
          if (!content || typeof content !== "object") {
            return mcpError("Invalid content: must be a page Data object")
          }

          // Page Data typically has: content (array), root (object), zones (object)
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

    // ==========================================
    // Atlas Redesign — G01: Order Fulfillment Steps
    // ==========================================

    server.tool(
      "get_order_fulfillment",
      "Get per-line-item fulfillment steps for an order",
      { orderId: z.string().describe("Order ID") },
      async ({ orderId }) => {
        try {
          requireToolScope("get_order_fulfillment")
          trackToolUsage("get_order_fulfillment")
          const tenantId = getMcpTenantId()

          const order = await prisma.order.findFirst({
            where: { id: orderId, tenantId },
            select: {
              id: true,
              orderNumber: true,
              items: {
                select: {
                  id: true,
                  title: true,
                  variantTitle: true,
                  quantity: true,
                  fulfillmentSteps: {
                    orderBy: { position: "asc" }
                  }
                }
              }
            }
          })

          if (!order) return mcpError("Order not found")

          return mcpResponse({ orderId: order.id, orderNumber: order.orderNumber, items: order.items })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "update_fulfillment_step",
      "Mark a fulfillment step complete or incomplete",
      {
        stepId: z.string().describe("Fulfillment step ID"),
        completed: z.boolean(),
        notes: z.string().optional()
      },
      async ({ stepId, completed, notes }) => {
        try {
          requireToolScope("update_fulfillment_step")
          trackToolUsage("update_fulfillment_step")

          const step = await prisma.orderItemFulfillmentStep.update({
            where: { id: stepId },
            data: {
              completed,
              completedAt: completed ? new Date() : null,
              completedBy: getMcpUserId(),
              ...(notes !== undefined ? { notes } : {})
            }
          })

          return mcpResponse({ step })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G02: Analytics Dashboards
    // ==========================================

    server.tool(
      "list_analytics_dashboards",
      "List analytics dashboards for this tenant",
      { brief: z.boolean().optional().describe("Return minimal fields") },
      async ({ brief }) => {
        try {
          requireToolScope("list_analytics_dashboards")
          trackToolUsage("list_analytics_dashboards")
          const tenantId = getMcpTenantId()

          const dashboards = await prisma.analyticsDashboard.findMany({
            where: { tenantId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
            select: brief
              ? { id: true, name: true, slug: true, isDefault: true }
              : { id: true, name: true, slug: true, isDefault: true, layout: true, pinnedBy: true, sharedWith: true, createdAt: true, _count: { select: { widgets: true } } }
          })

          return mcpResponse({ dashboards, count: dashboards.length })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_analytics_dashboard",
      "Get an analytics dashboard with all its widgets",
      { id: z.string() },
      async ({ id }) => {
        try {
          requireToolScope("get_analytics_dashboard")
          trackToolUsage("get_analytics_dashboard")
          const tenantId = getMcpTenantId()

          const dashboard = await prisma.analyticsDashboard.findFirst({
            where: { id, tenantId },
            include: { widgets: { orderBy: { createdAt: "asc" } } }
          })

          if (!dashboard) return mcpError("Dashboard not found")

          return mcpResponse({ dashboard })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "create_analytics_widget",
      "Add a widget to an analytics dashboard",
      {
        dashboardId: z.string(),
        title: z.string(),
        vizType: z.enum(["line", "bar", "donut", "kpi", "table", "funnel"]),
        query: z.object({
          metric: z.string(),
          dimension: z.string().optional(),
          groupBy: z.string().optional(),
          dateRange: z.object({ from: z.string(), to: z.string() }).optional(),
          filters: z.array(z.object({ field: z.string(), op: z.string(), value: z.union([z.string(), z.number()]) })).optional()
        }),
        position: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() })
      },
      async ({ dashboardId, title, vizType, query, position }) => {
        try {
          requireToolScope("create_analytics_widget")
          trackToolUsage("create_analytics_widget")

          const widget = await prisma.analyticsWidget.create({
            data: { dashboardId, title, vizType, query, position }
          })

          return mcpResponse({ widget })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "run_analytics_query",
      "Execute an analytics query and return aggregated data from order/product/customer records",
      {
        metric: z.enum(["revenue", "orders", "customers", "products", "pageviews"]).describe("Metric to measure"),
        dimension: z.enum(["date", "product", "status", "customer"]).optional(),
        dateRange: z.object({ from: z.string().describe("ISO date"), to: z.string().describe("ISO date") }).optional(),
        groupBy: z.string().optional(),
        limit: z.number().optional()
      },
      async ({ metric, dimension, dateRange, limit }) => {
        try {
          requireToolScope("run_analytics_query")
          trackToolUsage("run_analytics_query")
          const tenantId = getMcpTenantId()
          const from = dateRange ? new Date(dateRange.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          const to = dateRange ? new Date(dateRange.to) : new Date()
          const take = Math.min(limit ?? 50, 200)

          let result: unknown

          if (metric === "revenue" || metric === "orders") {
            const orders = await prisma.order.findMany({
              where: { tenantId, createdAt: { gte: from, lte: to } },
              select: { total: true, createdAt: true, status: true },
              take
            })
            const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0)
            result = { metric, totalOrders: orders.length, totalRevenue, from: from.toISOString(), to: to.toISOString(), dimension }
          } else if (metric === "customers") {
            const count = await prisma.customer.count({ where: { tenantId, createdAt: { gte: from, lte: to } } })
            result = { metric, newCustomers: count, from: from.toISOString(), to: to.toISOString() }
          } else if (metric === "products") {
            const count = await prisma.product.count({ where: { tenantId, status: "ACTIVE" } })
            result = { metric, activeProducts: count }
          } else {
            result = { metric, message: "Metric not yet supported in query engine" }
          }

          return mcpResponse({ query: { metric, dimension, dateRange }, result })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "list_widget_templates",
      "List analytics widget templates (system and tenant-specific)",
      { category: z.string().optional() },
      async ({ category }) => {
        try {
          requireToolScope("list_widget_templates")
          trackToolUsage("list_widget_templates")
          const tenantId = getMcpTenantId()

          const templates = await prisma.analyticsWidgetTemplate.findMany({
            where: {
              OR: [{ tenantId }, { isSystem: true }],
              ...(category ? { category } : {})
            },
            orderBy: [{ isSystem: "asc" }, { name: "asc" }]
          })

          return mcpResponse({ templates, count: templates.length })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G03: Blog Series
    // ==========================================

    server.tool(
      "list_blog_series",
      "List journal series for this tenant",
      { brief: z.boolean().optional() },
      async ({ brief }) => {
        try {
          requireToolScope("list_blog_series")
          trackToolUsage("list_blog_series")
          const tenantId = getMcpTenantId()

          const series = await prisma.blogSeries.findMany({
            where: { tenantId },
            orderBy: { position: "asc" },
            select: brief
              ? { id: true, title: true, slug: true, postCount: true }
              : { id: true, title: true, slug: true, description: true, postCount: true, position: true, createdAt: true, _count: { select: { posts: true } } }
          })

          return mcpResponse({ series, count: series.length })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_blog_series",
      "Get a journal series with its posts",
      { id: z.string() },
      async ({ id }) => {
        try {
          requireToolScope("get_blog_series")
          trackToolUsage("get_blog_series")
          const tenantId = getMcpTenantId()

          const series = await prisma.blogSeries.findFirst({
            where: { id, tenantId },
            include: {
              posts: {
                include: { post: { select: { id: true, title: true, slug: true, status: true, publishedAt: true } } },
                orderBy: { position: "asc" }
              }
            }
          })

          if (!series) return mcpError("Series not found")

          return mcpResponse({ series })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "create_blog_series",
      "Create a new journal series",
      {
        title: z.string(),
        slug: z.string(),
        description: z.string().optional()
      },
      async ({ title, slug, description }) => {
        try {
          requireToolScope("create_blog_series")
          trackToolUsage("create_blog_series")
          const tenantId = getMcpTenantId()

          const series = await prisma.blogSeries.create({
            data: { tenantId, title, slug, ...(description ? { description } : {}) }
          })

          return mcpResponse({ series })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G04: Distribution Channels
    // ==========================================

    server.tool(
      "get_post_distribution",
      "Get distribution channel state for a blog post",
      { postId: z.string() },
      async ({ postId }) => {
        try {
          requireToolScope("get_post_distribution")
          trackToolUsage("get_post_distribution")

          const channels = await prisma.postDistributionChannel.findMany({
            where: { postId },
            orderBy: { channel: "asc" }
          })

          return mcpResponse({ postId, channels })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "schedule_post_channel",
      "Schedule a blog post for distribution on a specific channel",
      {
        postId: z.string(),
        channel: z.enum(["WEB", "NEWSLETTER", "RSS", "TWITTER_X", "MASTODON", "INSTAGRAM"]),
        scheduledAt: z.string().optional().describe("ISO datetime to schedule; omit to enable immediately"),
        copy: z.string().optional().describe("Channel-specific copy override")
      },
      async ({ postId, channel, scheduledAt, copy }) => {
        try {
          requireToolScope("schedule_post_channel")
          trackToolUsage("schedule_post_channel")

          const channelRecord = await prisma.postDistributionChannel.upsert({
            where: { postId_channel: { postId, channel } },
            create: {
              postId,
              channel,
              enabled: true,
              ...(scheduledAt ? { scheduledAt: new Date(scheduledAt), status: "SCHEDULED" } : { status: "DRAFT" }),
              ...(copy ? { copy } : {})
            },
            update: {
              enabled: true,
              ...(scheduledAt ? { scheduledAt: new Date(scheduledAt), status: "SCHEDULED" } : {}),
              ...(copy !== undefined ? { copy } : {})
            }
          })

          return mcpResponse({ channel: channelRecord })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G05: Customer Lifecycle
    // ==========================================

    server.tool(
      "update_customer_lifecycle",
      "Update a customer's lifecycle stage (NEW → RETURNING → LOYAL → VIP → LAPSED → CHURNED)",
      {
        customerId: z.string(),
        stage: z.enum(["NEW", "RETURNING", "LOYAL", "VIP", "LAPSED", "CHURNED"])
      },
      async ({ customerId, stage }) => {
        try {
          requireToolScope("update_customer_lifecycle")
          trackToolUsage("update_customer_lifecycle")
          const tenantId = getMcpTenantId()

          const customer = await prisma.customer.updateMany({
            where: { id: customerId, tenantId },
            data: { lifecycleStage: stage, lifecycleUpdatedAt: new Date() }
          })

          if (customer.count === 0) return mcpError("Customer not found")

          return mcpResponse({ customerId, lifecycleStage: stage, updatedAt: new Date().toISOString() })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G06: Pricing Stack
    // ==========================================

    server.tool(
      "get_product_pricing",
      "Get all pricing layers for a product: base price, tiers, sale schedules",
      { productId: z.string() },
      async ({ productId }) => {
        try {
          requireToolScope("get_product_pricing")
          trackToolUsage("get_product_pricing")
          const tenantId = getMcpTenantId()

          const product = await prisma.product.findFirst({
            where: { id: productId, tenantId },
            select: {
              id: true,
              title: true,
              basePrice: true,
              compareAtPrice: true,
              pricingTiers: { where: { enabled: true }, orderBy: { minQty: "asc" } },
              saleSchedules: { where: { enabled: true }, orderBy: { startsAt: "asc" } }
            }
          })

          if (!product) return mcpError("Product not found")

          return mcpResponse({ product })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "create_pricing_tier",
      "Create a quantity-break or member-tier price for a product",
      {
        productId: z.string(),
        label: z.string().describe("Display label e.g. 'B2B Wholesale'"),
        minQty: z.number().int().min(1),
        maxQty: z.number().int().optional(),
        price: z.number().int().describe("Price in cents"),
        type: z.enum(["QTY", "MEMBER"])
      },
      async ({ productId, label, minQty, maxQty, price, type }) => {
        try {
          requireToolScope("create_pricing_tier")
          trackToolUsage("create_pricing_tier")

          const tier = await prisma.productPricingTier.create({
            data: { productId, label, minQty, ...(maxQty !== undefined ? { maxQty } : {}), price, type }
          })

          return mcpResponse({ tier })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "create_sale_schedule",
      "Schedule a sale price window for a product",
      {
        productId: z.string(),
        salePrice: z.number().int().describe("Sale price in cents"),
        startsAt: z.string().describe("ISO datetime"),
        endsAt: z.string().describe("ISO datetime"),
        variantId: z.string().optional()
      },
      async ({ productId, salePrice, startsAt, endsAt, variantId }) => {
        try {
          requireToolScope("create_sale_schedule")
          trackToolUsage("create_sale_schedule")

          const schedule = await prisma.productSaleSchedule.create({
            data: { productId, salePrice, startsAt: new Date(startsAt), endsAt: new Date(endsAt), ...(variantId ? { variantId } : {}) }
          })

          return mcpResponse({ schedule })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "delete_pricing_tier",
      "Delete a pricing tier by ID",
      { tierId: z.string() },
      async ({ tierId }) => {
        try {
          requireToolScope("delete_pricing_tier")
          trackToolUsage("delete_pricing_tier")

          await prisma.productPricingTier.delete({ where: { id: tierId } })

          return mcpResponse({ deleted: true, tierId })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "delete_sale_schedule",
      "Delete a sale schedule by ID",
      { scheduleId: z.string() },
      async ({ scheduleId }) => {
        try {
          requireToolScope("delete_sale_schedule")
          trackToolUsage("delete_sale_schedule")

          await prisma.productSaleSchedule.delete({ where: { id: scheduleId } })

          return mcpResponse({ deleted: true, scheduleId })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G07: Custom Fields
    // ==========================================

    server.tool(
      "list_custom_fields",
      "List the custom field library for this tenant",
      {
        type: z.enum(["TEXT", "NUMBER", "BOOLEAN", "SELECT", "MULTISELECT", "COLOR", "IMAGE", "DATE", "URL", "TEXTAREA"]).optional(),
        enabled: z.boolean().optional()
      },
      async ({ type, enabled }) => {
        try {
          requireToolScope("list_custom_fields")
          trackToolUsage("list_custom_fields")
          const tenantId = getMcpTenantId()

          const fields = await prisma.customField.findMany({
            where: {
              tenantId,
              ...(type ? { type } : {}),
              ...(enabled !== undefined ? { enabled } : {})
            },
            orderBy: { position: "asc" }
          })

          return mcpResponse({ fields, count: fields.length })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_product_custom_fields",
      "Get custom fields attached to a product and their current values per variant",
      { productId: z.string() },
      async ({ productId }) => {
        try {
          requireToolScope("get_product_custom_fields")
          trackToolUsage("get_product_custom_fields")
          const tenantId = getMcpTenantId()

          const product = await prisma.product.findFirst({
            where: { id: productId, tenantId },
            select: {
              id: true,
              title: true,
              customFields: {
                include: { customField: true },
                orderBy: { position: "asc" }
              },
              variants: {
                select: {
                  id: true,
                  sku: true,
                  customFieldValues: {
                    include: { customField: true }
                  }
                }
              }
            }
          })

          if (!product) return mcpError("Product not found")

          return mcpResponse({ product })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "set_variant_field_value",
      "Set a custom field value for a specific product variant",
      {
        variantId: z.string(),
        customFieldId: z.string(),
        value: z.unknown().describe("The field value — type must match the CustomField.type")
      },
      async ({ variantId, customFieldId, value }) => {
        try {
          requireToolScope("set_variant_field_value")
          trackToolUsage("set_variant_field_value")

          const record = await prisma.variantCustomFieldValue.upsert({
            where: { variantId_customFieldId: { variantId, customFieldId } },
            create: { variantId, customFieldId, value: value as Parameters<typeof prisma.variantCustomFieldValue.create>[0]["data"]["value"] },
            update: { value: value as Parameters<typeof prisma.variantCustomFieldValue.update>[0]["data"]["value"] }
          })

          return mcpResponse({ record })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "attach_custom_field_to_product",
      "Attach a custom field from the library to a product",
      {
        productId: z.string(),
        customFieldId: z.string(),
        position: z.number().optional()
      },
      async ({ productId, customFieldId, position }) => {
        try {
          requireToolScope("attach_custom_field_to_product")
          trackToolUsage("attach_custom_field_to_product")

          const record = await prisma.productCustomField.upsert({
            where: { productId_customFieldId: { productId, customFieldId } },
            create: { productId, customFieldId, position: position ?? 0 },
            update: { ...(position !== undefined ? { position } : {}) }
          })

          return mcpResponse({ record })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G08: Digital Assets + License Keys
    // ==========================================

    server.tool(
      "list_digital_assets",
      "List digital assets for this tenant",
      { productId: z.string().optional().describe("Filter by linked product") },
      async ({ productId }) => {
        try {
          requireToolScope("list_digital_assets")
          trackToolUsage("list_digital_assets")
          const tenantId = getMcpTenantId()

          const assets = await prisma.digitalAsset.findMany({
            where: { tenantId, ...(productId ? { product: { id: productId } } : {}) },
            include: {
              _count: { select: { licenseKeys: true, downloads: true } }
            },
            orderBy: { createdAt: "desc" }
          })

          return mcpResponse({ assets, count: assets.length })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_digital_asset",
      "Get a digital asset with license key stats",
      { id: z.string() },
      async ({ id }) => {
        try {
          requireToolScope("get_digital_asset")
          trackToolUsage("get_digital_asset")
          const tenantId = getMcpTenantId()

          const asset = await prisma.digitalAsset.findFirst({
            where: { id, tenantId },
            include: {
              _count: { select: { licenseKeys: true, downloads: true } }
            }
          })

          if (!asset) return mcpError("Digital asset not found")

          return mcpResponse({ asset })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "list_license_keys",
      "List license keys for a digital asset",
      {
        assetId: z.string(),
        status: z.enum(["AVAILABLE", "ASSIGNED", "ACTIVATED", "EXPIRED", "REVOKED"]).optional(),
        limit: z.number().optional()
      },
      async ({ assetId, status, limit }) => {
        try {
          requireToolScope("list_license_keys")
          trackToolUsage("list_license_keys")
          const { limit: l } = normalizePagination(limit, 0)

          const keys = await prisma.licenseKey.findMany({
            where: { digitalAssetId: assetId, ...(status ? { status } : {}) },
            take: l,
            orderBy: { createdAt: "desc" }
          })

          const total = await prisma.licenseKey.count({
            where: { digitalAssetId: assetId, ...(status ? { status } : {}) }
          })

          return mcpResponse({ keys: keys.map(k => ({ ...k, key: truncate(k.key, 8) + "…" })), total })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "revoke_license_key",
      "Revoke a license key",
      { keyId: z.string() },
      async ({ keyId }) => {
        try {
          requireToolScope("revoke_license_key")
          trackToolUsage("revoke_license_key")

          const key = await prisma.licenseKey.update({
            where: { id: keyId },
            data: { status: "REVOKED" }
          })

          return mcpResponse({ key: { id: key.id, status: key.status } })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G09: Order Workflow Stage Moves
    // ==========================================

    server.tool(
      "get_order_workflow",
      "Get the workflow and current stage for an order",
      { orderId: z.string() },
      async ({ orderId }) => {
        try {
          requireToolScope("get_order_workflow")
          trackToolUsage("get_order_workflow")
          const tenantId = getMcpTenantId()

          const order = await prisma.order.findFirst({
            where: { id: orderId, tenantId },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              currentStageId: true,
              currentStage: true,
              workflow: { include: { stages: { orderBy: { position: "asc" } } } }
            }
          })

          if (!order) return mcpError("Order not found")

          return mcpResponse({ order })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "move_order_to_stage",
      "Move an order to a specific workflow stage",
      {
        orderId: z.string(),
        stageId: z.string(),
        reason: z.string().optional(),
        notes: z.string().optional()
      },
      async ({ orderId, stageId, reason, notes }) => {
        try {
          requireToolScope("move_order_to_stage")
          trackToolUsage("move_order_to_stage")
          const tenantId = getMcpTenantId()
          const userId = getMcpUserId()

          const order = await prisma.order.findFirst({
            where: { id: orderId, tenantId },
            select: { id: true, orderNumber: true, currentStageId: true, workflowId: true }
          })

          if (!order) return mcpError("Order not found")

          // Validate stage belongs to order's workflow
          const stage = await prisma.orderWorkflowStage.findFirst({
            where: { id: stageId, workflowId: order.workflowId ?? undefined }
          })

          if (!stage && order.workflowId) return mcpError("Stage not found in order's workflow")

          // Create progress record + update order
          const [, updatedOrder] = await prisma.$transaction([
            prisma.orderProgress.create({
              data: {
                orderId,
                stageId,
                updatedById: userId,
                ...(notes ? { notes } : {})
              }
            }),
            prisma.order.update({
              where: { id: orderId },
              data: { currentStageId: stageId },
              select: { id: true, orderNumber: true, currentStageId: true, currentStage: true }
            })
          ])

          return mcpResponse({ order: updatedOrder, previousStageId: order.currentStageId, reason })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G10: Customer Notes
    // ==========================================

    server.tool(
      "list_customer_notes",
      "List notes for a customer",
      { customerId: z.string() },
      async ({ customerId }) => {
        try {
          requireToolScope("list_customer_notes")
          trackToolUsage("list_customer_notes")
          const tenantId = getMcpTenantId()

          // Verify customer belongs to tenant
          const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId }, select: { id: true } })
          if (!customer) return mcpError("Customer not found")

          const notes = await prisma.customerNote.findMany({
            where: { customerId },
            orderBy: [{ pinned: "desc" }, { createdAt: "desc" }]
          })

          return mcpResponse({ notes, count: notes.length })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "add_customer_note",
      "Add a note to a customer record",
      {
        customerId: z.string(),
        content: z.string(),
        pinned: z.boolean().optional()
      },
      async ({ customerId, content, pinned }) => {
        try {
          requireToolScope("add_customer_note")
          trackToolUsage("add_customer_note")
          const tenantId = getMcpTenantId()
          const authorId = getMcpUserId()

          const customer = await prisma.customer.findFirst({ where: { id: customerId, tenantId }, select: { id: true } })
          if (!customer) return mcpError("Customer not found")

          const note = await prisma.customerNote.create({
            data: { customerId, authorId, content, pinned: pinned ?? false }
          })

          return mcpResponse({ note })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "delete_customer_note",
      "Delete a customer note by ID",
      { noteId: z.string() },
      async ({ noteId }) => {
        try {
          requireToolScope("delete_customer_note")
          trackToolUsage("delete_customer_note")

          await prisma.customerNote.delete({ where: { id: noteId } })

          return mcpResponse({ deleted: true, noteId })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G11: Notifications
    // ==========================================

    server.tool(
      "list_notifications",
      "List notifications for the current tenant. Admin notifications only.",
      {
        unreadOnly: z.boolean().optional(),
        type: z.string().optional().describe("Filter by NotificationType e.g. ORDER_PLACED"),
        limit: z.number().optional(),
        offset: z.number().optional()
      },
      async ({ unreadOnly, type, limit, offset }) => {
        try {
          requireToolScope("list_notifications")
          trackToolUsage("list_notifications")
          const tenantId = getMcpTenantId()
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const notifications = await prisma.notification.findMany({
            where: {
              tenantId,
              ...(unreadOnly ? { read: false } : {}),
              ...(type ? { type: type as NonNullable<NonNullable<Parameters<typeof prisma.notification.findMany>[0]>["where"]>["type"] } : {})
            },
            take: l,
            skip: o,
            orderBy: { createdAt: "desc" }
          })

          const unreadCount = await prisma.notification.count({ where: { tenantId, read: false } })

          return mcpResponse({ notifications, count: notifications.length, unreadCount })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "mark_notification_read",
      "Mark a notification as read",
      { id: z.string() },
      async ({ id }) => {
        try {
          requireToolScope("mark_notification_read")
          trackToolUsage("mark_notification_read")

          const notification = await prisma.notification.update({
            where: { id },
            data: { read: true, readAt: new Date() }
          })

          return mcpResponse({ notification: { id: notification.id, read: notification.read } })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "mark_all_notifications_read",
      "Mark all notifications for this tenant as read",
      {},
      async () => {
        try {
          requireToolScope("mark_all_notifications_read")
          trackToolUsage("mark_all_notifications_read")
          const tenantId = getMcpTenantId()

          const result = await prisma.notification.updateMany({
            where: { tenantId, read: false },
            data: { read: true, readAt: new Date() }
          })

          return mcpResponse({ markedRead: result.count })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — G12: Bulk Variant Update
    // ==========================================

    server.tool(
      "bulk_update_variants",
      "Update multiple product variants at once — price, stock, SKU, or enabled state",
      {
        productId: z.string(),
        updates: z.array(z.object({
          variantId: z.string(),
          price: z.number().int().optional(),
          stock: z.number().int().optional(),
          sku: z.string().optional(),
          enabled: z.boolean().optional()
        })).min(1).max(200)
      },
      async ({ productId, updates }) => {
        try {
          requireToolScope("bulk_update_variants")
          trackToolUsage("bulk_update_variants")
          const tenantId = getMcpTenantId()

          // Verify product belongs to tenant
          const product = await prisma.product.findFirst({ where: { id: productId, tenantId }, select: { id: true } })
          if (!product) return mcpError("Product not found")

          const results = await prisma.$transaction(
            updates.map(({ variantId, price, stock, sku, enabled }) =>
              prisma.productVariant.update({
                where: { id: variantId },
                data: {
                  ...(price !== undefined ? { price } : {}),
                  ...(stock !== undefined ? { stock } : {}),
                  ...(sku !== undefined ? { sku } : {}),
                  ...(enabled !== undefined ? { enabled } : {})
                },
                select: { id: true, price: true, stock: true, sku: true }
              })
            )
          )

          return mcpResponse({ updated: results.length, variants: results })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — P2: Brand Preset (G13)
    // ==========================================

    server.tool(
      "get_brand_preset",
      "Get the current Atlas brand preset and density setting",
      {},
      async () => {
        try {
          requireToolScope("get_brand_preset")
          trackToolUsage("get_brand_preset")
          const tenantId = getMcpTenantId()

          const setting = await prisma.tenantSetting.findUnique({
            where: { tenantId: tenantId ?? 0 },
            select: { brandPreset: true, density: true }
          })

          return mcpResponse({ brandPreset: setting?.brandPreset ?? null, density: setting?.density ?? null })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "update_brand_preset",
      "Update the Atlas brand preset and/or density for this tenant",
      {
        preset: z.enum(["marigold", "boreal", "obsidian", "meadow"]).optional(),
        density: z.enum(["compact", "regular", "spacious"]).optional()
      },
      async ({ preset, density }) => {
        try {
          requireToolScope("update_brand_preset")
          trackToolUsage("update_brand_preset")
          const tenantId = getMcpTenantId()

          if (!preset && !density) return mcpError("Provide at least one of: preset, density")

          const setting = await prisma.tenantSetting.update({
            where: { tenantId: tenantId ?? 0 },
            data: {
              ...(preset ? { brandPreset: preset } : {}),
              ...(density ? { density } : {})
            },
            select: { brandPreset: true, density: true }
          })

          return mcpResponse({ brandPreset: setting.brandPreset, density: setting.density })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — P2: Page Tree (G14)
    // ==========================================

    server.tool(
      "get_page_tree",
      "Get pages as a hierarchical tree (parent→children). Max depth 3.",
      { includeUnpublished: z.boolean().optional() },
      async ({ includeUnpublished }) => {
        try {
          requireToolScope("get_page_tree")
          trackToolUsage("get_page_tree")
          const tenantId = getMcpTenantId()

          const pages = await prisma.page.findMany({
            where: { tenantId, ...(includeUnpublished ? {} : { status: "PUBLISHED" }) },
            select: { id: true, title: true, slug: true, status: true, parentId: true },
            orderBy: { title: "asc" }
          })

          // Build tree
          const map = new Map(pages.map(p => [p.id, { ...p, children: [] as typeof pages }]))
          const roots: typeof pages = []
          for (const page of pages) {
            if (page.parentId && map.has(page.parentId)) {
              map.get(page.parentId)!.children.push(page)
            } else {
              roots.push(page)
            }
          }

          return mcpResponse({ tree: roots.map(r => map.get(r.id)!), count: pages.length })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — P2: Discount Codes (G15)
    // ==========================================

    server.tool(
      "list_discount_codes",
      "List discount codes for this tenant",
      { enabled: z.boolean().optional() },
      async ({ enabled }) => {
        try {
          requireToolScope("list_discount_codes")
          trackToolUsage("list_discount_codes")
          const tenantId = getMcpTenantId()

          const codes = await prisma.discountCode.findMany({
            where: { tenantId, ...(enabled !== undefined ? { enabled } : {}) },
            orderBy: { createdAt: "desc" }
          })

          return mcpResponse({ codes, count: codes.length })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_discount_code",
      "Get a discount code by ID or code string",
      {
        id: z.string().optional(),
        code: z.string().optional()
      },
      async ({ id, code }) => {
        try {
          requireToolScope("get_discount_code")
          trackToolUsage("get_discount_code")
          const tenantId = getMcpTenantId()

          if (!id && !code) return mcpError("Provide either id or code")

          const discount = await prisma.discountCode.findFirst({
            where: { tenantId, ...(id ? { id } : { code }) }
          })

          if (!discount) return mcpError("Discount code not found")

          return mcpResponse({ discount })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "create_discount_code",
      "Create a new discount code",
      {
        code: z.string(),
        type: z.enum(["PERCENTAGE", "FIXED", "FREE_SHIPPING"]),
        value: z.number().describe("Percentage (0-100) or fixed amount in cents"),
        expiresAt: z.string().optional().describe("ISO datetime")
      },
      async ({ code, type, value, expiresAt }) => {
        try {
          requireToolScope("create_discount_code")
          trackToolUsage("create_discount_code")
          const tenantId = getMcpTenantId()

          const discount = await prisma.discountCode.create({
            data: {
              tenantId,
              code,
              type,
              value,
              ...(expiresAt ? { expiresAt: new Date(expiresAt) } : {})
            }
          })

          return mcpResponse({ discount })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ==========================================
    // Atlas Redesign — P2: Bundle Composition (G16)
    // ==========================================

    server.tool(
      "get_bundle_composition",
      "Get the items in a BUNDLE product",
      { productId: z.string() },
      async ({ productId }) => {
        try {
          requireToolScope("get_bundle_composition")
          trackToolUsage("get_bundle_composition")
          const tenantId = getMcpTenantId()

          const product = await prisma.product.findFirst({
            where: { id: productId, tenantId, type: "BUNDLE" },
            select: { id: true, title: true, bundleItems: true, bundlePriceMode: true, basePrice: true }
          })

          if (!product) return mcpError("Bundle product not found")

          return mcpResponse({ product })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "update_bundle_items",
      "Set the items in a BUNDLE product",
      {
        productId: z.string(),
        items: z.array(z.object({
          productId: z.string(),
          quantity: z.number().int().min(1),
          priceAdjustment: z.number().optional()
        })),
        priceMode: z.enum(["fixed", "calculated"]).optional()
      },
      async ({ productId, items, priceMode }) => {
        try {
          requireToolScope("update_bundle_items")
          trackToolUsage("update_bundle_items")
          const tenantId = getMcpTenantId()

          const product = await prisma.product.updateMany({
            where: { id: productId, tenantId, type: "BUNDLE" },
            data: {
              bundleItems: items,
              ...(priceMode ? { bundlePriceMode: priceMode } : {})
            }
          })

          if (product.count === 0) return mcpError("Bundle product not found")

          return mcpResponse({ productId, itemCount: items.length, priceMode })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    // ----------------------------------------
    // Coordinator scope — account summary + loyalty
    // ----------------------------------------

    server.tool(
      "get_account_summary",
      "Get account summary for a customer: storeCredit, loyaltyPoints, activeSubs, openOrders, lifecycleStage",
      {
        customerId: z.string().describe("Customer ID"),
      },
      async ({ customerId }) => {
        try {
          requireToolScope("get_account_summary")
          trackToolUsage("get_account_summary")
          const tenantId = getMcpTenantId()

          const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
            select: { id: true, storeCredit: true, loyaltyPoints: true, lifecycleStage: true },
          })
          if (!customer) return mcpError("Customer not found")

          const [activeSubs, openOrders] = await Promise.all([
            prisma.order.count({ where: { customerId, status: "PROCESSING" } }),
            prisma.order.count({ where: { customerId, status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
          ])

          return mcpResponse({
            customerId,
            storeCredit: customer.storeCredit,
            loyaltyPoints: customer.loyaltyPoints,
            lifecycleStage: customer.lifecycleStage,
            activeSubs,
            openOrders,
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "get_account_loyalty",
      "Get loyalty tier, points balance, and activity log for a customer",
      {
        customerId: z.string().describe("Customer ID"),
        limit: z.number().int().min(1).max(100).optional().describe("Max activity entries"),
      },
      async ({ customerId, limit }) => {
        try {
          requireToolScope("get_account_loyalty")
          trackToolUsage("get_account_loyalty")
          const tenantId = getMcpTenantId()

          const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
            select: {
              loyaltyPoints: true,
              loyaltyActivities: {
                orderBy: { createdAt: "desc" },
                take: Math.min(limit ?? 20, 100),
                select: { id: true, type: true, points: true, description: true, referenceId: true, createdAt: true },
              },
            },
          })
          if (!customer) return mcpError("Customer not found")

          const TIERS = [
            { tier: "Bronze", min: 0, next: 500 },
            { tier: "Silver", min: 500, next: 1500 },
            { tier: "Gold", min: 1500, next: 5000 },
            { tier: "Platinum", min: 5000, next: null },
          ]
          let currentTier = TIERS[0]
          for (const t of TIERS) {
            if (customer.loyaltyPoints >= t.min) currentTier = t
          }

          return mcpResponse({
            customerId,
            tier: currentTier.tier,
            points: customer.loyaltyPoints,
            nextTierPts: currentTier.next !== null ? currentTier.next - customer.loyaltyPoints : null,
            activityLog: customer.loyaltyActivities,
          })
        } catch (error: unknown) {
          return mcpError(error instanceof Error ? error.message : "Unknown error")
        }
      }
    )

    server.tool(
      "add_loyalty_activity",
      "Add a loyalty point credit/debit to a customer's account",
      {
        customerId: z.string(),
        type: z.enum(["EARNED_PURCHASE", "EARNED_REFERRAL", "EARNED_REVIEW", "REDEEMED", "ADJUSTED", "EXPIRED"]),
        points: z.number().int().describe("Positive to add, negative to deduct"),
        description: z.string().optional(),
        referenceId: z.string().optional(),
      },
      async ({ customerId, type, points, description, referenceId }) => {
        try {
          requireToolScope("add_loyalty_activity")
          trackToolUsage("add_loyalty_activity")
          const tenantId = getMcpTenantId()

          const customer = await prisma.customer.findFirst({
            where: { id: customerId, tenantId },
            select: { id: true, loyaltyPoints: true },
          })
          if (!customer) return mcpError("Customer not found")

          const [activity, updatedCustomer] = await prisma.$transaction([
            prisma.loyaltyActivity.create({
              data: { customerId, tenantId, type, points, description, referenceId },
            }),
            prisma.customer.update({
              where: { id: customerId },
              data: { loyaltyPoints: { increment: points } },
              select: { loyaltyPoints: true },
            }),
          ])

          return mcpResponse({
            activity: { id: activity.id, type, points },
            newBalance: updatedCustomer.loyaltyPoints,
          })
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
