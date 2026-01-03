/**
 * Event Bus System
 *
 * Pub/sub event system for triggering workflows based on system events.
 * Supports event filtering, priority-based handlers, and async execution.
 */

import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db';
import type {
  WorkflowEvent,
  WorkflowEventType,
  EventSubscription,
} from './types';

// =============================================================================
// EVENT BUS SINGLETON
// =============================================================================

class EventBus {
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private eventHistory: WorkflowEvent[] = [];
  private maxHistorySize = 1000;

  /**
   * Subscribe to events
   */
  subscribe(subscription: Omit<EventSubscription, 'id'>): string {
    const id = uuidv4();
    const fullSubscription: EventSubscription = { ...subscription, id };

    const eventTypes = Array.isArray(subscription.eventType)
      ? subscription.eventType
      : [subscription.eventType];

    for (const eventType of eventTypes) {
      const existing = this.subscriptions.get(eventType) || [];
      existing.push(fullSubscription);
      // Sort by priority (higher first)
      existing.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      this.subscriptions.set(eventType, existing);
    }

    return id;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    let found = false;

    for (const [eventType, subs] of this.subscriptions.entries()) {
      const filtered = subs.filter((s) => s.id !== subscriptionId);
      if (filtered.length !== subs.length) {
        found = true;
        this.subscriptions.set(eventType, filtered);
      }
    }

    return found;
  }

  /**
   * Emit an event
   */
  async emit<T = unknown>(
    type: WorkflowEventType,
    data: T,
    metadata?: WorkflowEvent['metadata']
  ): Promise<void> {
    const event: WorkflowEvent<T> = {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      data,
      metadata,
    };

    // Add to history
    this.eventHistory.push(event as WorkflowEvent);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Get subscribers for this event type
    const subscribers = this.subscriptions.get(type) || [];
    const wildcardSubscribers = this.subscriptions.get('*') || [];
    const allSubscribers = [...subscribers, ...wildcardSubscribers];

    // Execute handlers
    for (const subscription of allSubscribers) {
      try {
        // Apply filter if present
        if (subscription.filter && !subscription.filter(event as WorkflowEvent)) {
          continue;
        }

        await subscription.handler(event as WorkflowEvent);
      } catch (error) {
        console.error(`[EventBus] Handler error for ${type}:`, error);
      }
    }

    // Trigger workflows configured for this event
    await this.triggerEventWorkflows(event as WorkflowEvent);
  }

  /**
   * Emit event without waiting for handlers (fire-and-forget)
   */
  emitAsync<T = unknown>(
    type: WorkflowEventType,
    data: T,
    metadata?: WorkflowEvent['metadata']
  ): void {
    this.emit(type, data, metadata).catch((error) => {
      console.error(`[EventBus] Async emit error for ${type}:`, error);
    });
  }

  /**
   * Get recent events
   */
  getHistory(limit = 100): WorkflowEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get subscriptions for debugging
   */
  getSubscriptions(): Map<string, EventSubscription[]> {
    return new Map(this.subscriptions);
  }

  /**
   * Clear all subscriptions (for testing)
   */
  clearSubscriptions(): void {
    this.subscriptions.clear();
  }

  /**
   * Trigger workflows configured for EVENT trigger type
   */
  private async triggerEventWorkflows(event: WorkflowEvent): Promise<void> {
    try {
      // Find enabled workflows with EVENT trigger that match this event type
      const workflows = await prisma.workflow.findMany({
        where: {
          enabled: true,
          triggerType: 'EVENT',
        },
      });

      for (const workflow of workflows) {
        const triggerConfig = workflow.triggerConfig as Record<string, unknown> | null;
        if (!triggerConfig) continue;

        const eventTypes = triggerConfig.eventTypes as string[] | undefined;
        if (!eventTypes || !eventTypes.includes(event.type)) continue;

        // Check event filter if present
        const filter = triggerConfig.filter as Record<string, unknown> | undefined;
        if (filter && !this.matchesFilter(event.data, filter)) continue;

        // Queue workflow execution (import dynamically to avoid circular deps)
        const { executeWorkflow } = await import('./engine');
        executeWorkflow(workflow.id, {
          triggeredBy: 'event',
          eventData: event,
        }).catch((error) => {
          console.error(`[EventBus] Workflow execution error for ${workflow.id}:`, error);
        });
      }
    } catch (error) {
      console.error('[EventBus] Error triggering event workflows:', error);
    }
  }

  /**
   * Check if data matches a filter object
   */
  private matchesFilter(data: unknown, filter: Record<string, unknown>): boolean {
    if (!data || typeof data !== 'object') return false;

    const dataObj = data as Record<string, unknown>;

    for (const [key, value] of Object.entries(filter)) {
      const dataValue = this.getNestedValue(dataObj, key);

      if (typeof value === 'object' && value !== null) {
        // Handle operators like $eq, $gt, $in, etc.
        const ops = value as Record<string, unknown>;
        if ('$eq' in ops && dataValue !== ops.$eq) return false;
        if ('$neq' in ops && dataValue === ops.$neq) return false;
        if ('$gt' in ops && (typeof dataValue !== 'number' || dataValue <= (ops.$gt as number))) return false;
        if ('$gte' in ops && (typeof dataValue !== 'number' || dataValue < (ops.$gte as number))) return false;
        if ('$lt' in ops && (typeof dataValue !== 'number' || dataValue >= (ops.$lt as number))) return false;
        if ('$lte' in ops && (typeof dataValue !== 'number' || dataValue > (ops.$lte as number))) return false;
        if ('$in' in ops && !Array.isArray(ops.$in)) return false;
        if ('$in' in ops && !(ops.$in as unknown[]).includes(dataValue)) return false;
        if ('$contains' in ops && (typeof dataValue !== 'string' || !dataValue.includes(ops.$contains as string))) return false;
        if ('$exists' in ops && (ops.$exists ? dataValue === undefined : dataValue !== undefined)) return false;
      } else {
        // Simple equality check
        if (dataValue !== value) return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const eventBus = new EventBus();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Emit an event (convenience function)
 */
export function emit<T = unknown>(
  type: WorkflowEventType,
  data: T,
  metadata?: WorkflowEvent['metadata']
): Promise<void> {
  return eventBus.emit(type, data, metadata);
}

/**
 * Emit an event without waiting (convenience function)
 */
export function emitAsync<T = unknown>(
  type: WorkflowEventType,
  data: T,
  metadata?: WorkflowEvent['metadata']
): void {
  eventBus.emitAsync(type, data, metadata);
}

/**
 * Subscribe to events (convenience function)
 */
export function subscribe(subscription: Omit<EventSubscription, 'id'>): string {
  return eventBus.subscribe(subscription);
}

/**
 * Unsubscribe from events (convenience function)
 */
export function unsubscribe(subscriptionId: string): boolean {
  return eventBus.unsubscribe(subscriptionId);
}

// =============================================================================
// PREDEFINED EVENT EMITTERS
// =============================================================================

export const events = {
  // Order events
  order: {
    created: (order: unknown) => emit('order.created', order),
    paid: (order: unknown) => emit('order.paid', order),
    shipped: (order: unknown, shipment?: unknown) => emit('order.shipped', { order, shipment }),
    delivered: (order: unknown) => emit('order.delivered', order),
    cancelled: (order: unknown, reason?: string) => emit('order.cancelled', { order, reason }),
    refunded: (order: unknown, refund?: unknown) => emit('order.refunded', { order, refund }),
  },

  // User events
  user: {
    created: (user: unknown) => emit('user.created', user),
    updated: (user: unknown, changes?: unknown) => emit('user.updated', { user, changes }),
    deleted: (userId: string) => emit('user.deleted', { userId }),
    subscribed: (user: unknown, list?: string) => emit('user.subscribed', { user, list }),
    unsubscribed: (user: unknown, list?: string) => emit('user.unsubscribed', { user, list }),
  },

  // Product events
  product: {
    created: (product: unknown) => emit('product.created', product),
    updated: (product: unknown, changes?: unknown) => emit('product.updated', { product, changes }),
    deleted: (productId: string) => emit('product.deleted', { productId }),
    lowStock: (product: unknown, threshold: number) => emit('product.low_stock', { product, threshold }),
    outOfStock: (product: unknown) => emit('product.out_of_stock', product),
  },

  // Content events
  content: {
    pageCreated: (page: unknown) => emit('page.created', page),
    pagePublished: (page: unknown) => emit('page.published', page),
    pageUpdated: (page: unknown) => emit('page.updated', page),
    blogCreated: (post: unknown) => emit('blog.created', post),
    blogPublished: (post: unknown) => emit('blog.published', post),
    blogUpdated: (post: unknown) => emit('blog.updated', post),
  },

  // Payment events
  payment: {
    succeeded: (payment: unknown) => emit('payment.succeeded', payment),
    failed: (payment: unknown, error?: string) => emit('payment.failed', { payment, error }),
    subscriptionCreated: (subscription: unknown) => emit('subscription.created', subscription),
    subscriptionCancelled: (subscription: unknown) => emit('subscription.cancelled', subscription),
  },

  // Form events
  form: {
    submitted: (form: unknown, data: unknown) => emit('form.submitted', { form, data }),
    contactCreated: (contact: unknown) => emit('contact.created', contact),
  },

  // Webhook events
  webhook: {
    received: (source: string, payload: unknown) => emit('webhook.received', { source, payload }),
  },

  // Custom events
  custom: (eventType: string, data: unknown) => emit(eventType, data),
};
