"use client"

import { useState, useEffect } from "react"
import {
  Copy,
  Check,
  Bot,
  Key,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  Plus,
  Settings,
  Code,
  FileJson,
  Terminal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface McpIntegrationProps {
  selectedSubdomain: string | null
}

interface ApiKey {
  id: string
  name: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  createdAt: string
}

export function McpIntegration({ selectedSubdomain }: McpIntegrationProps) {
  const [copied, setCopied] = useState<string | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoadingKeys, setIsLoadingKeys] = useState(true)
  const [showQuickStart, setShowQuickStart] = useState(true)

  // Get base URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"
  const mcpUrl = selectedSubdomain
    ? `${baseUrl}/s/${selectedSubdomain}/mcp`
    : `${baseUrl}/s/<subdomain>/mcp`

  useEffect(() => {
    if (selectedSubdomain) {
      loadApiKeys()
    }
  }, [selectedSubdomain])

  const loadApiKeys = async () => {
    try {
      setIsLoadingKeys(true)
      const response = await fetch("/api/cms/api-keys")
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys || [])
      }
    } catch (error) {
      console.error("Error loading API keys:", error)
    } finally {
      setIsLoadingKeys(false)
    }
  }

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleQuickStart = () => {
    setShowQuickStart(prev => !prev)
  }

  // Generate MCP configuration for different clients
  const claudeDesktopConfig = JSON.stringify({
    mcpServers: {
      [selectedSubdomain || "your-site"]: {
        url: mcpUrl,
        headers: {
          Authorization: "Bearer cms_YOUR_API_KEY_HERE"
        }
      }
    }
  }, null, 2)

  const claudeCodeConfig = `# Add to your .claude/settings.json or run:
claude mcp add ${selectedSubdomain || "your-site"} \\
  --url "${mcpUrl}" \\
  --header "Authorization: Bearer cms_YOUR_API_KEY_HERE"`

  const cursorConfig = JSON.stringify({
    name: selectedSubdomain || "your-site",
    transport: "http",
    url: mcpUrl,
    headers: {
      Authorization: "Bearer cms_YOUR_API_KEY_HERE"
    }
  }, null, 2)

  const genericHttpConfig = `# MCP Server Configuration
URL: ${mcpUrl}
Transport: HTTP/SSE
Authentication: Bearer Token

# Headers
Authorization: Bearer cms_YOUR_API_KEY_HERE
Content-Type: application/json`

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">MCP Integration</h1>
          <p className="text-muted-foreground">Connect AI agents to your CMS</p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a subdomain from the sidebar to view MCP configuration.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-help-key="dashboard.mcp.page">
      <div>
        <h1 className="text-3xl font-bold mb-2">MCP Integration</h1>
        <p className="text-muted-foreground">
          Connect AI agents to <span className="font-medium">{selectedSubdomain}</span> via Model Context Protocol
        </p>
      </div>

      {/* Quick Start */}
      <Card data-help-key="dashboard.mcp.quickstart">
        <CardHeader
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={toggleQuickStart}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Quick Start</CardTitle>
                <CardDescription>Get your AI agent connected in minutes</CardDescription>
              </div>
            </div>
            {showQuickStart ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
        {showQuickStart && (
          <CardContent className="space-y-6">
              {/* Step 1: API Key */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Get an API Key</h3>
                  {isLoadingKeys ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading keys...
                    </div>
                  ) : apiKeys.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground mb-2">
                        You have {apiKeys.length} API key{apiKeys.length > 1 ? "s" : ""}:
                      </p>
                      <div className="space-y-2">
                        {apiKeys.slice(0, 3).map(key => (
                          <div key={key.id} className="flex items-center gap-2 text-sm">
                            <code className="bg-muted px-2 py-1 rounded">{key.keyPrefix}...</code>
                            <span className="text-muted-foreground">{key.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {key.scopes.join(", ")}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <Link href={`/s/${selectedSubdomain}/admin/settings`}>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Settings className="h-4 w-4 mr-2" />
                          Manage Keys
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        You need an API key to authenticate your AI agent.
                      </p>
                      <Link href={`/s/${selectedSubdomain}/admin/settings`}>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Create API Key
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Copy Config */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Copy Configuration</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Copy the configuration below for your AI client.
                  </p>
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">MCP Server URL</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(mcpUrl, "url")}
                      >
                        {copied === "url" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <code className="text-sm break-all">{mcpUrl}</code>
                  </div>
                </div>
              </div>

              {/* Step 3: Configure */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2">Add to Your AI Client</h3>
                  <p className="text-sm text-muted-foreground">
                    See the configuration examples below for your specific client.
                  </p>
                </div>
              </div>
            </CardContent>
        )}
      </Card>

      {/* Configuration Examples */}
      <Card data-help-key="dashboard.mcp.config">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Code className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle>Configuration Examples</CardTitle>
              <CardDescription>Copy-paste configurations for popular AI clients</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="claude-desktop" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="claude-desktop">Claude Desktop</TabsTrigger>
              <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
              <TabsTrigger value="cursor">Cursor</TabsTrigger>
              <TabsTrigger value="generic">Generic HTTP</TabsTrigger>
            </TabsList>

            <TabsContent value="claude-desktop" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">claude_desktop_config.json</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(claudeDesktopConfig, "claude-desktop")}
                  >
                    {copied === "claude-desktop" ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{claudeDesktopConfig}</code>
                </pre>
                <p className="text-sm text-muted-foreground">
                  Add this to your Claude Desktop configuration file at{" "}
                  <code className="bg-muted px-1 rounded">~/Library/Application Support/Claude/claude_desktop_config.json</code> (macOS) or{" "}
                  <code className="bg-muted px-1 rounded">%APPDATA%\Claude\claude_desktop_config.json</code> (Windows).
                </p>
              </div>
            </TabsContent>

            <TabsContent value="claude-code" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Terminal Command</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(claudeCodeConfig, "claude-code")}
                  >
                    {copied === "claude-code" ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{claudeCodeConfig}</code>
                </pre>
                <p className="text-sm text-muted-foreground">
                  Run this command in your terminal to add the MCP server to Claude Code CLI.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="cursor" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">MCP Server Config</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(cursorConfig, "cursor")}
                  >
                    {copied === "cursor" ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{cursorConfig}</code>
                </pre>
                <p className="text-sm text-muted-foreground">
                  Add this configuration to Cursor's MCP settings.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="generic" className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Generic Configuration</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(genericHttpConfig, "generic")}
                  >
                    {copied === "generic" ? (
                      <>
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{genericHttpConfig}</code>
                </pre>
                <p className="text-sm text-muted-foreground">
                  Use these settings for any MCP-compatible client.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Available Tools */}
      <Card data-help-key="dashboard.mcp.tools">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Key className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Available MCP Tools</CardTitle>
              <CardDescription>Tools your AI agent can use once connected</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "list_products", desc: "Browse your product catalog", scope: "read" },
              { name: "get_product", desc: "Get product details", scope: "read" },
              { name: "list_orders", desc: "View order history", scope: "read" },
              { name: "get_order", desc: "Get order details", scope: "read" },
              { name: "list_blog_posts", desc: "Browse blog content", scope: "read" },
              { name: "create_blog_post", desc: "Create new blog posts", scope: "write" },
              { name: "list_pages", desc: "Browse CMS pages", scope: "read" },
              { name: "get_page_puck_data", desc: "Get page editor data", scope: "read" },
              { name: "update_page_puck_content", desc: "Update page content", scope: "write" },
              { name: "list_customers", desc: "View customer list", scope: "read" },
              { name: "get_analytics_summary", desc: "View analytics data", scope: "read" },
              { name: "get_settings", desc: "View site settings", scope: "read" },
            ].map((tool) => (
              <div key={tool.name} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <code className="text-sm font-medium">{tool.name}</code>
                  <Badge variant={tool.scope === "write" ? "default" : "secondary"} className="text-xs">
                    {tool.scope}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{tool.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            +5 more tools available. Your AI agent can discover all tools automatically via the MCP protocol.
          </p>
        </CardContent>
      </Card>

      {/* Links */}
      <div className="flex gap-4">
        <Link href={`/s/${selectedSubdomain}/admin/settings`}>
          <Button variant="outline">
            <Key className="h-4 w-4 mr-2" />
            Manage API Keys
          </Button>
        </Link>
        <a
          href="https://modelcontextprotocol.io/docs"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            MCP Documentation
          </Button>
        </a>
      </div>
    </div>
  )
}
