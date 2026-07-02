'use client';

/**
 * Customer detail route — fetches the real customer dossier and renders the
 * Grainy CRM page. All mutations (edit, notes, tags, Stripe sync, delete) are
 * handled inside CustomerDetail against the existing API endpoints.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { CustomerDetail } from '@/components/cms/admin/customers/customer-detail';
import { useCMSConfig } from '@/contexts/CMSConfigContext';
import type { ApiCustomerDetail } from '@/components/cms/admin/customers/customers-model';

export default function CustomerDetailPage(): React.ReactElement {
  const params = useParams<{ id: string }>();
  const { buildPath } = useCMSConfig();
  const customerId = params.id;

  const [customer, setCustomer] = useState<ApiCustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cms/admin/customers/${customerId}`);
      if (res.ok) {
        setCustomer((await res.json()) as ApiCustomerDetail);
      } else {
        setNotFound(true);
        toast.error('Customer not found');
      }
    } catch {
      setNotFound(true);
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { void fetchCustomer(); }, [fetchCustomer]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <span className="gr-eyebrow" style={{ color: 'var(--text-muted)' }}>Loading customer…</span>
      </div>
    );
  }

  if (notFound || !customer) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>Customer not found</span>
        <Link href={buildPath('/admin/customers')} className="btn btn-secondary">Back to customers</Link>
      </div>
    );
  }

  return <CustomerDetail initialCustomer={customer} />;
}
