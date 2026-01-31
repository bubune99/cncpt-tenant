"use client"

import React, { createContext, useContext, ReactNode } from "react"

export interface TenantContextValue {
  subdomain: string
  tenantId: number | null
  accessLevel: "owner" | "admin" | "editor" | "viewer"
  basePath: string // e.g., "/s/bubune/admin" or "/admin"
}

const TenantContext = createContext<TenantContextValue | null>(null)

export interface TenantProviderProps {
  children: ReactNode
  subdomain: string
  tenantId: number | null
  accessLevel?: "owner" | "admin" | "editor" | "viewer"
  basePath?: string
}

export function TenantProvider({
  children,
  subdomain,
  tenantId,
  accessLevel = "admin",
  basePath = "/admin",
}: TenantProviderProps) {
  return (
    <TenantContext.Provider
      value={{
        subdomain,
        tenantId,
        accessLevel,
        basePath,
      }}
    >
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant(): TenantContextValue {
  const context = useContext(TenantContext)
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider")
  }
  return context
}

export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext)
}
