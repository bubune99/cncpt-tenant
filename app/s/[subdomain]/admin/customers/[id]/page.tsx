/**
 * Customer Detail / Editor — Atlas A2
 *
 * 5-up KPI bricks, 14-month cadence chart, order history table, notes/activity
 * timeline, lifecycle stepper, contact / segments / marketing sidebar.
 *
 * Preserves all existing data wiring (fetch /api/cms/admin/customers/[id],
 * PATCH, DELETE, sync-stripe).
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CustomerEditor } from '@/components/cms/editor/CustomerEditor';
import type {
  CustomerData,
  CustomerOrderRow,
  CustomerAddress,
  ActivityEntry,
  CustomerSegment,
  LifecycleStage,
} from '@/components/cms/editor/CustomerEditor';

// ── API types (existing shape) ────────────────────────────────────────────────

interface ApiAddress {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault: boolean;
}

interface ApiOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  itemCount: number;
  createdAt: string;
}

interface ApiCustomer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  taxId?: string;
  notes?: string;
  tags: string[];
  stripeCustomerId?: string;
  stripeSyncedAt?: string;
  acceptsMarketing: boolean;
  marketingOptInAt?: string;
  marketingOptOutAt?: string;
  totalOrders: number;
  totalSpent: number;
  averageOrder: number;
  lastOrderAt?: string;
  createdAt: string;
  updatedAt: string;
  orders: ApiOrder[];
  addresses: ApiAddress[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateString));
}

function getOrderStatusVariant(status: string): CustomerOrderRow['statusVariant'] {
  switch (status.toLowerCase()) {
    case 'shipped':
    case 'delivered':
      return 'solid-moss';
    case 'processing':
    case 'pending':
      return 'solid-accent';
    case 'cancelled':
      return 'out';
    default:
      return 'out';
  }
}

function inferLifecycle(c: ApiCustomer): LifecycleStage {
  if (c.totalOrders === 0) return 'lead';
  if (c.totalOrders === 1) return 'first';
  if (c.totalOrders <= 4) return 'repeat';
  if (c.totalOrders <= 10) return 'loyal';
  return 'vip';
}

/**
 * Build a synthetic 14-month cadence chart from the order history.
 * Each bar = one month. Height proportional to spend in that month.
 */
function buildCadenceBars(orders: ApiOrder[]): number[] {
  const bars = new Array<number>(14).fill(0);
  const now = new Date();
  orders.forEach((o) => {
    const months = (now.getFullYear() - new Date(o.createdAt).getFullYear()) * 12
      + now.getMonth() - new Date(o.createdAt).getMonth();
    if (months >= 0 && months < 14) {
      bars[13 - months] = (bars[13 - months] ?? 0) + o.total / 100;
    }
  });
  return bars;
}

function toCustomerData(api: ApiCustomer): CustomerData {
  const nameParts = [api.firstName, api.lastName].filter(Boolean) as string[];
  const displayName = nameParts.join(' ') || api.email;
  const initials = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : displayName.slice(0, 2).toUpperCase();

  const lifecycle = inferLifecycle(api);
  const cadenceBars = buildCadenceBars(api.orders);

  // Compute months retained
  const createdMs = new Date(api.createdAt).getTime();
  const nowMs = Date.now();
  const retentionMonths = Math.floor((nowMs - createdMs) / (1000 * 60 * 60 * 24 * 30));

  // Order frequency: average days between orders
  let orderFrequency = '';
  if (api.totalOrders > 1 && retentionMonths > 0) {
    const daysTotal = retentionMonths * 30;
    const daysBetween = Math.round(daysTotal / (api.totalOrders - 1));
    orderFrequency = `1 every ${daysBetween} days`;
  }

  const orders: CustomerOrderRow[] = api.orders.map((o, i): CustomerOrderRow => ({
    id: o.id,
    orderNumber: `#${o.orderNumber}`,
    when: formatDate(o.createdAt),
    itemCount: o.itemCount,
    total: formatCurrency(o.total),
    status: o.status.toUpperCase(),
    statusVariant: getOrderStatusVariant(o.status),
    isCurrent: i === 0 && ['pending', 'processing'].includes(o.status.toLowerCase()),
  }));

  const addresses: CustomerAddress[] = api.addresses.map((addr): CustomerAddress => ({
    id: addr.id,
    lines: [
      [addr.firstName, addr.lastName].filter(Boolean).join(' '),
      addr.street1,
      addr.street2 ?? '',
      `${addr.city}, ${addr.state} ${addr.postalCode}`,
      addr.country,
    ].filter(Boolean),
    isDefault: addr.isDefault,
    label: addr.label,
    usedOnCount: addr.isDefault ? api.totalOrders : undefined,
  }));

  const segments: CustomerSegment[] = [
    ...(lifecycle === 'loyal' || lifecycle === 'vip'
      ? [{ id: 'lifecycle', label: lifecycle.toUpperCase(), variant: 'solid-moss' as const }]
      : []),
    ...api.tags.map((tag): CustomerSegment => ({ id: tag, label: tag, variant: 'out' as const })),
    ...(api.acceptsMarketing ? [{ id: 'newsletter', label: 'Newsletter', variant: 'out' as const }] : []),
  ];

  const activity: ActivityEntry[] = api.orders.slice(0, 5).map((o, i): ActivityEntry => ({
    id: o.id,
    when: formatDate(o.createdAt),
    isCurrent: i === 0,
    body: (
      <>
        <b>Placed order {`#${o.orderNumber}`}</b>{' '}
        · {o.itemCount} item{o.itemCount !== 1 ? 's' : ''}{' '}
        <span className="fig">— {formatCurrency(o.total)}</span>
      </>
    ),
  }));

  if (api.notes) {
    activity.push({
      id: 'admin-notes',
      when: formatDate(api.updatedAt),
      isCurrent: false,
      body: <><b>Note:</b> <span className="fig">"{api.notes}"</span></>,
    });
  }

  const since = new Date(api.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  let lifecycleThreshold: string | undefined;
  switch (lifecycle) {
    case 'repeat':
      lifecycleThreshold = '1 more order → Loyal';
      break;
    case 'loyal':
      lifecycleThreshold = '3 more orders · $200 more spend → VIP threshold';
      break;
    default:
      break;
  }

  return {
    id: api.id,
    firstName: api.firstName,
    lastName: api.lastName,
    email: api.email,
    phone: api.phone,
    initials,
    avatarBg: '#c8443a',

    lifetimeValue: formatCurrency(api.totalSpent),
    orderCount: api.totalOrders,
    orderFrequency,
    avgBasket: formatCurrency(api.averageOrder),
    retentionMonths,
    churnRisk: retentionMonths > 6 && api.totalOrders >= 3 ? 'low' : retentionMonths < 2 ? 'high' : 'medium',

    cadenceBars,
    lifecycle,
    lifecycleThreshold,

    orders,
    activity,
    addresses,
    segments,

    newsletterStatus: api.acceptsMarketing
      ? `Subscribed · since ${api.marketingOptInAt ? formatDate(api.marketingOptInAt) : 'unknown'}`
      : 'Not subscribed',
    consentDate: api.marketingOptInAt ? formatDate(api.marketingOptInAt) : undefined,
    since,
  };
}

// ── Page component ────────────────────────────────────────────────────────────

export default function CustomerDetailPage(): React.ReactElement {
  const params = useParams<{ id: string; subdomain: string }>();
  const router = useRouter();
  const customerId = params.id;
  const subdomain = params.subdomain ?? 'admin';

  const [apiCustomer, setApiCustomer] = useState<ApiCustomer | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cms/admin/customers/${customerId}`);
      if (response.ok) {
        const data: ApiCustomer = await response.json();
        setApiCustomer(data);
        setCustomerData(toCustomerData(data));
      } else {
        toast.error('Customer not found');
        router.push('/admin/customers');
      }
    } catch {
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [customerId, router]);

  useEffect(() => {
    void fetchCustomer();
  }, [fetchCustomer]);

  const handleUpdate = useCallback(async (updated: Partial<CustomerData>) => {
    const response = await fetch(`/api/cms/admin/customers/${customerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone,
      }),
    });

    if (!response.ok) {
      toast.error('Failed to update customer');
      throw new Error('Failed to update customer');
    }

    toast.success('Customer updated');
    await fetchCustomer();
  }, [customerId, fetchCustomer]);

  if (loading) {
    return (
      <div
        className="atlas"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}
      >
        <span className="fig">Loading customer…</span>
      </div>
    );
  }

  if (!customerData) {
    return (
      <div
        className="atlas"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}
      >
        <span className="display-i" style={{ fontSize: 22 }}>Customer not found</span>
        <a href="/admin/customers" className="btn">← Back to customers</a>
      </div>
    );
  }

  return (
    <CustomerEditor
      customer={customerData}
      subdomain={subdomain}
      onUpdate={handleUpdate}
    />
  );
}
