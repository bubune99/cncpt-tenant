import { SignIn } from "@stackframe/stack"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams
  const afterAuth = redirect || "/dashboard"

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50" data-tour-id="login-page">
      <div data-tour-id="login-stack-container">
        <SignIn afterSignIn={afterAuth} afterSignUp={afterAuth} />
      </div>
    </div>
  )
}
