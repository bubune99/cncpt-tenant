"use client";

import React, { useState, useEffect, use, useCallback, useMemo } from "react";
import { Loader2, AlertCircle, ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/cms/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import { useCMSConfig } from "@/contexts/CMSConfigContext";
import { Puck, Data, Drawer } from "@puckeditor/core";
import "@puckeditor/core/puck.css";

// Import custom Puck AI plugin
import { aiChatPlugin } from "@/puck/plugins/aiChatPlugin";

// Import V0 Import Dialog
import { V0ImportDialog } from "@/puck/components/V0ImportDialog";
import type { V0ImportResult } from "@/lib/cms/v0/types";

// Import editor components
import { GlobalElementsPanel } from "@/puck/components/GlobalElementsPanel";
import { EditorContextMenu } from "@/puck/components/EditorContextMenu";
import { DraggableOutline } from "@/puck/components/DraggableOutline";
import { HelpModeButton } from "@/puck/components/HelpModeButton";
import { HelpModeProvider } from "@/lib/cms/puck/help-mode-context";

// Use custom AI chat plugin with Vercel AI SDK
const puckPlugins = [aiChatPlugin];

// Component preview SVG icons
const componentPreviews: Record<string, React.ReactNode> = {
  // Layout
  Section: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="2" fill="#f1f5f9" stroke="#cbd5e1" />
      <rect x="6" y="6" width="36" height="4" rx="1" fill="#cbd5e1" />
      <rect x="6" y="12" width="36" height="3" rx="1" fill="#e2e8f0" />
      <rect x="6" y="17" width="24" height="3" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  Container: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="6" y="4" width="36" height="20" rx="2" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="10" y="8" width="28" height="4" rx="1" fill="#e2e8f0" />
      <rect x="10" y="14" width="28" height="4" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  Grid: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="12" height="8" rx="1" fill="#e2e8f0" />
      <rect x="18" y="4" width="12" height="8" rx="1" fill="#e2e8f0" />
      <rect x="32" y="4" width="12" height="8" rx="1" fill="#e2e8f0" />
      <rect x="4" y="16" width="12" height="8" rx="1" fill="#e2e8f0" />
      <rect x="18" y="16" width="12" height="8" rx="1" fill="#e2e8f0" />
      <rect x="32" y="16" width="12" height="8" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  Flex: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="6" width="10" height="16" rx="1" fill="#e2e8f0" />
      <rect x="16" y="6" width="16" height="16" rx="1" fill="#e2e8f0" />
      <rect x="34" y="6" width="10" height="16" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  Row: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="8" width="12" height="12" rx="1" fill="#e2e8f0" />
      <rect x="18" y="8" width="12" height="12" rx="1" fill="#e2e8f0" />
      <rect x="32" y="8" width="12" height="12" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  Columns: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="20" height="20" rx="1" fill="#e2e8f0" />
      <rect x="26" y="4" width="18" height="20" rx="1" fill="#cbd5e1" />
    </svg>
  ),
  // Content
  Heading: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <text x="6" y="18" fontFamily="system-ui" fontSize="12" fontWeight="bold" fill="#374151">Aa</text>
      <rect x="22" y="10" width="20" height="3" rx="1" fill="#e2e8f0" />
      <rect x="22" y="15" width="14" height="3" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  Text: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="6" width="40" height="2" rx="1" fill="#94a3b8" />
      <rect x="4" y="10" width="36" height="2" rx="1" fill="#94a3b8" />
      <rect x="4" y="14" width="40" height="2" rx="1" fill="#94a3b8" />
      <rect x="4" y="18" width="28" height="2" rx="1" fill="#94a3b8" />
    </svg>
  ),
  Button: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="8" y="8" width="32" height="12" rx="3" fill="#3b82f6" />
      <rect x="14" y="12" width="20" height="4" rx="1" fill="#ffffff" />
    </svg>
  ),
  Image: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="40" height="20" rx="2" fill="#f1f5f9" stroke="#e2e8f0" />
      <circle cx="14" cy="12" r="3" fill="#94a3b8" />
      <path d="M4 20 L14 14 L24 18 L32 12 L44 18 V22 C44 23 43 24 42 24 H6 C5 24 4 23 4 22 V20Z" fill="#cbd5e1" />
    </svg>
  ),
  Spacer: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="40" height="3" rx="1" fill="#e2e8f0" />
      <line x1="24" y1="10" x2="24" y2="18" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
      <path d="M20 10 L24 6 L28 10" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <path d="M20 18 L24 22 L28 18" stroke="#94a3b8" strokeWidth="1" fill="none" />
      <rect x="4" y="21" width="40" height="3" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  // Primitives
  Box: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="6" y="4" width="36" height="20" rx="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2" />
      <rect x="10" y="8" width="28" height="12" rx="1" fill="#eff6ff" />
    </svg>
  ),
  Icon: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <circle cx="24" cy="14" r="10" fill="#f0fdf4" stroke="#22c55e" strokeWidth="1.5" />
      <path d="M20 14 L23 17 L28 11" stroke="#22c55e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  ),
  Divider: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="6" width="40" height="4" rx="1" fill="#e2e8f0" />
      <line x1="8" y1="14" x2="40" y2="14" stroke="#94a3b8" strokeWidth="2" />
      <rect x="4" y="18" width="40" height="4" rx="1" fill="#e2e8f0" />
    </svg>
  ),
  // Header & Footer
  Header: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="6" width="44" height="16" rx="1" fill="#ffffff" stroke="#0ea5e9" />
      <rect x="6" y="10" width="10" height="5" rx="1" fill="#0ea5e9" />
      <rect x="18" y="11" width="5" height="3" rx="1" fill="#94a3b8" />
      <rect x="25" y="11" width="5" height="3" rx="1" fill="#94a3b8" />
      <rect x="38" y="10" width="6" height="5" rx="1" fill="#0ea5e9" />
    </svg>
  ),
  Footer: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#1e293b" />
      <rect x="6" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <rect x="6" y="10" width="6" height="2" rx="1" fill="#475569" />
      <rect x="18" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <rect x="18" y="10" width="6" height="2" rx="1" fill="#475569" />
      <rect x="30" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <rect x="30" y="10" width="6" height="2" rx="1" fill="#475569" />
      <line x1="6" y1="18" x2="42" y2="18" stroke="#475569" />
      <rect x="18" y="21" width="12" height="2" rx="1" fill="#475569" />
    </svg>
  ),
  Card: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="2" width="40" height="24" rx="2" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="4" y="2" width="40" height="10" rx="2" fill="#f1f5f9" />
      <rect x="8" y="14" width="20" height="2" rx="1" fill="#374151" />
      <rect x="8" y="18" width="28" height="2" rx="1" fill="#94a3b8" />
      <rect x="8" y="22" width="24" height="2" rx="1" fill="#94a3b8" />
    </svg>
  ),
  StatsCard: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="40" height="20" rx="2" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="8" y="8" width="16" height="3" rx="1" fill="#94a3b8" />
      <text x="8" y="18" fontFamily="system-ui" fontSize="8" fontWeight="bold" fill="#1e293b">1,234</text>
      <path d="M32 16 L35 12 L38 14 L42 8" stroke="#22c55e" strokeWidth="1.5" fill="none" />
    </svg>
  ),
};

// Import the main Puck configuration
import puckConfig from "@/puck/config";

// Component preview renderer
function ComponentPreview({ name }: { name: string }) {
  return (
    <div className="component-preview-icon">
      {componentPreviews[name] || (
        <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
          <rect x="4" y="4" width="40" height="20" rx="2" fill="#f1f5f9" stroke="#e2e8f0" />
        </svg>
      )}
    </div>
  );
}

// Component list with custom previews using Drawer
function ComponentListWithPreviews() {
  return (
    <div className="component-list-with-previews">
      <div className="component-section">
        <h3 className="section-title">Primitives</h3>
        <Drawer>
          {["Box", "Icon", "Divider"].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">Layout</h3>
        <Drawer>
          {["Section", "Container", "Grid", "Flex", "Row", "Columns"].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">Content</h3>
        <Drawer>
          {["Heading", "Text", "Button", "Image", "Spacer"].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">Header & Footer</h3>
        <Drawer>
          {["Header", "Footer"].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card navigation-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">Pre-built</h3>
        <Drawer>
          {["StatsCard", "Card"].map((name) => (
            <Drawer.Item key={name} name={name}>
              {() => (
                <div className="component-card">
                  <ComponentPreview name={name} />
                  <div className="component-card-info">
                    <span className="component-card-name">{name}</span>
                  </div>
                </div>
              )}
            </Drawer.Item>
          ))}
        </Drawer>
      </div>

      <style>{`
        .component-list-with-previews {
          padding: 12px;
          overflow-y: auto;
          height: 100%;
        }

        .component-section {
          margin-bottom: 16px;
        }

        .section-title {
          font-size: 11px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
        }

        .component-card {
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          cursor: grab;
          transition: all 0.15s ease;
          margin-bottom: 6px;
        }

        .component-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
        }

        .component-card:active {
          cursor: grabbing;
        }

        .component-preview-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          padding: 8px;
          border-bottom: 1px solid #f1f5f9;
        }

        .component-card-info {
          padding: 8px 10px;
        }

        .component-card-name {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        [class*="Drawer-item"] {
          margin-bottom: 0 !important;
        }

        .navigation-card {
          border-color: #a5f3fc;
          background: linear-gradient(135deg, #f0fdff 0%, #e0f7ff 100%);
        }

        .navigation-card:hover {
          border-color: #0ea5e9;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
        }
      `}</style>
    </div>
  );
}

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
  const { buildPath } = useCMSConfig();
  const [page, setPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [puckData, setPuckData] = useState<Data | null>(null);
  const [isV0DialogOpen, setIsV0DialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"components" | "outline" | "global">("components");

  // Handle successful v0 import
  const handleV0ImportComplete = useCallback((result: V0ImportResult) => {
    if (result.success && result.component) {
      toast.success(`Component "${result.component.displayName}" imported successfully!`);
      // Component is saved as a draft - user can publish it from the Components panel
    }
  }, []);

  // Memoize overrides - MUST be before any early returns to satisfy Rules of Hooks
  const puckOverrides = useMemo(() => ({
    // Add context menu overlay
    puck: ({ children }: { children: React.ReactNode }) => (
      <>
        {children}
        <EditorContextMenu />
      </>
    ),
    headerActions: ({ children }: { children: React.ReactNode }) => (
      <>
        <HelpModeButton />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsV0DialogOpen(true)}
          className="ml-2"
        >
          <Download className="h-4 w-4 mr-1" />
          Import v0
        </Button>
        {children}
      </>
    ),
    drawer: () => (
      <div className="custom-sidebar">
        {/* Tab Switcher */}
        <div className="sidebar-tabs">
          <button
            className={`sidebar-tab ${activeTab === "components" ? "active" : ""}`}
            onClick={() => setActiveTab("components")}
          >
            Components
          </button>
          <button
            className={`sidebar-tab ${activeTab === "outline" ? "active" : ""}`}
            onClick={() => setActiveTab("outline")}
          >
            Outline
          </button>
          <button
            className={`sidebar-tab ${activeTab === "global" ? "active" : ""}`}
            onClick={() => setActiveTab("global")}
          >
            Global
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "global" ? (
          <GlobalElementsPanel
            onEditHeader={() => {}}
            onEditFooter={() => {}}
            currentView="page"
          />
        ) : activeTab === "outline" ? (
          <DraggableOutline />
        ) : (
          <ComponentListWithPreviews />
        )}
      </div>
    ),
  }), [activeTab]);

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

  const handlePublish = async (data: Data) => {
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
          <Link href={buildPath('/admin/pages')}>
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
    <HelpModeProvider>
      <div className="puck-editor-wrapper">
        {/* Application Header */}
        <div className="puck-app-header">
          <div className="puck-app-header-left">
            <Link href={buildPath('/admin/pages')} className="puck-back-link">
              <ArrowLeft className="h-4 w-4" />
              <span>Pages</span>
            </Link>
            <span className="puck-header-divider">/</span>
            <span className="puck-page-title">{page.title}</span>
          </div>
          <div className="puck-app-header-right">
            <span className="puck-page-path">/{page.slug}</span>
          </div>
        </div>

        {/* Puck Editor */}
        <div className="puck-editor-container">
          <Puck
            config={puckConfig}
            data={puckData}
            onPublish={handlePublish}
            plugins={puckPlugins}
            headerTitle=""
            headerPath=""
            overrides={puckOverrides}
          />
        </div>

        {/* V0 Import Dialog */}
        <V0ImportDialog
          isOpen={isV0DialogOpen}
          onClose={() => setIsV0DialogOpen(false)}
          onImportComplete={handleV0ImportComplete}
        />

        <style>{`
        .puck-editor-wrapper {
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          background: #ffffff;
        }

        .puck-app-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 44px;
          padding: 0 16px;
          background: #fafafa;
          border-bottom: 1px solid #e5e7eb;
          flex-shrink: 0;
        }

        .puck-app-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .puck-app-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .puck-back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          text-decoration: none;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .puck-back-link:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .puck-header-divider {
          color: #d1d5db;
          font-size: 14px;
        }

        .puck-page-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .puck-page-path {
          font-size: 12px;
          color: #9ca3af;
          font-family: var(--font-geist-mono), monospace;
        }

        .puck-editor-container {
          flex: 1;
          overflow: hidden;
        }

        /* Hide Puck's built-in header title since we have our own */
        [class*="Puck-headerTitle"],
        [class*="Puck-headerPath"] {
          display: none !important;
        }

        .custom-sidebar {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .sidebar-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #fafafa;
        }

        .sidebar-tab {
          flex: 1;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          border-bottom: 2px solid transparent;
        }

        .sidebar-tab:hover {
          color: #1a1a1a;
          background: #f3f4f6;
        }

        .sidebar-tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: #ffffff;
        }

        /* Fade out animation for save indicator */
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }

        .animate-fade-out {
          animation: fadeOut 3s forwards;
        }

        /* Right sidebar scrolling */
        [class*="Puck-rightSideBar"],
        [class*="rightSideBar"] {
          overflow-y: auto !important;
          max-height: calc(100vh - 60px) !important;
        }

        /* Fields panel scrolling */
        [class*="Fields"],
        [class*="Puck-fields"] {
          overflow-y: auto !important;
          max-height: calc(100vh - 120px) !important;
          padding-bottom: 24px !important;
        }
        `}</style>
      </div>
    </HelpModeProvider>
  );
}
