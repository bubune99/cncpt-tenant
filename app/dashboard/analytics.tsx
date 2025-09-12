"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Users,
  Eye,
  TrendingUp,
  Globe,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink,
  Zap,
} from "lucide-react"
import { getDeploymentOverview, getDetailedDeploymentLogs } from "@/app/deployment-dashboard-actions"

interface AnalyticsProps {
  subdomains: any[]
}

interface DeploymentOverview {
  totalDeployments: number
  activeDeployments: number
  failedDeployments: number
  totalSubdomains: number
  recentDeployments: Array<{
    id: number
    subdomain: string
    repository_name: string
    status: string
    created_at: string
    vercel_deployment_url?: string
  }>
  deploymentsByStatus: Record<string, number>
  deploymentTrends: Array<{
    date: string
    deployments: number
    successes: number
    failures: number
  }>
}

export function Analytics({ subdomains }: AnalyticsProps) {
  const [deploymentData, setDeploymentData] = useState<DeploymentOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSubdomain, setSelectedSubdomain] = useState<number | null>(null)
  const [deploymentLogs, setDeploymentLogs] = useState<any>(null)
  const [hasAuthError, setHasAuthError] = useState(false)

  useEffect(() => {
    loadDeploymentData()
  }, [])

  const loadDeploymentData = async () => {
    try {
      const data = await getDeploymentOverview()
      setDeploymentData(data)
      setHasAuthError(false)
    } catch (error) {
      console.error("Failed to load deployment data:", error)
      if (error instanceof Error && error.message.includes("Not authenticated")) {
        setHasAuthError(true)
        setDeploymentData({
          totalDeployments: 0,
          activeDeployments: 0,
          failedDeployments: 0,
          totalSubdomains: subdomains.length,
          recentDeployments: [],
          deploymentsByStatus: { not_configured: subdomains.length },
          deploymentTrends: [],
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadDeploymentLogs = async (subdomainId: number) => {
    try {
      const logs = await getDetailedDeploymentLogs(subdomainId)
      setDeploymentLogs(logs)
      setSelectedSubdomain(subdomainId)
    } catch (error) {
      console.error("Failed to load deployment logs:", error)
      if (error instanceof Error && error.message.includes("Not authenticated")) {
        setDeploymentLogs({
          subdomain: "Unknown",
          repository: "Not available",
          deployments: [],
        })
        setSelectedSubdomain(subdomainId)
      }
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

  const deploymentStats = deploymentData
    ? [
        {
          label: "Total Deployments",
          value: deploymentData.totalDeployments.toString(),
          change: "+12%",
          icon: Zap,
          color: "text-blue-600",
        },
        {
          label: "Active Sites",
          value: deploymentData.activeDeployments.toString(),
          change: "+8%",
          icon: CheckCircle,
          color: "text-green-600",
        },
        {
          label: "Failed Deployments",
          value: deploymentData.failedDeployments.toString(),
          change: "-2%",
          icon: XCircle,
          color: "text-red-600",
        },
        {
          label: "Total Subdomains",
          value: deploymentData.totalSubdomains.toString(),
          change: "0%",
          icon: Globe,
          color: "text-purple-600",
        },
      ]
    : []

  const traditionalStats = [
    { label: "Total Visitors", value: "1,234", change: "+12%", icon: Users },
    { label: "Page Views", value: "5,678", change: "+8%", icon: Eye },
    { label: "Active Sites", value: subdomains.length.toString(), change: "0%", icon: Globe },
    { label: "Conversion Rate", value: "3.2%", change: "+0.5%", icon: TrendingUp },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Deployments</h1>
          <p className="text-muted-foreground">Loading deployment data...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics & Deployments</h1>
          <p className="text-muted-foreground">Monitor your site performance and deployment status</p>
          {hasAuthError && (
            <p className="text-sm text-yellow-600 mt-1">
              ⚠️ Some deployment data may be limited due to authentication. Try refreshing the page.
            </p>
          )}
        </div>
        <Button onClick={loadDeploymentData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="deployments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deployments">Deployment Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Site Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="deployments" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {deploymentStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <Icon className={`w-8 h-8 ${stat.color}`} />
                    </div>
                    <div className="mt-4 flex items-center">
                      <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"} className="text-xs">
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">vs last month</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Deployments</span>
              </CardTitle>
              <CardDescription>Latest deployment activity across all your sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deploymentData?.recentDeployments.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(deployment.status)}
                      <div>
                        <p className="font-medium">{deployment.subdomain}</p>
                        <p className="text-sm text-muted-foreground">{deployment.repository_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(deployment.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(deployment.status)}>{deployment.status}</Badge>
                      {deployment.vercel_deployment_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://${deployment.vercel_deployment_url}`, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => loadDeploymentLogs(deployment.id)}>
                        View Logs
                      </Button>
                    </div>
                  </div>
                ))}

                {(!deploymentData?.recentDeployments || deploymentData.recentDeployments.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No deployments found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Status</CardTitle>
                <CardDescription>Distribution of deployment states</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deploymentData &&
                    Object.entries(deploymentData.deploymentsByStatus).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="font-medium capitalize">{status.replace("_", " ")}</span>
                        </div>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Trends</CardTitle>
                <CardDescription>Daily deployment activity (last 7 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deploymentData?.deploymentTrends.map((trend) => (
                    <div key={trend.date} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{new Date(trend.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-green-600">
                          {trend.successes} success
                        </Badge>
                        {trend.failures > 0 && (
                          <Badge variant="outline" className="text-red-600">
                            {trend.failures} failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {deploymentLogs && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Deployment History - {deploymentLogs.subdomain}</span>
                  <Button variant="outline" size="sm" onClick={() => setDeploymentLogs(null)}>
                    Close
                  </Button>
                </CardTitle>
                <CardDescription>Recent deployments for {deploymentLogs.repository}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deploymentLogs.deployments.map((deployment: any) => (
                    <div key={deployment.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(deployment.state.toLowerCase())}
                        <div>
                          <p className="font-medium">{deployment.url}</p>
                          <p className="text-sm text-muted-foreground">
                            {deployment.created.toLocaleString()} • {deployment.target}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(deployment.state.toLowerCase())}>{deployment.state}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(`https://${deployment.url}`, "_blank")}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {traditionalStats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <Icon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="mt-4 flex items-center">
                      <Badge variant={stat.change.startsWith("+") ? "default" : "secondary"} className="text-xs">
                        {stat.change}
                      </Badge>
                      <span className="text-xs text-muted-foreground ml-2">vs last month</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Traffic Overview</span>
              </CardTitle>
              <CardDescription>Visitor traffic for the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Analytics charts coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>Most visited pages this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { page: "/", views: "1,234", percentage: "45%" },
                    { page: "/about", views: "567", percentage: "20%" },
                    { page: "/contact", views: "234", percentage: "8%" },
                  ].map((item) => (
                    <div key={item.page} className="flex items-center justify-between">
                      <span className="font-medium">{item.page}</span>
                      <div className="text-right">
                        <p className="font-medium">{item.views}</p>
                        <p className="text-sm text-muted-foreground">{item.percentage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { source: "Direct", visitors: "567", percentage: "42%" },
                    { source: "Google", visitors: "234", percentage: "18%" },
                    { source: "Social Media", visitors: "123", percentage: "9%" },
                  ].map((item) => (
                    <div key={item.source} className="flex items-center justify-between">
                      <span className="font-medium">{item.source}</span>
                      <div className="text-right">
                        <p className="font-medium">{item.visitors}</p>
                        <p className="text-sm text-muted-foreground">{item.percentage}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
