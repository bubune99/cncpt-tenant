"use client"

import { createContext, useContext } from "react"

interface SubdomainContextValue {
  subdomain: string
}

const SubdomainContext = createContext<SubdomainContextValue | null>(null)

export function useSubdomain() {
  const context = useContext(SubdomainContext)
  if (!context) {
    throw new Error("useSubdomain must be used within a SubdomainProvider")
  }
  return context
}

export default function CMSLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { subdomain: string }
}) {
  return (
    <SubdomainContext.Provider value={{ subdomain: params.subdomain }}>
      {children}
    </SubdomainContext.Provider>
  )
}
