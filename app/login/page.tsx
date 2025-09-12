import { SignIn } from "@stackframe/stack"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn afterSignIn="/dashboard" afterSignUp="/dashboard" />
    </div>
  )
}
