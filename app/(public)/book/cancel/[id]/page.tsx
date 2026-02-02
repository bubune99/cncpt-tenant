'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  scheduledAt: string
  durationMinutes: number
  status: string
  service: { name: string } | null
}

export default function CancelBookingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    async function loadBooking() {
      try {
        const res = await fetch(`/api/bookings/${id}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Booking not found')
          return
        }

        setBooking(data.booking)

        if (data.booking.status === 'cancelled') {
          setCancelled(true)
        }
      } catch (err) {
        console.error('Failed to load booking:', err)
        setError('Failed to load booking details')
      } finally {
        setLoading(false)
      }
    }
    loadBooking()
  }, [id])

  const handleCancel = async () => {
    if (!email) {
      setError('Please enter your email to confirm')
      return
    }

    setCancelling(true)
    setError(null)

    try {
      const res = await fetch(`/api/bookings/${id}?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel booking')
      }

      setCancelled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Cancelled</h1>
            <p className="text-gray-600 mb-6">
              Your booking has been cancelled. You&apos;ll receive a confirmation email shortly.
            </p>

            <div className="space-y-3">
              <Link
                href="/book"
                className="block w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Book a New Appointment
              </Link>
              <Link
                href="/"
                className="block w-full py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Return Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cancel Booking</h1>
          <p className="text-gray-600 mb-6">
            Are you sure you want to cancel this appointment?
          </p>

          {booking && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Service</span>
                <span className="font-medium">{booking.service?.name || 'Consultation'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date</span>
                <span className="font-medium">{formatDate(booking.scheduledAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time</span>
                <span className="font-medium">{formatTime(booking.scheduledAt)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the email you used to book this appointment
            </p>
          </div>

          <div className="flex gap-4">
            <Link
              href="/"
              className="flex-1 py-3 text-center border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Keep Booking
            </Link>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
