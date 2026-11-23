import type { ReactNode } from 'react'
import { FarCmsLayout } from '@/lib/far-cms/cms-layout'

export default function Layout({ children }: { children: ReactNode }) {
  return <FarCmsLayout>{children}</FarCmsLayout>
}
