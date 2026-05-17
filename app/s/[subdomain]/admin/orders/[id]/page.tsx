/**
 * Order Detail / Editor — Atlas A2
 *
 * Per-line-item sub-fulfillment checkoffs, configurable items with attachments,
 * aggregate progress strip, Ship disabled until all sub-tasks complete.
 *
 * Preserves all existing data wiring (OrderProgress, fetch /api/cms/orders/[id]).
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

// ── API types (existing shape) ────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateString));
}

/** Map API order to OrderEditor's OrderData shape. */
function toOrderData(apiOrder: ApiOrder): OrderData {
  const items: OrderLineItem[] = apiOrder.items.map((item, idx): OrderLineItem => {
    // Generate deterministic sub-steps based on item kind
    // In production these would come from the workflow config
    const steps: SubStep[] = [
      { id: `${item.id}-pick`, label: 'Pick', state: 'pending', hint: `— shelf ${String.fromCharCode(65 + (idx % 3))}-${idx + 1}` },
      { id: `${item.id}-inspect`, label: 'Inspect', state: 'pending' },
      { id: `${item.id}-pack`, label: 'Pack', state: 'pending' },
    ];

    return {
      id: item.id,
      sku: item.sku,
      name: item.name,
      qty: item.quantity,
      unitPrice: formatCurrency(item.price),
      lineTotal: formatCurrency(item.price * item.quantity),
      kind: 'STANDARD',
      subSteps: steps,
    };
  });

  // Build initials from customer name
  const nameParts = apiOrder.customer.name.trim().split(/\s+/);
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : apiOrder.customer.name.slice(0, 2).toUpperCase();

  const addr = apiOrder.shippingAddress;

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
    hasCustomWork: false,
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
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cms/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        const order: ApiOrder = data.order;
        setApiOrder(order);
        setOrderData(toOrderData(order));
      } else {
        toast.error('Order not found');
        router.push('/admin/orders');
      }
    } catch {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId, router]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const handleStepToggle = useCallback(async (itemId: string, stepId: string) => {
    // Persist step toggle via API when endpoint is available
    // For now the optimistic update in OrderEditor is the source of truth
    // until a sub-fulfillment API is added.
    await Promise.resolve();
  }, []);

  const handleShip = useCallback(async () => {
    try {
      const response = await fetch(`/api/cms/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'shipped' }),
      });
      if (response.ok) {
        toast.success('Order marked as shipped');
        await fetchOrder();
      } else {
        toast.error('Failed to update shipping status');
      }
    } catch {
      toast.error('Failed to ship order');
    }
  }, [orderId, fetchOrder]);

  if (loading) {
    return (
      <div
        className="atlas"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}
      >
        <span className="fig">Loading order…</span>
      </div>
    );
  }

  if (!orderData || !apiOrder) {
    return (
      <div
        className="atlas"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}
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
      {apiOrder.workflow && (
        <div style={{ padding: '0 32px 18px' }}>
          <OrderProgress
            orderId={apiOrder.id}
            orderNumber={apiOrder.orderNumber}
            workflow={apiOrder.workflow}
            currentStage={apiOrder.currentStage ?? null}
            progress={apiOrder.progress ?? []}
            trackingAutoSync={apiOrder.trackingAutoSync ?? true}
            onUpdate={fetchOrder}
          />
        </div>
      )}
    </div>
  );
}
