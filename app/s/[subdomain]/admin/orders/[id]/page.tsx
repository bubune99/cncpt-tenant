'use client';

/**
 * Order detail — Grainy layout over real order data.
 *
 * Fetches the order (GET /api/cms/orders/[id]) and its per-line fulfillment
 * steps (GET /api/cms/orders/[id]/fulfillment), then drives real mutations:
 *   • sub-step toggle → POST /fulfillment?action=complete-step
 *   • ship           → PUT /api/cms/orders/[id] { status: 'SHIPPED' }
 *   • add note       → PUT /api/cms/orders/[id] { internalNotes }
 * The workflow stage stepper (OrderProgress) is preserved and injected into the
 * Order tab so no stage-management capability is lost.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { OrderProgress } from '@/components/cms/admin/orders/OrderProgress';
import { OrderDetail, type DetailLineItem, type DetailTimelineEntry, type OrderDetailModel } from '@/components/cms/admin/orders/order-detail';
import type { OrderStatus, PaymentStatus } from '@/components/cms/admin/orders/orders-model';
import { money } from '@/components/cms/admin/orders/orders-model';

// ── API shapes (only the fields we consume) ──────────────────────────────────

interface ApiStage { id: string; name: string; displayName: string; customerMessage?: string | null; icon?: string | null; color?: string | null; position: number; isTerminal: boolean }
interface ApiProgress { id: string; stageId: string; enteredAt: string; exitedAt?: string | null; source: string; isOverride: boolean; reason?: string | null; notes?: string | null; stage: ApiStage; updatedBy?: { id: string; name?: string | null; email?: string | null } | null }
interface ApiAttachment { name: string; url: string; mimeType: string; size: number }
interface ApiItem {
  id: string; title: string; variantTitle?: string | null; sku?: string | null;
  quantity: number; price: number; total: number;
  configOptions?: Record<string, string> | null;
  attachments?: ApiAttachment[] | null;
  product?: { title: string; slug: string } | null;
  variant?: { sku?: string | null } | null;
}
interface ApiShipment { id: string; carrier?: string | null; service?: string | null; trackingNumber?: string | null; trackingUrl?: string | null; labelUrl?: string | null; status: string; shippedAt?: string | null; createdAt: string }
interface ApiOrder {
  id: string; orderNumber: string; email: string; status: string; paymentStatus: string; paidAt?: string | null;
  subtotal: number; shippingTotal: number; taxTotal: number; discountTotal: number; total: number;
  customerNotes?: string | null; internalNotes?: string | null;
  createdAt: string; updatedAt: string;
  customer?: { id: string; firstName?: string | null; lastName?: string | null; email?: string | null } | null;
  items: ApiItem[];
  shipments?: ApiShipment[];
  progress?: ApiProgress[];
  workflow?: { id: string; name: string; enableShippoSync: boolean; stages: ApiStage[] } | null;
  currentStage?: ApiStage | null;
  trackingAutoSync?: boolean;
}
interface ApiStep { id: string; orderItemId?: string; name: string; position: number; completed: boolean; notes?: string | null }
interface ApiFulfillmentItem { id: string; fulfillmentSteps: ApiStep[]; configOptions?: Record<string, string> | null; attachments?: ApiAttachment[] | null }
interface ApiFulfillment { id: string; items: ApiFulfillmentItem[] }

// ── Helpers ───────────────────────────────────────────────────────────────────

function bytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
function kindOf(mime: string): string {
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('svg')) return 'SVG';
  if (mime.startsWith('image/')) return 'IMG';
  if (mime.includes('zip')) return 'ZIP';
  return mime.split('/').pop()?.toUpperCase() ?? 'FILE';
}

function buildModel(order: ApiOrder, fulfillment: ApiFulfillment | null): OrderDetailModel {
  const stepsByItem = new Map<string, ApiStep[]>();
  fulfillment?.items.forEach((fi) => stepsByItem.set(fi.id, fi.fulfillmentSteps));

  const items: DetailLineItem[] = order.items.map((it) => {
    const steps = stepsByItem.get(it.id) ?? [];
    const configOptions = it.configOptions
      ? Object.entries(it.configOptions).map(([key, value]) => ({ key, value: String(value) }))
      : undefined;
    const attachments = it.attachments && it.attachments.length > 0
      ? it.attachments.map((a, i) => ({ id: `${it.id}-att-${i}`, name: a.name, size: bytes(a.size), kind: kindOf(a.mimeType), url: a.url }))
      : undefined;
    const hasCustomWork = (configOptions?.length ?? 0) > 0 || (attachments?.length ?? 0) > 0;
    return {
      id: it.id,
      sku: it.variant?.sku ?? it.sku ?? '',
      name: it.title || it.product?.title || 'Item',
      qty: it.quantity,
      lineTotalCents: it.total,
      configOptions,
      attachments,
      hasCustomWork,
      subSteps: steps.map((s) => ({ id: s.id, label: s.name, done: s.completed, hint: s.notes ?? undefined })),
    };
  });

  const timeline: DetailTimelineEntry[] = [];
  timeline.push({ id: 'placed', at: order.createdAt, kind: 'placed', title: 'Order placed', meta: `${order.items.length} items · ${money(order.total)}` });
  if (order.paidAt) timeline.push({ id: 'paid', at: order.paidAt, kind: 'payment', title: 'Payment captured', meta: order.paymentStatus });
  (order.progress ?? []).forEach((p) =>
    timeline.push({
      id: p.id,
      at: p.enteredAt,
      kind: 'stage',
      title: `Moved to ${p.stage.displayName}`,
      meta: [p.source, p.updatedBy?.name || p.updatedBy?.email].filter(Boolean).join(' · ') || undefined,
    }),
  );
  (order.shipments ?? []).forEach((s) =>
    timeline.push({
      id: s.id,
      at: s.shippedAt ?? s.createdAt,
      kind: 'ship',
      title: `Shipment ${s.status.toLowerCase().replace(/_/g, ' ')}`,
      meta: [s.carrier, s.trackingNumber].filter(Boolean).join(' · ') || undefined,
    }),
  );
  timeline.sort((a, b) => +new Date(a.at) - +new Date(b.at));

  const ship = order.shipments?.[0];
  const name = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(' ').trim();

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customer?.id,
    customerName: name || order.customer?.email || order.email || 'Guest',
    customerEmail: order.customer?.email || order.email || '',
    placedAt: order.createdAt,
    status: order.status.toUpperCase() as OrderStatus,
    paymentStatus: order.paymentStatus.toUpperCase() as PaymentStatus,
    items,
    totals: [
      { label: 'Subtotal', cents: order.subtotal },
      { label: 'Shipping', cents: order.shippingTotal },
      { label: 'Tax', cents: order.taxTotal },
      ...(order.discountTotal ? [{ label: 'Discount', cents: -order.discountTotal }] : []),
    ],
    grandTotalCents: order.total,
    hasCustomWork: items.some((i) => i.hasCustomWork),
    shipment: ship
      ? { carrier: ship.carrier ?? undefined, service: ship.service ?? undefined, trackingNumber: ship.trackingNumber ?? undefined, trackingUrl: ship.trackingUrl ?? undefined, labelUrl: ship.labelUrl ?? undefined, status: ship.status }
      : undefined,
    timeline,
    internalNotes: order.internalNotes ?? undefined,
    customerNotes: order.customerNotes ?? undefined,
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OrderDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { buildPath } = useCMSConfig();
  const orderId = params.id;

  const [apiOrder, setApiOrder] = useState<ApiOrder | null>(null);
  const [fulfillment, setFulfillment] = useState<ApiFulfillment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, fRes] = await Promise.all([
        fetch(`/api/cms/orders/${orderId}`),
        fetch(`/api/cms/orders/${orderId}/fulfillment`),
      ]);
      if (orderRes.status === 404) {
        toast.error('Order not found');
        router.push(buildPath('/admin/orders'));
        return;
      }
      if (!orderRes.ok) throw new Error(`Order fetch failed (${orderRes.status})`);
      const { order } = (await orderRes.json()) as { order: ApiOrder };
      setApiOrder(order);
      if (fRes.ok) {
        const fData = (await fRes.json()) as { success: boolean; data: ApiFulfillment };
        setFulfillment(fData.success ? fData.data : null);
      } else {
        setFulfillment(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load order';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [orderId, router, buildPath]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const model = useMemo(() => (apiOrder ? buildModel(apiOrder, fulfillment) : null), [apiOrder, fulfillment]);

  const handleToggleStep = useCallback(
    async (itemId: string, stepId: string): Promise<void> => {
      const fi = fulfillment?.items.find((i) => i.id === itemId);
      const step = fi?.fulfillmentSteps.find((s) => s.id === stepId);
      const next = !(step?.completed ?? false);

      // optimistic
      setFulfillment((prev) =>
        prev
          ? { ...prev, items: prev.items.map((i) => (i.id !== itemId ? i : { ...i, fulfillmentSteps: i.fulfillmentSteps.map((s) => (s.id === stepId ? { ...s, completed: next } : s)) })) }
          : prev,
      );

      const res = await fetch(`/api/cms/orders/${orderId}/fulfillment?action=complete-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, completed: next }),
      });
      if (!res.ok) {
        // revert
        setFulfillment((prev) =>
          prev
            ? { ...prev, items: prev.items.map((i) => (i.id !== itemId ? i : { ...i, fulfillmentSteps: i.fulfillmentSteps.map((s) => (s.id === stepId ? { ...s, completed: !next } : s)) })) }
            : prev,
        );
        toast.error('Failed to update step');
      }
    },
    [fulfillment, orderId],
  );

  const handleShip = useCallback(async (): Promise<void> => {
    const res = await fetch(`/api/cms/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'SHIPPED' }),
    });
    if (res.ok) {
      toast.success('Order marked as shipped');
      await loadAll();
    } else {
      toast.error('Failed to update shipping status');
    }
  }, [orderId, loadAll]);

  const handleAddNote = useCallback(
    async (note: string): Promise<void> => {
      const existing = apiOrder?.internalNotes?.trim();
      const combined = existing ? `${existing}\n${note}` : note;
      const res = await fetch(`/api/cms/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: combined }),
      });
      if (res.ok) {
        toast.success('Note added');
        setApiOrder((prev) => (prev ? { ...prev, internalNotes: combined } : prev));
      } else {
        toast.error('Failed to add note');
      }
    },
    [orderId, apiOrder],
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <span className="gr-eyebrow">Loading order…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
        <span className="gr-eyebrow" style={{ color: 'var(--rust-700)' }}>Error loading order</span>
        <span style={{ fontSize: 15 }}>{error}</span>
        <button type="button" className="btn btn-secondary" onClick={() => void loadAll()}>Retry</button>
      </div>
    );
  }
  if (!model || !apiOrder) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
        <span style={{ fontSize: 18 }}>Order not found</span>
      </div>
    );
  }

  return (
    <OrderDetail
      order={model}
      buildPath={buildPath}
      onBack={() => router.push(buildPath('/admin/orders'))}
      onToggleStep={handleToggleStep}
      onShip={handleShip}
      onAddNote={handleAddNote}
      workflowSlot={
        apiOrder.workflow ? (
          <div className="gr-card" style={{ padding: '16px 18px' }}>
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
        ) : null
      }
    />
  );
}
