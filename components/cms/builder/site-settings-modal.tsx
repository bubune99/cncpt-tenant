"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/cms/ui/dialog"
import { Button } from '@/components/cms/ui/button"
import { Input } from '@/components/cms/ui/input"
import { Label } from '@/components/cms/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/cms/ui/tabs"
import { Switch } from '@/components/cms/ui/switch"
import { Textarea } from '@/components/cms/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/cms/ui/select"
import { Globe, Palette, Code, Search, Share2, Shield, Database, Zap } from "lucide-react"

interface SiteSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SiteSettingsModal({ isOpen, onClose }: SiteSettingsModalProps) {
  const [siteName, setSiteName] = useState("My Website")
  const [siteUrl, setSiteUrl] = useState("https://mywebsite.com")
  const [siteDescription, setSiteDescription] = useState("A modern website built with our page builder")

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Site Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
            <TabsTrigger value="general" className="flex flex-col gap-1 py-2 px-3 h-auto">
              <Globe className="w-4 h-4" />
              <span className="text-xs">General</span>
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex flex-col gap-1 py-2 px-3 h-auto">
              <Palette className="w-4 h-4" />
              <span className="text-xs">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex flex-col gap-1 py-2 px-3 h-auto">
              <Search className="w-4 h-4" />
              <span className="text-xs">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex flex-col gap-1 py-2 px-3 h-auto">
              <Share2 className="w-4 h-4" />
              <span className="text-xs">Social</span>
            </TabsTrigger>
            <TabsTrigger value="code" className="flex flex-col gap-1 py-2 px-3 h-auto">
              <Code className="w-4 h-4" />
              <span className="text-xs">Code</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex flex-col gap-1 py-2 px-3 h-auto">
              <Shield className="w-4 h-4" />
              <span className="text-xs">Security</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex flex-col gap-1 py-2 px-3 h-auto">
              <Database className="w-4 h-4" />
              <span className="text-xs">Data</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex flex-col gap-1 py-2 px-3 h-auto">
              <Zap className="w-4 h-4" />
              <span className="text-xs">Speed</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="general" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="Enter your site name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site URL</Label>
                  <Input
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Site Description</Label>
                  <Textarea
                    value={siteDescription}
                    onChange={(e) => setSiteDescription(e.target.value)}
                    placeholder="Describe your website"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                      <SelectItem value="gmt">GMT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="branding" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG or SVG (max. 2MB)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Upload favicon (32x32px)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary border border-border" />
                    <Input defaultValue="#3b82f6" className="flex-1" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <div className="w-10 h-10 rounded-lg bg-secondary border border-border" />
                    <Input defaultValue="#64748b" className="flex-1" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input placeholder="Page title for search engines" />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea placeholder="Brief description for search results" rows={3} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Search Engine Indexing</Label>
                    <p className="text-xs text-muted-foreground">Let search engines index your site</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Generate Sitemap</Label>
                    <p className="text-xs text-muted-foreground">Auto-generate XML sitemap</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Open Graph Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">Upload image for social sharing (1200x630px)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Twitter Handle</Label>
                  <Input placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <Label>Facebook Page</Label>
                  <Input placeholder="https://facebook.com/yourpage" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Head Code</Label>
                  <p className="text-xs text-muted-foreground">Add custom code to the {"<head>"} section</p>
                  <Textarea placeholder="<!-- Your code here -->" rows={4} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Body Start Code</Label>
                  <p className="text-xs text-muted-foreground">Add code right after {"<body>"} tag</p>
                  <Textarea placeholder="<!-- Your code here -->" rows={4} className="font-mono text-sm" />
                </div>
                <div className="space-y-2">
                  <Label>Body End Code</Label>
                  <p className="text-xs text-muted-foreground">Add code before {"</body>"} tag</p>
                  <Textarea placeholder="<!-- Your code here -->" rows={4} className="font-mono text-sm" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>SSL Certificate</Label>
                    <p className="text-xs text-muted-foreground">Force HTTPS connections</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Password Protection</Label>
                    <p className="text-xs text-muted-foreground">Require password to view site</p>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Allowed IP Addresses</Label>
                  <Textarea placeholder="One IP per line" rows={3} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="data" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-medium mb-2">Export Site Data</h4>
                  <p className="text-sm text-muted-foreground mb-4">Download all your site data as a JSON file</p>
                  <Button variant="outline" size="sm">
                    Export Data
                  </Button>
                </div>
                <div className="p-4 bg-secondary rounded-lg">
                  <h4 className="font-medium mb-2">Import Site Data</h4>
                  <p className="text-sm text-muted-foreground mb-4">Restore from a previously exported file</p>
                  <Button variant="outline" size="sm">
                    Import Data
                  </Button>
                </div>
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">Danger Zone</h4>
                  <p className="text-sm text-muted-foreground mb-4">Permanently delete all site data</p>
                  <Button variant="destructive" size="sm">
                    Delete All Data
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lazy Load Images</Label>
                    <p className="text-xs text-muted-foreground">Load images as they scroll into view</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Minify CSS/JS</Label>
                    <p className="text-xs text-muted-foreground">Compress code for faster loading</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Browser Caching</Label>
                    <p className="text-xs text-muted-foreground">Cache static assets in browser</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>CDN Enabled</Label>
                    <p className="text-xs text-muted-foreground">Serve assets from global CDN</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
