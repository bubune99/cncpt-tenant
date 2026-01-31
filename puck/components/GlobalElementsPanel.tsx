"use client";

import React, { useState, useEffect } from "react";

interface GlobalSettings {
  isGlobal: boolean;
  scope: "all" | "selected";
  selectedPages: string[];
  excludedPages: string[];
}

interface GlobalElement {
  type: "Header" | "Footer";
  sourcePageId: string;
  componentData: Record<string, unknown>;
  globalSettings: GlobalSettings;
}

interface GlobalElementsPanelProps {
  onEditHeader: () => void;
  onEditFooter: () => void;
  currentView: "page" | "header" | "footer";
}

export function GlobalElementsPanel({
  onEditHeader,
  onEditFooter,
  currentView,
}: GlobalElementsPanelProps) {
  const [globalHeaders, setGlobalHeaders] = useState<GlobalElement[]>([]);
  const [globalFooters, setGlobalFooters] = useState<GlobalElement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalElements();
  }, []);

  const fetchGlobalElements = async () => {
    try {
      const res = await fetch("/api/global-elements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list-all" }),
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalHeaders(data.headers || []);
        setGlobalFooters(data.footers || []);
      }
    } catch (error) {
      console.error("Failed to fetch global elements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScopeLabel = (settings: GlobalSettings) => {
    if (settings.scope === "all") {
      if (settings.excludedPages?.length > 0) {
        return `All pages except ${settings.excludedPages.length}`;
      }
      return "All pages";
    }
    return `${settings.selectedPages?.length || 0} selected pages`;
  };

  if (loading) {
    return (
      <div className="global-elements-panel loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="global-elements-panel">
      {/* Info Section */}
      <div className="panel-section info-section">
        <div className="info-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p>
            Global Headers and Footers are now configured directly on their components.
            Add a Header or Footer to any page, then enable "Make Global" in its settings.
          </p>
        </div>
      </div>

      {/* Global Headers */}
      <div className="panel-section">
        <h3 className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="6" rx="1" />
            <rect x="3" y="12" width="18" height="9" rx="1" opacity="0.3" />
          </svg>
          Global Headers
        </h3>

        {globalHeaders.length === 0 ? (
          <div className="empty-state">
            <p>No global headers defined yet.</p>
            <p className="hint">
              Add a Header component to any page and enable "Make Global" in its settings.
            </p>
          </div>
        ) : (
          <div className="elements-list">
            {globalHeaders.map((header, index) => (
              <div key={index} className="element-card">
                <div className="element-header">
                  <span className="element-type">Header</span>
                  <span className="element-badge global">Global</span>
                </div>
                <div className="element-details">
                  <div className="detail-row">
                    <span className="label">Source Page:</span>
                    <a
                      href={`/editor/${header.sourcePageId}`}
                      className="source-link"
                    >
                      {header.sourcePageId}
                    </a>
                  </div>
                  <div className="detail-row">
                    <span className="label">Applies to:</span>
                    <span className="scope">{getScopeLabel(header.globalSettings)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Footers */}
      <div className="panel-section">
        <h3 className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="9" rx="1" opacity="0.3" />
            <rect x="3" y="15" width="18" height="6" rx="1" />
          </svg>
          Global Footers
        </h3>

        {globalFooters.length === 0 ? (
          <div className="empty-state">
            <p>No global footers defined yet.</p>
            <p className="hint">
              Add a Footer component to any page and enable "Make Global" in its settings.
            </p>
          </div>
        ) : (
          <div className="elements-list">
            {globalFooters.map((footer, index) => (
              <div key={index} className="element-card">
                <div className="element-header">
                  <span className="element-type">Footer</span>
                  <span className="element-badge global">Global</span>
                </div>
                <div className="element-details">
                  <div className="detail-row">
                    <span className="label">Source Page:</span>
                    <a
                      href={`/editor/${footer.sourcePageId}`}
                      className="source-link"
                    >
                      {footer.sourcePageId}
                    </a>
                  </div>
                  <div className="detail-row">
                    <span className="label">Applies to:</span>
                    <span className="scope">{getScopeLabel(footer.globalSettings)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="panel-section">
        <h3 className="section-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Quick Tips
        </h3>
        <ul className="tips-list">
          <li>Headers/Footers marked as global will appear on other pages automatically</li>
          <li>Pages with their own Header/Footer will use those instead of global ones</li>
          <li>Use "Scope" to limit which pages receive the global element</li>
          <li>Use "Exclude Pages" to skip specific pages</li>
        </ul>
      </div>

      <style>{`
        .global-elements-panel {
          padding: 12px;
          height: 100%;
          overflow-y: auto;
        }

        .global-elements-panel.loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .panel-section {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-section:last-child {
          border-bottom: none;
        }

        .info-section {
          margin-bottom: 16px;
        }

        .info-box {
          display: flex;
          gap: 10px;
          padding: 12px;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          font-size: 12px;
          color: #1e40af;
          line-height: 1.5;
        }

        .info-box svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .info-box p {
          margin: 0;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
        }

        .section-title svg {
          color: #6b7280;
        }

        .empty-state {
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          text-align: center;
        }

        .empty-state p {
          margin: 0;
          font-size: 13px;
          color: #6b7280;
        }

        .empty-state .hint {
          margin-top: 8px;
          font-size: 12px;
          color: #9ca3af;
        }

        .elements-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .element-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .element-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .element-type {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
        }

        .element-badge {
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 600;
          border-radius: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .element-badge.global {
          background: #dcfce7;
          color: #166534;
        }

        .element-details {
          padding: 10px 12px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-row .label {
          font-size: 11px;
          color: #6b7280;
        }

        .source-link {
          font-size: 12px;
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }

        .source-link:hover {
          text-decoration: underline;
        }

        .scope {
          font-size: 12px;
          color: #374151;
          font-weight: 500;
        }

        .tips-list {
          margin: 0;
          padding: 0 0 0 20px;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.8;
        }

        .tips-list li {
          margin-bottom: 4px;
        }
      `}</style>
    </div>
  );
}
