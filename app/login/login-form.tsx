"use client"

import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction } from "@/app/auth-actions"

type LoginState = {
  error?: string
  success?: boolean
}

export function LoginForm() {
  const [state, action] = useFormState<LoginState>(loginAction, {})

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="your@email.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" placeholder="Enter your password" required />
      </div>

      {state?.error && <div className="text-sm text-red-500">{state.error}</div>}

      <Button type="submit" className="w-full">
        Sign In
      </Button>
    </form>
  )
}
