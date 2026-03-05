import { DocsLayoutClient } from "@/components/docs/docs-layout-client"

export const metadata = {
  title: "Documentation | CNCPT Web",
  description: "Learn how to use CNCPT Web — guides, tutorials, and API reference.",
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsLayoutClient>{children}</DocsLayoutClient>
}
