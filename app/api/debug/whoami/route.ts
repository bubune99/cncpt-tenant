import { NextResponse } from "next/server"
import { stackServerApp } from "@/stack"

export async function GET() {
  try {
    const user = await stackServerApp.getUser()

    if (!user) {
      return NextResponse.json({ error: "Not logged in", user: null })
    }

    return NextResponse.json({
      id: user.id,
      email: user.primaryEmail,
      displayName: user.displayName,
      message: "Use this 'id' value for super_admins.user_id"
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
