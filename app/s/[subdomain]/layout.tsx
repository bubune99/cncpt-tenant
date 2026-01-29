import { getSubdomainAuthConfigPublic } from "@/lib/subdomain-stack-auth"
import { SubdomainStackProvider } from "./components/subdomain-stack-provider"

export default async function StorefrontLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ subdomain: string }>
}) {
  const { subdomain } = await params
  const authConfig = await getSubdomainAuthConfigPublic(subdomain)

  // If no auth config exists, allow anonymous browsing only
  if (!authConfig) {
    return <>{children}</>
  }

  return (
    <SubdomainStackProvider config={authConfig}>
      {children}
    </SubdomainStackProvider>
  )
}
