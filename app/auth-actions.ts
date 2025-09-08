"use server"

import { stackServerApp } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function registerAction() {
  // Redirect to Stack Auth sign-up page
  redirect(stackServerApp.urls.signUp)
}

export async function loginAction() {
  // Redirect to Stack Auth sign-in page
  redirect(stackServerApp.urls.signIn)
}

export async function logoutAction() {
  // Use Stack Auth sign-out
  const user = await stackServerApp.getUser()
  if (user) {
    await user.signOut()
  }
  redirect("/")
}
