'use client';

import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';

/**
 * Root-level 404 page.
 *
 * Shows a generic, user-friendly 404 without exposing internal
 * platform details (no "subdomain hasn't been created" messaging).
 *
 * Subdomain-specific 404s are handled by app/s/[subdomain]/not-found.tsx.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="text-center max-w-md px-4">
        <p className="text-5xl sm:text-6xl font-bold text-gray-300 mb-3 sm:mb-4">404</p>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 mb-2 sm:mb-3">
          Page Not Found
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
          The page you are looking for does not exist or may have been removed.
        </p>
        <Link
          href={`${protocol}://${rootDomain}`}
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
