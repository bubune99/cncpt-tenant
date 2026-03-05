"use server"

import { stackServerApp } from "@/stack"
import { redirect } from "next/navigation"
import { syncUserToDb, syncUserToCms } from "@/lib/auth-sync"

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

  try {
    const stackUser = await stackServerApp.createUser({
      primaryEmail: email,
      password: password,
      displayName: name,
    })

    // Immediately sync to both platform users table and CMS User model
    // This ensures the user record exists before they hit the dashboard
    try {
      await syncUserToDb({
        id: stackUser.id,
        primaryEmail: email,
        displayName: name,
        profileImageUrl: null,
      })
    } catch (syncError) {
      console.warn("[register] Platform user sync failed (non-critical):", syncError)
    }

    try {
      await syncUserToCms({
        id: stackUser.id,
        primaryEmail: email,
        displayName: name,
        profileImageUrl: null,
      })
    } catch (syncError) {
      console.warn("[register] CMS user sync failed (non-critical):", syncError)
    }

    // Sign in the user after registration
    await stackServerApp.signInWithPassword({ email, password })
    redirect("/dashboard")
  } catch (error: any) {
    if (error.message?.includes("already exists")) {
      return { success: false, error: "An account with this email already exists" }
    }
    return { success: false, error: "Failed to create account. Please try again." }
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Email and password are required" }
  }

  try {
    await stackServerApp.signInWithPassword({ email, password })
    redirect("/dashboard")
  } catch (error) {
    return { success: false, error: "Invalid email or password" }
  }
}

export async function logoutAction() {
  await stackServerApp.signOut()
  redirect("/")
}
