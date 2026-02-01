"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Save,
  RefreshCw,
  FileText,
  ShoppingCart,
  Layout,
  Image,
  BarChart3,
  Mail,
  Bot,
  Puzzle,
  GitBranch,
  Truck,
  Package,
  Users,
  CreditCard,
  Languages,
  Calendar,
  Sparkles,
  MessageSquare,
  Star,
  Percent,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface CMSFeaturesProps {
  selectedSubdomain: string | null
}

interface FeatureConfig {
  // Core features
  blog: boolean
  pages: boolean
  media: boolean
  analytics: boolean
  forms: boolean
  multiLanguage: boolean
  scheduling: boolean

  // E-commerce
  ecommerce: {
    enabled: boolean
    products: boolean
    orders: boolean
    customers: boolean
    shipping: boolean
    inventory: boolean
    reviews: boolean
    discounts: boolean
  }

  // Email
  email: {
    enabled: boolean
    marketing: boolean
    transactional: boolean
  }

  // AI
  ai: {
    enabled: boolean
    chatbot: boolean
    contentGeneration: boolean
  }

  // Advanced
  plugins: boolean
  workflows: boolean
}

const defaultFeatures: FeatureConfig = {
  blog: true,
  pages: true,
  media: true,
  analytics: true,
  forms: false,
  multiLanguage: false,
  scheduling: false,
  ecommerce: {
    enabled: false,
    products: false,
    orders: false,
    customers: false,
    shipping: false,
    inventory: false,
    reviews: false,
    discounts: false,
  },
  email: {
    enabled: false,
    marketing: false,
    transactional: false,
  },
  ai: {
    enabled: true,
    chatbot: true,
    contentGeneration: true,
  },
  plugins: false,
  workflows: false,
}

const featureInfo: Record<string, { icon: React.ElementType; description: string; tier?: string }> = {
  blog: { icon: FileText, description: "Create and manage blog posts with rich content editor" },
  pages: { icon: Layout, description: "Build custom pages with the visual page builder" },
  media: { icon: Image, description: "Upload and manage images, videos, and files" },
  analytics: { icon: BarChart3, description: "View site traffic and content performance" },
  forms: { icon: MessageSquare, description: "Create contact forms and collect submissions" },
  multiLanguage: { icon: Languages, description: "Translate content into multiple languages", tier: "Pro" },
  scheduling: { icon: Calendar, description: "Schedule content to publish at specific times" },
  "ecommerce.enabled": { icon: ShoppingCart, description: "Enable e-commerce functionality" },
  "ecommerce.products": { icon: Package, description: "Create and manage products" },
  "ecommerce.orders": { icon: CreditCard, description: "Process and track orders" },
  "ecommerce.customers": { icon: Users, description: "Manage customer accounts" },
  "ecommerce.shipping": { icon: Truck, description: "Configure shipping rates and labels" },
  "ecommerce.inventory": { icon: Package, description: "Track product inventory levels" },
  "ecommerce.reviews": { icon: Star, description: "Allow customers to leave product reviews" },
  "ecommerce.discounts": { icon: Percent, description: "Create discount codes and promotions" },
  "email.enabled": { icon: Mail, description: "Enable email marketing features" },
  "email.marketing": { icon: Mail, description: "Send newsletters and campaigns" },
  "email.transactional": { icon: Mail, description: "Automated order and notification emails" },
  "ai.enabled": { icon: Bot, description: "Enable AI-powered features" },
  "ai.chatbot": { icon: MessageSquare, description: "AI assistant for content and admin tasks" },
  "ai.contentGeneration": { icon: Sparkles, description: "Generate content with AI" },
  plugins: { icon: Puzzle, description: "Install and manage third-party plugins", tier: "Pro" },
  workflows: { icon: GitBranch, description: "Create automated workflows and integrations", tier: "Pro" },
}

export function CMSFeatures({ selectedSubdomain }: CMSFeaturesProps) {
  const [features, setFeatures] = useState<FeatureConfig>(defaultFeatures)
  const [originalFeatures, setOriginalFeatures] = useState<FeatureConfig>(defaultFeatures)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load features
  const loadFeatures = useCallback(async () => {
    if (!selectedSubdomain) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/dashboard/cms-features?subdomain=${selectedSubdomain}`)
      if (res.ok) {
        const data = await res.json()
        const loaded = { ...defaultFeatures, ...data.features }
        setFeatures(loaded)
        setOriginalFeatures(loaded)
      }
    } catch (err) {
      console.error("Failed to load CMS features:", err)
      setError("Failed to load feature settings")
    } finally {
      setLoading(false)
    }
  }, [selectedSubdomain])

  useEffect(() => {
    loadFeatures()
  }, [loadFeatures])

  // Check if there are unsaved changes
  const hasChanges = JSON.stringify(features) !== JSON.stringify(originalFeatures)

  // Save features
  const handleSave = async () => {
    if (!selectedSubdomain) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const res = await fetch("/api/dashboard/cms-features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subdomain: selectedSubdomain,
          features,
        }),
      })

      if (res.ok) {
        setOriginalFeatures(features)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to save settings")
      }
    } catch (err) {
      console.error("Failed to save CMS features:", err)
      setError("Failed to save feature settings")
    } finally {
      setSaving(false)
    }
  }

  // Toggle a feature
  const toggleFeature = (path: string, value: boolean) => {
    setFeatures((prev) => {
      const newFeatures = { ...prev }
      const parts = path.split(".")

      if (parts.length === 1) {
        ;(newFeatures as any)[parts[0]] = value
      } else if (parts.length === 2) {
        ;(newFeatures as any)[parts[0]] = {
          ...(newFeatures as any)[parts[0]],
          [parts[1]]: value,
        }

        // If disabling parent, disable all children
        if (parts[1] === "enabled" && !value) {
          const parent = (newFeatures as any)[parts[0]]
          Object.keys(parent).forEach((key) => {
            if (key !== "enabled") parent[key] = false
          })
        }
      }

      return newFeatures
    })
  }

  // Get feature value by path
  const getFeatureValue = (path: string): boolean => {
    const parts = path.split(".")
    if (parts.length === 1) {
      return (features as any)[parts[0]] ?? false
    } else if (parts.length === 2) {
      return (features as any)[parts[0]]?.[parts[1]] ?? false
    }
    return false
  }

  // Check if feature is disabled due to parent
  const isDisabledByParent = (path: string): boolean => {
    const parts = path.split(".")
    if (parts.length === 2 && parts[1] !== "enabled") {
      return !(features as any)[parts[0]]?.enabled
    }
    return false
  }

  if (!selectedSubdomain) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Site Selected</h3>
          <p className="text-muted-foreground">
            Select a subdomain from the sidebar to configure CMS features
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const FeatureToggle = ({
    path,
    label,
    disabled = false
  }: {
    path: string
    label: string
    disabled?: boolean
  }) => {
    const info = featureInfo[path]
    const Icon = info?.icon || Puzzle
    const isParentDisabled = isDisabledByParent(path)
    const isChecked = getFeatureValue(path)

    return (
      <div className={`flex items-center justify-between py-3 ${isParentDisabled ? "opacity-50" : ""}`}>
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{label}</span>
              {info?.tier && (
                <Badge variant="secondary" className="text-xs">
                  {info.tier}
                </Badge>
              )}
            </div>
            {info?.description && (
              <p className="text-sm text-muted-foreground">{info.description}</p>
            )}
          </div>
        </div>
        <Switch
          checked={isChecked}
          onCheckedChange={(checked) => toggleFeature(path, checked)}
          disabled={disabled || isParentDisabled}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CMS Features</h2>
          <p className="text-muted-foreground">
            Configure which features are enabled for <strong>{selectedSubdomain}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadFeatures} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
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
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            Feature settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {hasChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have unsaved changes. Click "Save Changes" to apply them.
          </AlertDescription>
        </Alert>
      )}

      {/* Core Features */}
      <Card>
        <CardHeader>
          <CardTitle>Core Features</CardTitle>
          <CardDescription>Essential content management features</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <FeatureToggle path="blog" label="Blog" />
          <FeatureToggle path="pages" label="Pages" />
          <FeatureToggle path="media" label="Media Library" />
          <FeatureToggle path="analytics" label="Analytics" />
          <FeatureToggle path="forms" label="Forms" />
          <FeatureToggle path="scheduling" label="Content Scheduling" />
          <FeatureToggle path="multiLanguage" label="Multi-Language" />
        </CardContent>
      </Card>

      {/* E-Commerce Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            E-Commerce
          </CardTitle>
          <CardDescription>Online store and product management</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <FeatureToggle path="ecommerce.enabled" label="Enable E-Commerce" />
          <FeatureToggle path="ecommerce.products" label="Products" />
          <FeatureToggle path="ecommerce.orders" label="Orders" />
          <FeatureToggle path="ecommerce.customers" label="Customers" />
          <FeatureToggle path="ecommerce.shipping" label="Shipping" />
          <FeatureToggle path="ecommerce.inventory" label="Inventory Management" />
          <FeatureToggle path="ecommerce.reviews" label="Product Reviews" />
          <FeatureToggle path="ecommerce.discounts" label="Discounts & Coupons" />
        </CardContent>
      </Card>

      {/* Email Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email
          </CardTitle>
          <CardDescription>Email marketing and notifications</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <FeatureToggle path="email.enabled" label="Enable Email Features" />
          <FeatureToggle path="email.marketing" label="Email Marketing" />
          <FeatureToggle path="email.transactional" label="Transactional Emails" />
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Features
          </CardTitle>
          <CardDescription>AI-powered content and assistance</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <FeatureToggle path="ai.enabled" label="Enable AI Features" />
          <FeatureToggle path="ai.chatbot" label="AI Assistant" />
          <FeatureToggle path="ai.contentGeneration" label="AI Content Generation" />
        </CardContent>
      </Card>

      {/* Advanced Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Advanced Features
          </CardTitle>
          <CardDescription>Extensibility and automation</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <FeatureToggle path="plugins" label="Plugins" />
          <FeatureToggle path="workflows" label="Workflows & Automation" />
        </CardContent>
      </Card>
    </div>
  )
}
