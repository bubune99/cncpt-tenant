'use client';

/**
 * Create-customer dialog. Posts to the real POST /api/cms/admin/customers
 * endpoint. In single-tenant views the tenant is derived server-side from the
 * x-subdomain header, so the owner picker only appears (and is only required)
 * when a super-admin has more than one tenant to choose from.
 */

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/cms/ui/dialog';
import type { BusinessOwner } from './customers-model';

interface CreateFormData {
  email: string;
  name: string;
  businessOwnerId: string;
  accessLevel: string;
  sendInvitation: boolean;
}

const EMPTY_FORM: CreateFormData = {
  email: '',
  name: '',
  businessOwnerId: '',
  accessLevel: 'standard',
  sendInvitation: false,
};

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  border: '1px solid var(--line)', borderRadius: 'var(--r-sm, 8px)',
  background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
};

const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5, color: 'var(--text-secondary)' };

export function CustomerCreateDialog({
  open,
  onOpenChange,
  businessOwners,
  onCreated,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly businessOwners: readonly BusinessOwner[];
  readonly onCreated: () => void;
}): React.ReactElement {
  const [form, setForm] = useState<CreateFormData>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const ownerRequired = businessOwners.length > 1;

  const submit = async () => {
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (ownerRequired && !form.businessOwnerId) { toast.error('Business owner is required'); return; }

    setCreating(true);
    try {
      const res = await fetch('/api/cms/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (res.ok && data.success) {
        toast.success(`Customer ${form.name || form.email} created`);
        setForm(EMPTY_FORM);
        onOpenChange(false);
        onCreated();
      } else {
        toast.error(data.error ?? 'Failed to create customer');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer</DialogTitle>
          <DialogDescription>Create a customer account. An invitation email can be sent automatically.</DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="cust-email" style={labelStyle}>Email *</label>
            <input id="cust-email" type="email" value={form.email} placeholder="customer@example.com" style={fieldStyle}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label htmlFor="cust-name" style={labelStyle}>Name</label>
            <input id="cust-name" type="text" value={form.name} placeholder="Full name" style={fieldStyle}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          {ownerRequired && (
            <div>
              <label htmlFor="cust-owner" style={labelStyle}>Business owner *</label>
              <select id="cust-owner" value={form.businessOwnerId} style={fieldStyle}
                onChange={(e) => setForm((p) => ({ ...p, businessOwnerId: e.target.value }))}>
                <option value="">Select owner…</option>
                {businessOwners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label htmlFor="cust-level" style={labelStyle}>Access level</label>
            <select id="cust-level" value={form.accessLevel} style={fieldStyle}
              onChange={(e) => setForm((p) => ({ ...p, accessLevel: e.target.value }))}>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="basic">Basic</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>
            <input type="checkbox" className="checkbox" checked={form.sendInvitation}
              onChange={(e) => setForm((p) => ({ ...p, sendInvitation: e.target.checked }))} />
            Send invitation email
          </label>
        </div>

        <DialogFooter>
          <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={creating}>
            {creating ? (<><Loader2 className="animate-spin" size={15} style={{ marginRight: 6 }} />Creating…</>) : 'Create customer'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
