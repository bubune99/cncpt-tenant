/**
 * Unsubscribed Page
 *
 * Shown when a user unsubscribes from all email communications.
 */

import Link from 'next/link';

export default function UnsubscribedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You&apos;ve Been Unsubscribed
        </h1>
        <p className="text-gray-600 mb-6">
          You have been unsubscribed from all marketing emails. You may still
          receive important transactional emails related to your account.
        </p>
        <div className="space-y-3">
          <Link
            href="/email/preferences"
            className="block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Manage Email Preferences
          </Link>
          <Link
            href="/"
            className="block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
