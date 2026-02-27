'use client'

import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'
import type { DashboardStats } from '@/lib/cms/block-editor/smart-blocks/dashboard-data'

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

export default function DashboardWelcome({ block, data, className }: SmartBlockProps) {
  const stats = data.stats as DashboardStats | undefined
  const userName = (data.userName as string) || 'there'

  const outer =
    className ||
    block.className ||
    'rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white'

  return (
    <div className={outer}>
      <h2 className="text-2xl font-bold">
        Welcome back, {userName}
      </h2>
      <p className="mt-1 text-blue-100">
        Here is a summary of your account activity.
      </p>

      {stats && (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-md bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Total Orders</p>
            <p className="text-2xl font-semibold">{stats.orderCount}</p>
          </div>
          <div className="rounded-md bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Total Spent</p>
            <p className="text-2xl font-semibold">{formatCurrency(stats.totalSpent)}</p>
          </div>
          <div className="rounded-md bg-white/10 p-3 backdrop-blur-sm">
            <p className="text-sm text-blue-100">Member Since</p>
            <p className="text-2xl font-semibold">
              {new Date(stats.memberSince).toLocaleDateString(undefined, {
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
