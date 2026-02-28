"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Star, Trash2, Loader2, LayoutTemplate } from "lucide-react"
import { Button } from "@/components/cms/ui/button"
import { Badge } from "@/components/cms/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/cms/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/cms/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/cms/ui/alert-dialog"
import { toast } from "sonner"
import { usePartials } from "@/lib/cms/api/domains/partials"
import { partialsClient } from "@/lib/cms/api/domains/partials"
import { routes } from "@/lib/cms/api/routes"
import type { PartialCategory } from "@/lib/cms/api/domains/partials"
import { useSearchParams } from "next/navigation"

const CATEGORY_LABELS: Record<string, string> = {
  header: "Header",
  footer: "Footer",
  announcement: "Announcement",
  sidebar: "Sidebar",
  section: "Section",
}

const CATEGORY_COLORS: Record<string, string> = {
  header: "bg-blue-500/10 text-blue-600",
  footer: "bg-purple-500/10 text-purple-600",
  announcement: "bg-amber-500/10 text-amber-600",
  sidebar: "bg-green-500/10 text-green-600",
  section: "bg-gray-500/10 text-gray-600",
}

export default function PartialsListPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category") as PartialCategory | null
  const [categoryFilter, setCategoryFilter] = useState<string>(initialCategory || "all")
  const router = useRouter()

  const params = categoryFilter !== "all" ? { category: categoryFilter as PartialCategory } : undefined
  const { data: partials, isLoading, mutate } = usePartials(params)

  const handleSetDefault = async (id: string) => {
    try {
      await partialsClient.setDefault(id)
      toast.success("Partial set as default")
      mutate()
    } catch {
      toast.error("Failed to set default")
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await partialsClient.delete(id)
      toast.success("Partial deleted")
      mutate()
    } catch {
      toast.error("Failed to delete partial")
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Partials</h1>
          <p className="text-muted-foreground mt-1">
            Reusable block compositions for headers, footers, sidebars, and more.
          </p>
        </div>
        <Button asChild>
          <Link href={routes.admin.partials.new(categoryFilter !== "all" ? categoryFilter : undefined)}>
            <Plus className="h-4 w-4 mr-2" />
            New Partial
          </Link>
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4 mb-6">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="header">Headers</SelectItem>
            <SelectItem value="footer">Footers</SelectItem>
            <SelectItem value="announcement">Announcements</SelectItem>
            <SelectItem value="sidebar">Sidebars</SelectItem>
            <SelectItem value="section">Sections</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !partials || partials.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutTemplate className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No partials yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create reusable header, footer, and section templates using the block editor.
            </p>
            <Button asChild>
              <Link href={routes.admin.partials.new(categoryFilter !== "all" ? categoryFilter : undefined)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first partial
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partials.map((partial) => (
            <Card key={partial.id} className="group relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{partial.name}</CardTitle>
                    {partial.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {partial.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <Badge
                      variant="secondary"
                      className={CATEGORY_COLORS[partial.category] || ""}
                    >
                      {CATEGORY_LABELS[partial.category] || partial.category}
                    </Badge>
                    {partial.isDefault && (
                      <Badge variant="outline" className="border-amber-400 text-amber-600">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Thumbnail preview */}
                {partial.thumbnail ? (
                  <div className="aspect-[16/9] rounded-md overflow-hidden border mb-3">
                    <img
                      src={partial.thumbnail}
                      alt={partial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/9] rounded-md border bg-muted/50 flex items-center justify-center mb-3">
                    <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <Badge variant={partial.status === "published" ? "default" : "secondary"}>
                    {partial.status}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {!partial.isDefault && partial.status === "published" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(partial.id)}
                        title="Set as Default"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(routes.admin.partials.editor(partial.id))}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" title="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete partial?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete &ldquo;{partial.name}&rdquo;. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(partial.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
