"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export const dynamic = "force-dynamic"

function ClientSideSignIn() {
  const [isClient, setIsClient] = useState(false)
  const [SignInComponent, setSignInComponent] = useState<any>(null)
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect")

  useEffect(() => {
    setIsClient(true)
    import("@stackframe/stack").then((module) => {
      setSignInComponent(() => module.SignIn)
    })
  }, [])

  if (!isClient || !SignInComponent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const signInProps = redirectPath
    ? {
        afterSignIn: `/auth-redirect?redirect=${encodeURIComponent(redirectPath)}`,
        afterSignUp: `/auth-redirect?redirect=${encodeURIComponent(redirectPath)}`,
      }
    : {
        afterSignIn: "/auth-redirect",
        afterSignUp: "/auth-redirect",
      }

  return <SignInComponent {...signInProps} />
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect")

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
          <p className="mt-3 text-lg text-gray-600">
            Sign in to your account
            {redirectPath && (
              <span className="block text-sm text-gray-500 mt-1">You'll be redirected to {redirectPath}</span>
            )}
          </p>
        </div>

        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <ClientSideSignIn />
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
