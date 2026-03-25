import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack';
import { isSuperAdmin } from '@/lib/super-admin';
import { canAccessSubdomain } from '@/lib/team-auth';
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

function AccessDenied() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-bold">403 — Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to access this admin panel.
        </p>
      </div>
    </div>
  );
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  // Verify authenticated user has access to this subdomain's admin
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect('/handler/sign-in?after_auth_return_to=/admin');
  }

  // Super admins can access any subdomain
  const superAdmin = await isSuperAdmin(user.id);

  if (!superAdmin) {
    // Check ownership or team membership with admin-level access
    const access = await canAccessSubdomain(user.id, subdomain, 'admin');

    if (!access.hasAccess) {
      return <AccessDenied />;
    }
  }

  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <AdminShellWrapper>{children}</AdminShellWrapper>
    </Suspense>
  );
}
