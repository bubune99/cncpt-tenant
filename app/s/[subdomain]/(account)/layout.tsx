/**
 * Atlas White-Label Account Route Group Layout
 * Authentication guard + sidebar shell for all /account/* pages.
 * Uses --wl-* tokens; sidebar is client-rendered for active state.
 */

import { redirect } from 'next/navigation';
import { stackServerApp } from '@/lib/cms/stack';
import { features } from '../../../../client.config';
import { AccountSidebar } from '@/components/cms/account/AccountSidebar';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Feature gate
  if (!features.customerDashboard) {
    redirect('/');
  }

  // Auth guard
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/handler/sign-in?after_auth_return_to=/account');
  }

  const displayName  = user.displayName ?? user.primaryEmail ?? 'Customer';
  const userEmail    = user.primaryEmail ?? '';
  const userInitial  = displayName.charAt(0).toUpperCase();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--wl-bg)',
        color: 'var(--wl-text)',
        fontFamily: 'var(--wl-font-body)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Left sidebar */}
        <AccountSidebar
          userName={displayName}
          userEmail={userEmail}
          userInitial={userInitial}
        />

        {/* Main content */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            overflowY: 'auto',
            padding: '24px 32px 48px',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
