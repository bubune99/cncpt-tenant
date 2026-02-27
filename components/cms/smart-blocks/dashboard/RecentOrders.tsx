'use client'

import Link from 'next/link'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { RecentOrder } from '@/lib/cms/block-editor/smart-blocks/dashboard-data'

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
}

export default function RecentOrders({ block, data, className }: SmartBlockProps) {
  const orders = (data.recentOrders as RecentOrder[]) || []

  const outer =
    className ||
    block.className ||
    'rounded-lg border border-gray-200 bg-white p-6'

  return (
    <div className={outer}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
        <Link
          href="/account/orders"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          View all
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">
          No orders yet. Start shopping to see your orders here.
        </p>
      ) : (
        <div className="divide-y divide-gray-100">
          {orders.map((order) => {
            const statusClass = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'
            return (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    #{order.orderNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()} &middot;{' '}
                    {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}
                  >
                    {order.status}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
