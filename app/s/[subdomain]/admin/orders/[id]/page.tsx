/**
 * Order Detail / Editor — Atlas A2
 *
 * Per-line-item sub-fulfillment checkoffs, configurable items with attachments,
 * aggregate progress strip, Ship disabled until all sub-tasks complete.
 *
 * Wires real fulfillment steps from GET /api/cms/orders/[id]/fulfillment and
 * persists step toggles via POST /api/cms/orders/[id]/fulfillment?action=complete-step.
 * Stage moves are wired via PATCH /api/cms/orders/[id]/stage.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { OrderEditor } from '@/components/cms/editor/OrderEditor';
import { OrderProgress } from '@/components/cms/admin/orders/OrderProgress';
import type {
  OrderData,
  OrderLineItem,
  SubStep,
  SubStepState,
  OrderAttachment,
  ConfigOption,
} from '@/components/cms/editor/OrderEditor';

// ── API types (existing order shape) ─────────────────────────────────────────

interface ApiOrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  thumbnail: string;
}

interface ApiWorkflowStage {
  id: string;
  name: string;
  displayName: string;
  customerMessage?: string | null;
  icon?: string | null;
  color?: string | null;
  position: number;
  isTerminal: boolean;
}

interface ApiProgressEntry {
  id: string;
  stageId: string;
  enteredAt: string;
  exitedAt?: string | null;
  source: string;
  isOverride: boolean;
  reason?: string | null;
  notes?: string | null;
  stage: ApiWorkflowStage;
  updatedBy?: { id: string; name?: string | null; email?: string | null } | null;
}

interface ApiOrder {
  id: string;
  orderNumber: string;
  customer: { id: string; name: string; email: string; phone: string };
  items: ApiOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: { name: string; street: string; city: string; state: string; zip: string; country: string };
  notes: string;
  trackingNumber: string;
  trackingAutoSync?: boolean;
  workflow?: { id: string; name: string; enableShippoSync: boolean; stages: ApiWorkflowStage[] } | null;
  currentStage?: ApiWorkflowStage | null;
  progress?: ApiProgressEntry[];
  createdAt: string;
  updatedAt: string;
}

// ── Fulfillment API types (G01 — GET /api/cms/orders/[id]/fulfillment) ────────

interface ApiFulfillmentStep {
  readonly id: string;
  readonly orderItemId: string;
  readonly name: string;
  readonly position: number;
  readonly completed: boolean;
  readonly completedAt: string | null;
  readonly completedBy: string | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Raw configOption value stored as JSON: Record<string, string> */
type ApiConfigOptions = Record<string, string> | null;

/** Single attachment stored in JSON array */
interface ApiAttachment {
  readonly name: string;
  readonly url: string;
  readonly mimeType: string;
  readonly size: number;
}

interface ApiFulfillmentItem {
  readonly id: string;
  readonly title: string;
  readonly variantTitle: string | null;
  readonly quantity: number;
  readonly configOptions: ApiConfigOptions;
  readonly attachments: readonly ApiAttachment[] | null;
  readonly fulfillmentSteps: readonly ApiFulfillmentStep[];
}

interface ApiFulfillmentOrder {
  readonly id: string;
  readonly orderNumber: string;
  readonly status: string;
  readonly items: readonly ApiFulfillmentItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateString));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeToKind(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('svg')) return 'SVG';
  if (mimeType.startsWith('image/')) return 'IMG';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'ZIP';
  return mimeType.split('/').pop()?.toUpperCase() ?? 'FILE';
}

/**
 * Merge fulfillment steps from the fulfillment endpoint into the base order
 * items that came from the order endpoint, producing the final OrderLineItem[].
 *
 * If no fulfillment data is available for an item, falls back to three
 * deterministic pending steps (Pick / Inspect / Pack).
 */
function mergeItemsWithFulfillment(
  apiItems: readonly ApiOrderItem[],
  fulfillmentItems: readonly ApiFulfillmentItem[],
): OrderLineItem[] {
  const fulfillmentById = new Map<string, ApiFulfillmentItem>(
    fulfillmentItems.map((fi) => [fi.id, fi]),
  );

  return apiItems.map((item, idx): OrderLineItem => {
    const fi = fulfillmentById.get(item.id);

    const subSteps: readonly SubStep[] = fi && fi.fulfillmentSteps.length > 0
      ? fi.fulfillmentSteps.map((step): SubStep => ({
          id: step.id,
          label: step.name,
          state: step.completed ? ('done' as SubStepState) : ('pending' as SubStepState),
          hint: step.notes ?? undefined,
        }))
      : [
          { id: `${item.id}-pick`, label: 'Pick', state: 'pending' as SubStepState, hint: `— shelf ${String.fromCharCode(65 + (idx % 3))}-${idx + 1}` },
          { id: `${item.id}-inspect`, label: 'Inspect', state: 'pending' as SubStepState },
          { id: `${item.id}-pack`, label: 'Pack', state: 'pending' as SubStepState },
        ];

    const configOptions: readonly ConfigOption[] | undefined =
      fi?.configOptions != null
        ? Object.entries(fi.configOptions).map(([key, value]) => ({ key, value }))
        : undefined;

    const attachments: readonly OrderAttachment[] | undefined =
      fi?.attachments != null && fi.attachments.length > 0
        ? fi.attachments.map((a, ai): OrderAttachment => ({
            id: `${item.id}-att-${ai}`,
            name: a.name,
            size: formatBytes(a.size),
            kind: mimeToKind(a.mimeType),
            url: a.url,
          }))
        : undefined;

    const hasCustomWork =
      (configOptions != null && configOptions.length > 0) ||
      (attachments != null && attachments.length > 0);

    return {
      id: item.id,
      sku: item.sku,
      name: fi?.title ?? item.name,
      qty: item.quantity,
      unitPrice: formatCurrency(item.price),
      lineTotal: formatCurrency(item.price * item.quantity),
      kind: hasCustomWork ? 'CONFIGURABLE' : 'STANDARD',
      configOptions,
      attachments,
      subSteps,
    };
  });
}

/** Map API order + optional fulfillment data to OrderEditor's OrderData shape. */
function toOrderData(
  apiOrder: ApiOrder,
  fulfillmentOrder: ApiFulfillmentOrder | null,
): OrderData {
  const items = mergeItemsWithFulfillment(
    apiOrder.items,
    fulfillmentOrder?.items ?? [],
  );

  const nameParts = apiOrder.customer.name.trim().split(/\s+/);
  const initials =
    nameParts.length >= 2
      ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      : apiOrder.customer.name.slice(0, 2).toUpperCase();

  const addr = apiOrder.shippingAddress;
  const hasCustomWork = items.some((it) => it.kind === 'CONFIGURABLE');

  return {
    id: apiOrder.id,
    orderNumber: `#${apiOrder.orderNumber}`,
    placedAt: formatDate(apiOrder.createdAt),
    customer: {
      id: apiOrder.customer.id,
      name: apiOrder.customer.name,
      email: apiOrder.customer.email,
      phone: apiOrder.customer.phone || undefined,
      initials,
      avatarBg: '#c8443a',
    },
    items,
    totals: [
      { label: 'Subtotal', value: formatCurrency(apiOrder.subtotal) },
      { label: 'Shipping', value: formatCurrency(apiOrder.shipping) },
      { label: 'Tax', value: formatCurrency(apiOrder.tax) },
    ],
    grandTotal: formatCurrency(apiOrder.total),
    paymentCapture: `${apiOrder.paymentStatus} · ${apiOrder.paymentMethod}`,
    status: apiOrder.status,
    paymentStatus: apiOrder.paymentStatus,
    hasCustomWork,
    shipping: {
      addressLines: [
        addr.name,
        addr.street,
        `${addr.city}, ${addr.state} ${addr.zip}`,
        addr.country,
      ],
      verified: false,
      carrier: undefined,
      eta: undefined,
      labelGenerated: false,
    },
    notes: apiOrder.notes
      ? [{ author: 'Admin', time: formatDate(apiOrder.updatedAt), body: apiOrder.notes }]
      : [],
    tags: [],
  };
}

// ── Page component ────────────────────────────────────────────────────────────

export default function OrderDetailPage(): React.ReactElement {
  const params = useParams<{ id: string; subdomain: string }>();
  const router = useRouter();
  const orderId = params.id;
  const subdomain = params.subdomain ?? 'admin';

  const [apiOrder, setApiOrder] = useState<ApiOrder | null>(null);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [fulfillmentOrder, setFulfillmentOrder] = useState<ApiFulfillmentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch base order data
  const fetchOrder = useCallback(async (): Promise<ApiOrder | null> => {
    const response = await fetch(`/api/cms/orders/${orderId}`);
    if (!response.ok) {
      if (response.status === 404) {
        toast.error('Order not found');
        router.push('/admin/orders');
        return null;
      }
      throw new Error(`Order fetch failed: ${response.status}`);
    }
    const data: { order: ApiOrder } = await response.json();
    return data.order;
  }, [orderId, router]);

  // Fetch real fulfillment steps from G01 endpoint
  const fetchFulfillment = useCallback(async (): Promise<ApiFulfillmentOrder | null> => {
    const response = await fetch(`/api/cms/orders/${orderId}/fulfillment`);
    if (!response.ok) {
      // Non-fatal: fall back to deterministic placeholder steps
      return null;
    }
    const data: { success: boolean; data: ApiFulfillmentOrder } = await response.json();
    return data.success ? data.data : null;
  }, [orderId]);

  const loadAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setFetchError(null);
    try {
      const [order, fulfillment] = await Promise.all([fetchOrder(), fetchFulfillment()]);
      if (order == null) return; // redirected by fetchOrder
      setApiOrder(order);
      setFulfillmentOrder(fulfillment);
      setOrderData(toOrderData(order, fulfillment));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load order';
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [fetchOrder, fetchFulfillment]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  /**
   * Toggle a fulfillment step.
   *
   * Called by OrderEditor after it applies the optimistic update.
   * If this throws, OrderEditor reverts its optimistic state.
   *
   * The current toggle state is determined by finding the step in the current
   * fulfillmentOrder snapshot. We compute the next completed value from the
   * step's current DB state (not the optimistic UI state) so that even rapid
   * double-toggles converge correctly.
   */
  const handleStepToggle = useCallback(async (itemId: string, stepId: string): Promise<void> => {
    // Determine current DB completed state from fulfillment snapshot
    let currentCompleted = false;
    if (fulfillmentOrder != null) {
      const fi = fulfillmentOrder.items.find((i) => i.id === itemId);
      if (fi != null) {
        const step = fi.fulfillmentSteps.find((s) => s.id === stepId);
        if (step != null) {
          currentCompleted = step.completed;
        }
      }
    }
    const nextCompleted = !currentCompleted;

    const response = await fetch(
      `/api/cms/orders/${orderId}/fulfillment?action=complete-step`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, completed: nextCompleted }),
      },
    );

    if (!response.ok) {
      const errBody: unknown = await response.json().catch(() => ({}));
      const errMsg =
        typeof errBody === 'object' &&
        errBody !== null &&
        'error' in errBody &&
        typeof (errBody as Record<string, unknown>).error === 'string'
          ? (errBody as Record<string, string>).error
          : 'Failed to update step';
      throw new Error(errMsg);
    }

    const result: { success: boolean; data: ApiFulfillmentStep } = await response.json();

    // Update fulfillment snapshot so future toggles have the correct base state
    setFulfillmentOrder((prev): ApiFulfillmentOrder | null => {
      if (prev == null) return prev;
      return {
        ...prev,
        items: prev.items.map((fi): ApiFulfillmentItem =>
          fi.id !== itemId
            ? fi
            : {
                ...fi,
                fulfillmentSteps: fi.fulfillmentSteps.map((s): ApiFulfillmentStep =>
                  s.id !== stepId ? s : { ...s, completed: result.data.completed, completedAt: result.data.completedAt },
                ),
              },
        ),
      };
    });
  }, [orderId, fulfillmentOrder]);

  const handleShip = useCallback(async (): Promise<void> => {
    const response = await fetch(`/api/cms/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'shipped' }),
    });
    if (response.ok) {
      toast.success('Order marked as shipped');
      await loadAll();
    } else {
      toast.error('Failed to update shipping status');
    }
  }, [orderId, loadAll]);

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="atlas"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="eyebrow"
            style={{
              animation: 'pulse 1.4s ease-in-out infinite',
              fontSize: 11,
              letterSpacing: '0.1em',
            }}
          >
            Loading order…
          </div>
          <div
            style={{
              width: 240,
              height: 4,
              background: 'var(--rule)',
              borderRadius: 2,
              marginTop: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '40%',
                height: '100%',
                background: 'var(--ink)',
                animation: 'shimmer 1.2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (fetchError != null) {
    return (
      <div
        className="atlas"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 12,
        }}
      >
        <span className="eyebrow" style={{ color: 'var(--accent)' }}>Error loading order</span>
        <span className="display-i" style={{ fontSize: 18 }}>{fetchError}</span>
        <button className="btn btn-sm" onClick={() => void loadAll()}>Retry</button>
        <a href="/admin/orders" className="btn btn-sm">← Back to orders</a>
      </div>
    );
  }

  // ── Empty / not-found state ───────────────────────────────────────────────

  if (orderData == null || apiOrder == null) {
    return (
      <div
        className="atlas"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          gap: 12,
        }}
      >
        <span className="display-i" style={{ fontSize: 22 }}>Order not found</span>
        <a href="/admin/orders" className="btn">← Back to orders</a>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <OrderEditor
        order={orderData}
        subdomain={subdomain}
        onStepToggle={handleStepToggle}
        onShip={handleShip}
      />

      {/* Existing OrderProgress widget preserved for workflow integration */}
      {apiOrder.workflow != null && (
        <div style={{ padding: '0 32px 18px' }}>
          <OrderProgress
            orderId={apiOrder.id}
            orderNumber={apiOrder.orderNumber}
            workflow={apiOrder.workflow}
            currentStage={apiOrder.currentStage ?? null}
            progress={apiOrder.progress ?? []}
            trackingAutoSync={apiOrder.trackingAutoSync ?? true}
            onUpdate={loadAll}
          />
        </div>
      )}
    </div>
  );
}
