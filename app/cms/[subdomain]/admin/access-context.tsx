"use client"

import { createContext, useContext } from "react"

interface AccessContextValue {
  subdomain: string
  accessType: "owner" | "team" | null
  accessLevel: "view" | "edit" | "admin"
}

const AccessContext = createContext<AccessContextValue | null>(null)

export function useAccessContext() {
  const context = useContext(AccessContext)
  if (!context) {
    throw new Error("useAccessContext must be used within an AccessProvider")
  }
  return context
}

export function AccessProvider({
  children,
  value,
}: {
  children: React.ReactNode
  value: AccessContextValue
}) {
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}
