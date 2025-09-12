"use client"

import { useFormState } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerAction } from "@/app/auth-actions"

type RegisterState = {
  error?: string
  success?: boolean
}

export function RegisterForm() {
  const [state, action] = useFormState<RegisterState>(registerAction, {})

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input id="name" name="name" type="text" placeholder="Your full name" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" placeholder="your@email.com" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="At least 8 characters"
          required
          minLength={8}
        />
      </div>

      {state?.error && <div className="text-sm text-red-500">{state.error}</div>}

      <Button type="submit" className="w-full">
        Create Account
      </Button>
    </form>
  )
}
