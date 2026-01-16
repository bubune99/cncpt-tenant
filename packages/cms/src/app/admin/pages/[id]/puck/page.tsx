"use client";

import { useState, useEffect, use } from "react";
import { Loader2, LayoutTemplate, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Data } from "@measured/puck";

// Import Puck AI plugin
import { createAiPlugin } from "@puckeditor/plugin-ai";
import "@puckeditor/plugin-ai/styles.css";

// Create the AI plugin instance
const aiPlugin = createAiPlugin();

// Import the pages Puck configuration
import { pagesPuckConfig } from "@/puck/pages/config";

// Import the new professional builder
import { PuckBuilder } from "@/puck/components/builder";

// Import template components
import { SaveAsTemplateDialog } from "@/puck/components";

interface Page {
  id: string;
  title: string;
  slug: string;
  status: string;
  content: Data | null;
}

export default function PagePuckEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puckData, setPuckData] = useState<Data | null>(null);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);

  useEffect(() => {
    fetchPage();
  }, [id]);

  const fetchPage = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/pages/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Page not found");
          return;
        }
        throw new Error("Failed to fetch page");
      }

      const pageData = await response.json();
      setPage(pageData);
      setPuckData(
        pageData.content || {
          root: { props: {} },
          content: [],
          zones: {},
        }
      );
    } catch (error) {
      console.error("Error fetching page:", error);
      setError("Failed to load page");
      toast.error("Failed to load page");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Data) => {
    setIsSaving(true);
    setPuckData(data);

    try {
      const response = await fetch(`/api/admin/pages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save page");
      }

      toast.success("Page saved successfully");
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save page");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold mb-2">{error || "Page not found"}</h2>
        <p className="text-muted-foreground mb-4">
          The page you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
        </p>
        <Button asChild>
          <Link href="/admin/pages">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pages
          </Link>
        </Button>
      </div>
    );
  }

  if (!puckData) {
    return null;
  }

  return (
    <PuckBuilder
      config={pagesPuckConfig}
      data={puckData}
      onPublish={handleSave}
      plugins={[aiPlugin]}
      page={{
        id: page.id,
        name: page.title,
        slug: page.slug,
      }}
      onBack={() => router.push("/admin/pages")}
      headerActions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSaveTemplateDialog(true)}
        >
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Save as Template
        </Button>
      }
    >
      {/* Save as Template Dialog */}
      <SaveAsTemplateDialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
        currentConfig="pages"
        currentData={puckData}
        onSaved={() => {
          toast.success("Template saved");
        }}
      />
    </PuckBuilder>
  );
}
