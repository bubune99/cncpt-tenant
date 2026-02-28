'use client'

/**
 * Admin Dashboard Theme Settings
 *
 * Visual editor for customizing the customer-facing dashboard theme.
 * Persists settings via PUT /api/settings with group 'dashboard.theme'.
 */

import { useState, useEffect } from 'react'
import {
  Palette,
  Check,
  Loader2,
  ArrowLeft,
  Sun,
  Moon,
  Square,
  RectangleHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types (mirrored from lib/cms/dashboard/theme.ts to avoid server import)
// ---------------------------------------------------------------------------

interface DashboardTheme {
  primaryColor: string
  accentColor: string
  backgroundColor: string
  cardStyle: 'flat' | 'bordered' | 'elevated' | 'glass'
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  fontFamily?: string
  darkMode: boolean
}

const DEFAULT_THEME: DashboardTheme = {
  primaryColor: '#0066cc',
  accentColor: '#6366f1',
  backgroundColor: '#f9fafb',
  cardStyle: 'bordered',
  borderRadius: 'md',
  darkMode: false,
}

// ---------------------------------------------------------------------------
// Card style preview configs
// ---------------------------------------------------------------------------

const CARD_STYLES: { value: DashboardTheme['cardStyle']; label: string; description: string }[] = [
  { value: 'flat', label: 'Flat', description: 'No border, no shadow' },
  { value: 'bordered', label: 'Bordered', description: 'Subtle border' },
  { value: 'elevated', label: 'Elevated', description: 'Drop shadow' },
  { value: 'glass', label: 'Glass', description: 'Frosted glass effect' },
]

const CARD_STYLE_CLASSES: Record<DashboardTheme['cardStyle'], string> = {
  flat: 'bg-gray-50',
  bordered: 'border border-gray-200 bg-white',
  elevated: 'bg-white shadow-md',
  glass: 'bg-white/70 backdrop-blur-md border border-white/20 shadow-lg',
}

const BORDER_RADIUS_OPTIONS: { value: DashboardTheme['borderRadius']; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'xl', label: 'Extra Large' },
]

const RADIUS_CLASSES: Record<DashboardTheme['borderRadius'], string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function DashboardSettingsPage() {
  const [theme, setTheme] = useState<DashboardTheme>(DEFAULT_THEME)
  const [savedTheme, setSavedTheme] = useState<DashboardTheme>(DEFAULT_THEME)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(savedTheme)

  // Load theme on mount
  useEffect(() => {
    loadTheme()
  }, [])

  const loadTheme = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/cms/settings?group=dashboard.theme')
      if (res.ok) {
        const data = await res.json()
        const loaded = data['dashboard.theme']
        if (loaded && typeof loaded === 'object') {
          const merged = { ...DEFAULT_THEME, ...loaded }
          setTheme(merged)
          setSavedTheme(merged)
        }
      }
    } catch (error) {
      console.error('Failed to load dashboard theme:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: 'dashboard',
          settings: { theme: theme },
        }),
      })

      if (res.ok) {
        setSavedTheme({ ...theme })
        toast.success('Dashboard theme saved')
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast.error('Failed to save dashboard theme')
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateTheme = <K extends keyof DashboardTheme>(key: K, value: DashboardTheme[K]) => {
    setTheme((prev) => ({ ...prev, [key]: value }))
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/admin/settings" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-3xl font-bold">Dashboard Theme</h1>
        </div>
        <p className="text-muted-foreground">
          Customize the look and feel of the customer dashboard
        </p>
      </div>

      <div className="space-y-6">
        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Colors
            </CardTitle>
            <CardDescription>
              Set the primary and accent colors for the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme('primaryColor', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-200 p-1"
                  />
                  <Input
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme('primaryColor', e.target.value)}
                    className="font-mono text-sm"
                    placeholder="#0066cc"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="accentColor"
                    value={theme.accentColor}
                    onChange={(e) => updateTheme('accentColor', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-200 p-1"
                  />
                  <Input
                    value={theme.accentColor}
                    onChange={(e) => updateTheme('accentColor', e.target.value)}
                    className="font-mono text-sm"
                    placeholder="#6366f1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="backgroundColor"
                    value={theme.backgroundColor}
                    onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-gray-200 p-1"
                  />
                  <Input
                    value={theme.backgroundColor}
                    onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                    className="font-mono text-sm"
                    placeholder="#f9fafb"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Style */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Square className="h-5 w-5" />
              Card Style
            </CardTitle>
            <CardDescription>
              Choose how cards appear on the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {CARD_STYLES.map((style) => {
                const isSelected = theme.cardStyle === style.value
                return (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => updateTheme('cardStyle', style.value)}
                    className={`relative p-4 text-left transition-all ${RADIUS_CLASSES[theme.borderRadius]} ${CARD_STYLE_CLASSES[style.value]} ${
                      isSelected
                        ? 'ring-2 ring-offset-2'
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    style={isSelected ? { ringColor: theme.primaryColor } as React.CSSProperties : undefined}
                  >
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-white"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                    <div className="text-sm font-medium">{style.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{style.description}</div>
                    {/* Mini preview */}
                    <div className="mt-3 space-y-1.5">
                      <div className="h-2 rounded-full bg-gray-200 w-full" />
                      <div className="h-2 rounded-full bg-gray-200 w-3/4" />
                      <div className="h-2 rounded-full bg-gray-200 w-1/2" />
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Border Radius */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RectangleHorizontal className="h-5 w-5" />
              Border Radius
            </CardTitle>
            <CardDescription>
              Set the corner rounding for cards and elements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {BORDER_RADIUS_OPTIONS.map((opt) => {
                const isSelected = theme.borderRadius === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateTheme('borderRadius', opt.value)}
                    className={`flex items-center gap-2 px-4 py-2 border transition-colors ${RADIUS_CLASSES[opt.value]} ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className={`h-6 w-6 border-2 ${RADIUS_CLASSES[opt.value]} ${
                        isSelected ? 'border-blue-500' : 'border-gray-300'
                      }`}
                    />
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dark Mode & Font */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  {theme.darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable dark mode for the customer dashboard
                </p>
              </div>
              <Switch
                checked={theme.darkMode}
                onCheckedChange={(checked) => updateTheme('darkMode', checked)}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="fontFamily">Custom Font Family</Label>
              <Select
                value={theme.fontFamily || '__default'}
                onValueChange={(value) =>
                  updateTheme('fontFamily', value === '__default' ? undefined : value)
                }
              >
                <SelectTrigger id="fontFamily">
                  <SelectValue placeholder="System default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__default">System Default</SelectItem>
                  <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                  <SelectItem value="'DM Sans', sans-serif">DM Sans</SelectItem>
                  <SelectItem value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</SelectItem>
                  <SelectItem value="'Space Grotesk', sans-serif">Space Grotesk</SelectItem>
                  <SelectItem value="Georgia, serif">Georgia (Serif)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose a font for the customer dashboard. Ensure the font is loaded via your site styles.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Live preview of the dashboard card style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="p-6 rounded-lg"
              style={{
                backgroundColor: theme.backgroundColor,
                fontFamily: theme.fontFamily || undefined,
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Welcome card preview */}
                <div
                  className={`p-4 ${RADIUS_CLASSES[theme.borderRadius]}`}
                  style={{
                    background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.accentColor})`,
                    color: 'white',
                  }}
                >
                  <h3 className="font-semibold">Welcome back</h3>
                  <p className="text-sm opacity-80 mt-1">Here is your account summary</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="bg-white/10 rounded p-2 backdrop-blur-sm">
                      <p className="text-xs opacity-80">Orders</p>
                      <p className="font-semibold">12</p>
                    </div>
                    <div className="bg-white/10 rounded p-2 backdrop-blur-sm">
                      <p className="text-xs opacity-80">Spent</p>
                      <p className="font-semibold">$432</p>
                    </div>
                  </div>
                </div>

                {/* Info card preview */}
                <div
                  className={`p-4 ${RADIUS_CLASSES[theme.borderRadius]} ${CARD_STYLE_CLASSES[theme.cardStyle]}`}
                >
                  <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {['Orders', 'Profile', 'Addresses', 'Settings'].map((label) => (
                      <div
                        key={label}
                        className={`p-2 text-center text-sm border border-gray-100 ${RADIUS_CLASSES[theme.borderRadius]} hover:bg-gray-50`}
                      >
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Bar */}
      <div className="mt-8 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setTheme({ ...savedTheme })
          }}
          disabled={!hasChanges || isSaving}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Save Theme
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
