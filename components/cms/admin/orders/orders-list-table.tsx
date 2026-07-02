'use client';

/**
 * OrdersListTable — the List view. Columns are limited to fields the CMS order
 * payload actually carries (no channel / contains-type columns, which the data
 * model doesn't provide). Row click opens the order; the kebab menu exposes the
 * per-row actions that have real backend support.
 */

import React from 'react';
import { PanelRight, Printer, XCircle } from 'lucide-react';
import { Avatar, Badge, RowMenu } from './orders-ui';
import {
  avatarColor,
  initialsOf,
  money,
  paymentBadge,
  shortDate,
  statusBadge,
  type OrderRow,
} from './orders-model';

export function OrdersListTable({
  rows,
  selected,
  onToggle,
  onToggleAll,
  onOpen,
  onCancel,
}: {
  readonly rows: readonly OrderRow[];
  readonly selected: ReadonlySet<string>;
  readonly onToggle: (id: string) => void;
  readonly onToggleAll: () => void;
  readonly onOpen: (id: string) => void;
  readonly onCancel: (id: string) => void;
}): React.ReactElement {
  const allOn = rows.length > 0 && rows.every((o) => selected.has(o.id));

  return (
    <div className="table-wrap gr-scroll" style={{ flex: 1, minHeight: 0 }}>
      <table className="table">
        <thead>
          <tr>
            <th className="col-check">
              <input type="checkbox" className="checkbox" checked={allOn} onChange={onToggleAll} aria-label="Select all" />
            </th>
            <th>Order</th>
            <th>Customer</th>
            <th className="num">Items</th>
            <th className="num">Total</th>
            <th>Payment</th>
            <th>Placed</th>
            <th>Stage</th>
            <th className="col-actions" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: 28, color: 'var(--text-muted)' }}>
                No orders match these filters
              </td>
            </tr>
          ) : (
            rows.map((o) => {
              const on = selected.has(o.id);
              const stage = statusBadge(o.status);
              const pay = paymentBadge(o.paymentStatus);
              return (
                <tr key={o.id} className={on ? 'sel' : ''} onClick={() => onOpen(o.id)} style={{ cursor: 'pointer' }}>
                  <td className="col-check" onClick={(e) => { e.stopPropagation(); onToggle(o.id); }}>
                    <input type="checkbox" className="checkbox" checked={on} readOnly aria-label={`Select ${o.orderNumber}`} />
                  </td>
                  <td className="num" style={{ color: 'var(--clay-700)', fontWeight: 600 }}>#{o.orderNumber}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                      <Avatar initials={initialsOf(o.customerName)} color={avatarColor(o.customerName)} size={28} />
                      <span className="t-name" style={{ whiteSpace: 'nowrap' }}>{o.customerName}</span>
                    </div>
                  </td>
                  <td className="num">{o.itemUnits}</td>
                  <td className="num" style={{ color: 'var(--text)', fontWeight: 600 }}>{money(o.totalCents)}</td>
                  <td><Badge tone={pay.tone}>{pay.label}</Badge></td>
                  <td className="num" style={{ color: 'var(--text-muted)' }}>{shortDate(o.createdAt)}</td>
                  <td><Badge tone={stage.tone}>{stage.label}</Badge></td>
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <RowMenu
                      items={[
                        { icon: PanelRight, label: 'Open order', onClick: () => onOpen(o.id) },
                        { icon: Printer, label: 'Print slip', disabled: true, title: 'Coming soon' },
                        {
                          icon: XCircle,
                          label: 'Cancel order',
                          danger: true,
                          disabled: o.status === 'CANCELLED',
                          onClick: () => onCancel(o.id),
                        },
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
