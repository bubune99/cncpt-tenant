import { LoginForm } from "./login-form"
import Link from "next/link"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
          <p className="mt-3 text-lg text-gray-600">Sign in to your account</p>
        </div>

        <div className="mt-8 bg-white shadow-md rounded-lg p-6">
          <LoginForm />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                Sign up
              </Link>
            </p>
          </div>
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
