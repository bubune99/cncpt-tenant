"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import { ScrollArea } from "@/components/cms/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/cms/ui/alert-dialog"
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Globe,
  Clock,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cms/ui/dropdown-menu"
import { cn } from "@/lib/cms/utils"
import type { SavedPage } from "@/lib/cms/block-editor/storage"
import { formatDistanceToNow } from "date-fns"

export function PagesPanel() {
  const { getPages, loadPage, newPage, deletePage, state } = useEditor()
  const [search, setSearch] = useState("")
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [pages, setPages] = useState<SavedPage[]>([])

  // Fetch pages from API
  const refreshPages = useCallback(async () => {
    const result = await getPages()
    setPages(result)
  }, [getPages])

  useEffect(() => {
    refreshPages()
  }, [refreshPages, state.currentPage?.id, state.currentPage?.status])

  const filteredPages = useMemo(() => {
    if (!search.trim()) return pages
    const q = search.toLowerCase()
    return pages.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
    )
  }, [pages, search])

  const handleDelete = async () => {
    if (deleteConfirmId) {
      await deletePage(deleteConfirmId)
      setDeleteConfirmId(null)
      refreshPages()
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return "Unknown"
    }
  }

  return (
    <div className="w-64 border-r flex flex-col bg-card" style={{ borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          <span className="font-semibold text-sm text-foreground">Pages</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={() => newPage()}
          title="New Page"
        >
          <Plus size={14} />
        </Button>
      </div>

      {/* Search */}
      <div className="p-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages..."
            className="h-8 pl-8 text-xs bg-input"
          />
        </div>
      </div>

      {/* Pages List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">
                {search ? "No pages found" : "No saved pages"}
              </p>
              {!search && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => newPage()}
                  className="mt-2 text-xs"
                >
                  Create your first page
                </Button>
              )}
            </div>
          ) : (
            filteredPages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                isActive={state.currentPage?.id === page.id}
                onSelect={() => loadPage(page.id)}
                onDelete={() => setDeleteConfirmId(page.id)}
                formatDate={formatDate}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PageCard({
  page,
  isActive,
  onSelect,
  onDelete,
  formatDate,
}: {
  page: SavedPage
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  formatDate: (date: string) => string
}) {
  return (
    <div
      className={cn(
        "group relative rounded-lg border p-3 transition-all cursor-pointer",
        "hover:border-primary/50 hover:bg-accent/50",
        isActive 
          ? "border-primary bg-primary/5" 
          : "border-border bg-background"
      )}
      onClick={onSelect}
    >
      <div className="flex flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-foreground line-clamp-1 flex-1">
            {page.title}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground transition-opacity">
                <MoreVertical size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-destructive"
              >
                <Trash2 size={12} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {page.status === "published" ? (
            <span className="flex items-center gap-1 text-green-600">
              <Globe size={10} />
              Published
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Clock size={10} />
              Draft
            </span>
          )}
          <span className="opacity-60">|</span>
          <span>{formatDate(page.updatedAt)}</span>
        </div>
        
        <span className="text-[10px] font-mono text-muted-foreground/60 truncate">
          /pages/{page.slug}
        </span>
      </div>
    </div>
  )
}
