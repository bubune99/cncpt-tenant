"use client";

import React from "react";
import { Puck, Data } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { aiChatPlugin } from "@/puck/plugins/aiChatPlugin";
import puckConfig from "@/puck/config";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BundleExportDialog } from "@/puck/components/BundleExportDialog";
import { BundleImportDialog } from "@/puck/components/BundleImportDialog";

const initialData: Data = {
  content: [],
  root: {
    props: {
      title: "New Page",
    },
  },
};

// Use custom AI chat plugin

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
  NavLink: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="8" y="9" width="32" height="10" rx="1" fill="#f0f9ff" stroke="#0ea5e9" />
      <rect x="12" y="12" width="24" height="4" rx="1" fill="#0ea5e9" />
    </svg>
  ),
  NavMenu: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="9" width="40" height="10" rx="1" fill="#f0f9ff" stroke="#0ea5e9" />
      <rect x="8" y="12" width="10" height="4" rx="1" fill="#0ea5e9" />
      <rect x="20" y="12" width="10" height="4" rx="1" fill="#0ea5e9" />
      <rect x="32" y="12" width="10" height="4" rx="1" fill="#0ea5e9" />
    </svg>
  ),
  NavMenuItem: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="8" y="8" width="32" height="12" rx="1" fill="#f0f9ff" stroke="#0ea5e9" />
      <rect x="12" y="11" width="18" height="3" rx="1" fill="#0ea5e9" />
      <path d="M36 12 L38 14 L36 16" stroke="#0ea5e9" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  FooterColumn: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="8" y="4" width="32" height="20" rx="1" fill="#1e293b" />
      <rect x="12" y="8" width="16" height="3" rx="1" fill="#64748b" />
      <rect x="12" y="13" width="12" height="2" rx="1" fill="#475569" />
      <rect x="12" y="17" width="14" height="2" rx="1" fill="#475569" />
    </svg>
  ),
  FooterLink: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="8" y="10" width="32" height="8" rx="1" fill="#1e293b" />
      <rect x="12" y="13" width="24" height="3" rx="1" fill="#64748b" />
    </svg>
  ),
  SocialLink: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <circle cx="16" cy="14" r="6" fill="#1e293b" />
      <circle cx="32" cy="14" r="6" fill="#1e293b" />
      <rect x="13" y="11" width="6" height="6" rx="1" fill="#64748b" />
      <rect x="29" y="11" width="6" height="6" rx="1" fill="#64748b" />
    </svg>
  ),
  // Dashboard
  StatsCard: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="40" height="20" rx="2" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="8" y="8" width="16" height="3" rx="1" fill="#94a3b8" />
      <text x="8" y="18" fontFamily="system-ui" fontSize="8" fontWeight="bold" fill="#1e293b">1,234</text>
      <path d="M32 16 L35 12 L38 14 L42 8" stroke="#22c55e" strokeWidth="1.5" fill="none" />
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
  DataTable: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="4" y="4" width="40" height="20" rx="1" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="4" y="4" width="40" height="6" fill="#f8fafc" />
      <line x1="4" y1="10" x2="44" y2="10" stroke="#e2e8f0" />
      <line x1="4" y1="16" x2="44" y2="16" stroke="#e2e8f0" />
      <line x1="18" y1="4" x2="18" y2="24" stroke="#e2e8f0" />
      <line x1="32" y1="4" x2="32" y2="24" stroke="#e2e8f0" />
    </svg>
  ),
  // Templates
  HeroSplitTemplate: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#dbeafe" stroke="#3b82f6" />
      <rect x="6" y="6" width="18" height="3" rx="1" fill="#3b82f6" />
      <rect x="6" y="11" width="14" height="2" rx="1" fill="#93c5fd" />
      <rect x="6" y="15" width="10" height="4" rx="1" fill="#3b82f6" />
      <rect x="28" y="6" width="16" height="16" rx="1" fill="#bfdbfe" />
    </svg>
  ),
  HeroCenteredTemplate: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#dbeafe" stroke="#3b82f6" />
      <rect x="12" y="6" width="24" height="3" rx="1" fill="#3b82f6" />
      <rect x="10" y="11" width="28" height="2" rx="1" fill="#93c5fd" />
      <rect x="16" y="18" width="16" height="4" rx="1" fill="#3b82f6" />
    </svg>
  ),
  FeaturesGridTemplate: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#f0fdf4" stroke="#22c55e" />
      <rect x="6" y="6" width="10" height="8" rx="1" fill="#bbf7d0" />
      <rect x="19" y="6" width="10" height="8" rx="1" fill="#bbf7d0" />
      <rect x="32" y="6" width="10" height="8" rx="1" fill="#bbf7d0" />
      <rect x="6" y="17" width="10" height="8" rx="1" fill="#bbf7d0" />
      <rect x="19" y="17" width="10" height="8" rx="1" fill="#bbf7d0" />
      <rect x="32" y="17" width="10" height="8" rx="1" fill="#bbf7d0" />
    </svg>
  ),
  PricingTableTemplate: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#faf5ff" stroke="#a855f7" />
      <rect x="6" y="6" width="10" height="18" rx="1" fill="#e9d5ff" />
      <rect x="19" y="4" width="10" height="20" rx="1" fill="#c084fc" />
      <rect x="32" y="6" width="10" height="18" rx="1" fill="#e9d5ff" />
    </svg>
  ),
  TestimonialsTemplate: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#fef3c7" stroke="#f59e0b" />
      <rect x="6" y="6" width="14" height="16" rx="1" fill="#fde68a" />
      <rect x="23" y="6" width="14" height="16" rx="1" fill="#fde68a" />
      <circle cx="13" cy="12" r="3" fill="#fbbf24" />
      <circle cx="30" cy="12" r="3" fill="#fbbf24" />
    </svg>
  ),
  CtaSectionTemplate: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#3b82f6" />
      <rect x="12" y="8" width="24" height="3" rx="1" fill="#ffffff" />
      <rect x="14" y="13" width="20" height="2" rx="1" fill="#bfdbfe" />
      <rect x="16" y="18" width="16" height="4" rx="1" fill="#ffffff" />
    </svg>
  ),
  HeaderTemplate: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#f8fafc" stroke="#64748b" />
      <rect x="2" y="2" width="44" height="12" rx="1" fill="#e2e8f0" />
      <rect x="6" y="5" width="10" height="5" rx="1" fill="#64748b" />
      <rect x="20" y="6" width="5" height="3" rx="1" fill="#94a3b8" />
      <rect x="28" y="6" width="5" height="3" rx="1" fill="#94a3b8" />
      <rect x="38" y="5" width="6" height="5" rx="1" fill="#3b82f6" />
    </svg>
  ),
  FooterTemplate: (
    <svg width="48" height="28" viewBox="0 0 48 28" fill="none">
      <rect x="2" y="2" width="44" height="24" rx="1" fill="#1e293b" stroke="#334155" />
      <rect x="6" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <rect x="6" y="10" width="6" height="2" rx="1" fill="#475569" />
      <rect x="18" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <rect x="30" y="6" width="8" height="2" rx="1" fill="#64748b" />
      <line x1="6" y1="18" x2="42" y2="18" stroke="#475569" />
      <rect x="18" y="21" width="12" height="2" rx="1" fill="#475569" />
    </svg>
  ),
};

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const pageId = params.pageId as string;
  const [data, setData] = useState<Data>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("New Page");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  useEffect(() => {
    async function loadPage() {
      try {
        const response = await fetch(`/api/pages?id=${pageId}`);
        if (response.ok) {
          const pageData = await response.json();
          setData(pageData);
          if (pageData?.root?.props?.title) {
            setPageTitle(pageData.root.props.title);
          } else {
            setPageTitle(pageId);
          }
        }
      } catch (error) {
        console.log("No existing page found, starting fresh");
      } finally {
        setLoading(false);
      }
    }

    loadPage();
  }, [pageId]);

  const handleSave = async (puckData: Data) => {
    setSaving(true);
    try {
      await fetch("/api/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pageId, data: puckData }),
      });
      setData(puckData);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg text-gray-600">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="puck-editor-wrapper">
      <Puck
        config={puckConfig}
        data={data}
        onPublish={handleSave}
        onChange={setData}
        plugins={[aiChatPlugin]}
        headerTitle={`Editing: ${pageTitle}`}
        headerPath={`/preview/${pageId}`}
        overrides={{
          headerActions: () => (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => router.push("/")}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  color: "#374151",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Pages
              </button>
              <button
                onClick={() => window.open(`/preview/${pageId}`, "_blank")}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  color: "#374151",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Preview
              </button>
              <div style={{ width: "1px", height: "24px", background: "#e5e7eb", margin: "0 4px" }} />
              <button
                onClick={() => setShowImportDialog(true)}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  color: "#374151",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </button>
              <button
                onClick={() => setShowExportDialog(true)}
                style={{
                  padding: "6px 12px",
                  fontSize: "13px",
                  color: "#374151",
                  background: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          ),
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
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Saving...
        </div>
      )}
      {lastSaved && !saving && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-out">
          Saved
        </div>
      )}

      <BundleExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        pageId={pageId}
        pageTitle={pageTitle}
      />
      <BundleImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImportComplete={(result) => {
          if (result.pageId) {
            router.push(`/editor/${result.pageId}`);
          }
        }}
      />
      <style>{`
        .puck-editor-wrapper {
          height: 100vh;
          overflow: hidden;
        }

        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }

        .animate-fade-out {
          animation: fadeOut 3s forwards;
        }

        /* Highlight empty drop zones */
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
