"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Save, Globe, Palette } from "lucide-react"

export function SiteSettings() {
  const [siteTitle, setSiteTitle] = useState("")
  const [siteDescription, setSiteDescription] = useState("")
  const [isPublic, setIsPublic] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Site Settings</h1>
        <p className="text-muted-foreground">Configure your site's basic information and preferences</p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Basic Information</span>
          </CardTitle>
          <CardDescription>Set your site's title, description, and visibility</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-title">Site Title</Label>
            <Input
              id="site-title"
              placeholder="My Awesome Site"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="site-description">Site Description</Label>
            <Textarea
              id="site-description"
              placeholder="A brief description of your site..."
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Site</Label>
              <p className="text-sm text-muted-foreground">Make your site visible to search engines and public</p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>

          <Button className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Palette className="w-5 h-5" />
            <span>Theme & Appearance</span>
          </CardTitle>
          <CardDescription>Customize your site's look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
              <div className="w-full h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded mb-2"></div>
              <p className="text-sm font-medium">Modern</p>
            </div>
            <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
              <div className="w-full h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded mb-2"></div>
              <p className="text-sm font-medium">Nature</p>
            </div>
            <div className="p-4 border rounded-lg cursor-pointer hover:border-primary">
              <div className="w-full h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded mb-2"></div>
              <p className="text-sm font-medium">Warm</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
