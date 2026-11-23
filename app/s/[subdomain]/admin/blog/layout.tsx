import type { ReactNode } from 'react'
import { FarCmsLayout } from '@/lib/far-cms/cms-layout'
import './journal-editor.css'

export default function BlogLayout({ children }: { children: ReactNode }) {
  return <FarCmsLayout>{children}</FarCmsLayout>
}
