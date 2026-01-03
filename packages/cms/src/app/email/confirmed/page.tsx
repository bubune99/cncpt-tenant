'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'

function ConfirmedContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Subscription Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for confirming your email address. You&apos;re now subscribed to our updates.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Confirmation Failed
            </h1>
            <p className="text-gray-600">
              {error === 'missing_token'
                ? 'The confirmation link is invalid.'
                : error === 'Invalid or expired confirmation token'
                  ? 'This confirmation link has expired or already been used.'
                  : 'We couldn\'t confirm your subscription. Please try again or contact support.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function ConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      }
    >
      <ConfirmedContent />
    </Suspense>
  )
}
