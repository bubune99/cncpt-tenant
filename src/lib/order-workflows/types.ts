/**
 * Order Workflow Types
 *
 * Type definitions for the order progress management system
 */

// =============================================================================
// SHIPPO EVENT TYPES
// =============================================================================

export type ShippoTrackingEvent =
  | 'PRE_TRANSIT'
  | 'TRANSIT'
  | 'DELIVERED'
  | 'RETURNED'
  | 'FAILURE'
  | 'UNKNOWN'

// =============================================================================
// PROGRESS SOURCE TYPES
// =============================================================================

export type ProgressSource = 'manual' | 'shippo' | 'system' | 'webhook'

// =============================================================================
// WORKFLOW TYPES
// =============================================================================

export interface WorkflowStageInput {
  name: string
  slug: string
  displayName: string
  customerMessage?: string
  icon?: string
  color?: string
  position: number
  isTerminal?: boolean
  notifyCustomer?: boolean
  estimatedDuration?: number
  shippoEventTrigger?: ShippoTrackingEvent | null
}

export interface WorkflowCreateInput {
  name: string
  slug: string
  description?: string
  isDefault?: boolean
  isActive?: boolean
  enableShippoSync?: boolean
  stages?: WorkflowStageInput[]
}

export interface WorkflowUpdateInput {
  name?: string
  slug?: string
  description?: string
  isDefault?: boolean
  isActive?: boolean
  enableShippoSync?: boolean
}

export interface StageUpdateInput {
  name?: string
  slug?: string
  displayName?: string
  customerMessage?: string
  icon?: string
  color?: string
  position?: number
  isTerminal?: boolean
  notifyCustomer?: boolean
  estimatedDuration?: number
  shippoEventTrigger?: ShippoTrackingEvent | null
}

// =============================================================================
// PROGRESS TYPES
// =============================================================================

export interface ProgressTransitionInput {
  orderId: string
  stageId: string
  source?: ProgressSource
  isOverride?: boolean
  reason?: string
  updatedById?: string
  notes?: string
}

export interface ProgressRevertInput {
  orderId: string
  targetStageId: string
  reason: string
  updatedById?: string
  notes?: string
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

export interface WorkflowWithStages {
  id: string
  name: string
  slug: string
  description: string | null
  isDefault: boolean
  isActive: boolean
  enableShippoSync: boolean
  createdAt: Date
  updatedAt: Date
  stages: WorkflowStage[]
}

export interface WorkflowStage {
  id: string
  workflowId: string
  name: string
  slug: string
  displayName: string
  customerMessage: string | null
  icon: string | null
  color: string | null
  position: number
  isTerminal: boolean
  notifyCustomer: boolean
  estimatedDuration: number | null
  shippoEventTrigger: string | null
  createdAt: Date
  updatedAt: Date
}

export interface OrderProgressEntry {
  id: string
  orderId: string
  stageId: string
  enteredAt: Date
  exitedAt: Date | null
  source: string
  isOverride: boolean
  reason: string | null
  updatedById: string | null
  notes: string | null
  createdAt: Date
  stage: WorkflowStage
  updatedBy?: {
    id: string
    name: string | null
    email: string
  } | null
}

export interface OrderWithProgress {
  id: string
  orderNumber: string
  workflowId: string | null
  currentStageId: string | null
  trackingAutoSync: boolean
  workflow: WorkflowWithStages | null
  currentStage: WorkflowStage | null
  progress: OrderProgressEntry[]
}

// =============================================================================
// CUSTOMER-FACING TYPES
// =============================================================================

export interface CustomerProgressView {
  orderId: string
  orderNumber: string
  currentStage: {
    displayName: string
    customerMessage: string | null
    icon: string | null
    color: string | null
    isTerminal: boolean
  } | null
  stages: {
    displayName: string
    icon: string | null
    color: string | null
    isCompleted: boolean
    isCurrent: boolean
    completedAt: Date | null
  }[]
  estimatedDelivery: Date | null
}

// =============================================================================
// DEFAULT WORKFLOW TEMPLATES
// =============================================================================

export interface WorkflowTemplate {
  name: string
  slug: string
  description: string
  enableShippoSync: boolean
  stages: WorkflowStageInput[]
}

export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    name: 'Standard Shipping',
    slug: 'standard-shipping',
    description: 'Default workflow for physical products requiring shipping',
    enableShippoSync: true,
    stages: [
      {
        name: 'order_received',
        slug: 'order-received',
        displayName: 'Order Received',
        customerMessage: "We've received your order and are preparing it for processing.",
        icon: 'inbox',
        color: '#3B82F6',
        position: 0,
        notifyCustomer: true,
        estimatedDuration: 24,
        shippoEventTrigger: null,
      },
      {
        name: 'processing',
        slug: 'processing',
        displayName: 'Processing',
        customerMessage: "Your order is being prepared and will be shipped soon.",
        icon: 'package',
        color: '#F59E0B',
        position: 1,
        notifyCustomer: true,
        estimatedDuration: 48,
        shippoEventTrigger: 'PRE_TRANSIT',
      },
      {
        name: 'shipped',
        slug: 'shipped',
        displayName: 'Shipped',
        customerMessage: "Great news! Your order is on its way.",
        icon: 'truck',
        color: '#8B5CF6',
        position: 2,
        notifyCustomer: true,
        estimatedDuration: 72,
        shippoEventTrigger: 'TRANSIT',
      },
      {
        name: 'delivered',
        slug: 'delivered',
        displayName: 'Delivered',
        customerMessage: "Your order has been delivered. Thank you for shopping with us!",
        icon: 'check-circle',
        color: '#10B981',
        position: 3,
        isTerminal: true,
        notifyCustomer: true,
        shippoEventTrigger: 'DELIVERED',
      },
    ],
  },
  {
    name: 'Digital Download',
    slug: 'digital-download',
    description: 'Workflow for digital products with instant delivery',
    enableShippoSync: false,
    stages: [
      {
        name: 'order_received',
        slug: 'order-received',
        displayName: 'Order Received',
        customerMessage: "We've received your order.",
        icon: 'inbox',
        color: '#3B82F6',
        position: 0,
        notifyCustomer: true,
        estimatedDuration: 1,
      },
      {
        name: 'ready',
        slug: 'ready',
        displayName: 'Ready for Download',
        customerMessage: "Your files are ready! Check your email for download links.",
        icon: 'download',
        color: '#10B981',
        position: 1,
        isTerminal: true,
        notifyCustomer: true,
      },
    ],
  },
  {
    name: 'Custom Order',
    slug: 'custom-order',
    description: 'Workflow for made-to-order or customized products',
    enableShippoSync: true,
    stages: [
      {
        name: 'order_received',
        slug: 'order-received',
        displayName: 'Order Received',
        customerMessage: "We've received your custom order request.",
        icon: 'inbox',
        color: '#3B82F6',
        position: 0,
        notifyCustomer: true,
        estimatedDuration: 24,
      },
      {
        name: 'design_review',
        slug: 'design-review',
        displayName: 'Design Review',
        customerMessage: "Our team is reviewing your customization details.",
        icon: 'eye',
        color: '#6366F1',
        position: 1,
        notifyCustomer: true,
        estimatedDuration: 48,
      },
      {
        name: 'in_production',
        slug: 'in-production',
        displayName: 'In Production',
        customerMessage: "Your custom item is being crafted with care.",
        icon: 'hammer',
        color: '#F59E0B',
        position: 2,
        notifyCustomer: true,
        estimatedDuration: 120,
        shippoEventTrigger: 'PRE_TRANSIT',
      },
      {
        name: 'quality_check',
        slug: 'quality-check',
        displayName: 'Quality Check',
        customerMessage: "Your item is undergoing final quality inspection.",
        icon: 'shield-check',
        color: '#8B5CF6',
        position: 3,
        notifyCustomer: true,
        estimatedDuration: 24,
      },
      {
        name: 'shipped',
        slug: 'shipped',
        displayName: 'Shipped',
        customerMessage: "Your custom order is on its way!",
        icon: 'truck',
        color: '#EC4899',
        position: 4,
        notifyCustomer: true,
        estimatedDuration: 72,
        shippoEventTrigger: 'TRANSIT',
      },
      {
        name: 'delivered',
        slug: 'delivered',
        displayName: 'Delivered',
        customerMessage: "Your custom order has been delivered. Enjoy!",
        icon: 'check-circle',
        color: '#10B981',
        position: 5,
        isTerminal: true,
        notifyCustomer: true,
        shippoEventTrigger: 'DELIVERED',
      },
    ],
  },
  {
    name: 'Local Pickup',
    slug: 'local-pickup',
    description: 'Workflow for in-store or local pickup orders',
    enableShippoSync: false,
    stages: [
      {
        name: 'order_received',
        slug: 'order-received',
        displayName: 'Order Received',
        customerMessage: "We've received your order.",
        icon: 'inbox',
        color: '#3B82F6',
        position: 0,
        notifyCustomer: true,
        estimatedDuration: 24,
      },
      {
        name: 'preparing',
        slug: 'preparing',
        displayName: 'Preparing',
        customerMessage: "We're preparing your order for pickup.",
        icon: 'package',
        color: '#F59E0B',
        position: 1,
        notifyCustomer: true,
        estimatedDuration: 24,
      },
      {
        name: 'ready_for_pickup',
        slug: 'ready-for-pickup',
        displayName: 'Ready for Pickup',
        customerMessage: "Your order is ready! Come pick it up at your convenience.",
        icon: 'map-pin',
        color: '#10B981',
        position: 2,
        notifyCustomer: true,
        estimatedDuration: 168, // 7 days
      },
      {
        name: 'picked_up',
        slug: 'picked-up',
        displayName: 'Picked Up',
        customerMessage: "Thank you for picking up your order!",
        icon: 'check-circle',
        color: '#10B981',
        position: 3,
        isTerminal: true,
        notifyCustomer: true,
      },
    ],
  },
]
