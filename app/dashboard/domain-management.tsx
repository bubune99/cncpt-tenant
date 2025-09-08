"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, ExternalLink, Settings } from "lucide-react"

interface DomainManagementProps {
  subdomains: any[]
}

export function DomainManagement({ subdomains }: DomainManagementProps) {
  const [customDomain, setCustomDomain] = useState("")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Domain Management</h1>
        <p className="text-muted-foreground">Configure custom domains and manage your site URLs</p>
      </div>

      {/* Add Custom Domain */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Custom Domain</span>
          </CardTitle>
          <CardDescription>Connect your own domain to replace the subdomain URL</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="domain">Custom Domain</Label>
              <Input
                id="domain"
                placeholder="yourdomain.com"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button className="w-full">Add Domain</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            You'll need to update your DNS settings to point to our servers
          </p>
        </CardContent>
      </Card>

      {/* Current Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Your Domains</CardTitle>
          <CardDescription>Manage all domains connected to your subdomains</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {subdomains.map((subdomain) => (
              <div key={subdomain.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{subdomain.subdomain}.yourdomain.com</span>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Created {new Date(subdomain.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Visit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
