"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/cms/ui/dialog"
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
import { LayoutTemplate, Save } from "lucide-react"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { 
  saveCustomTemplate, 
  generateId, 
  type CustomTemplate 
} from "@/lib/cms/block-editor/storage"
import { toast } from "sonner"

const TEMPLATE_CATEGORIES = [
  { value: "header", label: "Header" },
  { value: "section", label: "Section" },
  { value: "page", label: "Full Page" },
  { value: "landing", label: "Landing Page" },
  { value: "component", label: "Component" },
  { value: "footer", label: "Footer" },
  { value: "other", label: "Other" },
]

interface SaveTemplateDialogProps {
  children: React.ReactNode
}

export function SaveTemplateDialog({ children }: SaveTemplateDialogProps) {
  const { state } = useEditor()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [category, setCategory] = useState("section")
  const [description, setDescription] = useState("")

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a template name")
      return
    }

    if (state.blocks.length === 0) {
      toast.error("No blocks to save")
      return
    }

    const template: CustomTemplate = {
      id: generateId(),
      name: name.trim(),
      category,
      description: description.trim() || undefined,
      blocks: JSON.parse(JSON.stringify(state.blocks)), // Deep clone
      createdAt: new Date().toISOString(),
    }

    saveCustomTemplate(template)
    toast.success("Template saved!", {
      description: `"${name}" has been added to your templates.`,
    })

    // Reset form
    setName("")
    setDescription("")
    setCategory("section")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate size={18} />
            Save as Template
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Hero Section"
              className="h-9"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="template-description">Description (optional)</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A modern hero section with gradient background..."
              className="h-20 resize-none text-sm"
            />
          </div>

          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              This will save all {state.blocks.length} block{state.blocks.length !== 1 ? "s" : ""} currently on the canvas as a reusable template.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim() || state.blocks.length === 0}>
            <Save size={14} className="mr-1.5" />
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
