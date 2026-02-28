"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/cms/ui/button"
import { Input } from "@/components/cms/ui/input"
import { Label } from "@/components/cms/ui/label"
import { Textarea } from "@/components/cms/ui/textarea"
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
import { useCreatePartial, usePartialFormDefaults } from "@/lib/cms/api/domains/partials"
import { routes } from "@/lib/cms/api/routes"
import type { PartialCategory } from "@/lib/cms/api/domains/partials"

export default function NewPartialPage() {
  const searchParams = useSearchParams()
  const initialCategory = (searchParams.get("category") as PartialCategory) || "section"

  const { formData, setField, handleNameChange } = usePartialFormDefaults({
    category: initialCategory,
  })
  const createPartial = useCreatePartial()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createPartial.mutate(formData)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href={routes.admin.partials.list}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Partial</h1>
          <p className="text-muted-foreground">Create a reusable block composition</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Partial Details</CardTitle>
            <CardDescription>
              Define the basic info for your partial. You&apos;ll design it in the block editor next.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Modern Navbar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setField("slug", e.target.value)}
                placeholder="modern-navbar"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => setField("category", v as PartialCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="announcement">Announcement Bar</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="section">Section</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="A brief description of this partial"
                rows={2}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={createPartial.isSubmitting}>
                {createPartial.isSubmitting ? "Creating..." : "Create & Open Editor"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
