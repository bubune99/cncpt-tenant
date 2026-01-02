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
import { Separator } from "@/components/ui/separator"
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
} from "lucide-react"
import { getDeploymentStatus } from "@/app/vercel-actions"
import { rootDomain, protocol } from "@/lib/utils"

interface SiteSettingsProps {
  selectedSubdomain: string | null
  activeTab?: "general" | "appearance" | "seo" | "security"
}

export function SiteSettings({ selectedSubdomain, activeTab = "general" }: SiteSettingsProps) {
  const [siteTitle, setSiteTitle] = useState("")
  const [siteDescription, setSiteDescription] = useState("")
  const [siteTagline, setSiteTagline] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [currentTab, setCurrentTab] = useState(activeTab)

  // SEO Settings
  const [metaTitle, setMetaTitle] = useState("")
  const [metaDescription, setMetaDescription] = useState("")
  const [ogImage, setOgImage] = useState("")
  const [favicon, setFavicon] = useState("")

  // Security Settings
  const [passwordProtected, setPasswordProtected] = useState(false)
  const [sitePassword, setSitePassword] = useState("")
  const [allowIndexing, setAllowIndexing] = useState(true)

  // Appearance Settings
  const [primaryColor, setPrimaryColor] = useState("#3b82f6")
  const [fontFamily, setFontFamily] = useState("inter")

  useEffect(() => {
    if (selectedSubdomain) {
      loadSettings()
    }
  }, [selectedSubdomain])

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would fetch from API
      // For now, using placeholder data
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Load deployment status
      // const status = await getDeploymentStatus(subdomainId)
      // setDeploymentStatus(status)
    } catch (error) {
      console.error("Failed to load settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!selectedSubdomain) return

    setIsSaving(true)
    try {
      // In a real app, this would save to API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setSuccessMessage("Settings saved successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error("Failed to save settings:", error)
    } finally {
      setIsSaving(false)
    }
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

      <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    {isPublic ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    Public Site
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {isPublic ? "Your site is visible to everyone" : "Your site is hidden from the public"}
                  </p>
                </div>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
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
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex gap-3">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-2">
                {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setPrimaryColor(color)}
                    className={`w-full aspect-square rounded-lg border-2 transition-all ${
                      primaryColor === color ? "border-gray-900 scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
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
                  { id: "inter", name: "Inter", sample: "Aa" },
                  { id: "roboto", name: "Roboto", sample: "Aa" },
                  { id: "poppins", name: "Poppins", sample: "Aa" },
                ].map((font) => (
                  <button
                    key={font.id}
                    onClick={() => setFontFamily(font.id)}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      fontFamily === font.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
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
                <div className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-all">
                  <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded mb-2"></div>
                  <p className="text-sm font-medium">Modern</p>
                </div>
                <div className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-all">
                  <div className="w-full h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded mb-2"></div>
                  <p className="text-sm font-medium">Nature</p>
                </div>
                <div className="p-4 border rounded-lg cursor-pointer hover:border-primary transition-all">
                  <div className="w-full h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded mb-2"></div>
                  <p className="text-sm font-medium">Warm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
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
              <CardTitle>Search Engine Indexing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Search Engine Indexing</Label>
                  <p className="text-sm text-muted-foreground">
                    {allowIndexing
                      ? "Search engines can discover and index your site"
                      : "Your site will not appear in search results"}
                  </p>
                </div>
                <Switch checked={allowIndexing} onCheckedChange={setAllowIndexing} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
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
                    placeholder="Enter a password"
                    value={sitePassword}
                    onChange={(e) => setSitePassword(e.target.value)}
                  />
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
                  <p className="text-sm text-green-600">Your site is secured with HTTPS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Advanced Security Headers
              </CardTitle>
              <CardDescription>Configure security headers for your site</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
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
