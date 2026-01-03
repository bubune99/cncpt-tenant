"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
// Uses /api/puck/* catch-all route via @puckeditor/cloud-client
const aiPlugin = createAiPlugin();

// Import the blog Puck configuration
import { blogPuckConfig } from "@/puck/blog/config";
import type { Data } from "@measured/puck";

interface BlogPost {
  id: string;
  title: string;
  puckContent?: Data;
}

export default function BlogPuckEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [puckData, setPuckData] = useState<Data | null>(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/blog/posts/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPost(data);
        // Initialize Puck data from saved content or create empty structure
        setPuckData(
          data.puckContent || {
            root: { props: {} },
            content: [],
            zones: {},
          }
        );
      } else {
        toast.error("Post not found");
        router.push("/admin/blog");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      toast.error("Failed to load post");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Data) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/blog/posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puckContent: data,
          usePuckLayout: true,
        }),
      });

      if (response.ok) {
        toast.success("Layout saved successfully");
        setPuckData(data);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save layout");
      }
    } catch (error) {
      console.error("Error saving layout:", error);
      toast.error("Failed to save layout");
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

  if (!post || !puckData) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/blog/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">{post.title}</h1>
            <p className="text-xs text-muted-foreground">
              Visual Editor (Puck)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/blog/${id}`}>
              Back to Editor
            </Link>
          </Button>
        </div>
      </div>

      {/* Puck Editor with AI Plugin */}
      <div className="flex-1 overflow-hidden">
        <Puck
          config={blogPuckConfig}
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
