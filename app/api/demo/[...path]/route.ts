import { NextRequest, NextResponse } from 'next/server'
import {
  DEMO_STATS,
  DEMO_PRODUCTS,
  DEMO_ORDERS,
  DEMO_CUSTOMERS,
  DEMO_BLOG_POSTS,
  DEMO_PAGES,
  DEMO_MEDIA,
  DEMO_ANALYTICS,
  DEMO_RECENT_ACTIVITY,
} from '@/lib/demo-data'

// Demo API handler that returns mock data for all CMS admin endpoints
// This allows the demo to work without a real database connection

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path.join('/')

  // Add artificial delay to simulate real API (200-500ms)
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

  // Route to appropriate mock data
  switch (endpoint) {
    // Dashboard stats
    case 'admin/stats':
    case 'admin/stats-simple':
      return NextResponse.json(DEMO_STATS)

    // Products
    case 'admin/products':
      return NextResponse.json({
        products: DEMO_PRODUCTS,
        total: DEMO_PRODUCTS.length,
        limit: 20,
        offset: 0,
      })

    // Orders
    case 'admin/orders':
      return NextResponse.json({
        orders: DEMO_ORDERS,
        total: DEMO_ORDERS.length,
        limit: 20,
        offset: 0,
      })

    // Customers
    case 'admin/customers':
      return NextResponse.json({
        customers: DEMO_CUSTOMERS,
        total: DEMO_CUSTOMERS.length,
        limit: 20,
        offset: 0,
      })

    // Blog posts
    case 'admin/blog':
    case 'admin/blog/posts':
      return NextResponse.json({
        posts: DEMO_BLOG_POSTS,
        total: DEMO_BLOG_POSTS.length,
        limit: 20,
        offset: 0,
      })

    // Blog categories
    case 'admin/blog/categories':
      return NextResponse.json({
        categories: [
          { id: 'cat-1', name: 'E-Commerce', slug: 'e-commerce', postCount: 5 },
          { id: 'cat-2', name: 'Technology', slug: 'technology', postCount: 8 },
          { id: 'cat-3', name: 'Web Development', slug: 'web-development', postCount: 4 },
          { id: 'cat-4', name: 'Marketing', slug: 'marketing', postCount: 3 },
          { id: 'cat-5', name: 'Security', slug: 'security', postCount: 3 },
        ],
        total: 5,
      })

    // Pages
    case 'admin/pages':
      return NextResponse.json({
        pages: DEMO_PAGES,
        total: DEMO_PAGES.length,
        limit: 20,
        offset: 0,
      })

    // Media
    case 'admin/media':
      return NextResponse.json({
        media: DEMO_MEDIA,
        total: DEMO_MEDIA.length,
        limit: 20,
        offset: 0,
      })

    // Analytics
    case 'admin/analytics':
    case 'admin/analytics/overview':
      return NextResponse.json(DEMO_ANALYTICS)

    // Recent activity
    case 'admin/activity':
      return NextResponse.json({
        activities: DEMO_RECENT_ACTIVITY,
      })

    // Users
    case 'admin/users':
      return NextResponse.json({
        users: [
          { id: 'user-1', name: 'Admin User', email: 'admin@demo.com', role: 'Super Admin', status: 'active', lastLogin: '2024-01-22T10:00:00Z' },
          { id: 'user-2', name: 'Content Editor', email: 'editor@demo.com', role: 'Content Editor', status: 'active', lastLogin: '2024-01-21T14:30:00Z' },
          { id: 'user-3', name: 'Store Manager', email: 'manager@demo.com', role: 'Store Manager', status: 'active', lastLogin: '2024-01-20T09:00:00Z' },
        ],
        total: 3,
      })

    // Roles
    case 'admin/roles':
      return NextResponse.json({
        roles: [
          { id: 'role-1', name: 'Super Admin', description: 'Full system access', userCount: 1 },
          { id: 'role-2', name: 'Store Manager', description: 'Manage products, orders, customers', userCount: 1 },
          { id: 'role-3', name: 'Content Editor', description: 'Manage pages, blog, media', userCount: 1 },
          { id: 'role-4', name: 'Order Fulfiller', description: 'View and fulfill orders', userCount: 0 },
        ],
        total: 4,
      })

    // Settings
    case 'admin/settings':
      return NextResponse.json({
        general: {
          siteName: 'Demo Store',
          siteUrl: 'https://demo.cncptweb.com',
          timezone: 'America/New_York',
          currency: 'USD',
          language: 'en',
        },
        email: {
          fromName: 'Demo Store',
          fromEmail: 'noreply@demo.cncptweb.com',
          provider: 'smtp',
        },
        shipping: {
          freeShippingThreshold: 50,
          defaultCarrier: 'USPS',
        },
      })

    // Shipping rates
    case 'admin/shipping':
    case 'admin/shipping/rates':
      return NextResponse.json({
        rates: [
          { id: 'rate-1', name: 'Standard Shipping', price: 5.99, minDays: 5, maxDays: 7 },
          { id: 'rate-2', name: 'Express Shipping', price: 12.99, minDays: 2, maxDays: 3 },
          { id: 'rate-3', name: 'Next Day', price: 24.99, minDays: 1, maxDays: 1 },
        ],
        total: 3,
      })

    // Discounts
    case 'admin/discounts':
      return NextResponse.json({
        discounts: [
          { id: 'disc-1', code: 'WELCOME10', type: 'percentage', value: 10, status: 'active', usageCount: 45 },
          { id: 'disc-2', code: 'FREESHIP', type: 'free_shipping', value: 0, status: 'active', usageCount: 128 },
          { id: 'disc-3', code: 'SAVE20', type: 'percentage', value: 20, status: 'inactive', usageCount: 0 },
        ],
        total: 3,
      })

    // Default fallback
    default:
      // Check if it's a single item request (e.g., admin/products/prod-001)
      if (endpoint.startsWith('admin/products/')) {
        const productId = endpoint.replace('admin/products/', '')
        const product = DEMO_PRODUCTS.find(p => p.id === productId || p.slug === productId)
        if (product) return NextResponse.json({ product })
      }

      if (endpoint.startsWith('admin/orders/')) {
        const orderId = endpoint.replace('admin/orders/', '')
        const order = DEMO_ORDERS.find(o => o.id === orderId || o.orderNumber === orderId)
        if (order) return NextResponse.json({ order })
      }

      if (endpoint.startsWith('admin/blog/posts/') || endpoint.startsWith('admin/blog/')) {
        const postId = endpoint.replace('admin/blog/posts/', '').replace('admin/blog/', '')
        const post = DEMO_BLOG_POSTS.find(p => p.id === postId || p.slug === postId)
        if (post) return NextResponse.json({ post })
      }

      if (endpoint.startsWith('admin/pages/')) {
        const pageId = endpoint.replace('admin/pages/', '')
        const page = DEMO_PAGES.find(p => p.id === pageId || p.slug === pageId)
        if (page) return NextResponse.json({ page })
      }

      // Return empty response for unknown endpoints
      return NextResponse.json({ message: 'Demo endpoint', data: [] })
  }
}

// POST handler - simulates creating items (doesn't actually save)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const endpoint = path.join('/')

  // Add artificial delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400))

  // Simulate successful creation
  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    success: true,
    message: 'Demo mode: Changes are not saved',
    data: {
      id: `demo-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }
  })
}

// PATCH/PUT handler - simulates updates
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    success: true,
    message: 'Demo mode: Changes are not saved',
    data: {
      ...body,
      updatedAt: new Date().toISOString(),
    }
  })
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  return PATCH(request, context)
}

// DELETE handler - simulates deletion
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200))

  return NextResponse.json({
    success: true,
    message: 'Demo mode: Item would be deleted in a real environment',
  })
}
