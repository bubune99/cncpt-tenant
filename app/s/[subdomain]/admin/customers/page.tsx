'use client';

/**
 * Customers — Grainy roster screen.
 *
 * Header stat chips, segment pill tabs, tier/tenant filter pills, sort + live
 * search, selection bulk bar, and the roster table over the real
 * /api/cms/admin/customers payload. Columns and stats are limited to fields the
 * list API provides (spend / AOV / location / segment tags live on the detail
 * page only). All existing capabilities are preserved: search, tenant + tier
 * filters, status tabs, CSV export, create-customer dialog, and the guided tour.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Activity, Sparkles, ShoppingBag, Download, Plus, Mail, Tag, X } from 'lucide-react';
import { useWizard } from '@/contexts/WizardContext';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { Btn, Eyebrow, LiveSearch } from '@/components/cms/admin/grainy-ui';
import { FilterSelect, SortSelect, SegTabs, type SegTab } from '@/components/cms/admin/customers/customers-ui';
import { CustomersListTable } from '@/components/cms/admin/customers/customers-list-table';
import { CustomerCreateDialog } from '@/components/cms/admin/customers/customer-create-dialog';
import {
  relativeTime,
  monthYear,
  type BusinessOwner,
  type CustomerListRow,
  type CustomerStats,
} from '@/components/cms/admin/customers/customers-model';

type SegKey = 'all' | 'active' | 'inactive' | 'new';
const NEW_WINDOW_MS = 7 * 86_400_000;

const TIER_OPTIONS = ['Any', 'Premium', 'Standard', 'Basic'] as const;
const SORT_OPTIONS = ['Last order', 'Orders', 'Name A–Z'] as const;

function tierToParam(tier: string): string {
  return tier === 'Any' ? 'all' : tier.toLowerCase();
}

export default function CustomersPage(): React.ReactElement {
  const { startTour, isTourCompleted } = useWizard();
  const { buildPath } = useCMSConfig();
  const router = useRouter();

  const [customers, setCustomers] = useState<CustomerListRow[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [businessOwners, setBusinessOwners] = useState<BusinessOwner[]>([]);
  const [loading, setLoading] = useState(true);

  const [seg, setSeg] = useState<SegKey>('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<string>('Last order');
  const [tier, setTier] = useState<string>('Any');
  const [ownerId, setOwnerId] = useState<string>('all');
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  // ── Guided tour (preserved) ──
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isTourCompleted('customers')) startTour('customers');
    }, 1000);
    return () => clearTimeout(timer);
  }, [startTour, isTourCompleted]);

  const fetchOwners = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/admin/business-owners/v2');
      if (res.ok) {
        const data = (await res.json()) as { businessOwners: Array<{ id: string; businessName: string }> };
        setBusinessOwners(data.businessOwners.map((o) => ({ id: o.id, name: o.businessName })));
      }
    } catch {
      // non-super-admin — empty list is expected
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/admin/customers/stats');
      if (res.ok) setStats((await res.json()) as CustomerStats);
    } catch {
      // silent — chips fall back to derived counts
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (ownerId !== 'all') params.append('businessOwnerId', ownerId);
      if (tier !== 'Any') params.append('accessLevel', tier.toLowerCase());
      const res = await fetch(`/api/cms/admin/customers?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { customers: CustomerListRow[] };
        setCustomers(data.customers);
        setBusinessOwners((prev) => {
          if (prev.length > 0) return prev;
          const seen = new Set<string>();
          const unique: BusinessOwner[] = [];
          for (const c of data.customers) {
            if (!seen.has(c.businessOwner.id)) {
              seen.add(c.businessOwner.id);
              unique.push({ id: c.businessOwner.id, name: c.businessOwner.businessName });
            }
          }
          return unique;
        });
      } else {
        toast.error('Failed to load customers');
      }
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [ownerId, tier]);

  useEffect(() => { void fetchOwners(); void fetchStats(); }, [fetchOwners, fetchStats]);
  useEffect(() => { void fetchCustomers(); }, [fetchCustomers]);

  // ── Derived rows ──
  const segFiltered = useMemo(() => customers.filter((c) => {
    switch (seg) {
      case 'active': return c.isActive;
      case 'inactive': return !c.isActive;
      case 'new': return Date.now() - new Date(c.createdAt).getTime() < NEW_WINDOW_MS;
      default: return true;
    }
  }), [customers, seg]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const searched = !term ? segFiltered : segFiltered.filter((c) =>
      c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term) || c.id.toLowerCase().includes(term));
    const sorted = [...searched];
    sorted.sort((a, b) => {
      if (sort === 'Orders') return b.designCount - a.designCount;
      if (sort === 'Name A–Z') return a.name.localeCompare(b.name);
      // Last order — most recent first, nulls last
      const at = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bt = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bt - at;
    });
    return sorted;
  }, [segFiltered, q, sort]);

  const segTabs = useMemo<SegTab<SegKey>[]>(() => [
    { key: 'all', label: 'All', count: customers.length },
    { key: 'active', label: 'Active', count: customers.filter((c) => c.isActive).length },
    { key: 'inactive', label: 'Dormant', count: customers.filter((c) => !c.isActive).length },
    { key: 'new', label: 'New · 7d', count: customers.filter((c) => Date.now() - new Date(c.createdAt).getTime() < NEW_WINDOW_MS).length },
  ], [customers]);

  const withOrders = useMemo(() => customers.filter((c) => c.designCount > 0).length, [customers]);
  const chips = [
    { icon: Users, value: stats?.totalCustomers ?? customers.length, label: 'customers', tone: 'var(--text)' },
    { icon: Activity, value: stats?.activeToday ?? 0, label: 'active today', tone: 'var(--sage-700)' },
    { icon: Sparkles, value: stats?.newThisMonth ?? 0, label: 'new this month', tone: 'var(--clay-700)' },
    { icon: ShoppingBag, value: withOrders, label: 'with orders', tone: 'var(--text)' },
  ] as const;

  // ── Selection ──
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOn = rows.length > 0 && rows.every((c) => sel.has(c.id));
  const toggleAll = () => setSel((s) => { const n = new Set(s); allOn ? rows.forEach((c) => n.delete(c.id)) : rows.forEach((c) => n.add(c.id)); return n; });

  const openCustomer = (id: string) => router.push(buildPath(`/admin/customers/${id}`));

  const showTenant = businessOwners.length > 1;
  const narrowed = tier !== 'Any' || (ownerId !== 'all') || q.trim().length > 0;

  // ── Export ──
  const exportAll = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/admin/customers/export');
      if (!res.ok) throw new Error('failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported customers · CSV');
    } catch {
      toast.error('Failed to export customers');
    }
  }, []);

  const exportSelected = useCallback(() => {
    const chosen = rows.filter((c) => sel.has(c.id));
    if (chosen.length === 0) return;
    const header = ['Name', 'Email', 'Tenant', 'Tier', 'Orders', 'Last order', 'Since', 'Status'];
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = chosen.map((c) => [
      c.name, c.email, c.businessOwner.businessName, c.accessLevel, String(c.designCount),
      relativeTime(c.lastActivityAt), monthYear(c.createdAt), c.isActive ? 'Active' : 'Dormant',
    ].map(esc).join(','));
    const blob = new Blob([[header.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${chosen.length} customers · CSV`);
  }, [rows, sel]);

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }} data-tour-id="customers-page">
      <div style={{ padding: '18px 26px 0', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }} data-tour-id="customers-heading">
          <div>
            <Eyebrow>People</Eyebrow>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 3 }}>
              <h2 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.015em' }}>Customers</h2>
              <span className="gr-num" style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{customers.length} people</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn icon={Download} onClick={() => void exportAll()}>Export</Btn>
            <Btn kind="primary" icon={Plus} onClick={() => setCreateOpen(true)}>New customer</Btn>
          </div>
        </div>

        {/* Stat chips */}
        <div style={{ display: 'flex', gap: 10, margin: '15px 0 4px', flexWrap: 'wrap' }}>
          {chips.map((chip) => {
            const Icon = chip.icon;
            return (
              <span key={chip.label} className="gr-card" style={{ padding: '9px 15px', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <Icon size={16} style={{ color: 'var(--text-muted)' }} />
                <span className="gr-num" style={{ fontSize: 18, fontWeight: 700, color: chip.tone }}>{chip.value}</span>
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{chip.label}</span>
              </span>
            );
          })}
        </div>

        {/* Segment tabs */}
        <div style={{ margin: '14px 0 4px' }}>
          <SegTabs tabs={segTabs} value={seg} onChange={setSeg} />
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 12px', flexWrap: 'wrap' }}>
          <FilterSelect label="tier" value={tier} options={TIER_OPTIONS} onChange={setTier} />
          {showTenant && (
            <FilterSelect
              label="tenant"
              value={ownerId === 'all' ? 'Any' : (businessOwners.find((o) => o.id === ownerId)?.name ?? 'Any')}
              options={['Any', ...businessOwners.map((o) => o.name)]}
              onChange={(name) => setOwnerId(name === 'Any' ? 'all' : (businessOwners.find((o) => o.name === name)?.id ?? 'all'))}
            />
          )}
          <SortSelect value={sort} options={SORT_OPTIONS} onChange={setSort} />
          {narrowed && (
            <button type="button" className="gr-link" onClick={() => { setTier('Any'); setOwnerId('all'); setQ(''); }} style={{ border: 'none', background: 'transparent', fontSize: 12, cursor: 'pointer' }}>
              Clear all
            </button>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <LiveSearch value={q} onChange={setQ} placeholder="Search name, email, ID…" width={240} />
          </div>
        </div>

        {/* Bulk bar */}
        {sel.size > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div className="bulkbar">
              <span className="count"><b>{sel.size}</b> selected</span>
              <span className="bb-sep" />
              <button type="button" className="bb-btn" onClick={exportSelected}><Download size={15} />Export</button>
              <button type="button" className="bb-btn" disabled title="Coming soon" style={{ opacity: 0.5, cursor: 'not-allowed' }}><Mail size={15} />Email</button>
              <button type="button" className="bb-btn" disabled title="Coming soon" style={{ opacity: 0.5, cursor: 'not-allowed' }}><Tag size={15} />Add to segment</button>
              <span className="bb-sep" />
              <button type="button" className="bb-close bb-btn" onClick={() => setSel(new Set())} aria-label="Clear selection"><X size={15} /></button>
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, padding: '0 26px 22px', display: 'flex', flexDirection: 'column' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <span className="gr-eyebrow">Loading…</span>
          </div>
        ) : (
          <CustomersListTable
            rows={rows}
            selected={sel}
            showTenant={showTenant}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onOpen={openCustomer}
            emptyLabel={q ? `No customers match "${q}"` : 'No customers found'}
          />
        )}
      </div>

      <CustomerCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        businessOwners={businessOwners}
        onCreated={() => { void fetchCustomers(); void fetchStats(); }}
      />
    </div>
  );
}
