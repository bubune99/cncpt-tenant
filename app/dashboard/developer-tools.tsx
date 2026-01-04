"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Code, Key, Copy, Check, RefreshCw, Save, Loader2, AlertCircle } from "lucide-react"
import {
  saveCustomCode,
  getCustomCode,
  generateApiKey,
  getApiKey,
  saveWebhookUrl,
  getWebhookUrl,
} from "@/app/actions"

interface DeveloperToolsProps {
  selectedSubdomain: string | null
}

export function DeveloperTools({ selectedSubdomain }: DeveloperToolsProps) {
  const [customCSS, setCustomCSS] = useState("")
  const [customJS, setCustomJS] = useState("")
  const [webhookUrl, setWebhookUrlState] = useState("")
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingCode, setIsSavingCode] = useState(false)
  const [isSavingWebhook, setIsSavingWebhook] = useState(false)
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (selectedSubdomain) {
      loadData()
    } else {
      setIsLoading(false)
    }
  }, [selectedSubdomain])

  const loadData = async () => {
    if (!selectedSubdomain) return

    setIsLoading(true)
    try {
      const [codeResult, keyResult, webhookResult] = await Promise.all([
        getCustomCode(selectedSubdomain),
        getApiKey(selectedSubdomain),
        getWebhookUrl(selectedSubdomain),
      ])

      if (codeResult.success) {
        setCustomCSS(codeResult.customCSS || "")
        setCustomJS(codeResult.customJS || "")
      }

      if (keyResult.success) {
        setApiKey(keyResult.apiKey)
      }

      if (webhookResult.success) {
        setWebhookUrlState(webhookResult.webhookUrl || "")
      }
    } catch (error) {
      console.error("Failed to load developer tools data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCode = async () => {
    if (!selectedSubdomain) return

    setIsSavingCode(true)
    setMessage(null)

    try {
      const result = await saveCustomCode(selectedSubdomain, customCSS, customJS)
      if (result.success) {
        setMessage({ type: "success", text: "Custom code saved successfully" })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save code" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save code" })
    } finally {
      setIsSavingCode(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSaveWebhook = async () => {
    if (!selectedSubdomain) return

    setIsSavingWebhook(true)
    setMessage(null)

    try {
      const result = await saveWebhookUrl(selectedSubdomain, webhookUrl)
      if (result.success) {
        setMessage({ type: "success", text: "Webhook URL saved successfully" })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save webhook" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to save webhook" })
    } finally {
      setIsSavingWebhook(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleGenerateKey = async () => {
    if (!selectedSubdomain) return

    setIsGeneratingKey(true)
    setMessage(null)

    try {
      const result = await generateApiKey(selectedSubdomain)
      if (result.success && result.apiKey) {
        setApiKey(result.apiKey)
        setMessage({ type: "success", text: "New API key generated" })
      } else {
        setMessage({ type: "error", text: result.error || "Failed to generate key" })
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to generate API key" })
    } finally {
      setIsGeneratingKey(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 12) return key
    return `${key.slice(0, 8)}${"•".repeat(24)}${key.slice(-4)}`
  }

  if (!selectedSubdomain) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
          <p className="text-muted-foreground">Advanced configuration and development features</p>
        </div>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a subdomain from the sidebar to access developer tools.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
        <p className="text-muted-foreground">
          Advanced configuration for <span className="font-medium">{selectedSubdomain}</span>
        </p>
        <Badge variant="secondary" className="mt-2">
          Beta Feature
        </Badge>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Custom Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>Custom Code</span>
          </CardTitle>
          <CardDescription>
            Add custom CSS and JavaScript to your site. Code will be injected into the page head.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-css">Custom CSS</Label>
            <Textarea
              id="custom-css"
              placeholder="/* Add your custom CSS here */
.my-class {
  color: blue;
}"
              value={customCSS}
              onChange={(e) => setCustomCSS(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-js">Custom JavaScript</Label>
            <Textarea
              id="custom-js"
              placeholder="// Add your custom JavaScript here
console.log('Hello from custom script!');"
              value={customJS}
              onChange={(e) => setCustomJS(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <Button onClick={handleSaveCode} disabled={isSavingCode}>
            {isSavingCode ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Custom Code
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* API Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>API Access</span>
          </CardTitle>
          <CardDescription>Generate API keys for programmatic access to your subdomain</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <p className="font-medium">API Key</p>
              <p className="text-sm text-muted-foreground font-mono">
                {apiKey ? maskApiKey(apiKey) : "No API key generated yet"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {apiKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(apiKey)}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleGenerateKey}
                disabled={isGeneratingKey}
              >
                {isGeneratingKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {apiKey ? "Regenerate" : "Generate"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">Webhook URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhook-url"
                placeholder="https://your-site.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrlState(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleSaveWebhook}
                disabled={isSavingWebhook}
              >
                {isSavingWebhook ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Receive real-time notifications when events occur on your subdomain
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
