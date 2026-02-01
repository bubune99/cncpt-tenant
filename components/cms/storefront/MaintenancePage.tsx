/**
 * MaintenancePage Component
 *
 * Displayed when a site is in maintenance mode.
 * Shows a friendly message and allows owners to bypass.
 */

import { Construction } from 'lucide-react';

export interface MaintenancePageProps {
  /** The subdomain/site name */
  siteName: string;
  /** Custom message from site owner */
  message?: string | null;
  /** Whether to show bypass option (for owners) */
  showBypass?: boolean;
  /** Bypass URL */
  bypassUrl?: string;
}

export function MaintenancePage({
  siteName,
  message,
  showBypass = false,
  bypassUrl = '?bypass=maintenance',
}: MaintenancePageProps) {
  const defaultMessage = "We're making some improvements to bring you a better experience. Please check back soon!";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Construction className="w-10 h-10 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Under Maintenance
        </h1>

        {/* Site name */}
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
          <span className="font-semibold">{siteName}</span> is currently undergoing scheduled maintenance.
        </p>

        {/* Message */}
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          {message || defaultMessage}
        </p>

        {/* Bypass link for owners */}
        {showBypass && (
          <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-2">
              Site owner?
            </p>
            <a
              href={bypassUrl}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Continue to site
            </a>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-xs text-slate-400 dark:text-slate-500">
          We apologize for any inconvenience.
        </div>
      </div>
    </div>
  );
}

export default MaintenancePage;
