'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { MailX, XCircle } from 'lucide-react'

function UnsubscribedContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {success ? (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MailX className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              You&apos;ve Been Unsubscribed
            </h1>
            <p className="text-gray-600 mb-4">
              We&apos;re sorry to see you go. You will no longer receive emails from us.
            </p>
            <p className="text-sm text-gray-500">
              Changed your mind? You can always resubscribe on our website.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Unsubscribe Failed
            </h1>
            <p className="text-gray-600">
              {error === 'missing_identifier'
                ? 'The unsubscribe link is invalid.'
                : error === 'Subscriber not found'
                  ? 'We couldn\'t find your subscription.'
                  : 'We couldn\'t process your unsubscribe request. Please try again or contact support.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      }
    >
      <UnsubscribedContent />
    </Suspense>
  )
}
