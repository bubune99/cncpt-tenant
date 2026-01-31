"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Search,
  Plus,
  Download,
  Star,
  Sparkles,
  Loader2,
  LayoutTemplate,
  FileText,
  DollarSign,
  Users,
  Phone,
  AlertCircle,
  Rocket,
} from "lucide-react";
import { V0ImportDialog } from "./V0ImportDialog";

interface SeedTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  isFeatured?: boolean;
  isNew?: boolean;
}

interface SeedTemplatesPanelProps {
  onPageCreated?: (pageId: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  landing: <Rocket className="h-5 w-5" />,
  marketing: <LayoutTemplate className="h-5 w-5" />,
  pricing: <DollarSign className="h-5 w-5" />,
  about: <Users className="h-5 w-5" />,
  contact: <Phone className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
  "coming-soon": <Sparkles className="h-5 w-5" />,
  blog: <FileText className="h-5 w-5" />,
};

export function SeedTemplatesPanel({ onPageCreated }: SeedTemplatesPanelProps) {
  const [templates, setTemplates] = useState<SeedTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create page dialog state
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SeedTemplate | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // V0 import dialog
  const [showV0Dialog, setShowV0Dialog] = useState(false);

  // Fetch templates on mount
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);

        // Fetch categories
        const catRes = await fetch("/api/templates?categories=true");
        const catData = await catRes.json();
        if (catData.categories) {
          setCategories(catData.categories);
        }

        // Fetch all templates
        const templatesRes = await fetch("/api/templates");
        const templatesData = await templatesRes.json();
        if (templatesData.templates) {
          setTemplates(templatesData.templates);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesCategory = !activeCategory || t.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Open create dialog
  const handleSelectTemplate = (template: SeedTemplate) => {
    setSelectedTemplate(template);
    setPageTitle(template.name);
    setPageSlug(generateSlug(template.name));
    setShowCreateDialog(true);
  };

  // Generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleTitleChange = (value: string) => {
    setPageTitle(value);
    setPageSlug(generateSlug(value));
  };

  // Create page from template
  const handleCreatePage = async () => {
    if (!selectedTemplate) return;

    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          title: pageTitle,
          slug: pageSlug,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create page");
      }

      // Notify parent
      if (onPageCreated) {
        onPageCreated(result.page.id);
      }

      // Navigate to editor
      window.location.href = result.page.editorUrl;
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Page Templates</h3>
          <Button size="sm" onClick={() => setShowV0Dialog(true)}>
            <Download className="h-4 w-4 mr-1" />
            Import v0
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          <Button
            size="sm"
            variant={activeCategory === null ? "default" : "ghost"}
            onClick={() => setActiveCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={activeCategory === category ? "default" : "ghost"}
              onClick={() => setActiveCategory(category)}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Templates List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No templates found
            </div>
          ) : (
            filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer group"
                onClick={() => handleSelectTemplate(template)}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                    {categoryIcons[template.category] || <LayoutTemplate className="h-5 w-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{template.name}</h4>
                      {template.isFeatured && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                      {template.isNew && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {template.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTemplate(template);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Create Page Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Page from Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pageTitle">Page Title</Label>
              <Input
                id="pageTitle"
                value={pageTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="My Page"
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pageSlug">Page Slug</Label>
              <Input
                id="pageSlug"
                value={pageSlug}
                onChange={(e) => setPageSlug(e.target.value)}
                placeholder="my-page"
                disabled={isCreating}
              />
              <p className="text-xs text-muted-foreground">
                URL will be: /preview/{pageSlug || "my-page"}
              </p>
            </div>
            {selectedTemplate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedTemplate.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedTemplate.description}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePage} disabled={isCreating || !pageTitle || !pageSlug}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Page"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* V0 Import Dialog */}
      <V0ImportDialog
        open={showV0Dialog}
        onOpenChange={setShowV0Dialog}
        onImport={(template) => {
          console.log("Template imported:", template);
          setShowV0Dialog(false);
        }}
      />
    </div>
  );
}

export default SeedTemplatesPanel;
