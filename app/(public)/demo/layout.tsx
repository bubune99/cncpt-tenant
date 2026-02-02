import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CMS Demo | CNCPT Web',
  description: 'Try our powerful CMS platform with sample data. Explore products, orders, blog posts, pages, and more - no signup required.',
  openGraph: {
    title: 'Try CNCPT CMS Demo',
    description: 'Explore our full-featured CMS platform with sample data. See how easy it is to manage your online business.',
    type: 'website',
  },
}

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
