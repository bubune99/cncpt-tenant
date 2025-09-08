"use server"

import { createUser, authenticateUser, createSession, deleteSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { sql } from "@/lib/neon"

export async function registerAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const name = formData.get("name") as string

  if (!email || !password || !name) {
    return { success: false, error: "All fields are required" }
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long" }
  }

  // Check if user already exists
  const existingUser = await sql`
    SELECT id FROM users WHERE email = ${email}
  `

  if (existingUser.length > 0) {
    return { success: false, error: "An account with this email already exists" }
  }

  try {
    const user = await createUser(email, password, name)
    await createSession(user.id)
    redirect("/dashboard")
  } catch (error) {
    return { success: false, error: "Failed to create account. Please try again." }
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  const user = await authenticateUser(email, password)
  if (!user) {
    return { success: false, error: "Invalid email or password" }
  }

  await createSession(user.id)
  redirect("/dashboard")
}

export async function logoutAction() {
  await deleteSession()
  redirect("/")
}
