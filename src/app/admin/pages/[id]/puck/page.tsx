"use client";

import { useState, useEffect, use } from "react";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import Puck to avoid SSR issues
const Puck = dynamic(
  () => import("@measured/puck").then((mod) => mod.Puck),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    ),
  }
);

// Import Puck styles (required for proper rendering)
import "@measured/puck/puck.css";

// Import Puck AI plugin
import { createAiPlugin } from "@puckeditor/plugin-ai";
import "@puckeditor/plugin-ai/styles.css";

// Create the AI plugin instance
const aiPlugin = createAiPlugin();

// Import the pages Puck configuration
import { pagesPuckConfig } from "@/puck/pages/config";
import type { Data } from "@measured/puck";

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
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puckData, setPuckData] = useState<Data | null>(null);

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

      // Initialize Puck data from saved content or create empty structure
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
      setPuckData(data);
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/pages/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">{page.title}</h1>
            <p className="text-xs text-muted-foreground">
              Visual Editor (Puck) • {page.slug}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/pages/${id}`}>
              Back to Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Puck Editor with AI Plugin */}
      <div className="flex-1 overflow-hidden">
        <Puck
          config={pagesPuckConfig}
          data={puckData}
          onPublish={handleSave}
          plugins={[aiPlugin]}
          headerTitle=""
          headerPath=""
        />
      </div>
    </div>
  );
}
