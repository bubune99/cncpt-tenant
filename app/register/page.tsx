"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export const dynamic = "force-dynamic"

function ClientSideSignUp() {
  const [isClient, setIsClient] = useState(false)
  const [SignUpComponent, setSignUpComponent] = useState<any>(null)

  useEffect(() => {
    setIsClient(true)
    import("@stackframe/stack").then((module) => {
      setSignUpComponent(() => module.SignUp)
    })
  }, [])

  if (!isClient || !SignUpComponent) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <SignUpComponent />
}

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Create Account</h1>
          <p className="mt-3 text-lg text-gray-600">Join us and create your own subdomain</p>
        </div>

        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <ClientSideSignUp />
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
