import { NextRequest, NextResponse } from "next/server"
import { getClientById } from "@/lib/clients"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
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
