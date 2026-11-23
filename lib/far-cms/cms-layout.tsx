// The context the shared far-cms screens expect (wizard, help, config, features), inside CNCPT's own admin chrome.
// Every area mounted from @far-cms/cms uses this in its layout. Card 10 (c645e053) step 3.
import type { ReactNode } from 'react'
import { CmsProviders } from '@far-cms/cms/src/components/admin/cms-providers'

export function FarCmsLayout({ children }: { children: ReactNode }) {
  // No Stripe sync card and no Canva tab: CNCPT's sites have no Stripe or Canva connection of their own yet, and those routes are not mounted.
  return <CmsProviders config={{ basePath: '' }} features={{ commerceEnabled: true, stripeCustomerSync: false, stripeProductSync: false, canva: false }}>{children}</CmsProviders>
}
