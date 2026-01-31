"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface EmailTemplate {
  id: string;
  name: string;
  subject?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const response = await fetch("/api/email-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createTemplate() {
    setCreating(true);
    try {
      const id = `email-${Date.now()}`;
      await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: "Untitled Email",
          data: { content: [], root: { props: { title: "Untitled Email" } } },
        }),
      });
      router.push(`/email/${id}`);
    } catch (error) {
      console.error("Failed to create template:", error);
      setCreating(false);
    }
  }

  async function deleteTemplate(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this email template?")) return;

    try {
      await fetch(`/api/email-templates?id=${id}`, { method: "DELETE" });
      setTemplates(templates.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  }

  function duplicateTemplate(template: EmailTemplate, e: React.MouseEvent) {
    e.stopPropagation();
    const newId = `email-${Date.now()}`;
    fetch(`/api/email-templates?id=${template.id}`)
      .then((res) => res.json())
      .then((data) => {
        return fetch("/api/email-templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: newId,
            name: `${template.name} (Copy)`,
            subject: data.subject,
            previewText: data.previewText,
            data: data.data,
          }),
        });
      })
      .then(() => loadTemplates());
  }

  if (loading) {
    return (
      <div className="email-templates-page">
        <div className="loading">Loading templates...</div>
        <style>{pageStyles}</style>
      </div>
    );
  }

  return (
    <div className="email-templates-page">
      <header className="page-header">
        <div className="header-left">
          <a href="/" className="back-link">← Back to Pages</a>
          <h1>Email Templates</h1>
          <p className="subtitle">Create and manage email templates</p>
        </div>
        <button
          onClick={createTemplate}
          disabled={creating}
          className="create-btn"
        >
          {creating ? "Creating..." : "+ New Email Template"}
        </button>
      </header>

      {templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M22 7L13.03 12.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
          <h2>No email templates yet</h2>
          <p>Create your first email template to get started</p>
          <button onClick={createTemplate} className="create-btn large">
            Create Email Template
          </button>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => router.push(`/email/${template.id}`)}
            >
              <div className="card-preview">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7L13.03 12.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <div className="card-content">
                <h3>{template.name}</h3>
                {template.subject && (
                  <p className="template-subject">Subject: {template.subject}</p>
                )}
                <div className="card-meta">
                  <span className={`status-badge ${template.status}`}>
                    {template.status}
                  </span>
                  <span className="date">
                    {new Date(template.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="card-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/email/preview/${template.id}`, "_blank");
                  }}
                  className="action-btn"
                  title="Preview"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <button
                  onClick={(e) => duplicateTemplate(template, e)}
                  className="action-btn"
                  title="Duplicate"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </button>
                <button
                  onClick={(e) => deleteTemplate(template.id, e)}
                  className="action-btn delete"
                  title="Delete"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{pageStyles}</style>
    </div>
  );
}

const pageStyles = `
  .email-templates-page {
    min-height: 100vh;
    background: #f9fafb;
    padding: 32px;
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50vh;
    color: #6b7280;
    font-size: 16px;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 32px;
    max-width: 1200px;
    margin-left: auto;
    margin-right: auto;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .back-link {
    color: #6b7280;
    text-decoration: none;
    font-size: 14px;
    margin-bottom: 8px;
  }

  .back-link:hover {
    color: #374151;
  }

  .page-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: #111827;
    margin: 0;
  }

  .subtitle {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
  }

  .create-btn {
    padding: 10px 20px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .create-btn:hover:not(:disabled) {
    background: #2563eb;
  }

  .create-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .create-btn.large {
    padding: 14px 28px;
    font-size: 16px;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
  }

  .empty-icon {
    color: #d1d5db;
    margin-bottom: 24px;
  }

  .empty-state h2 {
    font-size: 20px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .empty-state p {
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .template-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .template-card:hover {
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .card-preview {
    height: 140px;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
  }

  .card-content {
    padding: 16px;
  }

  .card-content h3 {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 4px 0;
  }

  .template-subject {
    font-size: 13px;
    color: #6b7280;
    margin: 0 0 12px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .card-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .status-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
    text-transform: capitalize;
  }

  .status-badge.draft {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.published {
    background: #d1fae5;
    color: #065f46;
  }

  .date {
    font-size: 12px;
    color: #9ca3af;
  }

  .card-actions {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    border-top: 1px solid #f3f4f6;
    background: #fafafa;
  }

  .action-btn {
    padding: 8px;
    background: none;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .action-btn:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .action-btn.delete:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }
`;
