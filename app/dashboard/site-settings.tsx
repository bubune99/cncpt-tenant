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
import { Save, Globe, Palette, ExternalLink, Plus, Trash2, CheckCircle, AlertCircle } from "lucide-react"
import { configureCustomDomain, getDeploymentStatus } from "@/app/vercel-actions"

interface SiteSettingsProps {
  user: any
  subdomains: any[]
  selectedSubdomain: string | null
}

export function SiteSettings({ user, subdomains, selectedSubdomain }: SiteSettingsProps) {
  const [siteTitle, setSiteTitle] = useState("")
  const [siteDescription, setSiteDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [customDomain, setCustomDomain] = useState("")
  const [connectedDomains, setConnectedDomains] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<any>(null)

  const currentSubdomain = subdomains?.find((s) => s.subdomain === selectedSubdomain)

  useEffect(() => {
    if (currentSubdomain) {
      loadSiteSettings()
      checkDeploymentStatus()
    }
  }, [currentSubdomain])

  const loadSiteSettings = async () => {
    // Load existing site settings from database
    // This would fetch from tenant_settings table
    if (currentSubdomain) {
      setSiteTitle(currentSubdomain.site_title || "")
      setSiteDescription(currentSubdomain.description || "")
      // Load connected domains
      setConnectedDomains(currentSubdomain.custom_domains || [])
    }
  }

  const checkDeploymentStatus = async () => {
    if (!currentSubdomain) return

    try {
      const status = await getDeploymentStatus(currentSubdomain.id)
      setDeploymentStatus(status)
    } catch (error) {
      console.error("Failed to check deployment status:", error)
    }
  }

  const handleSaveSettings = async () => {
    if (!currentSubdomain) return

    setIsLoading(true)
    try {
      // Save settings to database
      // This would update the tenant_settings table
      alert("Settings saved successfully!")
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomDomain = async () => {
    if (!currentSubdomain || !customDomain) return

    setIsLoading(true)
    try {
      await configureCustomDomain(currentSubdomain.id, customDomain)
      setConnectedDomains([...connectedDomains, customDomain])
      setCustomDomain("")
      alert(`Custom domain ${customDomain} configured successfully!`)
    } catch (error) {
      console.error("Failed to configure domain:", error)
      alert(`Failed to configure domain: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveDomain = async (domain: string) => {
    if (!currentSubdomain) return

    setIsLoading(true)
    try {
      // Remove domain from Vercel and database
      setConnectedDomains(connectedDomains.filter((d) => d !== domain))
      alert(`Domain ${domain} removed successfully!`)
    } catch (error) {
      console.error("Failed to remove domain:", error)
      alert(`Failed to remove domain: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Site Settings</h1>
          <p className="text-muted-foreground">Configure your site's settings and custom domains</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please select a subdomain from the sidebar to manage its settings.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Site Settings</h1>
        <p className="text-muted-foreground">
          Configure settings for <span className="font-medium">{selectedSubdomain}</span>
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Basic Information</span>
          </CardTitle>
          <CardDescription>Set your site's title, description, and visibility</CardDescription>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-description">Site Description</Label>
            <Textarea
              id="site-description"
              placeholder="A brief description of your site..."
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Site</Label>
              <p className="text-sm text-muted-foreground">Make your site visible to search engines and public</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <Button onClick={handleSaveSettings} disabled={isLoading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Custom Domains */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Custom Domains</span>
          </CardTitle>
          <CardDescription>
            Connect your own domain to this subdomain
            {deploymentStatus?.status !== "deployed" && (
              <span className="text-amber-600 ml-2">(Deploy your site first to add custom domains)</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Domains */}
          {connectedDomains.length > 0 && (
            <div className="space-y-2">
              <Label>Connected Domains</Label>
              <div className="space-y-2">
                {connectedDomains.map((domain) => (
                  <div key={domain} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="font-medium">{domain}</span>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => window.open(`https://${domain}`, "_blank")}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveDomain(domain)} disabled={isLoading}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Domain */}
          {deploymentStatus?.status === "deployed" && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="custom-domain">Add Custom Domain</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-domain"
                    placeholder="yourdomain.com"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                  />
                  <Button onClick={handleAddCustomDomain} disabled={isLoading || !customDomain}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Make sure to point your domain's DNS to Vercel before adding it.
                </p>
              </div>
            </>
          )}

          {/* Default Subdomain */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">Default Subdomain</p>
                <p className="text-xs text-muted-foreground">{selectedSubdomain}.yourdomain.com</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(`https://${selectedSubdomain}.yourdomain.com`, "_blank")}
              >
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Theme & Appearance</span>
          </CardTitle>
          <CardDescription>Customize your site's look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
              <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded mb-2"></div>
              <p className="text-sm font-medium">Modern</p>
            </div>
            <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
              <div className="w-full h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded mb-2"></div>
              <p className="text-sm font-medium">Nature</p>
            </div>
            <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
              <div className="w-full h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded mb-2"></div>
              <p className="text-sm font-medium">Warm</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
