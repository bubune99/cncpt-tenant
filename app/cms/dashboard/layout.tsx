/**
 * Dashboard Layout
 *
 * Authenticated area for user-facing dashboard.
 * Uses the AuthenticatedAreaShell for consistent navigation.
 */

import { Suspense } from 'react';
import { AuthenticatedAreaShell } from '@/components/authenticated-area';

// Prevent static generation - requires auth context
export const dynamic = 'force-dynamic';

function DashboardLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLoadingFallback />}>
      <AuthenticatedAreaShell areaId="dashboard">
        {children}
      </AuthenticatedAreaShell>
    </Suspense>
  );
}
