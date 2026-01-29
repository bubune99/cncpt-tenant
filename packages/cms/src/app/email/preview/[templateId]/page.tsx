"use client";

import { Render, Data } from "@puckeditor/core";
import emailPuckConfig from "@/puck/configs/email.config";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EmailPreviewPage() {
  const params = useParams();
  const templateId = params.templateId as string;
  const [data, setData] = useState<Data | null>(null);
  const [metadata, setMetadata] = useState<{ name?: string; subject?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    async function loadTemplate() {
      try {
        const response = await fetch(`/api/email-templates?id=${templateId}`);
        if (response.ok) {
          const templateData = await response.json();
          setData(templateData.data);
          setMetadata({
            name: templateData.name,
            subject: templateData.subject,
          });
        } else {
          setError("Email template not found");
        }
      } catch (err) {
        setError("Failed to load email template");
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [templateId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-lg text-gray-600">Loading preview...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Template Not Found</h1>
        <p className="text-gray-600 mb-4">{error || "This email template does not exist."}</p>
        <a
          href="/email"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Go to Templates
        </a>
      </div>
    );
  }

  return (
    <div className="email-preview-page">
      {/* Preview Header */}
      <div className="preview-header">
        <div className="preview-header-left">
          <a href="/email" className="back-link">← Back to Templates</a>
          <span className="template-name">{metadata?.name || "Email Preview"}</span>
          {metadata?.subject && (
            <span className="template-subject">Subject: {metadata.subject}</span>
          )}
        </div>
        <div className="preview-header-right">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === "desktop" ? "active" : ""}`}
              onClick={() => setViewMode("desktop")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Desktop
            </button>
            <button
              className={`toggle-btn ${viewMode === "mobile" ? "active" : ""}`}
              onClick={() => setViewMode("mobile")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12" y2="18" />
              </svg>
              Mobile
            </button>
          </div>
          <a
            href={`/email/${templateId}`}
            className="edit-btn"
          >
            Edit Template
          </a>
        </div>
      </div>

      {/* Preview Content */}
      <div className="preview-container">
        <div className={`preview-frame ${viewMode}`}>
          <Render config={emailPuckConfig} data={data} />
        </div>
      </div>

      <style>{`
        .email-preview-page {
          min-height: 100vh;
          background: #1f2937;
          display: flex;
          flex-direction: column;
        }

        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: #111827;
          border-bottom: 1px solid #374151;
        }

        .preview-header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-link {
          color: #9ca3af;
          text-decoration: none;
          font-size: 14px;
        }

        .back-link:hover {
          color: #ffffff;
        }

        .template-name {
          color: #ffffff;
          font-size: 14px;
          font-weight: 500;
        }

        .template-subject {
          color: #6b7280;
          font-size: 13px;
        }

        .preview-header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .view-toggle {
          display: flex;
          background: #374151;
          border-radius: 8px;
          padding: 4px;
        }

        .toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 13px;
          color: #9ca3af;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .toggle-btn:hover {
          color: #ffffff;
        }

        .toggle-btn.active {
          background: #4b5563;
          color: #ffffff;
        }

        .edit-btn {
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #ffffff;
          background: #3b82f6;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.15s ease;
        }

        .edit-btn:hover {
          background: #2563eb;
        }

        .preview-container {
          flex: 1;
          display: flex;
          justify-content: center;
          padding: 24px;
          overflow: auto;
        }

        .preview-frame {
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          transition: all 0.3s ease;
        }

        .preview-frame.desktop {
          width: 100%;
          max-width: 800px;
        }

        .preview-frame.mobile {
          width: 375px;
          border-radius: 24px;
          border: 8px solid #374151;
        }
      `}</style>
    </div>
  );
}
