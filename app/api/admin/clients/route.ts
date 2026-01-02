import { NextRequest, NextResponse } from "next/server"
import { getAllClients } from "@/lib/clients"
import type { ClientFilters } from "@/types/admin"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const filters: ClientFilters = {
      search: searchParams.get("search") || undefined,
      status: searchParams.get("status") as ClientFilters["status"] || "all",
      tierId: searchParams.get("tierId") || "all",
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "50", 10),
      sortBy: (searchParams.get("sortBy") as ClientFilters["sortBy"]) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as ClientFilters["sortOrder"]) || "desc",
    }

    const result = await getAllClients(filters)

    return NextResponse.json({
      clients: result.clients,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    })
  } catch (error) {
    console.error("[API] Error fetching clients:", error)
    // Return empty result if tables don't exist yet
    return NextResponse.json({
      clients: [],
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 0,
    })
  }
}
