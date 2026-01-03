"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Server,
  Globe,
  Play,
  Square,
  RefreshCw,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  ExternalLink,
  Shield,
  Copy,
  Info,
} from "lucide-react"
import {
  checkDokployConnection,
  getDokployProjects,
  getDokployApplications,
  getDokployDomainsForApplication,
  createDokployDomain,
  deleteDokployDomain,
  validateDokployDomain,
  generateDokployCertificate,
  deployDokployApplication,
  redeployDokployApplication,
  startDokployApplication,
  stopDokployApplication,
  restartDokployApplication,
  getDnsInstructions,
  type DokployDomainWithStatus,
} from "@/app/dokploy-actions"
import type { DokployProject, DokployApplication } from "@/lib/dokploy"

interface FrontendDeploymentProps {
  selectedSubdomain: string | null
}

export function FrontendDeployment({ selectedSubdomain }: FrontendDeploymentProps) {
  // Connection state
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string>("")

  // Loading states
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Data state
  const [projects, setProjects] = useState<DokployProject[]>([])
  const [applications, setApplications] = useState<DokployApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<DokployApplication | null>(null)
  const [domains, setDomains] = useState<DokployDomainWithStatus[]>([])

  // Domain form state
  const [newDomain, setNewDomain] = useState("")
  const [useHttps, setUseHttps] = useState(true)
  const [certificateType, setCertificateType] = useState<"letsencrypt" | "none">("letsencrypt")

  // Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Server IP for DNS instructions (would come from config or Dokploy)
  const serverIp = process.env.NEXT_PUBLIC_VPS_IP || "YOUR_SERVER_IP"

  useEffect(() => {
    checkConnection()
  }, [])

  useEffect(() => {
    if (isConnected && selectedSubdomain) {
      loadApplications()
    }
  }, [isConnected, selectedSubdomain])

  useEffect(() => {
    if (selectedApplication) {
      loadDomains()
    }
  }, [selectedApplication])

  const checkConnection = async () => {
    setIsLoading(true)
    try {
      const result = await checkDokployConnection()
      setIsConnected(result.connected)
      setConnectionError(result.error || null)
      setServerUrl(result.serverUrl || "")

      if (result.connected) {
        const projectList = await getDokployProjects()
        setProjects(projectList)
      }
    } catch (error) {
      setIsConnected(false)
      setConnectionError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadApplications = async () => {
    try {
      const apps = await getDokployApplications()
      setApplications(apps)

      // Auto-select application matching the subdomain name
      const matchingApp = apps.find(
        (app) =>
          app.name.toLowerCase() === selectedSubdomain?.toLowerCase() ||
          app.appName.toLowerCase() === selectedSubdomain?.toLowerCase()
      )
      if (matchingApp) {
        setSelectedApplication(matchingApp)
      }
    } catch (error) {
      console.error("Failed to load applications:", error)
    }
  }

  const loadDomains = async () => {
    if (!selectedApplication) return

    try {
      const domainList = await getDokployDomainsForApplication(selectedApplication.applicationId)
      setDomains(domainList)
    } catch (error) {
      console.error("Failed to load domains:", error)
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain || !selectedApplication) return

    setIsActionLoading(true)
    setErrorMessage(null)
    try {
      await createDokployDomain({
        host: newDomain,
        https: useHttps,
        certificateType: useHttps ? certificateType : "none",
        applicationId: selectedApplication.applicationId,
        domainType: "application",
        stripPath: false,
      })

      setSuccessMessage(`Domain "${newDomain}" added successfully!`)
      setNewDomain("")
      await loadDomains()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRemoveDomain = async (domainId: string, host: string) => {
    if (!confirm(`Are you sure you want to remove ${host}?`)) return

    setIsActionLoading(true)
    try {
      await deleteDokployDomain(domainId)
      setSuccessMessage(`Domain "${host}" removed successfully!`)
      await loadDomains()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleVerifyDomain = async (domainId: string) => {
    setIsActionLoading(true)
    try {
      const result = await validateDokployDomain(domainId)
      if (result.isValid) {
        setSuccessMessage("DNS verified successfully!")
      } else {
        setErrorMessage(result.error || "DNS verification failed. Please check your DNS settings.")
      }
      await loadDomains()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleGenerateCertificate = async (domainId: string) => {
    setIsActionLoading(true)
    try {
      const result = await generateDokployCertificate(domainId)
      if (result.success) {
        setSuccessMessage(result.message)
      } else {
        setErrorMessage(result.message)
      }
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDeploy = async () => {
    if (!selectedApplication) return
    setIsActionLoading(true)
    try {
      await deployDokployApplication(selectedApplication.applicationId)
      setSuccessMessage("Deployment started!")
      await loadApplications()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRedeploy = async () => {
    if (!selectedApplication) return
    setIsActionLoading(true)
    try {
      await redeployDokployApplication(selectedApplication.applicationId)
      setSuccessMessage("Redeployment started!")
      await loadApplications()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStart = async () => {
    if (!selectedApplication) return
    setIsActionLoading(true)
    try {
      await startDokployApplication(selectedApplication.applicationId)
      setSuccessMessage("Application started!")
      await loadApplications()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleStop = async () => {
    if (!selectedApplication) return
    setIsActionLoading(true)
    try {
      await stopDokployApplication(selectedApplication.applicationId)
      setSuccessMessage("Application stopped!")
      await loadApplications()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRestart = async () => {
    if (!selectedApplication) return
    setIsActionLoading(true)
    try {
      await restartDokployApplication(selectedApplication.applicationId)
      setSuccessMessage("Application restarted!")
      await loadApplications()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      setErrorMessage((error as Error).message)
    } finally {
      setIsActionLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setSuccessMessage("Copied to clipboard!")
    setTimeout(() => setSuccessMessage(null), 2000)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
      case "done":
        return <Badge className="bg-green-100 text-green-800">Running</Badge>
      case "idle":
        return <Badge variant="secondary">Idle</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getDnsStatusIcon = (status?: "pending" | "valid" | "invalid") => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "invalid":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Frontend Deployment</h1>
          <p className="text-muted-foreground">Manage your frontend application hosting</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a site from the sidebar to manage its frontend deployment.
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

  // Not connected to hosting service
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Frontend Deployment</h1>
          <p className="text-muted-foreground">Manage your frontend application hosting</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Server className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle>Hosting Service Unavailable</CardTitle>
            <CardDescription>
              {connectionError || "The hosting service is currently being configured. Please try again later."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Frontend hosting is being set up. Once available, you'll be able to:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Deploy your frontend application</li>
                  <li>Configure custom domains with SSL</li>
                  <li>Manage deployments and restarts</li>
                </ul>
              </AlertDescription>
            </Alert>
            <Button onClick={checkConnection} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Frontend Deployment</h1>
          <p className="text-muted-foreground">
            Manage frontend for <span className="font-medium">{selectedSubdomain}</span>
          </p>
        </div>
        {serverUrl && (
          <Button variant="outline" size="sm" onClick={() => window.open(serverUrl, "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Server Panel
          </Button>
        )}
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

      {/* Application Selection / Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Application Status
          </CardTitle>
          <CardDescription>
            {selectedApplication
              ? `Managing: ${selectedApplication.name}`
              : "Select an application to manage"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedApplication ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select an application to manage:
              </p>
              <div className="grid gap-2">
                {applications.map((app) => (
                  <button
                    key={app.applicationId}
                    onClick={() => setSelectedApplication(app)}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <div>
                      <p className="font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.appName}</p>
                    </div>
                    {getStatusBadge(app.applicationStatus)}
                  </button>
                ))}
              </div>
              {applications.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Server className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No applications found</p>
                  <p className="text-xs mt-1">Contact support to set up your frontend application</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">{selectedApplication.name}</p>
                  <p className="text-xs text-muted-foreground">
                    App: {selectedApplication.appName} | Project: {selectedApplication.projectId.substring(0, 8)}...
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedApplication.applicationStatus)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedApplication(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={handleDeploy}
                  disabled={isActionLoading}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Deploy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRedeploy}
                  disabled={isActionLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Redeploy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStart}
                  disabled={isActionLoading || selectedApplication.applicationStatus === "running"}
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStop}
                  disabled={isActionLoading || selectedApplication.applicationStatus === "idle"}
                >
                  <Square className="h-4 w-4 mr-1" />
                  Stop
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestart}
                  disabled={isActionLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Restart
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Domain Management */}
      {selectedApplication && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Custom Domains
            </CardTitle>
            <CardDescription>
              Configure custom domains for your frontend application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Existing Domains */}
            {domains.length > 0 && (
              <div className="space-y-3">
                {domains.map((domain) => (
                  <div
                    key={domain.domainId || domain.host}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getDnsStatusIcon(domain.validationStatus)}
                      <div>
                        <div className="flex items-center gap-2">
                          <a
                            href={`${domain.https ? "https" : "http"}://${domain.host}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium hover:underline flex items-center gap-1"
                          >
                            {domain.host}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          {domain.https && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              HTTPS
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {domain.validationStatus === "valid"
                            ? "DNS verified"
                            : domain.validationStatus === "invalid"
                            ? domain.validationError || "DNS verification failed"
                            : "Pending DNS verification"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => domain.domainId && handleVerifyDomain(domain.domainId)}
                        disabled={isActionLoading}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      {domain.https && domain.certificateType === "letsencrypt" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => domain.domainId && handleGenerateCertificate(domain.domainId)}
                          disabled={isActionLoading}
                          title="Generate SSL Certificate"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          domain.domainId && handleRemoveDomain(domain.domainId, domain.host)
                        }
                        disabled={isActionLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Separator />

            {/* Add New Domain */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Add New Domain</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="example.com or www.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddDomain} disabled={!newDomain || isActionLoading}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Domain
                </Button>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable HTTPS</Label>
                  <p className="text-xs text-muted-foreground">
                    Secure your domain with SSL/TLS
                  </p>
                </div>
                <Switch checked={useHttps} onCheckedChange={setUseHttps} />
              </div>

              {useHttps && (
                <div className="flex gap-4">
                  <button
                    onClick={() => setCertificateType("letsencrypt")}
                    className={`flex-1 p-3 border rounded-lg text-left transition-colors ${
                      certificateType === "letsencrypt"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-sm">Let's Encrypt</p>
                    <p className="text-xs text-muted-foreground">Free automatic SSL</p>
                  </button>
                  <button
                    onClick={() => setCertificateType("none")}
                    className={`flex-1 p-3 border rounded-lg text-left transition-colors ${
                      certificateType === "none"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-sm">Custom</p>
                    <p className="text-xs text-muted-foreground">Bring your own cert</p>
                  </button>
                </div>
              )}
            </div>

            {/* DNS Instructions */}
            {newDomain && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <p className="font-medium mb-2">DNS Configuration Required</p>
                  <p className="text-sm mb-3">
                    Add the following DNS record to your domain registrar:
                  </p>
                  <div className="space-y-2">
                    {(() => {
                      const instructions = getDnsInstructions(newDomain, serverIp)
                      return (
                        <>
                          <div className="flex items-center gap-2 bg-white/50 p-2 rounded font-mono text-xs">
                            <span className="font-bold w-16">Type:</span>
                            <span>{instructions.aRecord.type}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(instructions.aRecord.type)}
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 bg-white/50 p-2 rounded font-mono text-xs">
                            <span className="font-bold w-16">Host:</span>
                            <span>{instructions.aRecord.host}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(instructions.aRecord.host)}
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 bg-white/50 p-2 rounded font-mono text-xs">
                            <span className="font-bold w-16">Value:</span>
                            <span>{instructions.aRecord.value}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(instructions.aRecord.value)}
                              className="h-6 w-6 p-0 ml-auto"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 bg-white/50 p-2 rounded font-mono text-xs">
                            <span className="font-bold w-16">TTL:</span>
                            <span>{instructions.aRecord.ttl}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <p className="text-xs mt-3 text-blue-700">
                    DNS changes may take up to 48 hours to propagate globally.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
