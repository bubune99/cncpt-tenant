"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Server,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Copy,
  Info,
  Zap,
  GitBranch,
  RefreshCw,
} from "lucide-react"
import { rootDomain, protocol } from "@/lib/utils"

interface FrontendDeploymentProps {
  selectedSubdomain: string | null
}

interface DeploymentStatus {
  status: "deployed" | "building" | "error" | "unknown"
  url: string
  lastDeployed?: string
  gitBranch?: string
}

export function FrontendDeployment({ selectedSubdomain }: FrontendDeploymentProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null)

  useEffect(() => {
    if (selectedSubdomain) {
      // Simulate loading deployment info
      setIsLoading(true)
      setTimeout(() => {
        setDeploymentStatus({
          status: "deployed",
          url: `${protocol}://${selectedSubdomain}.${rootDomain}`,
          lastDeployed: new Date().toISOString(),
          gitBranch: "main",
        })
        setIsLoading(false)
      }, 500)
    }
  }, [selectedSubdomain])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage("Copied to clipboard!")
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hosting</h1>
          <p className="text-muted-foreground">Manage your application hosting</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a site from the sidebar to view its hosting information.
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

  const siteUrl = `${protocol}://${selectedSubdomain}.${rootDomain}`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hosting</h1>
          <p className="text-muted-foreground">
            Hosting for <span className="font-medium">{selectedSubdomain}</span>
          </p>
        </div>
      </div>

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Hosting Platform */}
      <Card data-help-key="dashboard.frontend.platform">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Hosting Platform
          </CardTitle>
          <CardDescription>
            Your site is hosted on Vercel's global edge network
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M24 22.525H0l12-21.05 12 21.05z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Vercel</p>
              <p className="text-sm text-muted-foreground">
                Edge-optimized hosting with automatic SSL
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-muted/50 rounded-lg">
              <Zap className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-sm font-medium">Edge Network</p>
              <p className="text-xs text-muted-foreground">Global CDN</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-sm font-medium">SSL/TLS</p>
              <p className="text-xs text-muted-foreground">Automatic HTTPS</p>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <RefreshCw className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <p className="text-sm font-medium">Auto Deploy</p>
              <p className="text-xs text-muted-foreground">Git integration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Site */}
      <Card data-help-key="dashboard.frontend.status">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Live Site
          </CardTitle>
          <CardDescription>Your site is live and accessible</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <div>
                <p className="font-medium">{selectedSubdomain}.{rootDomain}</p>
                <p className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs mr-2">
                    <Shield className="h-3 w-3 mr-1" />
                    HTTPS
                  </Badge>
                  SSL certificate active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(siteUrl)}
                title="Copy URL"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(siteUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Visit Site
              </Button>
            </div>
          </div>

          {deploymentStatus?.gitBranch && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GitBranch className="h-4 w-4" />
              <span>Deployed from branch: <code className="bg-muted px-1.5 py-0.5 rounded">{deploymentStatus.gitBranch}</code></span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card data-help-key="dashboard.frontend.how-it-works">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            How Hosting Works
          </CardTitle>
          <CardDescription>Your site is automatically deployed and managed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Automatic Deployment</p>
                <p className="text-sm text-muted-foreground">
                  Your site is automatically deployed when you make changes in the dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium">Global Edge Network</p>
                <p className="text-sm text-muted-foreground">
                  Content is served from the edge location closest to your visitors for fast load times.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium">SSL Certificates</p>
                <p className="text-sm text-muted-foreground">
                  SSL certificates are automatically provisioned and renewed for all domains.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">4</span>
              </div>
              <div>
                <p className="font-medium">Custom Domains</p>
                <p className="text-sm text-muted-foreground">
                  Connect your own domain in the <strong>Custom Domains</strong> section of the sidebar.
                </p>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Need a custom domain?</strong> Go to <strong>Custom Domains</strong> in the sidebar to connect your own domain with automatic SSL.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
