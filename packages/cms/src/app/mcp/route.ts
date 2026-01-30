/**
 * MCP Server Route for CMS
 * Exposes CMS content and e-commerce data to AI agents via Model Context Protocol
 *
 * Authentication: Per-user API keys (cms_*) with strict data isolation
 *
 * Following the pattern from vercel-labs/mcp-for-next.js
 */

import { createMcpHandler } from "mcp-handler"
import { z } from "zod"
import { NextRequest } from "next/server"
import { prisma } from "../../lib/db"
import {
  validateMcpApiKey,
  runWithMcpContext,
  getMcpUserId,
  requireMcpScope,
  mcpResponse,
  mcpError,
  truncate,
  normalizePagination,
  type McpContext
} from "../../lib/mcp"

// ==========================================
// Authentication
// ==========================================

async function authenticateRequest(
  request: NextRequest
): Promise<McpContext | null> {
  // Check Authorization header first (preferred)
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const context = await validateMcpApiKey(authHeader)
    if (context) return context
  }

  // Fall back to X-API-Key header
  const xApiKey = request.headers.get("x-api-key")
  if (xApiKey) {
    const context = await validateMcpApiKey(xApiKey)
    if (context) return context
  }

  // Dev mode fallback
  if (process.env.NODE_ENV === "development" && process.env.MCP_API_KEY) {
    const devKey = process.env.MCP_API_KEY
    if (authHeader === `Bearer ${devKey}` || xApiKey === devKey) {
      console.warn("MCP: Using deprecated MCP_API_KEY env var")
      return {
        userId: "dev-user",
        apiKeyId: "dev-key",
        scopes: ["read", "write"]
      }
    }
  }

  return null
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
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const products = await prisma.product.findMany({
            where: status ? { status } : undefined,
            take: l,
            skip: o,
            orderBy: { createdAt: "desc" },
            include: brief ? undefined : {
              variants: { take: 5 },
              _count: { select: { variants: true } }
            }
          })

          const count = await prisma.product.count({
            where: status ? { status } : undefined
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
          const product = await prisma.product.findUnique({
            where: { id },
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
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const orders = await prisma.order.findMany({
            where: status ? { status } : undefined,
            take: l,
            skip: o,
            orderBy: { createdAt: "desc" },
            include: brief ? undefined : {
              items: { take: 3 },
              customer: { select: { email: true, firstName: true, lastName: true } }
            }
          })

          const count = await prisma.order.count({
            where: status ? { status } : undefined
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
          if (!id && !orderNumber) {
            return mcpError("Provide either id or orderNumber")
          }

          const order = await prisma.order.findFirst({
            where: id ? { id } : { orderNumber },
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
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const posts = await prisma.blogPost.findMany({
            where: {
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
          if (!id && !slug) {
            return mcpError("Provide either id or slug")
          }

          const post = await prisma.blogPost.findFirst({
            where: id ? { id } : { slug },
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
          requireMcpScope("write")
          const userId = getMcpUserId()

          const post = await prisma.blogPost.create({
            data: {
              title,
              slug,
              content,
              excerpt,
              status: status || "DRAFT",
              authorId: userId,
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
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const pages = await prisma.page.findMany({
            where: status ? { status } : undefined,
            take: l,
            skip: o,
            orderBy: { updatedAt: "desc" }
          })

          const count = await prisma.page.count({
            where: status ? { status } : undefined
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
          if (!id && !slug) {
            return mcpError("Provide either id or slug")
          }

          const page = await prisma.page.findFirst({
            where: id ? { id } : { slug }
          })

          if (!page) return mcpError("Page not found")

          return mcpResponse({ page })
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
          const settings = await prisma.setting.findMany({
            where: group ? { group } : undefined,
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
          requireMcpScope("write")

          const existing = await prisma.setting.findFirst({ where: { key, tenantId: null } })
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
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          // Convert type filter to mimeType pattern
          const mimeTypeFilter = type ? {
            mimeType: { startsWith: type === "document" ? "application/" : `${type}/` }
          } : {}

          const media = await prisma.media.findMany({
            where: {
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
          const since = new Date()
          since.setDate(since.getDate() - (days || 30))

          const [orderCount, orderTotal, productCount, customerCount, postCount] = await Promise.all([
            prisma.order.count({ where: { createdAt: { gte: since } } }),
            prisma.order.aggregate({
              where: { createdAt: { gte: since } },
              _sum: { total: true }
            }),
            prisma.product.count({ where: { status: "ACTIVE" } }),
            prisma.customer.count(),
            prisma.blogPost.count({ where: { status: "PUBLISHED" } })
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
          const { limit: l, offset: o } = normalizePagination(limit, offset)

          const customers = await prisma.customer.findMany({
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

          const count = await prisma.customer.count()

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
          if (!id && !email) {
            return mcpError("Provide either id or email")
          }

          const customer = await prisma.customer.findFirst({
            where: id ? { id } : { email },
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

async function handleWithAuth(request: NextRequest) {
  const context = await authenticateRequest(request)

  if (!context) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Invalid or missing API key. Use Authorization: Bearer cms_xxxxx header.",
        hint: "Generate an API key from your CMS dashboard settings."
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" }
      }
    )
  }

  return runWithMcpContext(context, () => handler(request))
}

export const GET = handleWithAuth
export const POST = handleWithAuth
export const DELETE = handleWithAuth
