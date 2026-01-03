"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Save,
  Globe,
  Palette,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings,
  Shield,
  Eye,
  EyeOff,
  Image,
  Type,
  Code,
  Server,
  Play,
  Square,
  RefreshCw,
  Plus,
  Trash2,
} from "lucide-react"
import { rootDomain, protocol } from "@/lib/utils"
import {
  getSiteSettings,
  updateGeneralSettings,
  updateAppearanceSettings,
  updateSeoSettings,
  updateSecuritySettings,
  updateFrontendSettings,
  type SiteSettings as SiteSettingsType,
} from "@/app/site-settings-actions"

interface SiteSettingsProps {
  selectedSubdomain: string | null
  activeTab?: "general" | "appearance" | "seo" | "security" | "frontend"
}

export function SiteSettings({ selectedSubdomain, activeTab = "general" }: SiteSettingsProps) {
  const [settings, setSettings] = useState<SiteSettingsType | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState(activeTab)

  // General Settings
  const [siteTitle, setSiteTitle] = useState("")
  const [siteDescription, setSiteDescription] = useState("")
  const [siteTagline, setSiteTagline] = useState("")
  const [visibility, setVisibility] = useState<"public" | "private" | "maintenance">("public")

  // SEO Settings
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [ogImage, setOgImage] = useState("")
  const [favicon, setFavicon] = useState("")
  const [sitemapEnabled, setSitemapEnabled] = useState(true)

  // Security Settings
  const [passwordProtected, setPasswordProtected] = useState(false)
  const [sitePassword, setSitePassword] = useState("")
  const [securityHeadersEnabled, setSecurityHeadersEnabled] = useState(true)

  // Appearance Settings
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [secondaryColor, setSecondaryColor] = useState("#6b7280")
  const [accentColor, setAccentColor] = useState("#10b981")
  const [fontHeading, setFontHeading] = useState("Inter")
  const [fontBody, setFontBody] = useState("Inter")
  const [themePreset, setThemePreset] = useState("default")

  // Frontend VPS Settings
  const [frontendEnabled, setFrontendEnabled] = useState(false)
  const [frontendDomain, setFrontendDomain] = useState("")
  const [frontendEnvVars, setFrontendEnvVars] = useState<Record<string, string>>({})
  const [newEnvKey, setNewEnvKey] = useState("")
  const [newEnvValue, setNewEnvValue] = useState("")

  useEffect(() => {
    if (selectedSubdomain) {
      loadSettings()
    }
  }, [selectedSubdomain])

  const loadSettings = async () => {
    if (!selectedSubdomain) return

    setIsLoading(true)
    setErrorMessage(null)
    try {
      const data = await getSiteSettings(selectedSubdomain)
      if (data) {
        setSettings(data)
        // Populate form fields
        setSiteTitle(data.site_title || "")
        setSiteTagline(data.site_tagline || "")
        setSiteDescription(data.site_description || "")
        setVisibility(data.visibility || "public")
        setPrimaryColor(data.primary_color || "#3b82f6")
        setSecondaryColor(data.secondary_color || "#6b7280")
        setAccentColor(data.accent_color || "#10b981")
        setFontHeading(data.font_heading || "Inter")
        setFontBody(data.font_body || "Inter")
        setThemePreset(data.theme_preset || "default")
        setMetaTitle(data.meta_title || "")
        setMetaDescription(data.meta_description || "")
        setOgImage(data.og_image_url || "")
        setFavicon(data.favicon_url || "")
        setSitemapEnabled(data.sitemap_enabled ?? true)
        setPasswordProtected(data.password_protected ?? false)
        setSecurityHeadersEnabled(data.security_headers_enabled ?? true)
        setFrontendEnabled(data.frontend_enabled ?? false)
        setFrontendDomain(data.frontend_domain || "")
        setFrontendEnvVars(data.frontend_env_vars || {})
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
      setErrorMessage("Failed to load settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveGeneral = async () => {
    if (!selectedSubdomain) return
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const result = await updateGeneralSettings(selectedSubdomain, {
        site_title: siteTitle,
        site_tagline: siteTagline,
        site_description: siteDescription,
        visibility,
      })
      if (result.success) {
        setSuccessMessage("General settings saved successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setErrorMessage(result.error || "Failed to save settings")
      }
    } catch (error) {
      setErrorMessage("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAppearance = async () => {
    if (!selectedSubdomain) return
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const result = await updateAppearanceSettings(selectedSubdomain, {
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        font_heading: fontHeading,
        font_body: fontBody,
        theme_preset: themePreset,
      })
      if (result.success) {
        setSuccessMessage("Appearance settings saved successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setErrorMessage(result.error || "Failed to save settings")
      }
    } catch (error) {
      setErrorMessage("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSeo = async () => {
    if (!selectedSubdomain) return
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const result = await updateSeoSettings(selectedSubdomain, {
        meta_title: metaTitle,
        meta_description: metaDescription,
        og_image_url: ogImage,
        favicon_url: favicon,
        sitemap_enabled: sitemapEnabled,
      })
      if (result.success) {
        setSuccessMessage("SEO settings saved successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setErrorMessage(result.error || "Failed to save settings")
      }
    } catch (error) {
      setErrorMessage("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSecurity = async () => {
    if (!selectedSubdomain) return
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const result = await updateSecuritySettings(selectedSubdomain, {
        password_protected: passwordProtected,
        password: sitePassword || null,
        security_headers_enabled: securityHeadersEnabled,
      })
      if (result.success) {
        setSuccessMessage("Security settings saved successfully!")
        setSitePassword("") // Clear password field after save
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setErrorMessage(result.error || "Failed to save settings")
      }
    } catch (error) {
      setErrorMessage("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveFrontend = async () => {
    if (!selectedSubdomain) return
    setIsSaving(true)
    setErrorMessage(null)
    try {
      const result = await updateFrontendSettings(selectedSubdomain, {
        frontend_enabled: frontendEnabled,
        frontend_domain: frontendDomain,
        frontend_env_vars: frontendEnvVars,
      })
      if (result.success) {
        setSuccessMessage("Frontend settings saved successfully!")
        setTimeout(() => setSuccessMessage(null), 3000)
      } else {
        setErrorMessage(result.error || "Failed to save settings")
      }
    } catch (error) {
      setErrorMessage("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const addEnvVar = () => {
    if (newEnvKey && newEnvValue) {
      setFrontendEnvVars((prev) => ({ ...prev, [newEnvKey]: newEnvValue }))
      setNewEnvKey("")
      setNewEnvValue("")
    }
  }

  const removeEnvVar = (key: string) => {
    setFrontendEnvVars((prev) => {
      const updated = { ...prev }
      delete updated[key]
      return updated
    })
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Site Settings</h1>
          <p className="text-muted-foreground">Configure your site's settings</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a site from the sidebar to manage its settings.</AlertDescription>
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
          <h1 className="text-3xl font-bold mb-2">Site Settings</h1>
          <p className="text-muted-foreground">
            Configure settings for <span className="font-medium">{selectedSubdomain}.{rootDomain}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`${protocol}://${selectedSubdomain}.${rootDomain}`, "_blank")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Site
        </Button>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            SEO
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="frontend" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Frontend
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Set your site's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site-title">Site Title</Label>
                <Input
                  id="site-title"
                  placeholder="My Awesome Site"
                  value={siteTitle}
                  onChange={(e) => setSiteTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">This appears in the browser tab and search results</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-tagline">Tagline</Label>
                <Input
                  id="site-tagline"
                  placeholder="A brief tagline for your site"
                  value={siteTagline}
                  onChange={(e) => setSiteTagline(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site-description">Description</Label>
                <Textarea
                  id="site-description"
                  placeholder="Describe what your site is about..."
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Visibility</CardTitle>
              <CardDescription>Control who can see your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "public", label: "Public", icon: Eye, desc: "Visible to everyone" },
                  { value: "private", label: "Private", icon: EyeOff, desc: "Hidden from public" },
                  { value: "maintenance", label: "Maintenance", icon: Settings, desc: "Under construction" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setVisibility(option.value as any)}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      visibility === option.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <option.icon className="h-5 w-5 mb-2" />
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveGeneral} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>Customize your site's color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" />
                Typography
              </CardTitle>
              <CardDescription>Choose your site's font family</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "Inter", name: "Inter", sample: "Aa" },
                  { id: "Roboto", name: "Roboto", sample: "Aa" },
                  { id: "Poppins", name: "Poppins", sample: "Aa" },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => {
                      setFontHeading(font.id)
                      setFontBody(font.id)
                    }}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      fontHeading === font.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="text-3xl font-bold mb-2">{font.sample}</div>
                    <div className="text-sm">{font.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Presets</CardTitle>
              <CardDescription>Quick theme options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: "default", name: "Modern", gradient: "from-blue-500 to-purple-600" },
                  { id: "nature", name: "Nature", gradient: "from-green-500 to-teal-600" },
                  { id: "warm", name: "Warm", gradient: "from-orange-500 to-red-600" },
                ].map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setThemePreset(theme.id)}
                    className={`p-4 border rounded-lg transition-all ${
                      themePreset === theme.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className={`w-full h-20 bg-gradient-to-br ${theme.gradient} rounded mb-2`}></div>
                    <p className="text-sm font-medium">{theme.name}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveAppearance} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* SEO Settings */}
        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search Engine Optimization</CardTitle>
              <CardDescription>Improve your site's visibility in search results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  placeholder="Page title for search engines"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {metaTitle.length}/60 characters (recommended)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  placeholder="Brief description for search results..."
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length}/160 characters (recommended)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Social Sharing
              </CardTitle>
              <CardDescription>How your site appears when shared on social media</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="og-image">Social Share Image (OG Image)</Label>
                <Input
                  id="og-image"
                  placeholder="https://example.com/og-image.jpg"
                  value={ogImage}
                  onChange={(e) => setOgImage(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Recommended size: 1200x630 pixels</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="favicon">Favicon URL</Label>
                <Input
                  id="favicon"
                  placeholder="https://example.com/favicon.ico"
                  value={favicon}
                  onChange={(e) => setFavicon(e.target.value)}
                />
              </div>

              {/* Preview */}
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-2">Preview (Social Share)</p>
                <div className="bg-white rounded border overflow-hidden max-w-sm">
                  <div className="h-32 bg-gray-200 flex items-center justify-center">
                    {ogImage ? (
                      <img src={ogImage} alt="OG Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400">No image set</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{metaTitle || siteTitle || "Site Title"}</p>
                    <p className="text-xs text-gray-500 truncate">{metaDescription || siteDescription || "Site description"}</p>
                    <p className="text-xs text-gray-400 mt-1">{selectedSubdomain}.{rootDomain}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sitemap & Indexing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Sitemap</Label>
                  <p className="text-sm text-muted-foreground">
                    Generate a sitemap.xml for search engines
                  </p>
                </div>
                <Switch checked={sitemapEnabled} onCheckedChange={setSitemapEnabled} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSeo} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Password Protection</CardTitle>
              <CardDescription>Restrict access to your site with a password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Password Protection</Label>
                  <p className="text-sm text-muted-foreground">Visitors must enter a password to view your site</p>
                </div>
                <Switch checked={passwordProtected} onCheckedChange={setPasswordProtected} />
              </div>

              {passwordProtected && (
                <div className="space-y-2">
                  <Label htmlFor="site-password">Site Password</Label>
                  <Input
                    id="site-password"
                    type="password"
                    placeholder="Enter a new password"
                    value={sitePassword}
                    onChange={(e) => setSitePassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave blank to keep existing password</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SSL Certificate</CardTitle>
              <CardDescription>Secure your site with HTTPS</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">SSL Active</p>
                  <p className="text-sm text-green-600">Your site is secured with HTTPS (via Vercel)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Security Headers
              </CardTitle>
              <CardDescription>Configure security headers for your site</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Security Headers</Label>
                  <p className="text-sm text-muted-foreground">Add recommended security headers to responses</p>
                </div>
                <Switch checked={securityHeadersEnabled} onCheckedChange={setSecurityHeadersEnabled} />
              </div>

              {securityHeadersEnabled && (
                <div className="space-y-3 pt-4 border-t">
                  {[
                    { name: "X-Frame-Options", value: "DENY", desc: "Prevents clickjacking" },
                    { name: "X-Content-Type-Options", value: "nosniff", desc: "Prevents MIME sniffing" },
                    { name: "Referrer-Policy", value: "strict-origin", desc: "Controls referrer info" },
                  ].map((header) => (
                    <div key={header.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-mono text-sm font-medium">{header.name}</p>
                        <p className="text-xs text-muted-foreground">{header.desc}</p>
                      </div>
                      <Badge variant="secondary">{header.value}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSecurity} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Frontend VPS Settings */}
        <TabsContent value="frontend" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Frontend Deployment
              </CardTitle>
              <CardDescription>
                Configure your frontend application hosting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Frontend</Label>
                  <p className="text-sm text-muted-foreground">
                    Deploy a frontend application to display your CMS content
                  </p>
                </div>
                <Switch checked={frontendEnabled} onCheckedChange={setFrontendEnabled} />
              </div>

              {frontendEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="frontend-domain">Frontend Domain</Label>
                    <Input
                      id="frontend-domain"
                      placeholder="www.mysite.com"
                      value={frontendDomain}
                      onChange={(e) => setFrontendDomain(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The domain where your frontend will be accessible
                    </p>
                  </div>

                  {/* Deployment Management Link */}
                  <Alert className="bg-blue-50 border-blue-200">
                    <Server className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <p className="font-medium mb-2">Full Deployment Controls</p>
                      <p className="text-sm mb-3">
                        For full deployment controls including deploy, start, stop, restart,
                        and custom domain management with SSL, use the dedicated Frontend panel.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          // Navigate to the Frontend (VPS) section
                          const event = new CustomEvent('navigate-to-section', { detail: 'frontend' })
                          window.dispatchEvent(event)
                        }}
                      >
                        <Server className="h-4 w-4 mr-2" />
                        Open Frontend Panel
                      </Button>
                    </AlertDescription>
                  </Alert>

                  {/* Quick Status */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Deployment Status</span>
                      <Badge
                        variant={
                          settings?.frontend_status === "running"
                            ? "default"
                            : settings?.frontend_status === "deploying"
                            ? "secondary"
                            : settings?.frontend_status === "error"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {settings?.frontend_status || "not_deployed"}
                      </Badge>
                    </div>
                    {settings?.frontend_last_deployed_at && (
                      <p className="text-xs text-muted-foreground">
                        Last deployed: {new Date(settings.frontend_last_deployed_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {frontendEnabled && (
            <Card>
              <CardHeader>
                <CardTitle>Environment Variables</CardTitle>
                <CardDescription>
                  Configure environment variables for your frontend application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing env vars */}
                <div className="space-y-2">
                  {Object.entries(frontendEnvVars).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <code className="flex-1 text-sm font-mono">{key}</code>
                      <code className="flex-1 text-sm font-mono text-muted-foreground truncate">
                        {value.substring(0, 20)}...
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeEnvVar(key)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add new env var */}
                <div className="flex gap-2">
                  <Input
                    placeholder="KEY"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value.toUpperCase())}
                    className="flex-1 font-mono"
                  />
                  <Input
                    placeholder="value"
                    value={newEnvValue}
                    onChange={(e) => setNewEnvValue(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addEnvVar} disabled={!newEnvKey || !newEnvValue}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Common env vars hint */}
                <div className="text-xs text-muted-foreground p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-medium text-blue-800 mb-1">Required Variables:</p>
                  <ul className="list-disc list-inside text-blue-700 space-y-1">
                    <li>NEXT_PUBLIC_CMS_URL - Your CMS API endpoint</li>
                    <li>NEXT_PUBLIC_SITE_URL - Your frontend URL</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button onClick={handleSaveFrontend} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
