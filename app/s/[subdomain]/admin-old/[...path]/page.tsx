"use client"

import { useParams } from "next/navigation"
import { AdminPageRouter } from "@/admin-pages"

export default function SubdomainAdminPage() {
  const params = useParams()
  const path = params.path as string[]

  return <AdminPageRouter path={path} />
}
