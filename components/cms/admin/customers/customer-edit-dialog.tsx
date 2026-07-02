'use client';

/**
 * Edit-customer dialog. Patches the real PATCH /api/cms/admin/customers/[id]
 * endpoint (firstName, lastName, phone, company, taxId, acceptsMarketing).
 * This preserves the profile-editing capability the old CustomerEditor exposed.
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
import type { ApiCustomerDetail } from './customers-model';

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  border: '1px solid var(--line)', borderRadius: 'var(--r-sm, 8px)',
  background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 5, color: 'var(--text-secondary)' };

export function CustomerEditDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly customer: ApiCustomerDetail;
  readonly onSaved: () => void;
}): React.ReactElement {
  const [firstName, setFirstName] = useState(customer.firstName ?? '');
  const [lastName, setLastName] = useState(customer.lastName ?? '');
  const [phone, setPhone] = useState(customer.phone ?? '');
  const [company, setCompany] = useState(customer.company ?? '');
  const [taxId, setTaxId] = useState(customer.taxId ?? '');
  const [acceptsMarketing, setAcceptsMarketing] = useState(customer.acceptsMarketing);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/cms/admin/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, phone, company, taxId, acceptsMarketing }),
      });
      if (!res.ok) throw new Error('patch failed');
      toast.success('Customer updated');
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error('Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit customer</DialogTitle>
          <DialogDescription>Update contact details and marketing consent.</DialogDescription>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="edit-first" style={labelStyle}>First name</label>
              <input id="edit-first" value={firstName} style={fieldStyle} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="edit-last" style={labelStyle}>Last name</label>
              <input id="edit-last" value={lastName} style={fieldStyle} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="edit-phone" style={labelStyle}>Phone</label>
            <input id="edit-phone" value={phone} style={fieldStyle} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="edit-company" style={labelStyle}>Company</label>
            <input id="edit-company" value={company} style={fieldStyle} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label htmlFor="edit-taxid" style={labelStyle}>Tax ID</label>
            <input id="edit-taxid" value={taxId} style={fieldStyle} onChange={(e) => setTaxId(e.target.value)} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: 'var(--text)' }}>
            <input type="checkbox" className="checkbox" checked={acceptsMarketing} onChange={(e) => setAcceptsMarketing(e.target.checked)} />
            Accepts marketing
          </label>
        </div>

        <DialogFooter>
          <button type="button" className="btn btn-ghost" onClick={() => onOpenChange(false)}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => void submit()} disabled={saving}>
            {saving ? (<><Loader2 className="animate-spin" size={15} style={{ marginRight: 6 }} />Saving…</>) : 'Save changes'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
