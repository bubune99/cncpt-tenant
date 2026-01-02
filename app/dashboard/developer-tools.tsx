"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Code, Terminal, Database, Key, GitBranch } from "lucide-react"

export function DeveloperTools() {
  const [customCSS, setCustomCSS] = useState("")
  const [customJS, setCustomJS] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Developer Tools</h1>
        <p className="text-muted-foreground">Advanced configuration and development features</p>
        <Badge variant="secondary" className="mt-2">
          Beta Feature
        </Badge>
      </div>

      {/* Custom Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>Custom Code</span>
          </CardTitle>
          <CardDescription>Add custom CSS and JavaScript to your site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="custom-css">Custom CSS</Label>
            <Textarea
              id="custom-css"
              placeholder="/* Add your custom CSS here */"
              value={customCSS}
              onChange={(e) => setCustomCSS(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-js">Custom JavaScript</Label>
            <Textarea
              id="custom-js"
              placeholder="// Add your custom JavaScript here"
              value={customJS}
              onChange={(e) => setCustomJS(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <Button>Save Custom Code</Button>
        </CardContent>
      </Card>

      {/* API Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>API Access</span>
          </CardTitle>
          <CardDescription>Generate API keys for programmatic access</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">API Key</p>
              <p className="text-sm text-muted-foreground">sk_test_••••••••••••••••</p>
            </div>
            <Button variant="outline">Regenerate</Button>
          </div>

          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <Input placeholder="https://your-site.com/webhook" />
          </div>
        </CardContent>
      </Card>

      {/* Database Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Database Management</span>
          </CardTitle>
          <CardDescription>Direct database access and management tools</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <Terminal className="w-6 h-6 mb-2" />
              SQL Console
            </Button>
            <Button variant="outline" className="h-20 flex-col bg-transparent">
              <GitBranch className="w-6 h-6 mb-2" />
              Database Backup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
