"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/cms/ui/dialog"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import { Label } from "@/components/cms/ui/label"
import { ShoppingBag, Check, AlertCircle, ExternalLink, Info } from "lucide-react"
import { cn } from "@/lib/cms/utils"

const STORAGE_KEY = "page-builder:shopify-settings"

export interface ShopifySettings {
  storeDomain: string
  storefrontAccessToken: string
  apiVersion: string
}

const DEFAULT_SETTINGS: ShopifySettings = {
  storeDomain: "",
  storefrontAccessToken: "",
  apiVersion: "2024-01",
}

export function getShopifySettings(): ShopifySettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS
}

export function saveShopifySettings(settings: ShopifySettings): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function isShopifyConnected(): boolean {
  const settings = getShopifySettings()
  return !!settings.storeDomain && !!settings.storefrontAccessToken
}

interface ShopifySettingsDialogProps {
  children: React.ReactNode
  onSave?: (settings: ShopifySettings) => void
}

export function ShopifySettingsDialog({ children, onSave }: ShopifySettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [settings, setSettings] = useState<ShopifySettings>(DEFAULT_SETTINGS)
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle")
  const [testError, setTestError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSettings(getShopifySettings())
      setTestStatus("idle")
      setTestError(null)
    }
  }, [open])

  const handleSave = () => {
    saveShopifySettings(settings)
    onSave?.(settings)
    setOpen(false)
  }

  const testConnection = async () => {
    if (!settings.storeDomain || !settings.storefrontAccessToken) {
      setTestError("Please fill in all fields")
      setTestStatus("error")
      return
    }

    setTestStatus("testing")
    setTestError(null)

    try {
      // Test the connection by making a simple GraphQL query
      const domain = settings.storeDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")
      const response = await fetch(`https://${domain}/api/${settings.apiVersion}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Storefront-Access-Token": settings.storefrontAccessToken,
        },
        body: JSON.stringify({
          query: `{ shop { name } }`,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.errors) {
        throw new Error(data.errors[0]?.message || "GraphQL error")
      }

      setTestStatus("success")
    } catch (err) {
      setTestStatus("error")
      setTestError(err instanceof Error ? err.message : "Connection failed")
    }
  }

  const isValid = settings.storeDomain && settings.storefrontAccessToken

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md" style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)" }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-green-400" />
            Shopify Connection
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Info banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300">
              Connect your Shopify store to use commerce blocks. You need a{" "}
              <a
                href="https://shopify.dev/docs/api/storefront"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-200"
              >
                Storefront API access token
              </a>.
            </p>
          </div>

          {/* Store Domain */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="store-domain" className="text-xs font-medium">
              Store Domain
            </Label>
            <Input
              id="store-domain"
              value={settings.storeDomain}
              onChange={(e) => setSettings({ ...settings, storeDomain: e.target.value })}
              placeholder="your-store.myshopify.com"
              className="h-9 text-sm bg-input"
            />
            <p className="text-[10px] text-muted-foreground">
              Your Shopify store domain (e.g., your-store.myshopify.com)
            </p>
          </div>

          {/* Storefront Access Token */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="access-token" className="text-xs font-medium">
              Storefront Access Token
            </Label>
            <Input
              id="access-token"
              type="password"
              value={settings.storefrontAccessToken}
              onChange={(e) => setSettings({ ...settings, storefrontAccessToken: e.target.value })}
              placeholder="shpat_xxxxxxxxxxxxxxxxxxxxx"
              className="h-9 text-sm bg-input font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              Found in Shopify Admin &gt; Settings &gt; Apps &gt; Develop apps
            </p>
          </div>

          {/* API Version */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="api-version" className="text-xs font-medium">
              API Version
            </Label>
            <Input
              id="api-version"
              value={settings.apiVersion}
              onChange={(e) => setSettings({ ...settings, apiVersion: e.target.value })}
              placeholder="2024-01"
              className="h-9 text-sm bg-input"
            />
            <p className="text-[10px] text-muted-foreground">
              Storefront API version (default: 2024-01)
            </p>
          </div>

          {/* Test Connection */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={!isValid || testStatus === "testing"}
              className="gap-1.5"
            >
              {testStatus === "testing" ? (
                <>
                  <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>

            {testStatus === "success" && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <Check size={14} />
                Connected successfully
              </span>
            )}

            {testStatus === "error" && testError && (
              <span className="flex items-center gap-1 text-xs text-red-400">
                <AlertCircle size={14} />
                {testError}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isValid}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Indicator component to show Shopify connection status in toolbar
 */
export function ShopifyConnectionStatus() {
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    setConnected(isShopifyConnected())
  }, [])

  return (
    <ShopifySettingsDialog onSave={() => setConnected(isShopifyConnected())}>
      <button
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
          connected
            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20"
            : "bg-muted text-muted-foreground hover:bg-accent"
        )}
        title={connected ? "Shopify connected" : "Connect Shopify store"}
      >
        <ShoppingBag size={12} />
        {connected ? "Connected" : "Connect Shopify"}
      </button>
    </ShopifySettingsDialog>
  )
}
