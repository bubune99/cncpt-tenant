// The shared far-cms Customers screens expect the CMS's admin context (wizard, help, config); CNCPT's own admin
// layout around this provides the chrome. Card 10 (c645e053) step 3.
import type { ReactNode } from 'react'
import { CmsProviders } from '@far-cms/cms/src/components/admin/cms-providers'

export default function FarCmsCustomersLayout({ children }: { children: ReactNode }) {
  return <CmsProviders config={{ basePath: '' }}>{children}</CmsProviders>
}
