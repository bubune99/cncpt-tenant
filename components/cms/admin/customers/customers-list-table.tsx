'use client';

/**
 * CustomersListTable — the roster table. Columns are limited to the fields the
 * list API actually returns; per-customer spend / AOV / location / segment tags
 * live only on the detail payload, so they are surfaced on the detail page, not
 * invented here. The "Tenant" column only appears in multi-tenant (super-admin)
 * views. Row click opens the customer dossier.
 */

import React from 'react';
import { PanelRight, Mail } from 'lucide-react';
import { Avatar, Badge, RowMenu } from '@/components/cms/admin/grainy-ui';
import {
  avatarColor,
  initialsOf,
  relativeTime,
  monthYear,
  statusBadge,
  tierBadge,
  type CustomerListRow,
} from './customers-model';

export function CustomersListTable({
  rows,
  selected,
  showTenant,
  onToggle,
  onToggleAll,
  onOpen,
  emptyLabel,
}: {
  readonly rows: readonly CustomerListRow[];
  readonly selected: ReadonlySet<string>;
  readonly showTenant: boolean;
  readonly onToggle: (id: string) => void;
  readonly onToggleAll: () => void;
  readonly onOpen: (id: string) => void;
  readonly emptyLabel: string;
}): React.ReactElement {
  const allOn = rows.length > 0 && rows.every((c) => selected.has(c.id));
  const colCount = showTenant ? 8 : 7;

  return (
    <div className="table-wrap gr-scroll" style={{ flex: 1, minHeight: 0 }}>
      <table className="table">
        <thead>
          <tr>
            <th className="col-check">
              <input type="checkbox" className="checkbox" checked={allOn} onChange={onToggleAll} aria-label="Select all" />
            </th>
            <th>Customer</th>
            {showTenant && <th>Tenant</th>}
            <th>Tier</th>
            <th className="num">Orders</th>
            <th>Last order</th>
            <th>Since</th>
            <th>Status</th>
            <th className="col-actions" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colCount + 1} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((c) => {
              const on = selected.has(c.id);
              const tier = tierBadge(c.accessLevel);
              const status = statusBadge(c.isActive);
              return (
                <tr key={c.id} className={on ? 'sel' : ''} onClick={() => onOpen(c.id)} style={{ cursor: 'pointer' }}>
                  <td className="col-check" onClick={(e) => { e.stopPropagation(); onToggle(c.id); }}>
                    <input type="checkbox" className="checkbox" checked={on} readOnly aria-label={`Select ${c.name}`} />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <Avatar initials={initialsOf(c.name || c.email)} color={avatarColor(c.id)} size={32} />
                      <div style={{ minWidth: 0 }}>
                        <div className="t-name" style={{ whiteSpace: 'nowrap' }}>{c.name || '—'}</div>
                        <div className="gr-num" style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  {showTenant && (
                    <td><span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{c.businessOwner.businessName}</span></td>
                  )}
                  <td><Badge tone={tier.tone}>{tier.label}</Badge></td>
                  <td className="num" style={{ fontWeight: 600, color: 'var(--text)' }}>{c.designCount}</td>
                  <td className="num"><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{relativeTime(c.lastActivityAt)}</span></td>
                  <td className="num"><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{monthYear(c.createdAt)}</span></td>
                  <td><Badge tone={status.tone}>{status.label}</Badge></td>
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <RowMenu
                      items={[
                        { icon: PanelRight, label: 'Open customer', onClick: () => onOpen(c.id) },
                        { icon: Mail, label: 'Email', onClick: () => { window.location.href = `mailto:${c.email}`; } },
                      ]}
                    />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
