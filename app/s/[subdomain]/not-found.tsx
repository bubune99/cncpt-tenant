import Link from 'next/link';

/**
 * Not Found page for subdomain routes.
 *
 * This catches notFound() calls within /s/[subdomain]/ routes,
 * such as when a page slug doesn't exist on a valid subdomain.
 * Shows a proper 404 page instead of the misleading
 * "subdomain hasn't been created" message.
 */
export default function SubdomainNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white p-4">
      <div className="text-center max-w-md px-4">
        <p className="text-5xl sm:text-6xl font-bold text-gray-300 mb-3 sm:mb-4">404</p>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 mb-2 sm:mb-3">
          Page Not Found
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}
