import { stackServerApp } from "@/stack"
import { redirect } from "next/navigation"

export default async function TeamsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await stackServerApp.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  )
}
