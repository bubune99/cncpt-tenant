"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, Code, Link } from "lucide-react";

interface V0ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport?: (template: unknown) => void;
}

type ImportMode = "url" | "code";

const categories = [
  { value: "custom", label: "Custom" },
  { value: "landing", label: "Landing" },
  { value: "marketing", label: "Marketing" },
  { value: "pricing", label: "Pricing" },
  { value: "about", label: "About" },
  { value: "contact", label: "Contact" },
  { value: "dashboard", label: "Dashboard" },
  { value: "ecommerce", label: "E-commerce" },
];

export function V0ImportDialog({ open, onOpenChange, onImport }: V0ImportDialogProps) {
  const [mode, setMode] = useState<ImportMode>("code");
  const [url, setUrl] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("custom");
  const [createPage, setCreatePage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleImport = async () => {
    setIsLoading(true);
    setError(null);
    setWarnings([]);

    try {
      const body: Record<string, unknown> = {
        name: name || "Imported Component",
        category,
        createPage,
      };

      if (createPage) {
        if (!slug) {
          setError("Please enter a slug for the page");
          setIsLoading(false);
          return;
        }
        body.slug = slug;
      }

      if (mode === "url") {
        if (!url) {
          setError("Please enter a v0.dev URL");
          setIsLoading(false);
          return;
        }
        body.url = url;
      } else {
        if (!code) {
          setError("Please paste the component code");
          setIsLoading(false);
          return;
        }
        body.code = code;
      }

      const response = await fetch("/api/v0", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || result.errors?.join(", ") || "Import failed");
        setIsLoading(false);
        return;
      }

      if (result.warnings?.length > 0) {
        setWarnings(result.warnings);
      }

      // Call the onImport callback with the template
      if (result.template && onImport) {
        onImport(result.template);
      }

      // If a page was created, navigate to editor
      if (result.page) {
        window.location.href = result.page.editorUrl;
        return;
      }

      // Reset and close
      resetForm();
      onOpenChange(false);
    } catch (err) {
      setError((err as Error).message || "Failed to import");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUrl("");
    setCode("");
    setName("");
    setSlug("");
    setError(null);
    setWarnings([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import from v0
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "code" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("code")}
            >
              <Code className="h-4 w-4 mr-2" />
              Paste Code
            </Button>
            <Button
              type="button"
              variant={mode === "url" ? "default" : "outline"}
              className="flex-1"
              onClick={() => setMode("url")}
            >
              <Link className="h-4 w-4 mr-2" />
              From URL
            </Button>
          </div>

          {/* URL Input */}
          {mode === "url" && (
            <div className="space-y-2">
              <Label htmlFor="url">v0.dev URL</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://v0.dev/t/..."
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Note: URL importing requires the component to be publicly accessible
              </p>
            </div>
          )}

          {/* Code Input */}
          {mode === "code" && (
            <div className="space-y-2">
              <Label htmlFor="code">Component Code (JSX/TSX)</Label>
              <Textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`Paste your v0 component code here...

Example:
export default function Component() {
  return (
    <section className="py-16">
      <h1 className="text-4xl font-bold">...</h1>
    </section>
  )
}`}
                rows={10}
                className="font-mono text-sm"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Component"
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create Page Option */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="createPage"
                checked={createPage}
                onCheckedChange={(checked) => setCreatePage(checked as boolean)}
                disabled={isLoading}
              />
              <Label htmlFor="createPage" className="cursor-pointer">
                Create as new page
              </Label>
            </div>

            {createPage && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="slug">Page Slug</Label>
                <Input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="my-page"
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  URL will be: /preview/{slug || "my-page"}
                </p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert>
              <AlertDescription>
                <strong>Warnings:</strong>
                <ul className="list-disc list-inside mt-1">
                  {warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default V0ImportDialog;
