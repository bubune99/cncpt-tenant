import { SignIn } from "@stackframe/stack"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams
  const afterAuth = redirect || "/dashboard"

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn afterSignIn={afterAuth} afterSignUp={afterAuth} />
    </div>
  )
}
