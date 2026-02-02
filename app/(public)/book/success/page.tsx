'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function BookingSuccessPage() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('id')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your consultation has been scheduled. You&apos;ll receive a confirmation email shortly with all the details.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-medium text-gray-900 mb-2">What&apos;s Next?</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                Check your email for confirmation details
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                Add the appointment to your calendar
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                Prepare any questions you have about your project
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">&#10003;</span>
                We&apos;ll send you a reminder before the meeting
              </li>
            </ul>
          </div>

          {bookingId && (
            <p className="text-xs text-gray-400 mb-6">
              Booking reference: {bookingId.slice(0, 8)}
            </p>
          )}

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Return Home
            </Link>
            <Link
              href="/book"
              className="block w-full py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Book Another Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
