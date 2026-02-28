'use client';

import { useEffect, useState, useCallback } from 'react';
import WidgetShell from '../WidgetShell';
import { Badge } from '../../../ui/badge';

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  customerEmail?: string;
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDING: 'outline',
  PROCESSING: 'secondary',
  SHIPPED: 'default',
  DELIVERED: 'default',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

export default function RecentOrdersWidget({ editing }: { editing?: boolean }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cms/orders?limit=10&sort=createdAt&order=desc');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setOrders(json.orders || json.data || []);
    } catch {
      setError('Could not load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <WidgetShell
      title="Recent Orders"
      editing={editing}
      loading={loading}
      error={error}
      onRefresh={fetchData}
    >
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No orders yet
        </p>
      ) : (
        <div className="space-y-2">
          {orders.slice(0, 10).map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium truncate">
                  {order.orderNumber || order.id.slice(0, 8)}
                </span>
                {order.customerEmail && (
                  <span className="text-xs text-muted-foreground truncate">
                    {order.customerEmail}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={STATUS_VARIANT[order.status] || 'outline'}>
                  {order.status}
                </Badge>
                <span className="text-xs font-medium">
                  ${(Number(order.total) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
