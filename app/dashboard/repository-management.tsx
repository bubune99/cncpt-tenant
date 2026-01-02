"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Github,
  ExternalLink,
  Settings,
  GitBranch,
  Folder,
  Terminal,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Globe,
} from "lucide-react"
import { initiateGitHubOAuth, getUserRepositories } from "@/app/github-actions"
import { createVercelProject, deployRepository, getDeploymentStatus, configureCustomDomain } from "@/app/vercel-actions"

interface Repository {
  id: number
  name: string
  full_name: string
  html_url: string
  description?: string
  private: boolean
  default_branch: string
}

interface DeploymentStatus {
  status: string
  url?: string
  deploymentId?: string
  createdAt?: Date
  vercelState?: string
  error?: string
}

interface RepositoryManagementProps {
  user: any
  subdomains: any[]
  selectedSubdomain: string | null
}

export function RepositoryManagement({ user, subdomains, selectedSubdomain }: RepositoryManagementProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null)
  const [customDomain, setCustomDomain] = useState("")
  const [deploymentConfig, setDeploymentConfig] = useState({
    branch: "main",
    buildCommand: "npm run build",
    outputDirectory: "dist",
    environmentVariables: "",
  })

  const currentSubdomain = subdomains?.find((s) => s.subdomain === selectedSubdomain)

  useEffect(() => {
    checkGitHubConnection()
  }, [])

  useEffect(() => {
    if (currentSubdomain) {
      checkDeploymentStatus()
    }
  }, [currentSubdomain])

  const checkGitHubConnection = async () => {
    try {
      const repos = await getUserRepositories()
      setRepositories(repos)
      setIsConnected(true)
    } catch (error) {
      setIsConnected(false)
    }
  }

  const checkDeploymentStatus = async () => {
    if (!currentSubdomain) return

    try {
      console.log("[v0] Checking deployment status for subdomain:", currentSubdomain.subdomain)
      const status = await getDeploymentStatus(currentSubdomain.id)
      console.log("[v0] Deployment status received:", status)
      setDeploymentStatus(status)
    } catch (error) {
      console.log("[v0] Failed to check deployment status:", error)
      if (error.message === "Not authenticated") {
        // Set a default status when authentication fails
        setDeploymentStatus({ status: "not_configured" })
      } else {
        // For other errors, still set a fallback status
        setDeploymentStatus({ status: "error", error: error.message })
      }
    }
  }

  const handleConnectGitHub = async () => {
    setIsLoading(true)
    try {
      await initiateGitHubOAuth()
    } catch (error) {
      console.error("Failed to connect GitHub:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRepositorySelect = (repo: Repository) => {
    setSelectedRepo(repo)
    setDeploymentConfig((prev) => ({
      ...prev,
      branch: repo.default_branch,
    }))
  }

  const handleDeploymentSetup = async () => {
    if (!selectedRepo || !currentSubdomain) return

    setIsLoading(true)
    try {
      await createVercelProject({
        subdomainId: currentSubdomain.id,
        repositoryName: selectedRepo.name,
        repositoryFullName: selectedRepo.full_name,
        repositoryUrl: selectedRepo.html_url,
        branch: deploymentConfig.branch,
        buildCommand: deploymentConfig.buildCommand,
        outputDirectory: deploymentConfig.outputDirectory,
        environmentVariables: deploymentConfig.environmentVariables,
      })

      await deployRepository(currentSubdomain.id)
      await checkDeploymentStatus()

      alert("Deployment setup successful! Your repository is now being deployed.")
    } catch (error) {
      console.error("Failed to setup deployment:", error)
      alert(`Failed to setup deployment: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRedeploy = async () => {
    if (!currentSubdomain) return

    setIsLoading(true)
    try {
      await deployRepository(currentSubdomain.id)
      await checkDeploymentStatus()
      alert("Redeployment triggered successfully!")
    } catch (error) {
      console.error("Failed to redeploy:", error)
      alert(`Failed to redeploy: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfigureDomain = async () => {
    if (!currentSubdomain || !customDomain) return

    setIsLoading(true)
    try {
      await configureCustomDomain(currentSubdomain.id, customDomain)
      alert(`Custom domain ${customDomain} configured successfully!`)
      setCustomDomain("")
    } catch (error) {
      console.error("Failed to configure domain:", error)
      alert(`Failed to configure domain: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "deployed":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "building":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed":
        return "bg-green-100 text-green-800"
      case "building":
        return "bg-blue-100 text-blue-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">GitHub Integration</h1>
          <p className="text-muted-foreground">Connect GitHub repositories to your subdomains</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a subdomain from the sidebar to manage its repository connection.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">GitHub Integration</h1>
        <p className="text-muted-foreground">
          {selectedSubdomain
            ? `Connect GitHub repositories to ${selectedSubdomain}`
            : "Connect GitHub repositories to your subdomains"}
        </p>
      </div>

      {!selectedSubdomain ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a subdomain from the sidebar to manage its repository connection.
          </AlertDescription>
        </Alert>
      ) : !isConnected ? (
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Github className="w-6 h-6 text-gray-600" />
            </div>
            <CardTitle>Connect Your GitHub Account</CardTitle>
            <CardDescription>Link your GitHub account to deploy repositories to your subdomains</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={handleConnectGitHub} disabled={isLoading} className="w-full max-w-sm">
              <Github className="w-4 h-4 mr-2" />
              {isLoading ? "Connecting..." : "Connect GitHub"}
            </Button>
            <p className="text-sm text-gray-500 mt-3">
              We'll redirect you to GitHub to authorize access to your repositories
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Current Deployment Status */}
          {deploymentStatus && deploymentStatus.status !== "not_configured" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Current Deployment
                </CardTitle>
                <CardDescription>Status of the current deployment for {selectedSubdomain}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(deploymentStatus.status)}
                    <div>
                      <p className="font-medium text-sm capitalize">{deploymentStatus.status.replace("_", " ")}</p>
                      {deploymentStatus.url && (
                        <a
                          href={`https://${deploymentStatus.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Globe className="w-3 h-3" />
                          {deploymentStatus.url}
                        </a>
                      )}
                      {deploymentStatus.createdAt && (
                        <p className="text-xs text-gray-500">
                          Last deployed: {deploymentStatus.createdAt.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(deploymentStatus.status)}>{deploymentStatus.status}</Badge>
                    <Button variant="outline" size="sm" onClick={handleRedeploy} disabled={isLoading}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Redeploy
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Repository Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="w-5 h-5" />
                  Select Repository
                </CardTitle>
                <CardDescription>Choose a repository to deploy to {selectedSubdomain}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {repositories.map((repo) => (
                    <div
                      key={repo.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedRepo?.id === repo.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleRepositorySelect(repo)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{repo.name}</h4>
                            {repo.private && (
                              <Badge variant="secondary" className="text-xs">
                                Private
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-1">{repo.description}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              {repo.default_branch}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(repo.html_url, "_blank")
                          }}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {repositories.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Github className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No repositories found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deployment Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Deployment Settings
                </CardTitle>
                <CardDescription>Configure how your repository will be deployed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedRepo ? (
                  <>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Github className="w-4 h-4" />
                        <span className="font-medium text-sm">{selectedRepo.full_name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{selectedRepo.description}</p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="branch" className="text-sm font-medium">
                          Branch
                        </Label>
                        <Select
                          value={deploymentConfig.branch}
                          onValueChange={(value) => setDeploymentConfig((prev) => ({ ...prev, branch: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={selectedRepo.default_branch}>
                              {selectedRepo.default_branch} (default)
                            </SelectItem>
                            <SelectItem value="develop">develop</SelectItem>
                            <SelectItem value="staging">staging</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="buildCommand" className="text-sm font-medium">
                          Build Command
                        </Label>
                        <Input
                          id="buildCommand"
                          value={deploymentConfig.buildCommand}
                          onChange={(e) => setDeploymentConfig((prev) => ({ ...prev, buildCommand: e.target.value }))}
                          placeholder="npm run build"
                        />
                      </div>

                      <div>
                        <Label htmlFor="outputDirectory" className="text-sm font-medium">
                          Output Directory
                        </Label>
                        <Input
                          id="outputDirectory"
                          value={deploymentConfig.outputDirectory}
                          onChange={(e) =>
                            setDeploymentConfig((prev) => ({ ...prev, outputDirectory: e.target.value }))
                          }
                          placeholder="dist"
                        />
                      </div>

                      <div>
                        <Label htmlFor="envVars" className="text-sm font-medium">
                          Environment Variables
                        </Label>
                        <textarea
                          id="envVars"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          rows={3}
                          value={deploymentConfig.environmentVariables}
                          onChange={(e) =>
                            setDeploymentConfig((prev) => ({ ...prev, environmentVariables: e.target.value }))
                          }
                          placeholder="KEY1=value1&#10;KEY2=value2"
                        />
                        <p className="text-xs text-gray-500 mt-1">One per line in KEY=value format</p>
                      </div>
                    </div>

                    <Separator />

                    <Button onClick={handleDeploymentSetup} disabled={isLoading} className="w-full">
                      <Terminal className="w-4 h-4 mr-2" />
                      {isLoading ? "Setting up..." : "Deploy Repository"}
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Select a repository to configure deployment</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
