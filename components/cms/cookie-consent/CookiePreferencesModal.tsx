'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/cms/ui/dialog'
import { Button } from '@/components/cms/ui/button'
import { Switch } from '@/components/cms/ui/switch'
import type { CookieConsentState } from '@/hooks/use-cookie-consent'

interface CookiePreferencesModalProps {
  open: boolean
  onClose: () => void
  currentConsent: CookieConsentState
  onSave: (preferences: CookieConsentState) => void
  onAcceptAll: () => void
}

interface ConsentCategory {
  key: keyof CookieConsentState
  label: string
  description: string
  required: boolean
}

const CATEGORIES: ConsentCategory[] = [
  {
    key: 'essential',
    label: 'Essential',
    description:
      'Required for the website to function. Includes session management, security features, and accessibility preferences.',
    required: true,
  },
  {
    key: 'analytics',
    label: 'Analytics',
    description:
      'Help us understand how visitors interact with our website by collecting anonymous usage data.',
    required: false,
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description:
      'Used to deliver relevant advertisements and track the effectiveness of marketing campaigns.',
    required: false,
  },
  {
    key: 'functional',
    label: 'Functional',
    description:
      'Enable enhanced functionality such as remembering your preferences, language settings, and personalized content.',
    required: false,
  },
]

export function CookiePreferencesModal({
  open,
  onClose,
  currentConsent,
  onSave,
  onAcceptAll,
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookieConsentState>(currentConsent)

  useEffect(() => {
    setPreferences(currentConsent)
  }, [currentConsent])

  function handleToggle(key: keyof CookieConsentState) {
    if (key === 'essential') return
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cookie Preferences</DialogTitle>
          <DialogDescription>
            Choose which cookies you allow. Essential cookies cannot be disabled as they are
            required for the website to function properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {CATEGORIES.map((category) => (
            <div
              key={category.key}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor={`cookie-${category.key}`}
                    className="text-sm font-medium leading-none"
                  >
                    {category.label}
                  </label>
                  {category.required && (
                    <span className="text-xs text-muted-foreground">(Required)</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
              <Switch
                id={`cookie-${category.key}`}
                checked={preferences[category.key]}
                onCheckedChange={() => handleToggle(category.key)}
                disabled={category.required}
                aria-label={`${category.required ? 'Required: ' : ''}${category.label} cookies`}
              />
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => onSave(preferences)}>
            Save Preferences
          </Button>
          <Button onClick={onAcceptAll}>Accept All</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
