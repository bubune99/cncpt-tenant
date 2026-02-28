"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { CanvaConnectButton } from "./CanvaConnectButton"
import { CanvaDesignCard, CanvaDesignCardSkeleton } from "./CanvaDesignCard"
import { CanvaImportDialog } from "./CanvaImportDialog"
import { Search, Loader2, RefreshCw } from "lucide-react"
import type { CanvaDesign } from "@/lib/cms/canva/types"
import type { FolderWithRelations } from "@/lib/cms/media/types"

interface CanvaPanelProps {
  folders: FolderWithRelations[]
  onImportComplete: () => void
}

export function CanvaPanel({ folders, onImportComplete }: CanvaPanelProps) {
  const [connected, setConnected] = useState(false)
  const [designs, setDesigns] = useState<CanvaDesign[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [continuation, setContinuation] = useState<string | undefined>()
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [importDesign, setImportDesign] = useState<CanvaDesign | null>(null)
  const [error, setError] = useState("")

  const fetchDesigns = useCallback(
    async (query?: string, cont?: string) => {
      const isLoadMore = !!cont
      if (isLoadMore) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setDesigns([])
      }
      setError("")

      try {
        const params = new URLSearchParams()
        if (query) params.set("query", query)
        if (cont) params.set("continuation", cont)
        params.set("limit", "24")

        const response = await fetch(`/api/canva/designs?${params.toString()}`)
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || "Failed to fetch designs")
        }

        const data = await response.json()

        if (isLoadMore) {
          setDesigns((prev) => [...prev, ...data.items])
        } else {
          setDesigns(data.items || [])
        }

        setContinuation(data.continuation || undefined)
        setHasMore(!!data.continuation)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch designs")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    []
  )

  // Fetch designs when connected
  useEffect(() => {
    if (connected) {
      fetchDesigns()
    }
  }, [connected, fetchDesigns])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchDesigns(searchQuery || undefined)
  }

  function handleLoadMore() {
    if (continuation) {
      fetchDesigns(searchQuery || undefined, continuation)
    }
  }

  function handleStatusChange(isConnected: boolean) {
    setConnected(isConnected)
  }

  // Not connected — show connect prompt
  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
        <div className="rounded-full bg-muted p-4">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-lg">Connect your Canva account</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            Import designs directly from Canva into your media library. Connect
            your account to browse and import designs.
          </p>
        </div>
        <CanvaConnectButton onStatusChange={handleStatusChange} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => fetchDesigns(searchQuery || undefined)}
          title="Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <CanvaConnectButton onStatusChange={handleStatusChange} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => fetchDesigns(searchQuery || undefined)}
            >
              Retry
            </Button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <CanvaDesignCardSkeleton key={i} />
            ))}
          </div>
        ) : designs.length === 0 && !error ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">
              {searchQuery
                ? "No designs found matching your search"
                : "No designs found in your Canva account"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {designs.map((design) => (
                <CanvaDesignCard
                  key={design.id}
                  design={design}
                  onImport={setImportDesign}
                />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Import Dialog */}
      <CanvaImportDialog
        design={importDesign}
        open={!!importDesign}
        folders={folders}
        onClose={() => setImportDesign(null)}
        onImportComplete={() => {
          setImportDesign(null)
          onImportComplete()
        }}
      />
    </div>
  )
}
