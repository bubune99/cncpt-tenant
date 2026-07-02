'use client';

/**
 * Customer dossier — orchestrator. Owns detail + notes state and every real
 * mutation (edit profile, add/delete note, edit tags, Stripe sync, delete).
 * Renders header, stat cards, and the two-column (main / sidebar) CRM layout.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChevronLeft, Mail, Pencil, Plus, User, Building2, MapPin, RefreshCw, Trash2 } from 'lucide-react';
import { Avatar, Badge, Btn, RowMenu } from '@/components/cms/admin/grainy-ui';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import { CustomerDetailMain } from './customer-detail-main';
import { CustomerDetailSidebar } from './customer-detail-sidebar';
import { CustomerEditDialog } from './customer-edit-dialog';
import {
  accessLevelFromTags,
  avatarColor,
  displayName,
  fullDate,
  initialsOf,
  inferLifecycle,
  lifecycleBadge,
  money,
  relativeTime,
  statusBadge,
  tierBadge,
  visibleTags,
  type ApiCustomerDetail,
  type CustomerNote,
} from './customers-model';

function isActiveCustomer(c: ApiCustomerDetail): boolean {
  if (c.lastOrderAt) return true;
  return new Date(c.createdAt).getTime() > Date.now() - 90 * 86_400_000;
}

function StatCell({ label, value, tone }: { readonly label: string; readonly value: React.ReactNode; readonly tone?: string }): React.ReactElement {
  return (
    <div className="gr-card" style={{ padding: '13px 16px', flex: 1, minWidth: 120 }}>
      <div className="gr-eyebrow" style={{ fontSize: 9 }}>{label}</div>
      <div className="gr-num" style={{ fontSize: 23, fontWeight: 700, marginTop: 4, color: tone ?? 'var(--text)' }}>{value}</div>
    </div>
  );
}

export function CustomerDetail({
  initialCustomer,
}: {
  readonly initialCustomer: ApiCustomerDetail;
}): React.ReactElement {
  const router = useRouter();
  const { buildPath } = useCMSConfig();

  const [customer, setCustomer] = useState<ApiCustomerDetail>(initialCustomer);
  const [notes, setNotes] = useState<CustomerNote[]>([]);
  const [notesLoading, setNotesLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const refetchCustomer = useCallback(async () => {
    try {
      const res = await fetch(`/api/cms/admin/customers/${customer.id}`);
      if (res.ok) setCustomer((await res.json()) as ApiCustomerDetail);
    } catch {
      // keep current data on transient failure
    }
  }, [customer.id]);

  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const res = await fetch(`/api/cms/admin/customers/${customer.id}/notes`);
      if (res.ok) {
        const data = (await res.json()) as { data?: CustomerNote[] };
        setNotes(data.data ?? []);
      }
    } catch {
      // leave notes empty
    } finally {
      setNotesLoading(false);
    }
  }, [customer.id]);

  useEffect(() => { void fetchNotes(); }, [fetchNotes]);

  const addNote = useCallback(async (content: string) => {
    try {
      const res = await fetch(`/api/cms/admin/customers/${customer.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('failed');
      toast.success('Note added');
      await fetchNotes();
    } catch {
      toast.error('Failed to add note');
    }
  }, [customer.id, fetchNotes]);

  const deleteNote = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/cms/admin/customers/${customer.id}/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      toast.success('Note deleted');
      await fetchNotes();
    } catch {
      toast.error('Failed to delete note');
    }
  }, [customer.id, fetchNotes]);

  const changeTags = useCallback(async (nextVisible: string[]) => {
    // Preserve the internal access:<level> marker that isn't shown as a chip.
    const accessTag = customer.tags.filter((t) => t.startsWith('access:'));
    const merged = [...accessTag, ...nextVisible];
    try {
      const res = await fetch(`/api/cms/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: merged }),
      });
      if (!res.ok) throw new Error('failed');
      setCustomer((prev) => ({ ...prev, tags: merged }));
    } catch {
      toast.error('Failed to update tags');
    }
  }, [customer.id, customer.tags]);

  const syncStripe = useCallback(async () => {
    toast.loading('Syncing to Stripe…', { id: 'stripe-sync' });
    try {
      const res = await fetch(`/api/cms/admin/customers/${customer.id}/sync-stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error('failed');
      toast.success('Synced to Stripe', { id: 'stripe-sync' });
      await refetchCustomer();
    } catch {
      toast.error('Stripe sync failed', { id: 'stripe-sync' });
    }
  }, [customer.id, refetchCustomer]);

  const deleteCustomer = useCallback(async () => {
    if (!window.confirm('Delete this customer? Their orders will be kept but detached.')) return;
    try {
      const res = await fetch(`/api/cms/admin/customers/${customer.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('failed');
      toast.success('Customer deleted');
      router.push(buildPath('/admin/customers'));
    } catch {
      toast.error('Failed to delete customer');
    }
  }, [customer.id, router, buildPath]);

  const name = displayName(customer.firstName, customer.lastName, customer.email);
  const tier = tierBadge(accessLevelFromTags(customer.tags));
  const status = statusBadge(isActiveCustomer(customer));
  const lifecycle = lifecycleBadge(inferLifecycle(customer.totalOrders));
  const tags = visibleTags(customer.tags);
  const isBusiness = !!customer.company;
  const defaultAddr = useMemo(() => customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0], [customer.addresses]);
  const location = defaultAddr ? ([defaultAddr.city, defaultAddr.state].filter(Boolean).join(', ') || defaultAddr.country) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }} data-tour-id="customer-detail">
      {/* Header */}
      <div style={{ padding: '18px 26px 16px', flex: 'none', borderBottom: '1px solid var(--line)' }}>
        <Link href={buildPath('/admin/customers')} className="gr-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
          <ChevronLeft size={13} />Customers
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Avatar initials={initialsOf(name)} color={avatarColor(customer.id)} size={52} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'var(--text-xl)', margin: 0, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>{name}</h1>
              <Badge tone={status.tone}>{status.label}</Badge>
              <Badge tone={tier.tone}>{tier.label}</Badge>
              <Badge tone={lifecycle.tone}>{lifecycle.label}</Badge>
              {tags.map((t) => <span key={t} className="chip" style={{ fontSize: 10.5 }}>{t}</span>)}
            </div>
            <div className="gr-num" style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>{isBusiness ? <Building2 size={12} /> : <User size={12} />}{isBusiness ? 'Business' : 'Individual'}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={12} />{customer.email}</span>
              {location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin size={12} />{location}</span>}
              <span>since {fullDate(customer.createdAt)}</span>
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flex: 'none', alignItems: 'center' }}>
            <Btn icon={Mail} onClick={() => { window.location.href = `mailto:${customer.email}`; }}>Email</Btn>
            <Btn icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Btn>
            <Link href={buildPath('/admin/orders/new')}><Btn kind="primary" icon={Plus}>New order</Btn></Link>
            <RowMenu
              items={[
                { icon: RefreshCw, label: 'Sync to Stripe', onClick: () => void syncStripe() },
                { icon: Trash2, label: 'Delete customer', danger: true, onClick: () => void deleteCustomer() },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="gr-scroll" style={{ flex: 1, minHeight: 0, padding: '18px 26px 26px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <StatCell label="Lifetime value" value={money(customer.totalSpent)} tone="var(--clay-700)" />
          <StatCell label="Orders" value={customer.totalOrders} />
          <StatCell label="Avg order" value={customer.totalOrders > 0 ? money(customer.averageOrder) : '—'} />
          <StatCell label="Last order" value={relativeTime(customer.lastOrderAt)} />
          <div className="gr-card" style={{ padding: '13px 16px', flex: 1, minWidth: 120 }}>
            <div className="gr-eyebrow" style={{ fontSize: 9 }}>Lifecycle</div>
            <div style={{ marginTop: 9 }}><Badge tone={lifecycle.tone}>{lifecycle.label}</Badge></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 18, alignItems: 'start' }}>
          <CustomerDetailMain customer={customer} buildPath={buildPath} />
          <CustomerDetailSidebar
            customer={customer}
            notes={notes}
            notesLoading={notesLoading}
            onAddNote={addNote}
            onDeleteNote={deleteNote}
            onTagsChange={changeTags}
          />
        </div>
      </div>

      <CustomerEditDialog open={editOpen} onOpenChange={setEditOpen} customer={customer} onSaved={() => void refetchCustomer()} />
    </div>
  );
}
