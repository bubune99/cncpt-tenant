/**
 * Agent Governance — Tool Registry
 *
 * Single source of truth describing every built-in AI tool the chat agent can
 * call: which business domain it belongs to, which RBAC permission it requires,
 * whether it mutates state, and whether it is high-risk (always needs approval).
 *
 * The model-facing tool NAME (the key used in the assembled `allTools` object,
 * e.g. `createPage`, `navigate_to_route`) is the key here. Tools NOT listed
 * here (dynamic VMCP/MCP tools) are passed through unguarded — they self-govern
 * via their own `needsApproval` (see src/lib/vmcp/tools.ts).
 */

import type { AuditAction } from '@/lib/cms/permissions/types'
import type { AgentToolDomain } from './types'

export interface ToolMeta {
  /** Business/pseudo domain this tool belongs to. */
  domain: AgentToolDomain
  /** RBAC permission required to use it (checked for reads AND writes). */
  permission?: string
  /** True if the tool changes persistent state (DB / Stripe / settings). */
  mutation: boolean
  /** True if it must always require approval (delete/refund/publish/settings). */
  highRisk?: boolean
  /** Audit-log action recorded on a successful mutation. */
  audit?: AuditAction
  /** True for navigation tools, gated by AgentSettings.navigationEnabled. */
  navigation?: boolean
}

export const TOOL_REGISTRY: Record<string, ToolMeta> = {
  // --- Navigation (gated by navigationEnabled) ---
  navigateTo: { domain: 'navigation', mutation: false, navigation: true },
  navigate_to_route: { domain: 'navigation', mutation: false, navigation: true },

  // --- Visual / meta (never mutate persistent state) ---
  spotlight_steps: { domain: 'meta', mutation: false },
  scan_page: { domain: 'meta', mutation: false },

  // --- Reads (RBAC-gated, never mutate, never need approval) ---
  searchProducts: { domain: 'read', permission: 'products.view', mutation: false },
  searchOrders: { domain: 'read', permission: 'orders.view', mutation: false },
  getDashboardStats: { domain: 'read', mutation: false },
  getRecentActivity: { domain: 'read', mutation: false },
  getEntityDetails: { domain: 'read', mutation: false },
  searchEntities: { domain: 'read', mutation: false },
  getEntityStats: { domain: 'read', mutation: false },

  // --- Pages ---
  createPage: { domain: 'pages', permission: 'pages.create', mutation: true, audit: 'page.create' },
  updatePage: { domain: 'pages', permission: 'pages.edit', mutation: true, audit: 'page.update' },
  duplicatePage: { domain: 'pages', permission: 'pages.create', mutation: true, audit: 'page.create' },
  deletePage: { domain: 'pages', permission: 'pages.delete', mutation: true, highRisk: true, audit: 'page.delete' },
  publishPage: { domain: 'pages', permission: 'pages.publish', mutation: true, highRisk: true, audit: 'page.update' },

  // --- Products ---
  createProduct: { domain: 'products', permission: 'products.create', mutation: true, audit: 'product.create' },
  updateProduct: { domain: 'products', permission: 'products.edit', mutation: true, audit: 'product.update' },
  manageProductVariant: { domain: 'products', permission: 'products.edit', mutation: true, audit: 'product.update' },
  syncProductToStripe: { domain: 'products', permission: 'products.edit', mutation: true, audit: 'product.update' },
  deleteProduct: { domain: 'products', permission: 'products.delete', mutation: true, highRisk: true, audit: 'product.delete' },

  // --- Blog ---
  createBlogPost: { domain: 'blog', permission: 'blog.create', mutation: true, audit: 'blog.create' },
  updateBlogPost: { domain: 'blog', permission: 'blog.edit', mutation: true, audit: 'blog.update' },
  manageBlogCategory: { domain: 'blog', permission: 'blog.edit', mutation: true, audit: 'blog.update' },
  manageBlogTag: { domain: 'blog', permission: 'blog.edit', mutation: true, audit: 'blog.update' },
  deleteBlogPost: { domain: 'blog', permission: 'blog.delete', mutation: true, highRisk: true, audit: 'blog.delete' },
  publishBlogPost: { domain: 'blog', permission: 'blog.publish', mutation: true, highRisk: true, audit: 'blog.publish' },

  // --- Orders ---
  updateOrderStatus: { domain: 'orders', permission: 'orders.edit', mutation: true, audit: 'order.update' },
  fulfillOrder: { domain: 'orders', permission: 'orders.fulfill', mutation: true, audit: 'order.fulfill' },
  refundOrder: { domain: 'orders', permission: 'orders.refund', mutation: true, highRisk: true, audit: 'order.refund' },
  cancelOrder: { domain: 'orders', permission: 'orders.cancel', mutation: true, highRisk: true, audit: 'order.cancel' },

  // --- Settings (all high-risk) ---
  updateSettings: { domain: 'settings', permission: 'settings.general', mutation: true, highRisk: true, audit: 'settings.update' },
  updateBrandingSettings: { domain: 'settings', permission: 'settings.general', mutation: true, highRisk: true, audit: 'site_settings.update' },
  updateSiteSettings: { domain: 'settings', permission: 'settings.general', mutation: true, highRisk: true, audit: 'site_settings.update' },
}

/** Pseudo-domains that are never subject to the admin domain allowlist. */
const UNGATED_DOMAINS = new Set<AgentToolDomain>(['read', 'meta', 'navigation'])

export function isAllowlistGatedDomain(domain: AgentToolDomain): boolean {
  return !UNGATED_DOMAINS.has(domain)
}
