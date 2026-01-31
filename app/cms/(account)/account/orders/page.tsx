'use client';

/**
 * Customer Orders Page
 *
 * Lists all customer orders with filtering and pagination.
 */

import { useState } from 'react';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useCustomerOrders, type Order } from '../../../../puck/dashboard/hooks';
import { OrderSummaryCard } from '../../../../puck/dashboard/components';

// Helper to format currency from cents
function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

// Helper to format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const limit = 10;

  const { orders, total, isLoading, isError } = useCustomerOrders({
    limit,
    offset: page * limit,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/account"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order History
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              View and track all your orders
            </p>
          </div>
        </div>

        <select
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
        >
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-gray-500">
            <p>Failed to load orders. Please try again.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No orders found</p>
            <p className="text-sm mt-1">
              {statusFilter !== 'all'
                ? `No ${statusFilter} orders`
                : "You haven't placed any orders yet"}
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order: Order) => (
              <div key={order.id} className="p-4">
                <OrderSummaryCard
                  orderNumber={order.orderNumber}
                  date={formatDate(order.createdAt)}
                  status={order.status as 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'}
                  total={formatCurrency(order.total)}
                  itemCount={order.itemCount}
                  trackingNumber={order.shipment?.trackingNumber}
                  showViewButton={true}
                  viewOrderUrl={`/account/orders/${order.id}`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500">
              Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total} orders
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
