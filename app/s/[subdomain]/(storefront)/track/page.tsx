'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, Search, ArrowRight } from 'lucide-react'

export default function TrackOrderPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!orderNumber.trim()) {
      setError('Please enter an order number')
      return
    }

    // Navigate to the order tracking page
    const url = email
      ? `/track/${orderNumber.toUpperCase()}?email=${encodeURIComponent(email)}`
      : `/track/${orderNumber.toUpperCase()}`

    router.push(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Track Your Order</h1>
            <p className="text-gray-600">
              Enter your order number to see the latest status
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="orderNumber"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Order Number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., ORD-000001"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter the email used for this order"
              />
              <p className="mt-1 text-xs text-gray-500">
                Skip email verification by entering your order email
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              Track Order
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-gray-500">
              Can&apos;t find your order number? Check your order confirmation email.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Need help?{' '}
          <a href="/contact" className="text-blue-600 hover:text-blue-800">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  )
}
