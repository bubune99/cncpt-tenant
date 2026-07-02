"use client"

import { useUser } from "@stackframe/stack"
import { ClientsPageContent } from "./clients-content"

export default function ClientsPage() {
  const user = useUser()
  const adminUserId = user?.id || ""

  return <ClientsPageContent adminUserId={adminUserId} />
}
