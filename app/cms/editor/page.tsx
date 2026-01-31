"use client";

/**
 * Puck Visual Editor Page
 *
 * Main editor interface with support for:
 * - Scoped configurations per authenticated area
 * - Permission-based component filtering
 * - Slug validation for area pages
 */

import React from "react";
import { Puck, Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import puckConfig from "@/puck/config";

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
import {
  createScopedConfig,
  validateSlugForArea,
  getAllowedPathPrefixes,
  getGlobalPermissions,
  createPuckUiState,
  determineUserRole,
} from "@/lib/puck";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

const initialData: Data = {
  content: [],
  root: {
    props: {
      title: "New Page",
    },
  },
};

interface EditorState {
  data: Data;
  loading: boolean;
  saving: boolean;
  error: string | null;
  pageId: string | null;
  slug: string;
  areaId: string | null;
  isNewPage: boolean;
}

function EditorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // Parse URL params
  const pageId = searchParams.get("id");
  const pathParam = searchParams.get("path"); // For new pages: dashboard/pages/my-page
  const areaId = searchParams.get("area"); // Area context: dashboard, app, admin, public

  const [state, setState] = useState<EditorState>({
    data: initialData,
    loading: true,
    saving: false,
    error: null,
    pageId: pageId,
    slug: pathParam || "",
    areaId: areaId,
    isNewPage: !pageId,
  });

  const [slugInput, setSlugInput] = useState(pathParam || "");
  const [showSlugModal, setShowSlugModal] = useState(!pageId && !pathParam);

  // Build user permission context
  const userPermissions = useMemo(() => {
    // TODO: Get actual permissions from auth context when available
    // For now, use basic permissions based on authenticated state
    const permissions = new Set<string>(["pages.view", "pages.edit", "pages.create"]);
    if (user) {
      // If user is authenticated, grant base editing permissions
      permissions.add("pages.edit");
    }
    return permissions;
  }, [user]);

  const userRoles = useMemo(() => {
    // TODO: Get actual roles from auth context
    return ["editor"];
  }, []);

  const userRole = useMemo(() => {
    return determineUserRole(userPermissions, userRoles);
  }, [userPermissions, userRoles]);

  // Get scoped config based on area and user permissions
  const scopedConfig = useMemo(() => {
    // If no area specified, use full config (admin/public editing)
    if (!state.areaId || state.areaId === "public" || state.areaId === "admin") {
      return puckConfig;
    }

    // Create scoped config for the area
    return createScopedConfig(puckConfig, {
      areaId: state.areaId,
      userPermissions,
    });
  }, [state.areaId, userPermissions]);

  // Get global Puck permissions based on user role
  const puckPermissions = useMemo(() => {
    return getGlobalPermissions({
      role: userRole,
      permissions: userPermissions,
      areaId: state.areaId || undefined,
    });
  }, [userRole, userPermissions, state.areaId]);

  // Create UI state for Puck with permission context
  const puckUiState = useMemo(() => {
    return createPuckUiState(userPermissions, userRoles, {
      areaId: state.areaId || undefined,
      isPageOwner: true, // TODO: Check actual page ownership
    });
  }, [userPermissions, userRoles, state.areaId]);

  // Load existing page data
  useEffect(() => {
    async function loadPage() {
      if (!pageId) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      try {
        const response = await fetch(`/api/admin/pages/${pageId}`);
        if (response.ok) {
          const page = await response.json();
          setState((prev) => ({
            ...prev,
            data: page.content || initialData,
            slug: page.slug || "",
            loading: false,
          }));
          setSlugInput(page.slug || "");
        } else {
          setState((prev) => ({
            ...prev,
            error: "Page not found",
            loading: false,
          }));
        }
      } catch (error) {
        console.error("Failed to load page:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to load page",
          loading: false,
        }));
      }
    }

    loadPage();
  }, [pageId]);

  // Validate slug for area
  const validateSlug = (slug: string): { valid: boolean; error?: string } => {
    if (!slug.trim()) {
      return { valid: false, error: "Slug is required" };
    }

    // Check for invalid characters
    if (!/^[a-z0-9-/]+$/.test(slug)) {
      return { valid: false, error: "Slug can only contain lowercase letters, numbers, hyphens, and slashes" };
    }

    // If area is specified, validate against area prefix
    if (state.areaId && state.areaId !== "public" && state.areaId !== "admin") {
      return validateSlugForArea(slug, state.areaId);
    }

    return { valid: true };
  };

  // Handle save/publish
  const handlePublish = async (puckData: Data) => {
    setState((prev) => ({ ...prev, saving: true, error: null }));

    try {
      const slug = slugInput.trim();
      const validation = validateSlug(slug);

      if (!validation.valid) {
        setState((prev) => ({ ...prev, saving: false, error: validation.error || "Invalid slug" }));
        return;
      }

      const endpoint = state.pageId
        ? `/api/admin/pages/${state.pageId}`
        : "/api/admin/pages";

      const method = state.pageId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: (puckData.root?.props as { title?: string })?.title || "Untitled Page",
          slug,
          content: puckData,
          status: "PUBLISHED",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      const savedPage = await response.json();

      setState((prev) => ({
        ...prev,
        saving: false,
        pageId: savedPage.id,
        isNewPage: false,
      }));

      // Update URL with page ID if it was a new page
      if (!state.pageId && savedPage.id) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("id", savedPage.id);
        newUrl.searchParams.delete("path");
        router.replace(newUrl.pathname + newUrl.search);
      }
    } catch (error) {
      console.error("Failed to save:", error);
      setState((prev) => ({
        ...prev,
        saving: false,
        error: error instanceof Error ? error.message : "Failed to save",
      }));
    }
  };

  // Handle slug confirmation for new pages
  const handleSlugConfirm = () => {
    const validation = validateSlug(slugInput);
    if (validation.valid) {
      setState((prev) => ({ ...prev, slug: slugInput }));
      setShowSlugModal(false);
    } else {
      setState((prev) => ({ ...prev, error: validation.error || "Invalid slug" }));
    }
  };

  // Loading states
  if (authLoading || state.loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <div className="text-lg text-gray-600">Loading editor...</div>
        </div>
      </div>
    );
  }

  // Auth required
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to use the editor.</p>
          <a
            href="/handler/sign-in"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Slug modal for new pages
  if (showSlugModal) {
    const prefixes = getAllowedPathPrefixes();

    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold mb-4">Create New Page</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Location
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={state.areaId || "public"}
              onChange={(e) => {
                const newAreaId = e.target.value;
                const prefix = prefixes.find((p) => p.areaId === newAreaId)?.prefix || "";
                setState((prev) => ({ ...prev, areaId: newAreaId === "public" ? null : newAreaId }));
                setSlugInput(prefix ? `${prefix.replace(/^\//, "")}/` : "");
              }}
            >
              {prefixes.map((p) => (
                <option key={p.areaId} value={p.areaId}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Page Slug (URL path)
            </label>
            <input
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value.toLowerCase())}
              placeholder="e.g., dashboard/pages/my-page"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              This will be the URL path: /{slugInput || "your-page-slug"}
            </p>
          </div>

          {state.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {state.error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSlugConfirm}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main editor
  const headerTitle = state.isNewPage
    ? `New Page: /${slugInput}`
    : `Editing: /${state.slug}`;

  return (
    <div className="puck-editor-wrapper">
      <Puck
        config={scopedConfig}
        data={state.data}
        onPublish={handlePublish}
        headerTitle={headerTitle}
        headerPath={`/preview/${state.slug || "preview"}`}
        permissions={puckPermissions}
        overrides={{
          componentItem: ({ name, children }) => (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#ffffff",
                marginBottom: "4px",
              }}
            >
              {/* Preview thumbnail */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "12px 8px",
                  background: "#f9fafb",
                  borderBottom: "1px solid #f3f4f6",
                  minHeight: "48px",
                }}
              >
                {componentPreviews[name] || (
                  <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
                    <rect x="4" y="4" width="40" height="20" rx="2" fill="#f1f5f9" stroke="#e2e8f0" />
                  </svg>
                )}
              </div>
              {/* Component name - use Puck's default children for drag functionality */}
              <div style={{ padding: "0" }}>
                {children}
              </div>
            </div>
          ),
        }}
      />

      {/* Status indicators */}
      {state.saving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Saving...
        </div>
      )}

      {state.error && !state.saving && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {state.error}
          <button
            onClick={() => setState((prev) => ({ ...prev, error: null }))}
            className="ml-2 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Area indicator */}
      {state.areaId && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-full text-sm">
          Editing in: {state.areaId.charAt(0).toUpperCase() + state.areaId.slice(1)} Area
        </div>
      )}

      <style>{`
        .puck-editor-wrapper {
          height: 100vh;
          overflow: hidden;
        }

        [data-puck-component] {
          position: relative;
        }

        [data-puck-dropzone]:empty {
          min-height: 60px;
          border: 2px dashed #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f9fafb;
        }

        [data-puck-dropzone]:empty::before {
          content: "Drop components here";
          color: #9ca3af;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="text-lg text-gray-600">Loading editor...</div>
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
