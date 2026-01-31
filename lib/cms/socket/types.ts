/**
 * Socket.io Types
 *
 * Shared types for WebSocket communication between client and server.
 */

// Entity types that can be tracked
export type EntityType =
  | 'product'
  | 'order'
  | 'customer'
  | 'page'
  | 'blogPost'
  | 'workflow'
  | 'form'
  | 'media'
  | 'setting'
  | 'emailCampaign'
  | 'shippingMethod'
  | 'role'
  | 'user'

/**
 * Entity Context
 *
 * Represents the current context of what the user is viewing/doing.
 * Sent via WebSocket whenever the user navigates or interacts.
 */
export interface EntityContext {
  // Current location
  route: string // /admin/products/123
  section: string // 'products' | 'orders' | 'customers' | etc.

  // Entity information
  entityType: EntityType | null
  entityId: string | null

  // Nested context (for detail pages with sub-resources)
  parentContext?: {
    entityType: EntityType
    entityId: string
  }

  // UI state
  selectedIds?: string[] // Multi-select in tables
  filters?: Record<string, unknown> // Active filters
  searchQuery?: string // Current search
  modalOpen?: string // Active modal ID
  tabActive?: string // Active tab in tabbed interfaces

  // Metadata
  timestamp: number
  sessionId: string
}

/**
 * Help Click Event
 *
 * Sent when user clicks a help element in help mode.
 */
export interface HelpClickEvent {
  helpKey: string
  context: EntityContext
  elementRect?: {
    top: number
    left: number
    width: number
    height: number
  }
}

/**
 * Socket Events - Client to Server
 */
export interface ClientToServerEvents {
  'context:update': (context: EntityContext) => void
  'help:element-click': (data: HelpClickEvent) => void
  'chat:context-response': (data: {
    context: EntityContext | null
    lastHelpClick: HelpClickEvent | null
  }) => void
}

/**
 * Help Content Update Event
 *
 * Sent when AI updates help content via tools.
 */
export interface HelpContentUpdateEvent {
  elementKey: string
  action: 'created' | 'updated' | 'deleted'
  title?: string
  summary?: string
  source: 'ai' | 'admin'
  timestamp: number
}

/**
 * Socket Events - Server to Client
 */
export interface ServerToClientEvents {
  'help:context-received': (data: { helpKey: string }) => void
  'help:content-updated': (data: HelpContentUpdateEvent) => void
  'chat:context-request': () => void
  'ai:suggestion': (data: { message: string; action?: string }) => void
}

/**
 * Socket Data stored per connection
 */
export interface SocketData {
  userId?: string
  context?: EntityContext
  lastHelpClick?: HelpClickEvent
  connectedAt: number
}

/**
 * Map section names to entity types
 */
export const sectionToEntityType: Record<string, EntityType> = {
  products: 'product',
  orders: 'order',
  customers: 'customer',
  pages: 'page',
  blog: 'blogPost',
  workflows: 'workflow',
  forms: 'form',
  media: 'media',
  settings: 'setting',
  'email-marketing': 'emailCampaign',
  shipping: 'shippingMethod',
  roles: 'role',
  users: 'user',
}

/**
 * Parse a route path into EntityContext
 */
export function parseRouteToContext(
  pathname: string,
  searchParams?: URLSearchParams,
  sessionId?: string
): EntityContext {
  const segments = pathname.split('/').filter(Boolean)
  // /admin/products/123 -> ['admin', 'products', '123']

  const context: EntityContext = {
    route: pathname,
    section: segments[1] || 'dashboard',
    entityType: null,
    entityId: null,
    timestamp: Date.now(),
    sessionId: sessionId || 'unknown',
  }

  // Determine entity type from section
  if (segments[1] && sectionToEntityType[segments[1]]) {
    context.entityType = sectionToEntityType[segments[1]]

    // Check for entity ID (skip 'new' as it's not an ID)
    if (segments[2] && segments[2] !== 'new') {
      context.entityId = segments[2]
    }

    // Check for nested context (e.g., /admin/orders/123/items/456)
    if (segments[3] && segments[4] && segments[4] !== 'new') {
      const nestedSection = segments[3]
      if (sectionToEntityType[nestedSection]) {
        context.parentContext = {
          entityType: context.entityType,
          entityId: context.entityId!,
        }
        context.entityType = sectionToEntityType[nestedSection]
        context.entityId = segments[4]
      }
    }
  }

  // Parse search params if provided
  if (searchParams) {
    const filters: Record<string, unknown> = {}
    searchParams.forEach((value, key) => {
      if (key === 'q') {
        context.searchQuery = value
      } else if (key === 'tab') {
        context.tabActive = value
      } else {
        filters[key] = value
      }
    })
    if (Object.keys(filters).length > 0) {
      context.filters = filters
    }
  }

  return context
}
