'use client';

/**
 * Admin customers list — Atlas editorial style
 * Faithful port of atlas-v2-pages.jsx Customers()
 *
 * Preserves all existing data wiring:
 *  - fetch /api/cms/admin/customers with filters
 *  - fetch /api/cms/admin/customers/stats
 *  - fetch /api/cms/admin/customers/export
 *  - POST /api/cms/admin/customers (create customer dialog)
 *  - fetch /api/cms/admin/business-owners/v2
 *  - useWizard tour integration
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWizard } from '@/contexts/WizardContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Customer {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly businessOwner: {
    readonly id: string;
    readonly businessName: string;
  };
  readonly stackAuthUserId?: string;
  readonly accessLevel: string;
  readonly storageUsed: number;
  readonly storageLimit: number;
  readonly designCount: number;
  readonly lastActivityAt: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
}

interface CustomerStats {
  readonly totalCustomers: number;
  readonly activeToday: number;
  readonly newThisMonth: number;
  readonly totalStorageUsed: number;
  readonly averageStoragePerCustomer: number;
}

interface BusinessOwner {
  readonly id: string;
  readonly name: string;
}

type TabFilter = 'all' | 'active' | 'inactive' | 'new';

interface CreateFormData {
  email: string;
  name: string;
  businessOwnerId: string;
  accessLevel: string;
  storageLimit: number | undefined;
  sendInvitation: boolean;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** Deterministic colour from string — cycles through atlas-friendly palette */
const AVATAR_PALETTE = [
  '#e7a23b', '#3a4a8b', '#c8443a', '#4f5e3a',
  '#88857a', '#8b2c1f', '#1a1410', '#3a6b8b',
] as const;

function avatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length] ?? '#88857a';
}

function tierPill(accessLevel: string): { label: string; cls: string } {
  switch (accessLevel.toLowerCase()) {
    case 'premium':  return { label: 'VIP',   cls: 'pill-solid-gold' };
    case 'standard': return { label: 'REG',   cls: 'pill-out' };
    case 'basic':    return { label: 'NEW',   cls: 'pill-out' };
    default:         return { label: accessLevel.toUpperCase().slice(0, 6), cls: 'pill-out' };
  }
}

function formatLastSeen(ts: string | null): string {
  if (!ts) return 'never';
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60)  return `${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24)    return `${hours}h ago`;
  const days = Math.floor(diff / 86_400_000);
  if (days === 1)    return 'yesterday';
  if (days < 7)      return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatSince(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function CustomersPage() {
  const { startTour, isTourCompleted } = useWizard();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [businessOwnerFilter, setBusinessOwnerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [accessLevelFilter, setAccessLevelFilter] = useState('all');
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  // Create customer dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateFormData>({
    email: '',
    name: '',
    businessOwnerId: '',
    accessLevel: 'standard',
    storageLimit: undefined,
    sendInvitation: false,
  });

  // ── Tour ──
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isTourCompleted('customers')) startTour('customers');
    }, 1000);
    return () => clearTimeout(timer);
  }, [startTour, isTourCompleted]);

  // ── Data fetching ──
  useEffect(() => {
    void fetchCustomers();
    void fetchStats();
    void fetchAllBusinessOwners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessOwnerFilter, statusFilter, accessLevelFilter]);

  const fetchAllBusinessOwners = async () => {
    try {
      const res = await fetch('/api/cms/admin/business-owners/v2');
      if (res.ok) {
        const data = await res.json() as { businessOwners: Array<{ id: string; businessName: string }> };
        setBusinessOwners(data.businessOwners.map(o => ({ id: o.id, name: o.businessName })));
      }
    } catch {
      // non-admin — empty list is fine
    }
  };

  const fetchCustomers = async () => {
    try {
      const params = new URLSearchParams();
      if (businessOwnerFilter !== 'all') params.append('businessOwnerId', businessOwnerFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (accessLevelFilter !== 'all') params.append('accessLevel', accessLevelFilter);
      const res = await fetch(`/api/cms/admin/customers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json() as { customers: Customer[] };
        setCustomers(data.customers);
        if (businessOwners.length === 0) {
          const seen = new Set<string>();
          const unique: BusinessOwner[] = [];
          for (const c of data.customers) {
            if (!seen.has(c.businessOwner.id)) {
              seen.add(c.businessOwner.id);
              unique.push({ id: c.businessOwner.id, name: c.businessOwner.businessName });
            }
          }
          setBusinessOwners(unique);
        }
      }
    } catch {
      // silence
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/cms/admin/customers/stats');
      if (res.ok) {
        const data = await res.json() as CustomerStats;
        setStats(data);
      }
    } catch {
      // silence
    }
  };

  const exportCustomers = async () => {
    try {
      const res = await fetch('/api/cms/admin/customers/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch {
      toast.error('Failed to export customers');
    }
  };

  const handleCreateCustomer = async () => {
    if (!createFormData.email) { toast.error('Email is required'); return; }
    if (!createFormData.businessOwnerId) { toast.error('Business owner is required'); return; }

    setIsCreating(true);
    try {
      const res = await fetch('/api/cms/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createFormData),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        toast.success(`Customer ${createFormData.name || createFormData.email} created successfully`);
        setCreateFormData({ email: '', name: '', businessOwnerId: '', accessLevel: 'standard', storageLimit: undefined, sendInvitation: false });
        setIsCreateDialogOpen(false);
        void fetchCustomers();
        void fetchStats();
      } else {
        toast.error(data.error ?? 'Failed to create customer');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsCreating(false);
    }
  };

  // ── Derived ──

  const filtered = customers.filter(c => {
    const matchTab =
      activeTab === 'all'      ? true :
      activeTab === 'active'   ? c.isActive :
      activeTab === 'inactive' ? !c.isActive :
      activeTab === 'new'      ? (Date.now() - new Date(c.createdAt).getTime()) < 7 * 86_400_000 :
      true;

    const matchSearch = !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchTab && matchSearch;
  });

  const tabCounts = {
    all:      customers.length,
    active:   customers.filter(c => c.isActive).length,
    inactive: customers.filter(c => !c.isActive).length,
    new:      customers.filter(c => (Date.now() - new Date(c.createdAt).getTime()) < 7 * 86_400_000).length,
  };

  const tabItems: readonly [TabFilter, string, number][] = [
    ['all',      'All',      tabCounts.all],
    ['active',   'Active',   tabCounts.active],
    ['inactive', 'Inactive', tabCounts.inactive],
    ['new',      'New 7d',   tabCounts.new],
  ];

  return (
    <div data-tour-id="customers-page">

      {/* Main head */}
      <div className="main-head" data-tour-id="customers-heading">
        <div>
          <div className="eyebrow">People</div>
          <h1>The <span className="display-i accent">roster.</span></h1>
          <div className="sub">
            {loading
              ? 'Loading…'
              : `${stats?.totalCustomers ?? customers.length} on the books · ${stats?.activeToday ?? 0} active today · ${stats?.newThisMonth ?? 0} new this month`}
          </div>
        </div>
        <div className="actions">
          <div style={{ position: 'relative' }}>
            <input
              type="search"
              placeholder="Search…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                height: 28, paddingLeft: 8, paddingRight: 8, fontSize: 12,
                border: '1px solid var(--ink)', background: 'var(--paper)',
                color: 'var(--ink)', fontFamily: 'inherit', outline: 'none',
              }}
              aria-label="Search customers"
            />
          </div>
          <button className="btn" onClick={() => void exportCustomers()} type="button">
            <span className="kbd">E</span>Export
          </button>
          <button
            className="btn btn-solid"
            onClick={() => setIsCreateDialogOpen(true)}
            type="button"
            data-tour-id="customers-create-button"
          >
            <span className="kbd">S</span>+ Customer
          </button>
        </div>
      </div>

      {/* Filter row — business owner + access level */}
      {(businessOwners.length > 0 || accessLevelFilter !== 'all') && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
          {businessOwners.length > 1 && (
            <select
              value={businessOwnerFilter}
              onChange={e => setBusinessOwnerFilter(e.target.value)}
              style={{ fontSize: 11, padding: '3px 8px', border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit' }}
              aria-label="Filter by business owner"
            >
              <option value="all">All owners</option>
              {businessOwners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <select
            value={accessLevelFilter}
            onChange={e => setAccessLevelFilter(e.target.value)}
            style={{ fontSize: 11, padding: '3px 8px', border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit' }}
            aria-label="Filter by access level"
          >
            <option value="all">All levels</option>
            <option value="premium">Premium</option>
            <option value="standard">Standard</option>
            <option value="basic">Basic</option>
          </select>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--ink)', marginBottom: 0 }}>
        {tabItems.map(([key, label, count]) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? 'tab on' : 'tab'}
            onClick={() => setActiveTab(key)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px 6px 0', fontSize: 12 }}
          >
            {label} <span className="ct">{count}</span>
          </button>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--ink-soft)', fontSize: 11, display: 'flex', alignItems: 'center', paddingBottom: 6 }}>
          sort: LTV ↓
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 8 }}>
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--ink-soft)' }} />
          <span className="eyebrow">Loading…</span>
        </div>
      ) : (
        <table className="tbl" style={{ marginTop: 0 }}>
          <thead>
            <tr>
              <th className="check"><input type="checkbox" aria-label="Select all" /></th>
              <th style={{ width: 30 }}></th>
              <th>Customer</th>
              <th style={{ width: 160 }}>Tenant</th>
              <th className="num sort" style={{ width: 70 }}>Designs</th>
              <th style={{ width: 100 }}>Last seen</th>
              <th style={{ width: 90 }}>Since</th>
              <th style={{ width: 80 }}>Tier</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const { label: tierLabel, cls: tierCls } = tierPill(c.accessLevel);
              const color = avatarColor(c.id);
              const init = initials(c.name || c.email);
              return (
                <tr key={c.id}>
                  <td className="check"><input type="checkbox" aria-label={`Select ${c.name || c.email}`} /></td>
                  <td>
                    <span style={{
                      display: 'inline-flex', width: 28, height: 28,
                      background: color, color: 'var(--paper)',
                      alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'var(--font-display), Spectral, serif',
                      fontSize: 12, fontWeight: 500,
                      borderRadius: '50%', border: '1px solid var(--ink)',
                      flexShrink: 0,
                    }}>
                      {init}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${c.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="name">{c.name || '—'}</div>
                      <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{c.email}</div>
                    </Link>
                  </td>
                  <td>
                    <span className="fig" style={{ fontSize: 12 }}>
                      {c.businessOwner.businessName}
                    </span>
                  </td>
                  <td className="num">{c.designCount}</td>
                  <td><span className="meta">{formatLastSeen(c.lastActivityAt)}</span></td>
                  <td><span className="meta">{formatSince(c.createdAt)}</span></td>
                  <td>
                    <span className={`pill ${tierCls}`}>{tierLabel}</span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-soft)', fontSize: 13 }}>
                  {searchTerm ? `No customers match "${searchTerm}"` : 'No customers found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Action bar */}
      <div className="action-bar">
        <span className="selct">Customers</span>
        <span><span className="kbd">↑↓</span>move</span>
        <span><span className="kbd">Enter</span>open</span>
        <span><span className="kbd">M</span>message</span>
        <span><span className="kbd">T</span>tag</span>
        <span><span className="kbd">E</span>export</span>
      </div>

      {/* Create customer dialog — shadcn preserved */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>
              Create a customer account. An invitation email can be sent automatically.
            </DialogDescription>
          </DialogHeader>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label htmlFor="customer-email" style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                Email *
              </label>
              <input
                id="customer-email"
                type="email"
                value={createFormData.email}
                onChange={e => setCreateFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
                style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label htmlFor="customer-name" style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                Name
              </label>
              <input
                id="customer-name"
                type="text"
                value={createFormData.name}
                onChange={e => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full name"
                style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit' }}
              />
            </div>
            {businessOwners.length > 0 && (
              <div>
                <label htmlFor="customer-owner" style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                  Business Owner *
                </label>
                <select
                  id="customer-owner"
                  value={createFormData.businessOwnerId}
                  onChange={e => setCreateFormData(prev => ({ ...prev, businessOwnerId: e.target.value }))}
                  style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit' }}
                >
                  <option value="">Select owner…</option>
                  {businessOwners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="customer-level" style={{ fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 4 }}>
                Access Level
              </label>
              <select
                id="customer-level"
                value={createFormData.accessLevel}
                onChange={e => setCreateFormData(prev => ({ ...prev, accessLevel: e.target.value }))}
                style={{ width: '100%', padding: '6px 8px', fontSize: 13, border: '1px solid var(--rule)', background: 'var(--paper)', color: 'var(--ink)', fontFamily: 'inherit' }}
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="basic">Basic</option>
              </select>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={createFormData.sendInvitation}
                onChange={e => setCreateFormData(prev => ({ ...prev, sendInvitation: e.target.checked }))}
              />
              Send invitation email
            </label>
          </div>

          <DialogFooter>
            <button className="btn" onClick={() => setIsCreateDialogOpen(false)} type="button">
              Cancel
            </button>
            <button
              className="btn btn-solid"
              onClick={() => void handleCreateCustomer()}
              disabled={isCreating}
              type="button"
            >
              {isCreating ? (
                <><Loader2 className="h-4 w-4 animate-spin" style={{ marginRight: 6 }} />Creating…</>
              ) : (
                'Create Customer'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
