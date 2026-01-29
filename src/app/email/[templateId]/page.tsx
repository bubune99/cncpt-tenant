"use client";

import { Puck, Data, Drawer } from "@puckeditor/core";
import "@puckeditor/core/puck.css";
import { aiChatPlugin } from "@/puck/plugins/aiChatPlugin";
import emailPuckConfig from "@/puck/configs/email.config";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const initialData: Data = {
  content: [],
  root: {
    props: {
      title: "New Email",
    },
  },
};

// Use custom AI chat plugin

export default function EmailEditorPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.templateId as string;
  const [data, setData] = useState<Data>(initialData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [emailMetadata, setEmailMetadata] = useState({
    name: "New Email",
    subject: "",
    previewText: "",
  });

  useEffect(() => {
    async function loadTemplate() {
      try {
        const response = await fetch(`/api/email-templates?id=${templateId}`);
        if (response.ok) {
          const templateData = await response.json();
          setData(templateData.data || initialData);
          setEmailMetadata({
            name: templateData.name || "New Email",
            subject: templateData.subject || "",
            previewText: templateData.previewText || "",
          });
        }
      } catch (error) {
        console.log("No existing template found, starting fresh");
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [templateId]);

  const handleSave = async (puckData: Data) => {
    setSaving(true);
    try {
      await fetch("/api/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: templateId,
          data: puckData,
          name: emailMetadata.name,
          subject: emailMetadata.subject,
          previewText: emailMetadata.previewText,
        }),
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
        <div className="text-lg text-gray-600">Loading email editor...</div>
      </div>
    );
  }

  return (
    <div className="email-editor-wrapper">
      <Puck
        config={emailPuckConfig}
        data={data}
        onPublish={handleSave}
        onChange={setData}
        plugins={[aiChatPlugin]}
        overrides={{
          headerActions: () => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/email")}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                ← Templates
              </button>
              <button
                onClick={() => window.open(`/email/preview/${templateId}`, "_blank")}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Preview
              </button>
            </div>
          ),
          components: () => <EmailComponentList />,
        }}
      />
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Saving...
        </div>
      )}
      {lastSaved && !saving && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-out">
          Saved ✓
        </div>
      )}
      <style>{`
        .email-editor-wrapper {
          height: 100vh;
          overflow: hidden;
        }

        /* Email editor specific styling */
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
          content: "Drop email components here";
          color: #9ca3af;
          font-size: 14px;
        }

        /* Fade out animation */
        @keyframes fadeOut {
          0% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; }
        }

        .animate-fade-out {
          animation: fadeOut 3s forwards;
        }

        /* Component list styling */
        .email-component-list {
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
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
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

        .component-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          border-radius: 6px;
          color: #6b7280;
        }

        .component-name {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }
      `}</style>
    </div>
  );
}

// Email component list with icons
function EmailComponentList() {
  return (
    <div className="email-component-list">
      <div className="component-section">
        <h3 className="section-title">Layout</h3>
        <Drawer>
          <Drawer.Item name="EmailSection">
            {() => (
              <div className="component-card">
                <div className="component-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                </div>
                <span className="component-name">Section</span>
              </div>
            )}
          </Drawer.Item>
          <Drawer.Item name="EmailColumns">
            {() => (
              <div className="component-card">
                <div className="component-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="8" height="18" rx="1" />
                    <rect x="13" y="3" width="8" height="18" rx="1" />
                  </svg>
                </div>
                <span className="component-name">Columns</span>
              </div>
            )}
          </Drawer.Item>
        </Drawer>
      </div>

      <div className="component-section">
        <h3 className="section-title">Content</h3>
        <Drawer>
          <Drawer.Item name="EmailHeading">
            {() => (
              <div className="component-card">
                <div className="component-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12h8M4 6h16M4 18h16" />
                  </svg>
                </div>
                <span className="component-name">Heading</span>
              </div>
            )}
          </Drawer.Item>
          <Drawer.Item name="EmailText">
            {() => (
              <div className="component-card">
                <div className="component-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M4 12h16M4 18h12" />
                  </svg>
                </div>
                <span className="component-name">Text</span>
              </div>
            )}
          </Drawer.Item>
          <Drawer.Item name="EmailButton">
            {() => (
              <div className="component-card">
                <div className="component-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="8" width="18" height="8" rx="2" />
                  </svg>
                </div>
                <span className="component-name">Button</span>
              </div>
            )}
          </Drawer.Item>
          <Drawer.Item name="EmailImage">
            {() => (
              <div className="component-card">
                <div className="component-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <span className="component-name">Image</span>
              </div>
            )}
          </Drawer.Item>
          <Drawer.Item name="EmailSpacer">
            {() => (
              <div className="component-card">
                <div className="component-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="component-name">Spacer</span>
              </div>
            )}
          </Drawer.Item>
        </Drawer>
      </div>
    </div>
  );
}
