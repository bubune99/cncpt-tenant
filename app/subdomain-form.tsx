"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createSubdomainAction } from "@/app/actions"
import { rootDomain } from "@/lib/utils"

type CreateState = {
  error?: string
  success?: boolean
  subdomain?: string
  icon?: string
}

function SubdomainInput({ defaultValue }: { defaultValue?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="subdomain">Subdomain</Label>
      <div className="flex items-center">
        <div className="relative flex-1">
          <Input
            id="subdomain"
            name="subdomain"
            placeholder="your-subdomain"
            defaultValue={defaultValue}
            className="w-full rounded-r-none focus:z-10"
            required
          />
        </div>
        <span className="bg-gray-100 px-3 border border-l-0 border-input rounded-r-md text-gray-500 min-h-[36px] flex items-center">
          .{rootDomain}
        </span>
      </div>
      <p className="text-xs text-gray-500">Lowercase letters, numbers, and hyphens only</p>
    </div>
  )
}

export function SubdomainForm() {
  const [isPending, setIsPending] = useState(false)
  const [state, setState] = useState<CreateState>({})

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsPending(true)

    try {
      const formData = new FormData(event.currentTarget)
      const result = await createSubdomainAction(state, formData)
      setState(result)
    } catch (error) {
      setState({ error: "Failed to create subdomain" })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <SubdomainInput defaultValue={state?.subdomain} />

      {state?.error && <div className="text-sm text-red-500">{state.error}</div>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Creating..." : "Create Subdomain"}
      </Button>
    </form>
  )
}
