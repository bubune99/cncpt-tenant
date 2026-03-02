import { NextRequest, NextResponse } from "next/server"
import { getClientById } from "@/lib/clients"
import { stackServerApp } from "@/stack"
import { isSuperAdmin } from "@/lib/super-admin"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const user = await stackServerApp.getUser()
    if (!user || !(await isSuperAdmin(user.id))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const client = await getClientById(resolvedParams.clientId)

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    return NextResponse.json({ client })
  } catch (error) {
    console.error("[API] Error fetching client:", error)
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    )
  }
}
