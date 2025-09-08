import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { stackServerApp } from "@/lib/auth"

export default async function RegisterPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }

  redirect(stackServerApp.urls.signUp)
}
