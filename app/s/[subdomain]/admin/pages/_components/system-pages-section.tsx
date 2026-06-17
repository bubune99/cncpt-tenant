'use client';

/**
 * System Pages Section
 *
 * Admin affordance at the top of /admin/pages that exposes per-tenant
 * customisation of built-in pages (404 today, 500 / maintenance / coming
 * soon as future work). Each row shows whether the tenant is currently on
 * the platform default or a custom version, and lets them:
 *
 *   - Customize  (POST   /api/cms/admin/system-pages/[key])
 *                Creates a draft Page row with sensible defaults, then
 *                redirects to the existing block editor at
 *                /admin/pages/<id>/editor.
 *   - Edit       Same as Customize when a row already exists — redirects
 *                straight to the editor.
 *   - Reset      (DELETE /api/cms/admin/system-pages/[key])
 *                Removes the tenant's custom row so the platform default
 *                renders again.
 *
 * The block editor + storefront wiring already exist; this component is
 * just the on-ramp.
 */

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCMSConfig } from '@/contexts/CMSConfigContext'
import { Button } from '@/components/cms/ui/button'
import {
  Card,
  CardContent,
} from '@/components/cms/ui/card'
import { Badge } from '@/components/cms/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/cms/ui/alert-dialog'
import {
  AlertTriangle,
  ChevronDown,
  Construction,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  ServerCrash,
  ShieldAlert,
} from 'lucide-react'
import { toast } from 'sonner'

type SystemPageKey =
  | 'NOT_FOUND'
  | 'SERVER_ERROR'
  | 'MAINTENANCE'
  | 'COMING_SOON'

interface SystemPageItem {
  key: SystemPageKey
  slug: string
  label: string
  description: string
  defaultTitle: string
  defaultMetaDescription: string
  available: boolean
  customized: {
    id: string
    title: string
    slug: string
    status: 'draft' | 'published' | 'archived'
    hasContent: boolean
    updatedAt: string
    publishedAt: string | null
  } | null
}

const ICONS: Record<SystemPageKey, React.ComponentType<{ className?: string }>> = {
  NOT_FOUND: AlertTriangle,
  SERVER_ERROR: ServerCrash,
  MAINTENANCE: Construction,
  COMING_SOON: ShieldAlert,
}

interface SystemPagesSectionProps {
  /** Called when the page should refresh its main pages list (e.g. after
   *  reset). Optional — section is otherwise self-contained. */
  onChange?: () => void
}

export function SystemPagesSection({ onChange }: SystemPagesSectionProps) {
  const router = useRouter()
  const { buildPath } = useCMSConfig()
  const [items, setItems] = useState<SystemPageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<SystemPageKey | null>(null)
  const [resetTarget, setResetTarget] = useState<SystemPageItem | null>(null)
  const [isResetting, setIsResetting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/cms/admin/system-pages')
      if (!response.ok) throw new Error('Failed to load system pages')
      const data = await response.json()
      setItems(data.items ?? [])
    } catch (error) {
      console.error('Error loading system pages:', error)
      toast.error('Failed to load system pages')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleEditOrCustomize = async (item: SystemPageItem) => {
    if (!item.available) return

    setBusyKey(item.key)
    try {
      const response = await fetch(
        `/api/cms/admin/system-pages/${item.key}`,
        { method: 'POST' }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to open editor')
      }
      const data = await response.json()
      router.push(buildPath(`/admin/pages/${data.id}/editor`))
    } catch (error) {
      console.error('Customize system page error:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to open editor'
      )
    } finally {
      setBusyKey(null)
    }
  }

  const confirmReset = async () => {
    if (!resetTarget) return
    setIsResetting(true)
    try {
      const response = await fetch(
        `/api/cms/admin/system-pages/${resetTarget.key}`,
        { method: 'DELETE' }
      )
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to reset')
      }
      toast.success(`${resetTarget.label} reset to default`)
      await fetchItems()
      onChange?.()
    } catch (error) {
      console.error('Reset system page error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to reset')
    } finally {
      setIsResetting(false)
      setResetTarget(null)
    }
  }

  const stats = useMemo(() => {
    const customizedCount = items.filter((item) => item.customized).length
    return {
      total: items.length,
      customized: customizedCount,
    }
  }, [items])

  return (
    <Card
      className="mb-4 border-amber-500/20"
      data-help-key="admin.pages.system"
      data-tour-id="system-pages-section"
    >
      {/* Compact, collapsed-by-default header bar so it doesn't dominate the
          page or push the real page list below the fold. */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium">System pages</span>
          <span className="text-xs text-muted-foreground truncate">
            404 &amp; built-in pages
            {stats.customized > 0 && ` · ${stats.customized} customized`}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      {expanded && (
      <CardContent className="pt-0">
        <div className="grid gap-3">
          {items.map((item) => {
            const Icon = ICONS[item.key]
            const isBusy = busyKey === item.key
            const isCustom = Boolean(item.customized)
            return (
              <div
                key={item.key}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card"
                data-system-key={item.key}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Icon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{item.label}</span>
                      {isCustom ? (
                        item.customized!.status === 'published' ? (
                          <Badge className="bg-green-500">Customized · Live</Badge>
                        ) : (
                          <Badge variant="secondary">Customized · Draft</Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Default
                        </Badge>
                      )}
                      {!item.available && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Coming soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.available ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleEditOrCustomize(item)}
                        disabled={isBusy}
                        data-action={isCustom ? 'edit' : 'customize'}
                      >
                        {isBusy ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Opening…
                          </>
                        ) : isCustom ? (
                          <>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Customize
                          </>
                        )}
                      </Button>
                      {isCustom && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setResetTarget(item)}
                          disabled={isBusy}
                          data-action="reset"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Coming soon
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
          {!isLoading && items.length === 0 && (
            <div className="text-sm text-muted-foreground py-4 text-center">
              No system pages available.
            </div>
          )}
          {isLoading && items.length === 0 && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
      )}

      <AlertDialog
        open={Boolean(resetTarget)}
        onOpenChange={(open) => !open && setResetTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset to default?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes your customized {resetTarget?.label.toLowerCase()}{' '}
              page. Your custom blocks will be deleted and visitors will see
              the platform default again. You can re-customize at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting…
                </>
              ) : (
                'Reset to default'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
