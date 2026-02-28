/**
 * Account Route Group Layout
 *
 * Layout for customer account pages with Stack Auth protection.
 * Redirects unauthenticated users to sign in.
 */

import { redirect } from 'next/navigation';
import { stackServerApp } from '@/lib/cms/stack';
import { PageWrapper, getPageLayoutSettings } from '@/components/cms/page-wrapper';
import { features } from '../../../../../client.config';

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if customer dashboard feature is enabled
  if (!features.customerDashboard) {
    redirect('/');
  }

  // Check authentication on the server
  const user = await stackServerApp.getUser();

  if (!user) {
    // Redirect to sign in with return URL
    redirect('/handler/sign-in?after_auth_return_to=/account');
  }

  // Account pages use default layout (header/footer from SiteSettings)
  const pageSettings = getPageLayoutSettings({
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
