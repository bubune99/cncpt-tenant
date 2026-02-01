import { Suspense } from 'react';
import { AdminShellWrapper } from './AdminShellWrapper';

// Prevent static generation - admin pages require auth context
export const dynamic = 'force-dynamic';

function AdminLoadingFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading admin...</p>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <AdminShellWrapper>{children}</AdminShellWrapper>
    </Suspense>
  );
}
