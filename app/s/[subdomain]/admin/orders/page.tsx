'use client';

/**
 * Orders — Grainy fulfillment queue.
 *
 * List · Cards · Kanban over the real /api/cms/orders payload. Stage filters,
 * bulk actions, kanban drag, and row actions all drive real mutations
 * (PUT /api/cms/orders/[id] for status changes). Columns and stats are limited
 * to fields the order model actually provides.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Table, LayoutGrid, Columns3, Download, Plus, ShoppingBag, DollarSign, Truck, Printer, Tag, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { Btn, Eyebrow, LiveSearch, Segment, StatCard, type SegmentOption } from '@/components/cms/admin/orders/orders-ui';
import { OrdersListTable } from '@/components/cms/admin/orders/orders-list-table';
import { OrdersKanban } from '@/components/cms/admin/orders/orders-kanban';
import { OrderCard } from '@/components/cms/admin/orders/order-card';
import {
  STAGES,
  money,
  stageToStatus,
  statusToStage,
  toOrderRow,
  type OrderRow,
  type RawOrder,
  type Stage,
} from '@/components/cms/admin/orders/orders-model';

type ViewMode = 'list' | 'cards' | 'kanban';
type StageFilter = 'All' | Stage;

async function updateStatus(id: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/cms/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default function OrdersPage(): React.ReactElement {
  const { user } = useAuth();
  const { buildPath } = useCMSConfig();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [stage, setStage] = useState<StageFilter>('All');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/orders?limit=200');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { orders?: RawOrder[] };
      setOrders((data.orders ?? []).map(toOrderRow));
    } catch {
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const searched = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(term) ||
        o.customerName.toLowerCase().includes(term) ||
        o.customerEmail.toLowerCase().includes(term),
    );
  }, [orders, q]);

  const rows = useMemo(
    () => (stage === 'All' ? searched : searched.filter((o) => statusToStage(o.status) === stage)),
    [searched, stage],
  );

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STAGES.forEach((s) => {
      counts[s] = searched.filter((o) => statusToStage(o.status) === s).length;
    });
    return counts;
  }, [searched]);

  const stats = useMemo(() => {
    const open = orders.filter((o) => o.status === 'PENDING' || o.status === 'PROCESSING').length;
    const collected = orders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.totalCents, 0);
    const shipped = orders.filter((o) => o.status === 'SHIPPED').length;
    return { open, collected, shipped };
  }, [orders]);

  // ── selection ──
  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const allOn = rows.length > 0 && rows.every((o) => sel.has(o.id));
  const toggleAll = () =>
    setSel((s) => {
      const n = new Set(s);
      if (allOn) rows.forEach((o) => n.delete(o.id));
      else rows.forEach((o) => n.add(o.id));
      return n;
    });

  const openOrder = (id: string) => router.push(buildPath(`/admin/orders/${id}`));

  // ── mutations ──
  const cancelOne = useCallback(async (id: string) => {
    const ok = await updateStatus(id, 'CANCELLED');
    if (ok) {
      toast.success('Order cancelled');
      void fetchOrders();
    } else {
      toast.error('Failed to cancel order');
    }
  }, [fetchOrders]);

  const bulkStatus = useCallback(
    async (status: string, verb: string) => {
      const ids = [...sel];
      if (ids.length === 0) return;
      const results = await Promise.all(ids.map((id) => updateStatus(id, status)));
      const done = results.filter(Boolean).length;
      if (done > 0) toast.success(`${done} order${done === 1 ? '' : 's'} ${verb}`);
      if (done < ids.length) toast.error(`${ids.length - done} failed`);
      setSel(new Set());
      void fetchOrders();
    },
    [sel, fetchOrders],
  );

  const moveStage = useCallback(
    (id: string, from: Stage, to: Stage): boolean => {
      if (to === 'Shipped' && from === 'New') {
        toast.error('Move to In progress before shipping');
        return false;
      }
      // optimistic: reflect the new status immediately, reconcile on refetch
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: stageToStatus(to) } : o)));
      void (async () => {
        const ok = await updateStatus(id, stageToStatus(to));
        if (ok) toast.success(`#${orders.find((o) => o.id === id)?.orderNumber ?? id} → ${to}`);
        else {
          toast.error('Failed to move order');
        }
        void fetchOrders();
      })();
      return true;
    },
    [orders, fetchOrders],
  );

  const exportCsv = useCallback(() => {
    const header = ['Order', 'Customer', 'Email', 'Items', 'Total', 'Payment', 'Status', 'Placed'];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = rows.map((o) =>
      [o.orderNumber, o.customerName, o.customerEmail, String(o.itemUnits), money(o.totalCents), o.paymentStatus, o.status, o.createdAt]
        .map(escape)
        .join(','),
    );
    const blob = new Blob([[header.map(escape).join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} orders · CSV`);
  }, [rows]);

  const viewOptions: readonly SegmentOption<ViewMode>[] = [
    { value: 'list', label: 'List', icon: Table },
    { value: 'cards', label: 'Cards', icon: LayoutGrid },
    { value: 'kanban', label: 'Kanban', icon: Columns3 },
  ];
  const stageOptions: readonly SegmentOption<StageFilter>[] = [
    { value: 'All', label: `All ${searched.length}` },
    ...STAGES.map((s): SegmentOption<StageFilter> => ({ value: s, label: `${s} ${stageCounts[s] ?? 0}` })),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }} data-tour-id="orders-page">
      <div style={{ padding: '18px 26px 0', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }} data-tour-id="orders-heading">
          <div>
            <Eyebrow>Fulfillment · today</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
              <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.015em' }}>Orders</h2>
              <span className="gr-num" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{orders.length} total</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Segment options={viewOptions} value={view} onChange={setView} />
            <Btn icon={Download} onClick={exportCsv}>Export</Btn>
            <Link href={buildPath('/admin/orders/new')} data-tour-id="orders-create-button">
              <Btn kind="primary" icon={Plus}>New order</Btn>
            </Link>
          </div>
        </div>

        {view !== 'kanban' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0 4px' }}>
            <StatCard icon={ShoppingBag} value={stats.open} label="Open orders" note="need fulfillment" />
            <StatCard icon={DollarSign} value={money(stats.collected)} label="Collected" note="paid orders" />
            <StatCard icon={Truck} value={stats.shipped} label="Shipped" note="in transit" />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 12px', flexWrap: 'wrap' }}>
          {view !== 'kanban' ? (
            <Segment options={stageOptions} value={stage} onChange={setStage} />
          ) : (
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Drag a card between columns to advance fulfillment.</span>
          )}
          <div style={{ marginLeft: 'auto' }} data-tour-id="orders-search-input">
            <LiveSearch value={q} onChange={setQ} placeholder="Filter orders…" width={210} />
          </div>
        </div>

        {sel.size > 0 && view !== 'kanban' && (
          <div style={{ marginBottom: 12 }}>
            <div className="bulkbar">
              <span className="count"><b>{sel.size}</b> selected</span>
              <span className="bb-sep" />
              <button type="button" className="bb-btn" onClick={() => void bulkStatus('SHIPPED', 'marked shipped')}>
                <Truck size={15} />Mark shipped
              </button>
              <button type="button" className="bb-btn" disabled title="Coming soon" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <Printer size={15} />Print slips
              </button>
              <button type="button" className="bb-btn" disabled title="Coming soon" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                <Tag size={15} />Tag
              </button>
              <span className="bb-sep" />
              <button type="button" className="bb-btn danger" onClick={() => void bulkStatus('CANCELLED', 'cancelled')}>
                <X size={15} />Cancel
              </button>
              <button type="button" className="bb-close bb-btn" onClick={() => setSel(new Set())} aria-label="Clear selection">
                <X size={15} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: '0 26px 22px', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <span className="gr-eyebrow">Loading…</span>
          </div>
        ) : view === 'list' ? (
          <OrdersListTable rows={rows} selected={sel} onToggle={toggle} onToggleAll={toggleAll} onOpen={openOrder} onCancel={(id) => void cancelOne(id)} />
        ) : view === 'cards' ? (
          <div className="gr-scroll" style={{ flex: 1, minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, paddingBottom: 8 }}>
              {rows.map((o) => (
                <OrderCard key={o.id} order={o} onClick={() => openOrder(o.id)} />
              ))}
            </div>
          </div>
        ) : (
          <OrdersKanban rows={searched} onOpen={openOrder} onMove={moveStage} />
        )}
      </div>
    </div>
  );
}
