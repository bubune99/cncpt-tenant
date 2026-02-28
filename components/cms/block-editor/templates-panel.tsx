"use client"

import { useState, useMemo } from "react"
import { useEditor } from "@/lib/cms/block-editor/editor-context"
import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/cms/block-editor/page-templates"
import { Button } from "@/components/cms/ui/button"
import { ScrollArea } from "@/components/cms/ui/scroll-area"
import { Input } from "@/components/cms/ui/input"
import {
  LayoutTemplate,
  Search,
  Plus,
  Replace,
  Layout,
  Columns,
  Type,
  ChevronRight,
  Trash2,
  User,
  MoreVertical,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/cms/ui/dropdown-menu"
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
import { cn } from "@/lib/cms/utils"
import { 
  getCustomTemplates, 
  deleteCustomTemplate, 
  type CustomTemplate 
} from "@/lib/cms/block-editor/storage"
import { generateId } from "@/lib/cms/block-editor/tree-utils"

const CATEGORY_LABELS: Record<PageTemplate["category"], string> = {
  header: "Headers",
  section: "Sections",
  page: "Full Pages",
  landing: "Landing Pages",
  component: "Components",
  footer: "Footers",
}

const CATEGORY_ICONS: Record<PageTemplate["category"], React.ReactNode> = {
  header: <Layout size={12} />,
  section: <Columns size={12} />,
  page: <Type size={12} />,
  landing: <Layout size={12} />,
  component: <Columns size={12} />,
  footer: <Type size={12} />,
}

const CATEGORY_ORDER: PageTemplate["category"][] = ["header", "section", "page", "landing", "component", "footer"]

export function TemplatesPanel() {
  const { setBlocks, state } = useEditor()
  const [search, setSearch] = useState("")
  const [expandedCategory, setExpandedCategory] = useState<string | null>("section")
  const [showMyTemplates, setShowMyTemplates] = useState(true)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Get custom templates
  const customTemplates = useMemo(() => getCustomTemplates(), [state.blocks])

  const filteredTemplates = PAGE_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  )

  const filteredCustomTemplates = customTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.description?.toLowerCase() || "").includes(search.toLowerCase())
  )

  const groupedTemplates = filteredTemplates.reduce(
    (acc, t) => {
      if (!acc[t.category]) acc[t.category] = []
      acc[t.category].push(t)
      return acc
    },
    {} as Record<string, PageTemplate[]>
  )

  const handleReplace = (template: PageTemplate) => {
    const blocks = template.blocks()
    setBlocks(blocks)
  }

  const handleAdd = (template: PageTemplate) => {
    const blocks = template.blocks()
    // Append to existing blocks
    setBlocks([...state.blocks, ...blocks])
  }

  const handleCustomReplace = (template: CustomTemplate) => {
    // Deep clone and regenerate IDs to avoid conflicts
    const clonedBlocks = JSON.parse(JSON.stringify(template.blocks))
    const regenerateIds = (blocks: typeof clonedBlocks): typeof clonedBlocks => {
      return blocks.map((block: typeof clonedBlocks[0]) => ({
        ...block,
        id: generateId(),
        children: block.children ? regenerateIds(block.children) : undefined,
      }))
    }
    setBlocks(regenerateIds(clonedBlocks))
  }

  const handleCustomAdd = (template: CustomTemplate) => {
    const clonedBlocks = JSON.parse(JSON.stringify(template.blocks))
    const regenerateIds = (blocks: typeof clonedBlocks): typeof clonedBlocks => {
      return blocks.map((block: typeof clonedBlocks[0]) => ({
        ...block,
        id: generateId(),
        children: block.children ? regenerateIds(block.children) : undefined,
      }))
    }
    setBlocks([...state.blocks, ...regenerateIds(clonedBlocks)])
  }

  const handleDeleteCustomTemplate = () => {
    if (deleteConfirmId) {
      deleteCustomTemplate(deleteConfirmId)
      setDeleteConfirmId(null)
    }
  }

  return (
    <div className="w-64 border-r flex flex-col bg-card" style={{ borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: "var(--border)" }}>
        <LayoutTemplate size={16} className="text-primary" />
        <span className="font-semibold text-sm text-foreground">Templates</span>
      </div>

      {/* Search */}
      <div className="p-2 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="h-8 pl-8 text-xs bg-input"
          />
        </div>
      </div>

      {/* Templates List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* My Templates Section */}
          {(filteredCustomTemplates.length > 0 || !search) && (
            <div>
              <button
                onClick={() => setShowMyTemplates(!showMyTemplates)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left transition-colors"
              >
                <ChevronRight
                  size={12}
                  className={cn(
                    "text-muted-foreground transition-transform",
                    showMyTemplates && "rotate-90"
                  )}
                />
                <User size={12} />
                <span className="text-xs font-medium text-foreground flex-1">
                  My Templates
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {customTemplates.length}
                </span>
              </button>

              {showMyTemplates && (
                <div className="ml-4 mt-1 space-y-1">
                  {filteredCustomTemplates.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground px-2 py-2">
                      {search ? "No matching templates" : "Save your first template from the toolbar"}
                    </p>
                  ) : (
                    filteredCustomTemplates.map((template) => (
                      <CustomTemplateCard
                        key={template.id}
                        template={template}
                        onReplace={() => handleCustomReplace(template)}
                        onAdd={() => handleCustomAdd(template)}
                        onDelete={() => setDeleteConfirmId(template.id)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Built-in Templates */}
          {CATEGORY_ORDER.filter(cat => groupedTemplates[cat]).map((category) => (
            <div key={category}>
              {/* Category Header */}
              <button
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left transition-colors"
              >
                <ChevronRight
                  size={12}
                  className={cn(
                    "text-muted-foreground transition-transform",
                    expandedCategory === category && "rotate-90"
                  )}
                />
                {CATEGORY_ICONS[category]}
                <span className="text-xs font-medium text-foreground flex-1">
                  {CATEGORY_LABELS[category]}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {groupedTemplates[category].length}
                </span>
              </button>

              {/* Templates in Category */}
              {expandedCategory === category && (
                <div className="ml-4 mt-1 space-y-1">
                  {groupedTemplates[category].map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onReplace={() => handleReplace(template)}
                      onAdd={() => handleAdd(template)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <LayoutTemplate size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No templates found</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="p-2 border-t text-[10px] text-muted-foreground text-center" style={{ borderColor: "var(--border)" }}>
        Click to preview, use buttons to add or replace
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomTemplate} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CustomTemplateCard({
  template,
  onReplace,
  onAdd,
  onDelete,
}: {
  template: CustomTemplate
  onReplace: () => void
  onAdd: () => void
  onDelete: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "relative rounded-lg border p-3 transition-all cursor-pointer",
        "hover:border-primary/50 hover:bg-accent/50",
        "border-border bg-background"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <span className="text-xs font-medium text-foreground">{template.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent text-muted-foreground"
                style={{ opacity: isHovered ? 1 : 0 }}
              >
                <MoreVertical size={12} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 size={12} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {template.description && (
          <span className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
            {template.description}
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/60 capitalize">
          {template.category}
        </span>
      </div>

      {/* Action buttons on hover */}
      {isHovered && (
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            title="Add to page"
          >
            <Plus size={12} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onReplace()
            }}
            title="Replace page"
          >
            <Replace size={12} />
          </Button>
        </div>
      )}
    </div>
  )
}

function TemplateCard({
  template,
  onReplace,
  onAdd,
}: {
  template: PageTemplate
  onReplace: () => void
  onAdd: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        "relative rounded-lg border p-3 transition-all cursor-pointer",
        "hover:border-primary/50 hover:bg-accent/50",
        "border-border bg-background"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-foreground">{template.name}</span>
        <span className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
          {template.description}
        </span>
      </div>

      {/* Action buttons on hover */}
      {isHovered && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            title="Add to page"
          >
            <Plus size={12} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation()
              onReplace()
            }}
            title="Replace page"
          >
            <Replace size={12} />
          </Button>
        </div>
      )}
    </div>
  )
}
