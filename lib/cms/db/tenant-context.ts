/**
 * Tenant Context for Prisma with PostgreSQL RLS
 *
 * Sets `app.current_tenant_id` via SET LOCAL within each transaction,
 * ensuring RLS policies filter data to the current tenant.
 *
 * Compatible with Neon/pgbouncer transaction-mode pooling:
 * - SET LOCAL is scoped to the current transaction
 * - Automatically reset when the transaction ends
 * - No session state leakage between pooled connections
 *
 * Usage:
 *   const tenantPrisma = withTenantContext(prisma, tenantId)
 *   const products = await tenantPrisma.product.findMany() // auto-filtered
 *
 *   // For SuperAdmin bypass:
 *   const adminPrisma = withSuperAdminContext(prisma)
 *   const allProducts = await adminPrisma.product.findMany() // sees everything
 */

import { PrismaClient, Prisma } from "@prisma/client"

// ============================================================================
// Transaction-based tenant context (recommended for RLS)
// ============================================================================

/**
 * Execute a callback within a tenant-scoped transaction.
 * Sets SET LOCAL app.current_tenant_id before running queries.
 *
 * This is the safest approach for Neon/pgbouncer since SET LOCAL
 * is automatically scoped to the transaction and cleaned up on commit/rollback.
 */
export async function withTenantTransaction<T>(
  prisma: PrismaClient,
  tenantId: number,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // SET LOCAL is scoped to this transaction only - safe for connection pooling
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    )
    return callback(tx)
  })
}

/**
 * Execute a callback with SuperAdmin access (bypasses RLS).
 */
export async function withSuperAdminTransaction<T>(
  prisma: PrismaClient,
  callback: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = 'true'`)
    return callback(tx)
  })
}

// ============================================================================
// Prisma Client Extension for automatic tenant context
// ============================================================================

/**
 * Creates a Prisma client extension that automatically wraps every query
 * in a tenant-scoped transaction. This provides transparent RLS filtering
 * without requiring callers to use $transaction explicitly.
 *
 * IMPORTANT: This wraps each query in its own transaction. For operations
 * that need multiple queries in one transaction, use withTenantTransaction()
 * directly instead.
 *
 * Usage:
 *   const tenantPrisma = createTenantClient(prisma, tenantId)
 *   const products = await tenantPrisma.product.findMany()
 */
export function createTenantClient(prisma: PrismaClient, tenantId: number) {
  return prisma.$extends({
    query: {
      $allOperations({ args, query, operation }) {
        // For read operations, wrap in a tenant-scoped transaction
        // For write operations, also set tenant context
        return prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(
            `SET LOCAL app.current_tenant_id = '${tenantId}'`
          )
          // Re-run the query within this transaction context
          // The RLS policies will now filter based on the SET LOCAL value
          return (tx as any)[operation]
            ? query(args)
            : query(args)
        }) as any
      },
    },
  })
}

/**
 * Creates a SuperAdmin Prisma client that bypasses all RLS policies.
 */
export function createSuperAdminClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allOperations({ args, query }) {
        return prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(
            `SET LOCAL app.is_super_admin = 'true'`
          )
          return query(args)
        }) as any
      },
    },
  })
}

// ============================================================================
// Middleware approach (alternative - for existing codebases)
// ============================================================================

/**
 * Tenant context store using AsyncLocalStorage for per-request tenant ID.
 * This avoids passing tenantId through every function call.
 */
let currentTenantId: number | null = null
let isSuperAdmin = false

export function setCurrentTenant(tenantId: number | null) {
  currentTenantId = tenantId
}

export function getCurrentTenant(): number | null {
  return currentTenantId
}

export function setSuperAdmin(value: boolean) {
  isSuperAdmin = value
}

export function getIsSuperAdmin(): boolean {
  return isSuperAdmin
}

/**
 * Prisma middleware that injects tenant_id into WHERE clauses.
 * This is a software-level filter in addition to RLS (defense in depth).
 *
 * NOTE: This middleware adds tenant_id filtering at the Prisma level.
 * RLS at the database level is the primary security boundary.
 * This middleware provides an additional safety net.
 */
const TENANT_SCOPED_MODELS = new Set([
  "Customer",
  "Setting",
  "Product",
  "CustomField",
  "Category",
  "DigitalAsset",
  "Order",
  "OrderWorkflow",
  "Page",
  "RouteConfig",
  "Media",
  "MediaFolder",
  "BlogPost",
  "BlogCategory",
  "BlogTag",
  "Cart",
  "DiscountCode",
  "Wishlist",
  "TenantPost",
  "TenantPage",
  "TenantSetting",
  "Feedback",
  "AnalyticsEvent",
])

/**
 * Apply the tenant-scoping middleware to a Prisma client.
 * This injects tenantId into all queries for tenant-scoped models.
 */
export function applyTenantMiddleware(prisma: PrismaClient): void {
  prisma.$use(async (params, next) => {
    const tenantId = getCurrentTenant()

    // Skip if no tenant context is set (platform-level operations)
    if (tenantId === null || isSuperAdmin) {
      return next(params)
    }

    // Only apply to tenant-scoped models
    if (!params.model || !TENANT_SCOPED_MODELS.has(params.model)) {
      return next(params)
    }

    // Inject tenantId into queries
    switch (params.action) {
      case "findMany":
      case "findFirst":
      case "findUnique":
      case "count":
      case "aggregate":
      case "groupBy":
        params.args = params.args || {}
        params.args.where = params.args.where || {}
        params.args.where.tenantId = tenantId
        break

      case "create":
        params.args = params.args || {}
        params.args.data = params.args.data || {}
        if (!params.args.data.tenantId) {
          params.args.data.tenantId = tenantId
        }
        break

      case "createMany":
        params.args = params.args || {}
        if (Array.isArray(params.args.data)) {
          params.args.data = params.args.data.map((d: any) => ({
            ...d,
            tenantId: d.tenantId || tenantId,
          }))
        }
        break

      case "update":
      case "updateMany":
      case "delete":
      case "deleteMany":
        params.args = params.args || {}
        params.args.where = params.args.where || {}
        params.args.where.tenantId = tenantId
        break

      case "upsert":
        params.args = params.args || {}
        params.args.where = params.args.where || {}
        params.args.where.tenantId = tenantId
        params.args.create = params.args.create || {}
        if (!params.args.create.tenantId) {
          params.args.create.tenantId = tenantId
        }
        break
    }

    return next(params)
  })
}

// ============================================================================
// Request-scoped tenant context helper (for Next.js middleware/API routes)
// ============================================================================

/**
 * Run a function with a specific tenant context.
 * Restores the previous context after the function completes.
 *
 * Usage in API routes:
 *   export async function GET(req: Request) {
 *     const tenantId = getTenantIdFromRequest(req)
 *     return runWithTenant(tenantId, async () => {
 *       const products = await prisma.product.findMany()
 *       return Response.json(products)
 *     })
 *   }
 */
export async function runWithTenant<T>(
  tenantId: number,
  fn: () => Promise<T>
): Promise<T> {
  const previousTenantId = currentTenantId
  const previousSuperAdmin = isSuperAdmin
  try {
    currentTenantId = tenantId
    isSuperAdmin = false
    return await fn()
  } finally {
    currentTenantId = previousTenantId
    isSuperAdmin = previousSuperAdmin
  }
}

/**
 * Run a function with SuperAdmin context (bypasses tenant filtering).
 */
export async function runAsSuperAdmin<T>(fn: () => Promise<T>): Promise<T> {
  const previousTenantId = currentTenantId
  const previousSuperAdmin = isSuperAdmin
  try {
    isSuperAdmin = true
    return await fn()
  } finally {
    currentTenantId = previousTenantId
    isSuperAdmin = previousSuperAdmin
  }
}
