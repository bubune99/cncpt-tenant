import { StackHandler } from "@stackframe/stack"
import { notFound } from "next/navigation"
import {
  getSubdomainAuthConfig,
  createSubdomainStackServerApp,
} from "@/lib/subdomain-stack-auth"

export default async function SubdomainAuthHandler({
  params,
  ...props
}: {
  params: Promise<{ subdomain: string; handler: string[] }>
}) {
  const { subdomain } = await params
  const authConfig = await getSubdomainAuthConfig(subdomain)

  // If no auth config exists for this subdomain, return 404
  if (!authConfig) {
    notFound()
  }

  // Create subdomain-specific Stack Auth app
  const stackApp = createSubdomainStackServerApp(authConfig)

  return <StackHandler fullPage app={stackApp} {...props} />
}
