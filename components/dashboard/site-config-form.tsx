"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Timezone options (common ones)
const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "Europe/London", label: "London (GMT)" },
  { value: "Europe/Paris", label: "Paris (CET)" },
  { value: "Europe/Berlin", label: "Berlin (CET)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Shanghai", label: "Shanghai (CST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Dubai", label: "Dubai (GST)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
]

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "nl", label: "Dutch" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ar", label: "Arabic" },
  { value: "hi", label: "Hindi" },
]

export interface SiteConfig {
  subdomain: string
  siteName: string
  siteDescription: string
  contactEmail: string
  timezone: string
  primaryLanguage: string
  customDomain?: string
}

interface SiteConfigFormProps {
  config: SiteConfig
  onChange: (config: SiteConfig) => void
  errors?: Partial<Record<keyof SiteConfig, string>>
  disabled?: boolean
  domain: string
}

export function SiteConfigForm({
  config,
  onChange,
  errors = {},
  disabled = false,
  domain,
}: SiteConfigFormProps) {
  const updateField = <K extends keyof SiteConfig>(field: K, value: SiteConfig[K]) => {
    onChange({ ...config, [field]: value })
  }

  // Auto-sanitize subdomain input
  const handleSubdomainChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, "")
    updateField("subdomain", sanitized)
  }

  return (
    <div className="space-y-6">
      {/* Subdomain */}
      <div className="space-y-2">
        <Label htmlFor="subdomain">
          Subdomain <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="subdomain"
            placeholder="mysite"
            value={config.subdomain}
            onChange={(e) => handleSubdomainChange(e.target.value)}
            disabled={disabled}
            className={errors.subdomain ? "border-destructive" : ""}
          />
          <span className="text-muted-foreground whitespace-nowrap">.{domain}</span>
        </div>
        {errors.subdomain ? (
          <p className="text-sm text-destructive">{errors.subdomain}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Only lowercase letters, numbers, and hyphens. Minimum 3 characters.
          </p>
        )}
      </div>

      {/* Site Name */}
      <div className="space-y-2">
        <Label htmlFor="siteName">
          Site Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="siteName"
          placeholder="My Awesome Site"
          value={config.siteName}
          onChange={(e) => updateField("siteName", e.target.value)}
          disabled={disabled}
          className={errors.siteName ? "border-destructive" : ""}
        />
        {errors.siteName && (
          <p className="text-sm text-destructive">{errors.siteName}</p>
        )}
      </div>

      {/* Site Description */}
      <div className="space-y-2">
        <Label htmlFor="siteDescription">Site Description</Label>
        <Textarea
          id="siteDescription"
          placeholder="A brief description of your site..."
          value={config.siteDescription}
          onChange={(e) => updateField("siteDescription", e.target.value)}
          disabled={disabled}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Used for SEO and site metadata
        </p>
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <Label htmlFor="contactEmail">
          Contact Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contactEmail"
          type="email"
          placeholder="contact@example.com"
          value={config.contactEmail}
          onChange={(e) => updateField("contactEmail", e.target.value)}
          disabled={disabled}
          className={errors.contactEmail ? "border-destructive" : ""}
        />
        {errors.contactEmail && (
          <p className="text-sm text-destructive">{errors.contactEmail}</p>
        )}
      </div>

      {/* Timezone & Language Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={config.timezone}
            onValueChange={(value) => updateField("timezone", value)}
            disabled={disabled}
          >
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="language">Primary Language</Label>
          <Select
            value={config.primaryLanguage}
            onValueChange={(value) => updateField("primaryLanguage", value)}
            disabled={disabled}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Custom Domain (optional) */}
      <div className="space-y-2">
        <Label htmlFor="customDomain">
          Custom Domain <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          id="customDomain"
          placeholder="www.mysite.com"
          value={config.customDomain || ""}
          onChange={(e) => updateField("customDomain", e.target.value || undefined)}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground">
          You can configure this later. DNS setup will be required.
        </p>
      </div>
    </div>
  )
}
