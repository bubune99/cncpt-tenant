"use client"

import { useState, useEffect } from "react"
import {
  Github,
  GitBranch,
  FolderGit2,
  RefreshCw,
  Link2,
  Unlink,
  Check,
  X,
  Loader2,
  ExternalLink,
  AlertCircle,
  FileCode,
  ArrowUpDown,
  GitPullRequest,
} from "lucide-react"
import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/card"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Badge } from "../ui/badge"
import { Separator } from "../ui/separator"
import { Alert, AlertDescription } from "../ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { toast } from "sonner"

interface GitHubConnection {
  id: string
  owner: string
  repo: string
  branch: string
  componentPath: string
  connected: boolean
  lastSyncedAt?: string
}

interface SyncedFile {
  id: string
  filePath: string
  pageTitle: string
  status: "synced" | "local_changes" | "remote_changes" | "conflict"
  lastSyncedAt: string
}

export default function GitHubSettings() {
  const [connection, setConnection] = useState<GitHubConnection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [showConnectDialog, setShowConnectDialog] = useState(false)
  const [syncedFiles, setSyncedFiles] = useState<SyncedFile[]>([])
  const [branches, setBranches] = useState<string[]>([])

  // Form state
  const [formData, setFormData] = useState({
    repo: "",
    token: "",
    branch: "main",
    componentPath: "src/components/blocks",
  })

  useEffect(() => {
    loadConnection()
  }, [])

  const loadConnection = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/github/connection")
      if (response.ok) {
        const data = await response.json()
        setConnection(data.connection)
        setSyncedFiles(data.syncedFiles || [])
        setBranches(data.branches || [])
      }
    } catch (error) {
      console.error("Error loading GitHub connection:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!formData.repo || !formData.token) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsConnecting(true)
    try {
      const response = await fetch("/api/admin/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to connect")
      }

      const data = await response.json()
      setConnection(data.connection)
      setBranches(data.branches || [])
      setShowConnectDialog(false)
      toast.success("Successfully connected to GitHub")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to connect")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect? This will not delete any files.")) {
      return
    }

    try {
      const response = await fetch("/api/admin/github/disconnect", {
        method: "POST",
      })

      if (response.ok) {
        setConnection(null)
        setSyncedFiles([])
        toast.success("Disconnected from GitHub")
      }
    } catch (error) {
      toast.error("Failed to disconnect")
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch("/api/admin/github/sync", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Sync failed")
      }

      const data = await response.json()
      setSyncedFiles(data.syncedFiles || [])
      setConnection((prev) =>
        prev ? { ...prev, lastSyncedAt: new Date().toISOString() } : null
      )
      toast.success(`Synced ${data.pulled || 0} files`)
    } catch (error) {
      toast.error("Sync failed")
    } finally {
      setIsSyncing(false)
    }
  }

  const handlePullFile = async (filePath: string) => {
    try {
      const response = await fetch("/api/admin/github/pull", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      })

      if (response.ok) {
        toast.success("File pulled successfully")
        loadConnection()
      }
    } catch (error) {
      toast.error("Failed to pull file")
    }
  }

  const handlePushFile = async (filePath: string) => {
    try {
      const response = await fetch("/api/admin/github/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath }),
      })

      if (response.ok) {
        toast.success("File pushed successfully")
        loadConnection()
      }
    } catch (error) {
      toast.error("Failed to push file")
    }
  }

  const getStatusBadge = (status: SyncedFile["status"]) => {
    switch (status) {
      case "synced":
        return (
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
            <Check className="mr-1 h-3 w-3" />
            Synced
          </Badge>
        )
      case "local_changes":
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
            <ArrowUpDown className="mr-1 h-3 w-3" />
            Local Changes
          </Badge>
        )
      case "remote_changes":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
            <ArrowUpDown className="mr-1 h-3 w-3" />
            Remote Changes
          </Badge>
        )
      case "conflict":
        return (
          <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">
            <AlertCircle className="mr-1 h-3 w-3" />
            Conflict
          </Badge>
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Github className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>GitHub Connection</CardTitle>
                <CardDescription>
                  Sync your block components with a GitHub repository
                </CardDescription>
              </div>
            </div>
            {connection?.connected && (
              <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
                <Check className="mr-1 h-3 w-3" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {connection?.connected ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Repository
                  </Label>
                  <div className="flex items-center gap-2">
                    <FolderGit2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {connection.owner}/{connection.repo}
                    </span>
                    <a
                      href={`https://github.com/${connection.owner}/${connection.repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Branch
                  </Label>
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{connection.branch}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Component Path
                  </Label>
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{connection.componentPath}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                    Last Synced
                  </Label>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {connection.lastSyncedAt
                        ? new Date(connection.lastSyncedAt).toLocaleString()
                        : "Never"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No GitHub repository connected. Connect a repository to sync your block components.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          {connection?.connected ? (
            <>
              <Button variant="outline" onClick={handleDisconnect}>
                <Unlink className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
                  {isSyncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sync All
                </Button>
              </div>
            </>
          ) : (
            <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect Repository
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Connect GitHub Repository
                  </DialogTitle>
                  <DialogDescription>
                    Enter your repository details to enable block synchronization.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="repo">Repository</Label>
                    <Input
                      id="repo"
                      placeholder="owner/repository"
                      value={formData.repo}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, repo: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: owner/repo (e.g., acme/website)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="token">Personal Access Token</Label>
                    <Input
                      id="token"
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={formData.token}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, token: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Requires <code>repo</code> scope.{" "}
                      <a
                        href="https://github.com/settings/tokens/new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Create token
                      </a>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        placeholder="main"
                        value={formData.branch}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, branch: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="path">Component Path</Label>
                      <Input
                        id="path"
                        placeholder="src/components/blocks"
                        value={formData.componentPath}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            componentPath: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowConnectDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleConnect} disabled={isConnecting}>
                    {isConnecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="mr-2 h-4 w-4" />
                    )}
                    Connect
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardFooter>
      </Card>

      {/* Synced Files */}
      {connection?.connected && syncedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Synced Files</CardTitle>
            <CardDescription>
              Components linked between your pages and GitHub
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>File Path</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Synced</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {syncedFiles.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">{file.pageTitle}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {file.filePath}
                    </TableCell>
                    <TableCell>{getStatusBadge(file.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(file.lastSyncedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {(file.status === "remote_changes" || file.status === "conflict") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePullFile(file.filePath)}
                          >
                            Pull
                          </Button>
                        )}
                        {(file.status === "local_changes" || file.status === "conflict") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePushFile(file.filePath)}
                          >
                            Push
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>How GitHub Sync Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                1
              </div>
              <h4 className="font-medium">Connect Repository</h4>
              <p className="text-sm text-muted-foreground">
                Link your GitHub repository using a personal access token with repo scope.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                2
              </div>
              <h4 className="font-medium">Pull Components</h4>
              <p className="text-sm text-muted-foreground">
                Import existing React components from your repo as editable block pages.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                3
              </div>
              <h4 className="font-medium">Push Changes</h4>
              <p className="text-sm text-muted-foreground">
                Export your visual edits back to GitHub as clean React components.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
