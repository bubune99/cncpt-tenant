"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "../../ui/card"
import { Button } from "../../ui/button"
import { Skeleton } from "../../ui/skeleton"
import { Download, ExternalLink } from "lucide-react"
import type { CanvaDesign } from "@/lib/cms/canva/types"

interface CanvaDesignCardProps {
  design: CanvaDesign
  onImport: (design: CanvaDesign) => void
}

export function CanvaDesignCard({ design, onImport }: CanvaDesignCardProps) {
  const [thumbnailError, setThumbnailError] = useState(false)

  const formattedDate = new Date(design.updated_at * 1000).toLocaleDateString(
    undefined,
    { month: "short", day: "numeric", year: "numeric" }
  )

  return (
    <Card className="group overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer">
      {/* Thumbnail */}
      <div
        className="relative aspect-[4/3] bg-muted overflow-hidden"
        onClick={() => onImport(design)}
      >
        {design.thumbnail && !thumbnailError ? (
          <img
            src={design.thumbnail.url}
            alt={design.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={() => setThumbnailError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            No preview
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button size="sm" variant="secondary" className="gap-2">
            <Download className="h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Info */}
      <CardContent className="p-3">
        <p className="text-sm font-medium truncate" title={design.title}>
          {design.title || "Untitled Design"}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-muted-foreground">{formattedDate}</p>
          <a
            href={design.urls.edit_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}

export function CanvaDesignCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full" />
      <CardContent className="p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3 mt-2" />
      </CardContent>
    </Card>
  )
}
