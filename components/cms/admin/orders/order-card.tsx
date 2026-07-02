'use client';

/**
 * OrderCard — the shared card used by both the Cards grid and the Kanban lanes
 * (in `mini` form). Data is real; there is no fabricated channel or contents.
 */

import React from 'react';
import { Avatar, Badge } from './orders-ui';
import {
  avatarColor,
  initialsOf,
  money,
  shortDate,
  statusBadge,
  type OrderRow,
} from './orders-model';

export function OrderCard({
  order,
  mini,
  onClick,
}: {
  readonly order: OrderRow;
  readonly mini?: boolean;
  readonly onClick: () => void;
}): React.ReactElement {
  const badge = statusBadge(order.status);
  return (
    <div className="gr-card" onClick={onClick} style={{ padding: mini ? '11px 12px' : '15px 16px', cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={initialsOf(order.customerName)} color={avatarColor(order.customerName)} size={mini ? 28 : 34} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span className="gr-num" style={{ fontSize: 12, color: 'var(--clay-700)', fontWeight: 600 }}>
              #{order.orderNumber}
            </span>
            <span
              style={{
                fontWeight: 600,
                fontSize: mini ? 13 : 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {order.customerName}
            </span>
          </div>
          {!mini && (
            <div className="gr-num" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              placed {shortDate(order.createdAt)}
            </div>
          )}
        </div>
        {!mini && <Badge tone={badge.tone}>{badge.label}</Badge>}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: mini ? 9 : 12,
          paddingTop: mini ? 9 : 12,
          borderTop: '1px solid var(--line-faint)',
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {order.itemUnits} item{order.itemUnits === 1 ? '' : 's'}
        </span>
        <span className="gr-num" style={{ fontWeight: 700, fontSize: 14, marginLeft: 'auto' }}>
          {money(order.totalCents)}
        </span>
      </div>
    </div>
  );
}
