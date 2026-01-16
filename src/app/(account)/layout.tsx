/**
 * Account Route Group Layout
 *
 * Layout for customer account pages with Stack Auth protection.
 * Redirects unauthenticated users to sign in.
 */

import { redirect } from 'next/navigation';
import { stackServerApp } from '../../lib/stack';
import { PageWrapper, getPageLayoutSettings } from '../../components/page-wrapper';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on the server
  const user = await stackServerApp.getUser();

  if (!user) {
    // Redirect to sign in with return URL
    redirect('/handler/sign-in?after_auth_return_to=/account');
  }

  // Default page settings for account pages - use GLOBAL mode for header/footer
  const pageSettings = getPageLayoutSettings({
    headerMode: 'GLOBAL',
    footerMode: 'GLOBAL',
    showAnnouncement: false,
  });

  return (
    <PageWrapper pageSettings={pageSettings}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </PageWrapper>
  );
}
