"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Save,
  Loader2,
  Palette,
  Image,
  Type,
  Code,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
} from "lucide-react"

interface BrandingSettingsProps {
  selectedSubdomain: string | null
}

interface BrandingData {
  siteName: string
  siteTagline: string
  logoUrl: string
  logoAlt: string
  logoDarkUrl: string
  faviconUrl: string
  faviconSvgUrl: string
  appleTouchIconUrl: string
  ogImageUrl: string
  primaryColor: string
  accentColor: string
  themeColor: string
  titleTemplate: string
  metaDescription: string
  hidePoweredBy: boolean
  customCss: string
}

const defaultBranding: BrandingData = {
  siteName: "",
  siteTagline: "",
  logoUrl: "",
  logoAlt: "",
  logoDarkUrl: "",
  faviconUrl: "",
  faviconSvgUrl: "",
  appleTouchIconUrl: "",
  ogImageUrl: "",
  primaryColor: "#0066cc",
  accentColor: "#6366f1",
  themeColor: "#0891b2",
  titleTemplate: "",
  metaDescription: "",
  hidePoweredBy: false,
  customCss: "",
}

export function BrandingSettings({ selectedSubdomain }: BrandingSettingsProps) {
  const [branding, setBranding] = useState<BrandingData>(defaultBranding)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (selectedSubdomain) {
      loadBranding()
    }
  }, [selectedSubdomain])

  const loadBranding = async () => {
    if (!selectedSubdomain) return
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const response = await fetch(
        `/api/cms/admin/branding?subdomain=${encodeURIComponent(selectedSubdomain)}`
      )
      if (response.ok) {
        const data = await response.json()
        if (data.branding) {
          setBranding((prev) => ({ ...prev, ...data.branding }))
        }
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error)
      setErrorMessage("Failed to load branding settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedSubdomain) return
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const response = await fetch("/api/cms/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subdomain: selectedSubdomain, branding }),
      })

      if (response.ok) {
        setHasChanges(false)
        setSuccessMessage("Branding saved successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        const data = await response.json()
        setErrorMessage(data.error || "Failed to save branding")
      }
    } catch (error) {
      setErrorMessage("Failed to save branding settings")
    } finally {
      setIsSaving(false)
    }
  }

  const updateField = (field: keyof BrandingData, value: string | boolean) => {
    setBranding((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Branding & White Label</h1>
          <p className="text-muted-foreground">
            Customize your site&apos;s identity and appearance
          </p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a site from the sidebar to manage its branding.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Branding & White Label</h1>
          <p className="text-muted-foreground">
            Customize branding for{" "}
            <span className="font-medium">{selectedSubdomain}</span>
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Site Identity */}
      <Card data-help-key="dashboard.branding.identity">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            Site Identity
          </CardTitle>
          <CardDescription>
            Your brand name and tagline appear in headers, metadata, and emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="siteName">Brand Name</Label>
              <Input
                id="siteName"
                value={branding.siteName}
                onChange={(e) => updateField("siteName", e.target.value)}
                placeholder="My Brand"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="siteTagline">Tagline</Label>
              <Input
                id="siteTagline"
                value={branding.siteTagline}
                onChange={(e) => updateField("siteTagline", e.target.value)}
                placeholder="Your site's slogan"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo */}
      <Card data-help-key="dashboard.branding.logo">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Logo
          </CardTitle>
          <CardDescription>
            Upload logos for light and dark themes. Recommended: 200x50px or
            larger.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo (Light Mode)</Label>
              <Input
                id="logoUrl"
                value={branding.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
              />
              {branding.logoUrl && (
                <div className="mt-2 p-3 bg-white border rounded">
                  <img
                    src={branding.logoUrl}
                    alt="Logo preview"
                    className="max-h-12 object-contain"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoDarkUrl">Logo (Dark Mode)</Label>
              <Input
                id="logoDarkUrl"
                value={branding.logoDarkUrl}
                onChange={(e) => updateField("logoDarkUrl", e.target.value)}
                placeholder="https://example.com/logo-dark.png"
              />
              {branding.logoDarkUrl && (
                <div className="mt-2 p-3 bg-gray-900 border rounded">
                  <img
                    src={branding.logoDarkUrl}
                    alt="Dark logo preview"
                    className="max-h-12 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logoAlt">Logo Alt Text</Label>
            <Input
              id="logoAlt"
              value={branding.logoAlt}
              onChange={(e) => updateField("logoAlt", e.target.value)}
              placeholder="Company Logo"
            />
            <p className="text-xs text-muted-foreground">
              Describes the logo for accessibility and SEO
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Favicon & Icons */}
      <Card data-help-key="dashboard.branding.favicon">
        <CardHeader>
          <CardTitle>Favicon & Icons</CardTitle>
          <CardDescription>
            Browser tab icon and mobile app icons
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="faviconUrl">Favicon (PNG/ICO)</Label>
              <Input
                id="faviconUrl"
                value={branding.faviconUrl}
                onChange={(e) => updateField("faviconUrl", e.target.value)}
                placeholder="https://example.com/favicon.ico"
              />
              <p className="text-xs text-muted-foreground">
                32x32px .ico or .png
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="faviconSvgUrl">Favicon (SVG)</Label>
              <Input
                id="faviconSvgUrl"
                value={branding.faviconSvgUrl}
                onChange={(e) => updateField("faviconSvgUrl", e.target.value)}
                placeholder="https://example.com/icon.svg"
              />
              <p className="text-xs text-muted-foreground">
                Scalable SVG for modern browsers
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appleTouchIconUrl">Apple Touch Icon</Label>
              <Input
                id="appleTouchIconUrl"
                value={branding.appleTouchIconUrl}
                onChange={(e) =>
                  updateField("appleTouchIconUrl", e.target.value)
                }
                placeholder="https://example.com/apple-icon.png"
              />
              <p className="text-xs text-muted-foreground">180x180px .png</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand Colors */}
      <Card data-help-key="dashboard.branding.colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Primary colors used throughout your storefront
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3">
              <Label>Primary Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.primaryColor}
                  onChange={(e) => updateField("primaryColor", e.target.value)}
                  placeholder="#0066cc"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Accent Color</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.accentColor}
                  onChange={(e) => updateField("accentColor", e.target.value)}
                  placeholder="#6366f1"
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label>Theme Color (Browser/PWA)</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={branding.themeColor}
                  onChange={(e) => updateField("themeColor", e.target.value)}
                  className="h-10 w-14 rounded border cursor-pointer"
                />
                <Input
                  value={branding.themeColor}
                  onChange={(e) => updateField("themeColor", e.target.value)}
                  placeholder="#0891b2"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Colors the browser address bar and PWA splash screen
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO & Metadata */}
      <Card data-help-key="dashboard.branding.seo">
        <CardHeader>
          <CardTitle>SEO & Metadata</CardTitle>
          <CardDescription>
            Control how your site appears in search results and social shares
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titleTemplate">Title Template</Label>
            <Input
              id="titleTemplate"
              value={branding.titleTemplate}
              onChange={(e) => updateField("titleTemplate", e.target.value)}
              placeholder="%s | My Brand"
            />
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">%s</code> as page
              title placeholder. Example: &quot;%s | My Brand&quot;
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="metaDescription">Default Meta Description</Label>
            <Textarea
              id="metaDescription"
              value={branding.metaDescription}
              onChange={(e) => updateField("metaDescription", e.target.value)}
              placeholder="A brief description of your site..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {branding.metaDescription.length}/160 characters recommended
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ogImageUrl">Social Share Image (OG Image)</Label>
            <Input
              id="ogImageUrl"
              value={branding.ogImageUrl}
              onChange={(e) => updateField("ogImageUrl", e.target.value)}
              placeholder="https://example.com/og-image.jpg"
            />
            <p className="text-xs text-muted-foreground">
              Recommended: 1200x630px for best display on social platforms
            </p>
          </div>
        </CardContent>
      </Card>

      {/* White Label */}
      <Card data-help-key="dashboard.branding.whitelabel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            White Label
          </CardTitle>
          <CardDescription>
            Control platform branding visibility and add custom CSS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Hide &quot;Powered by CNCPT Web&quot;</Label>
              <p className="text-sm text-muted-foreground">
                Remove platform branding from your storefront footer
              </p>
            </div>
            <Switch
              checked={branding.hidePoweredBy}
              onCheckedChange={(checked) =>
                updateField("hidePoweredBy", checked)
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customCss">Custom CSS</Label>
            <Textarea
              id="customCss"
              value={branding.customCss}
              onChange={(e) => updateField("customCss", e.target.value)}
              placeholder={`.my-class { color: var(--primary); }\n\n/* Override any storefront styles */`}
              rows={6}
              className="font-mono text-sm"
            />
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Custom CSS is sanitized for security. Dangerous constructs like
                @import, expression(), and javascript: URLs are removed.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => {
            loadBranding()
            setHasChanges(false)
          }}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Branding
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
