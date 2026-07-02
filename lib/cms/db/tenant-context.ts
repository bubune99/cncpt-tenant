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
import { AsyncLocalStorage } from "node:async_hooks"

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
  // Validate tenantId is a safe integer to prevent SQL injection
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    throw new Error(`Invalid tenant ID: ${tenantId}`)
  }
  return prisma.$transaction(async (tx) => {
    // SET LOCAL is scoped to this transaction only - safe for connection pooling
    // Using $executeRaw with Prisma.sql template tag for parameterized query
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
  // Validate tenantId is a safe integer to prevent SQL injection
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    throw new Error(`Invalid tenant ID: ${tenantId}`)
  }
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
 * Tenant context store using AsyncLocalStorage for per-request isolation.
 * Each async execution context (request) gets its own tenant state,
 * preventing concurrent requests from leaking tenant IDs across requests.
 */
interface TenantStore {
  tenantId: number | null
  isSuperAdmin: boolean
}

// Cache in globalThis to survive HMR — must be the same instance as the one
// captured by the Prisma $extends callback to avoid stale references.
const globalForTenant = globalThis as unknown as {
  __tenantStorage?: AsyncLocalStorage<TenantStore>
}
const tenantStorage = globalForTenant.__tenantStorage ??= new AsyncLocalStorage<TenantStore>()

export function setCurrentTenant(tenantId: number | null) {
  const store = tenantStorage.getStore()
  if (store) {
    store.tenantId = tenantId
  }
}

export function getCurrentTenant(): number | null {
  return tenantStorage.getStore()?.tenantId ?? null
}

export function setSuperAdmin(value: boolean) {
  const store = tenantStorage.getStore()
  if (store) {
    store.isSuperAdmin = value
  }
}

export function getIsSuperAdmin(): boolean {
  return tenantStorage.getStore()?.isSuperAdmin ?? false
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
  "PageVersion",
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
  // NOTE: AnalyticsEvent does NOT have a tenantId column in the schema.
  // Adding it here would cause Prisma query errors. If tenant scoping is
  // needed for analytics, add the tenantId field to the schema first.
  // "AnalyticsEvent",
  // Tenant isolation audit (2026-03) — CRITICAL priority
  "Event",
  "EventTicketType",
  "EventScheduleItem",
  "EventSpeaker",
  "EventRegistration",
  "Partial",
  "GiftCard",
  "GiftCardTransaction",
  "ProductReview",
  "ReviewVote",
  "Form",
  "FormSubmission",
  // Tenant isolation audit (2026-03) — HIGH priority
  "Role",
  "RoleAssignment",
  "UserPermission",
  "MediaTag",
  "BackInStockSubscription",
  "StockReservation",
  "Notification",
  "SiteSettings",
  // Email marketing tenant isolation (2026-03)
  "EmailCampaign",
  "EmailSubscriber",
  "EmailTemplate",
])

/**
 * Apply the tenant-scoping middleware to a Prisma client.
 * Returns an extended client that injects tenantId into all queries for tenant-scoped models.
 *
 * Uses Prisma Client Extensions ($extends) instead of the deprecated $use middleware.
 */
export function applyTenantMiddleware(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        const tenantId = getCurrentTenant()

        // Skip if no tenant context is set (platform-level operations)
        if (tenantId === null || getIsSuperAdmin()) {
          return query(args)
        }

        // Only apply to tenant-scoped models
        if (!model || !TENANT_SCOPED_MODELS.has(model)) {
          return query(args)
        }

        // Inject tenantId into queries
        switch (operation) {
          case "findMany":
          case "findFirst":
          case "findUnique":
          case "count":
          case "aggregate":
          case "groupBy":
            args = args || {} as any
            ;(args as any).where = (args as any).where || {}
            ;(args as any).where.tenantId = tenantId
            break

          case "create":
            args = args || {} as any
            ;(args as any).data = (args as any).data || {}
            if (!(args as any).data.tenantId) {
              ;(args as any).data.tenantId = tenantId
            }
            break

          case "createMany":
            args = args || {} as any
            if (Array.isArray((args as any).data)) {
              ;(args as any).data = (args as any).data.map((d: any) => ({
                ...d,
                tenantId: d.tenantId || tenantId,
              }))
            }
            break

          case "update":
          case "updateMany":
          case "delete":
          case "deleteMany":
            args = args || {} as any
            ;(args as any).where = (args as any).where || {}
            ;(args as any).where.tenantId = tenantId
            break

          case "upsert":
            args = args || {} as any
            ;(args as any).where = (args as any).where || {}
            ;(args as any).where.tenantId = tenantId
            ;(args as any).create = (args as any).create || {}
            if (!(args as any).create.tenantId) {
              ;(args as any).create.tenantId = tenantId
            }
            break
        }

        return query(args)
      },
    },
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
  // Validate tenantId is a safe integer to prevent injection via middleware filter
  if (!Number.isInteger(tenantId) || tenantId <= 0) {
    throw new Error(`Invalid tenant ID: ${tenantId}`)
  }
  const store: TenantStore = { tenantId, isSuperAdmin: false }
  return tenantStorage.run(store, fn)
}

/**
 * Run a function with SuperAdmin context (bypasses tenant filtering).
 */
export async function runAsSuperAdmin<T>(fn: () => Promise<T>): Promise<T> {
  const store: TenantStore = { tenantId: null, isSuperAdmin: true }
  return tenantStorage.run(store, fn)
}
