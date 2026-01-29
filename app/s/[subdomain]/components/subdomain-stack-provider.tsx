"use client"

import { useMemo, createContext, useContext } from "react"
import { StackProvider, StackTheme } from "@stackframe/stack"
import {
  createSubdomainStackClientApp,
  type SubdomainAuthConfigPublic,
} from "@/lib/subdomain-stack-auth"

// Context for subdomain branding info
interface SubdomainBrandingContextValue {
  subdomain: string
  logoUrl: string | null
  primaryColor: string
  brandName: string | null
  enableSocialAuth: boolean
  enableMagicLink: boolean
  enablePasswordAuth: boolean
}

const SubdomainBrandingContext =
  createContext<SubdomainBrandingContextValue | null>(null)

export function useSubdomainBranding() {
  const context = useContext(SubdomainBrandingContext)
  if (!context) {
    throw new Error(
      "useSubdomainBranding must be used within SubdomainStackProvider"
    )
  }
  return context
}

interface SubdomainStackProviderProps {
  children: React.ReactNode
  config: SubdomainAuthConfigPublic
}

export function SubdomainStackProvider({
  children,
  config,
}: SubdomainStackProviderProps) {
  // Memoize the Stack app to avoid recreation on re-renders
  const stackApp = useMemo(
    () => createSubdomainStackClientApp(config),
    [config.stack_auth_project_id, config.stack_auth_publishable_key]
  )

  // Branding context value
  const brandingValue = useMemo<SubdomainBrandingContextValue>(
    () => ({
      subdomain: config.subdomain,
      logoUrl: config.branding_logo_url,
      primaryColor: config.branding_primary_color,
      brandName: config.branding_name,
      enableSocialAuth: config.enable_social_auth,
      enableMagicLink: config.enable_magic_link,
      enablePasswordAuth: config.enable_password_auth,
    }),
    [config]
  )

  return (
    <SubdomainBrandingContext.Provider value={brandingValue}>
      <StackProvider app={stackApp}>
        <StackTheme>
          {children}
        </StackTheme>
      </StackProvider>
    </SubdomainBrandingContext.Provider>
  )
}
