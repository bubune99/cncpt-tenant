"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

// Common emojis for subdomain icons
const EMOJI_OPTIONS = [
  "🚀", "💡", "🎯", "⭐", "🔥", "💎", "🌟", "🎨",
  "📱", "💻", "🌈", "🎪", "🏠", "🛒", "📚", "🎵",
  "🎮", "🏆", "💼", "🌍", "🔧", "📊", "🎁", "💫",
]

interface SubdomainInputProps {
  value: string
  onChange: (value: string) => void
  emoji: string
  onEmojiChange: (emoji: string) => void
  domain: string
  onAvailabilityChange?: (isAvailable: boolean | null) => void
  disabled?: boolean
  error?: string
}

export function SubdomainInput({
  value,
  onChange,
  emoji,
  onEmojiChange,
  domain,
  onAvailabilityChange,
  disabled = false,
  error: externalError,
}: SubdomainInputProps) {
  const [checking, setChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  // Validation rules
  const validateSubdomain = useCallback((subdomain: string): string | null => {
    if (!subdomain) return null // Empty is ok (not validated yet)

    if (subdomain.length < 3) {
      return "Must be at least 3 characters"
    }

    if (subdomain.length > 63) {
      return "Must be at most 63 characters"
    }

    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(subdomain)) {
      if (subdomain.startsWith("-") || subdomain.endsWith("-")) {
        return "Cannot start or end with a hyphen"
      }
      return "Only lowercase letters, numbers, and hyphens"
    }

    const reserved = [
      "www", "app", "api", "admin", "dashboard", "mail", "email",
      "ftp", "blog", "shop", "store", "help", "support", "docs",
      "dev", "staging", "test", "demo",
    ]
    if (reserved.includes(subdomain)) {
      return "This subdomain is reserved"
    }

    return null
  }, [])

  // Check availability via API
  const checkAvailability = useCallback(async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setIsAvailable(null)
      onAvailabilityChange?.(null)
      return
    }

    const validationErr = validateSubdomain(subdomain)
    if (validationErr) {
      setIsAvailable(null)
      onAvailabilityChange?.(null)
      return
    }

    setChecking(true)
    try {
      const response = await fetch(`/api/dashboard/subdomain/check?subdomain=${encodeURIComponent(subdomain)}`)
      const data = await response.json()

      // Simple check - if we get a 409 or the response says it's taken
      const available = response.status !== 409 && !data.taken
      setIsAvailable(available)
      onAvailabilityChange?.(available)
    } catch (error) {
      console.error("Error checking subdomain availability:", error)
      // On error, don't show any status - let server validate on submit
      setIsAvailable(null)
      onAvailabilityChange?.(null)
    } finally {
      setChecking(false)
    }
  }, [validateSubdomain, onAvailabilityChange])

  // Debounced availability check
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    const error = validateSubdomain(sanitized)
    setValidationError(error)

    if (!error && sanitized.length >= 3) {
      const timer = setTimeout(() => {
        checkAvailability(sanitized)
      }, 500)
      setDebounceTimer(timer)
    } else {
      setIsAvailable(null)
      onAvailabilityChange?.(null)
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-sanitize input (lowercase, only valid chars)
    const raw = e.target.value.toLowerCase()
    // Allow typing but show sanitized preview
    onChange(raw.replace(/[^a-z0-9-]/g, ""))
  }

  const displayError = externalError || validationError

  return (
    <div className="space-y-4">
      {/* Subdomain Input */}
      <div className="space-y-2">
        <Label htmlFor="subdomain">Subdomain Name</Label>
        <div className="relative">
          <Input
            id="subdomain"
            placeholder="mysite"
            value={value}
            onChange={handleInputChange}
            disabled={disabled}
            className={cn(
              "pr-10",
              displayError && "border-destructive focus-visible:ring-destructive",
              isAvailable === true && "border-green-500 focus-visible:ring-green-500"
            )}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {checking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            {!checking && isAvailable === true && (
              <Check className="h-4 w-4 text-green-500" />
            )}
            {!checking && isAvailable === false && (
              <X className="h-4 w-4 text-destructive" />
            )}
          </div>
        </div>

        {/* Validation/Error Messages */}
        {displayError && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {displayError}
          </p>
        )}
        {!displayError && isAvailable === false && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <X className="h-3 w-3" />
            This subdomain is already taken
          </p>
        )}
        {!displayError && isAvailable === true && (
          <p className="text-sm text-green-600 flex items-center gap-1">
            <Check className="h-3 w-3" />
            This subdomain is available!
          </p>
        )}
      </div>

      {/* Emoji Selector */}
      <div className="space-y-2">
        <Label>Choose Icon</Label>
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_OPTIONS.map((e) => (
            <Button
              key={e}
              type="button"
              variant={emoji === e ? "default" : "outline"}
              size="lg"
              onClick={() => onEmojiChange(e)}
              disabled={disabled}
              className="text-xl h-10 w-10 p-0"
            >
              {e}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-muted rounded-lg">
        <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji}</span>
          <span className="font-medium text-lg">
            {value || "yoursite"}.{domain}
          </span>
        </div>
        {isAvailable === true && (
          <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
            Available
          </Badge>
        )}
      </div>
    </div>
  )
}

// Also create a simple check endpoint for availability
// This component expects: GET /api/dashboard/subdomain/check?subdomain=xxx
// which should return { available: boolean } or { taken: boolean }
