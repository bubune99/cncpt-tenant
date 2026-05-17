'use client';

/**
 * Orders list — Atlas Board / Ledger toggle
 *
 * Faithful port of atlas-v2-pages.jsx Orders() + OrdersBoard() + OrdersLedger()
 * Preserves all existing data wiring: fetch /api/cms/orders, status badges,
 * bulk-select, filtering. Board view adds kanban lanes on top of live data.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { useCMSConfig } from '@/contexts/CMSConfigContext';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'paid' | 'pending' | 'refunded';
type ViewMode = 'board' | 'ledger';

interface Order {
  readonly id: string;
  readonly orderNumber: string;
  readonly customer: { readonly name: string; readonly email: string };
  readonly items: number;
  readonly total: number;
  readonly status: OrderStatus;
  readonly paymentStatus: PaymentStatus;
  readonly createdAt: string;
  readonly shippingAddress: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const STATUS_PILL: Record<OrderStatus, string> = {
  pending:    'pill-solid-accent',
  processing: 'pill-solid-gold',
  shipped:    'pill-solid-moss',
  delivered:  'pill-solid-ink',
  cancelled:  'pill-out-accent',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending:    'NEW',
  processing: 'PACKED',
  shipped:    'SHIPPED',
  delivered:  'DONE',
  cancelled:  'CANCEL',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────
// Board (kanban) view
// ─────────────────────────────────────────────

interface BoardProps {
  readonly orders: readonly Order[];
}

function OrdersBoard({ orders }: BoardProps) {
  const lanes: readonly { key: OrderStatus; label: string; italic: string; alert: boolean }[] = [
    { key: 'pending',    label: 'New',     italic: 'awaiting',   alert: false },
    { key: 'processing', label: 'Packed',  italic: 'ready',      alert: false },
    { key: 'shipped',    label: 'Shipped', italic: 'in transit', alert: false },
    { key: 'cancelled',  label: 'Issue',   italic: 'stuck',      alert: true  },
  ] as const;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0, alignItems: 'flex-start' }}>
        {lanes.map((lane, i) => {
          const cards = orders.filter(o => o.status === lane.key);
          return (
            <div
              key={lane.key}
              style={{ padding: '0 14px', borderLeft: i ? '1px solid var(--rule)' : 'none' }}
            >
              <div className="kbn-lane-h">
                <span className="display" style={{ fontSize: 22 }}>
                  {lane.alert && <span className="accent">⚑ </span>}
                  {lane.label}
                </span>
                <span className="fig" style={{ fontSize: 13, marginLeft: 'auto' }}>
                  {cards.length} {lane.italic}
                </span>
              </div>

              {cards.length === 0 && (
                <div className="fig" style={{ fontSize: 12, padding: '8px 0', color: 'var(--ink-faint)' }}>
                  No orders
                </div>
              )}

              {cards.map(o => (
                <div
                  key={o.id}
                  className={'kbn-card' + (lane.alert ? ' alert' : '')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <span className="mono accent" style={{ fontSize: 12 }}>{o.orderNumber}</span>
                    <span className="fig" style={{ fontSize: 11 }}>{formatDate(o.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{o.customer.name}</div>
                  <div className="fig" style={{ fontSize: 12 }}>{o.shippingAddress}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8, paddingTop: 6, borderTop: '1px solid var(--rule-soft)' }}>
                    <span className="fig" style={{ fontSize: 11 }}>{o.items} item{o.items !== 1 ? 's' : ''}</span>
                    <span className="mono" style={{ fontSize: 12 }}>{formatCurrency(o.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="action-bar">
        <span><span className="kbd">↑↓ →</span>move card</span>
        <span><span className="kbd">Enter</span>open</span>
        <span><span className="kbd">P</span>pack &amp; ship</span>
        <span><span className="kbd">R</span>refund</span>
        <span className="right mono" style={{ fontSize: 10 }}>
          {new Date().toISOString().slice(0,16).replace('T',' ')} UTC
        </span>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Ledger (table) view
// ─────────────────────────────────────────────

interface LedgerProps {
  readonly orders: readonly Order[];
  readonly selectedIds: readonly string[];
  readonly onSelectAll: (checked: boolean) => void;
  readonly onSelectOne: (id: string, checked: boolean) => void;
  readonly activeTab: string;
  readonly onTabChange: (tab: string) => void;
}

function OrdersLedger({ orders, selectedIds, onSelectAll, onSelectOne, activeTab, onTabChange }: LedgerProps) {
  const tabs: readonly (readonly [string, string, number])[] = [
    ['all',        'All',       orders.length],
    ['pending',    'New',       orders.filter(o => o.status === 'pending').length],
    ['processing', 'Packed',    orders.filter(o => o.status === 'processing').length],
    ['shipped',    'Shipped',   orders.filter(o => o.status === 'shipped').length],
    ['delivered',  'Delivered', orders.filter(o => o.status === 'delivered').length],
    ['cancelled',  'Issue',     orders.filter(o => o.status === 'cancelled').length],
  ] as const;

  const visible = activeTab === 'all' ? orders : orders.filter(o => o.status === activeTab);

  return (
    <>
      {/* Filter tabs */}
      <div className="tabs">
        {tabs.map(([key, label, count]) => (
          <span
            key={key}
            className={'tab' + (activeTab === key ? ' on' : '')}
            onClick={() => onTabChange(key)}
          >
            {label}<span className="ct">{count}</span>
          </span>
        ))}
        <span className="right">
          <span className="fig" style={{ fontSize: 11 }}>sort: placed ↓</span>
        </span>
      </div>

      <table className="tbl" style={{ marginTop: 0 }}>
        <thead>
          <tr>
            <th className="check">
              <input
                type="checkbox"
                onChange={e => onSelectAll(e.target.checked)}
                checked={selectedIds.length === visible.length && visible.length > 0}
              />
            </th>
            <th style={{ width: 80 }}>Order</th>
            <th>Customer</th>
            <th style={{ width: 140 }}>Location</th>
            <th className="sort" style={{ width: 110 }}>Placed</th>
            <th className="num" style={{ width: 50 }}>Items</th>
            <th className="num" style={{ width: 80 }}>Total</th>
            <th style={{ width: 100 }}>Status</th>
            <th style={{ width: 90 }}>Payment</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: 24 }}>
                <span className="fig">No orders found</span>
              </td>
            </tr>
          ) : visible.map(o => (
            <tr key={o.id} className={selectedIds.includes(o.id) ? 'sel' : ''}>
              <td className="check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(o.id)}
                  onChange={e => onSelectOne(o.id, e.target.checked)}
                />
              </td>
              <td>
                <Link href={`/admin/orders/${o.id}`} className="mono accent" style={{ fontSize: 12, textDecoration: 'none' }}>
                  {o.orderNumber}
                </Link>
              </td>
              <td>
                <div className="name">{o.customer.name}</div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{o.customer.email}</div>
              </td>
              <td><span className="fig" style={{ fontSize: 12 }}>{o.shippingAddress}</span></td>
              <td><span className="meta">{formatDate(o.createdAt)}</span></td>
              <td className="num">{o.items}</td>
              <td className="num">{formatCurrency(o.total)}</td>
              <td><span className={`pill ${STATUS_PILL[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
              <td>
                <span className={`pill ${o.paymentStatus === 'paid' ? 'pill-solid-moss' : o.paymentStatus === 'refunded' ? 'pill-solid-accent' : 'pill-soft'}`}>
                  {o.paymentStatus.toUpperCase()}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="action-bar">
        {selectedIds.length > 0 && <span className="selct">{selectedIds.length} selected</span>}
        <span><span className="kbd">↑↓</span>move</span>
        <span><span className="kbd">Enter</span>open</span>
        <span><span className="kbd">P</span>pack &amp; ship</span>
        <span><span className="kbd">R</span>refund</span>
        <span><span className="kbd">F</span>flag</span>
        <span className="right mono" style={{ fontSize: 10 }}>
          {new Date().toISOString().slice(0,16).replace('T',' ')} UTC
        </span>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function OrdersPage() {
  const { user } = useAuth();
  const { buildPath } = useCMSConfig();

  const [orders, setOrders]           = useState<Order[]>([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [view, setView]               = useState<ViewMode>('board');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab]     = useState('all');
  const [search, setSearch]           = useState('');

  useEffect(() => { void fetchOrders(); }, [user]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cms/orders');
      if (res.ok) {
        const data = await res.json() as { orders?: Order[] };
        setOrders(data.orders ?? []);
      } else {
        setOrders([]);
      }
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.email.toLowerCase().includes(q)
    );
  });

  const handleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? filtered.map(o => o.id) : []);

  const handleSelectOne = (id: string, checked: boolean) =>
    setSelectedIds(prev => checked ? [...prev, id] : prev.filter(x => x !== id));

  const stats = {
    total:   orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    revenue: orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
    stuck:   orders.filter(o => o.status === 'cancelled').length,
  };

  return (
    <div data-tour-id="orders-page">
      {/* Main head */}
      <div className="main-head" data-tour-id="orders-heading">
        <div>
          <div className="eyebrow">Orders</div>
          <h1>The <span className="display-i accent">{view === 'board' ? 'board.' : 'ledger.'}</span></h1>
          <div className="sub">
            {stats.total} total · {stats.pending} awaiting · {stats.stuck} stuck · {formatCurrency(stats.revenue)} collected
          </div>
        </div>
        <div className="actions">
          <span className="fig" style={{ fontSize: 11 }}>view:</span>
          <button
            className={`btn${view === 'board' ? ' btn-solid' : ''}`}
            style={{ padding: '5px 10px', fontSize: 11 }}
            onClick={() => setView('board')}
          >
            Board
          </button>
          <button
            className={`btn${view === 'ledger' ? ' btn-solid' : ''}`}
            style={{ padding: '5px 10px', fontSize: 11 }}
            onClick={() => setView('ledger')}
          >
            Ledger
          </button>
          {/* Search input inline */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="btn"
            style={{ cursor: 'text', width: 140 }}
            data-tour-id="orders-search-input"
          />
          <Link href={buildPath('/admin/orders/new')} className="btn btn-solid" data-tour-id="orders-create-button">
            <span className="kbd">N</span>+ Order
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <span className="eyebrow">Loading…</span>
        </div>
      ) : view === 'board' ? (
        <OrdersBoard orders={filtered} />
      ) : (
        <OrdersLedger
          orders={filtered}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  );
}
