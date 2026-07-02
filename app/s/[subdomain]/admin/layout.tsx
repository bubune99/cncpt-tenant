import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack';
import { isSuperAdmin } from '@/lib/super-admin';
import { canAccessSubdomain } from '@/lib/team-auth';
import { isDemoSubdomain } from '@/lib/demo';
import { sql } from '@/lib/neon';
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

function AccessDenied({ subdomain }: { subdomain: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <h1 className="text-2xl font-bold">403 — Access Denied</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to access the admin panel for{' '}
          <span className="font-mono">{subdomain}</span>.
        </p>
        <p className="text-xs text-muted-foreground">
          Ask the owner of this site to invite you, or sign in with a different account.
        </p>
        <div className="flex gap-2 mt-2">
          <Link
            href="/handler/sign-in"
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            Switch account
          </Link>
          <a
            href="https://cncptweb.com/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Your dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

function UnknownSubdomain({ subdomain }: { subdomain: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 text-center max-w-md">
        <p className="text-5xl font-bold text-muted-foreground/40">404</p>
        <h1 className="text-2xl font-bold">This site doesn&apos;t exist</h1>
        <p className="text-sm text-muted-foreground">
          No site is registered at{' '}
          <span className="font-mono">{subdomain}.cncptweb.com</span>. It may have been
          deleted, or the URL might be misspelled.
        </p>
        <div className="flex gap-2 mt-2">
          <a
            href="https://cncptweb.com"
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent transition-colors"
          >
            CNCPT Web home
          </a>
          <a
            href="https://cncptweb.com/dashboard"
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Your dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

// Helper: does this subdomain row actually exist in the DB?
async function subdomainExists(subdomain: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT 1 FROM subdomains WHERE subdomain = ${subdomain} LIMIT 1
    `;
    return result.length > 0;
  } catch (error) {
    // If the lookup itself fails, fall back to access-denied path so we
    // don't leak DB errors as a friendly "site doesn't exist" page.
    console.error('[admin-layout] subdomain existence check failed:', error);
    return true;
  }
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;

  // The "demo" subdomain is an unauthenticated, read-only showcase — the
  // access API (/api/subdomains/[subdomain]/access) and client shell already
  // handle demo mode, but this server gate ran first and bounced everyone to
  // sign-in, making the demo unreachable. Skip auth for it.
  if (isDemoSubdomain(subdomain)) {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <AdminShellWrapper>{children}</AdminShellWrapper>
      </Suspense>
    );
  }

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
      // Differentiate between "subdomain doesn't exist" (typo) and
      // "subdomain exists but you don't own it" (genuine access denial).
      // Without this branch the user sees a bare 403, which is misleading
      // when they just typo'd a URL.
      const exists = await subdomainExists(subdomain);
      if (!exists) {
        return <UnknownSubdomain subdomain={subdomain} />;
      }
      return <AccessDenied subdomain={subdomain} />;
    }
  }

  return (
    <Suspense fallback={<AdminLoadingFallback />}>
      <AdminShellWrapper>{children}</AdminShellWrapper>
    </Suspense>
  );
}
