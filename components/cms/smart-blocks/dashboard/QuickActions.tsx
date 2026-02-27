'use client'

import Link from 'next/link'
import {
  Package,
  User,
  MapPin,
  Settings,
  Heart,
  CreditCard,
} from 'lucide-react'
import type { SmartBlockProps } from '@/lib/cms/block-editor/smart-blocks/registry'

const ACTIONS = [
  { label: 'My Orders', href: '/account/orders', icon: Package, color: 'bg-blue-50 text-blue-600' },
  { label: 'Profile', href: '/account/profile', icon: User, color: 'bg-gray-50 text-gray-600' },
  { label: 'Addresses', href: '/account/addresses', icon: MapPin, color: 'bg-green-50 text-green-600' },
  { label: 'Wishlist', href: '/account/wishlist', icon: Heart, color: 'bg-red-50 text-red-600' },
  { label: 'Payments', href: '/account/payments', icon: CreditCard, color: 'bg-purple-50 text-purple-600' },
  { label: 'Settings', href: '/account/settings', icon: Settings, color: 'bg-amber-50 text-amber-600' },
]

export default function QuickActions({ block, data: _data, className }: SmartBlockProps) {
  const outer =
    className ||
    block.className ||
    'rounded-lg border border-gray-200 bg-white p-6'

  return (
    <div className={outer}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-lg border border-gray-100 p-4 hover:border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className={`rounded-full p-2 ${action.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {action.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
