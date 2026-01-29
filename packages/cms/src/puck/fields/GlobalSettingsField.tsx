"use client";

import React, { useState, useEffect } from "react";

interface GlobalSettings {
  isGlobal: boolean;
  scope: "all" | "selected";
  selectedPages: string[];
  excludedPages: string[];
}

interface Page {
  id: string;
  title: string;
  status?: string;
}

interface GlobalSettingsFieldProps {
  value: GlobalSettings;
  onChange: (value: GlobalSettings) => void;
}

export const defaultGlobalSettings: GlobalSettings = {
  isGlobal: false,
  scope: "all",
  selectedPages: [],
  excludedPages: [],
};

export function GlobalSettingsField({
  value = defaultGlobalSettings,
  onChange,
}: GlobalSettingsFieldProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"selected" | "excluded">("selected");

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await fetch("/api/pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (error) {
      console.error("Failed to fetch pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (updates: Partial<GlobalSettings>) => {
    onChange({ ...value, ...updates });
  };

  const filteredPages = pages.filter(
    (page) =>
      page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const togglePage = (pageId: string, list: "selectedPages" | "excludedPages") => {
    const currentList = value[list] || [];
    if (currentList.includes(pageId)) {
      updateSettings({ [list]: currentList.filter((id) => id !== pageId) });
    } else {
      updateSettings({ [list]: [...currentList, pageId] });
    }
  };

  const selectAllPages = (list: "selectedPages" | "excludedPages") => {
    updateSettings({ [list]: filteredPages.map((p) => p.id) });
  };

  const clearAllPages = (list: "selectedPages" | "excludedPages") => {
    updateSettings({ [list]: [] });
  };

  const currentList = activeTab === "selected" ? "selectedPages" : "excludedPages";
  const currentPageIds = value[currentList] || [];

  return (
    <div className="global-settings-field">
      {/* Global Toggle */}
      <div className="setting-section">
        <div className="setting-row">
          <span className="setting-label">Make Global</span>
          <div className="toggle-group">
            <button
              type="button"
              className={`toggle-btn ${value.isGlobal ? "active" : ""}`}
              onClick={() => updateSettings({ isGlobal: true })}
            >
              Yes
            </button>
            <button
              type="button"
              className={`toggle-btn ${!value.isGlobal ? "active" : ""}`}
              onClick={() => updateSettings({ isGlobal: false })}
            >
              No
            </button>
          </div>
        </div>
      </div>

      {value.isGlobal && (
        <>
          {/* Scope Selection */}
          <div className="setting-section">
            <div className="setting-row">
              <span className="setting-label">Apply To</span>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${value.scope === "all" ? "active" : ""}`}
                  onClick={() => updateSettings({ scope: "all" })}
                >
                  All Pages
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${value.scope === "selected" ? "active" : ""}`}
                  onClick={() => updateSettings({ scope: "selected" })}
                >
                  Selected
                </button>
              </div>
            </div>
          </div>

          {/* Page Selection Tabs */}
          <div className="setting-section">
            <div className="tabs">
              <button
                type="button"
                className={`tab ${activeTab === "selected" ? "active" : ""}`}
                onClick={() => setActiveTab("selected")}
              >
                Include Pages
                {value.selectedPages?.length > 0 && (
                  <span className="badge">{value.selectedPages.length}</span>
                )}
              </button>
              <button
                type="button"
                className={`tab ${activeTab === "excluded" ? "active" : ""}`}
                onClick={() => setActiveTab("excluded")}
              >
                Exclude Pages
                {value.excludedPages?.length > 0 && (
                  <span className="badge">{value.excludedPages.length}</span>
                )}
              </button>
            </div>

            {activeTab === "selected" && value.scope !== "selected" && (
              <div className="info-note">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <span>Switch to "Selected" scope to use include list</span>
              </div>
            )}

            {/* Search */}
            <div className="search-box">
              <svg
                className="search-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button type="button" onClick={() => selectAllPages(currentList)} className="action-btn">
                Select All
              </button>
              <button type="button" onClick={() => clearAllPages(currentList)} className="action-btn">
                Clear All
              </button>
            </div>

            {/* Pages List */}
            <div className="pages-list">
              {loading ? (
                <div className="empty-state">Loading pages...</div>
              ) : filteredPages.length === 0 ? (
                <div className="empty-state">
                  {searchTerm ? "No pages match your search" : "No pages available"}
                </div>
              ) : (
                filteredPages.map((page) => (
                  <label key={page.id} className="page-item">
                    <input
                      type="checkbox"
                      checked={currentPageIds.includes(page.id)}
                      onChange={() => togglePage(page.id, currentList)}
                      className="page-checkbox"
                    />
                    <div className="page-info">
                      <span className="page-title">{page.title}</span>
                      <span className="page-id">{page.id}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        .global-settings-field {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .setting-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .setting-label {
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        .toggle-group {
          display: flex;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #e5e7eb;
        }

        .toggle-btn {
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 500;
          background: #ffffff;
          color: #6b7280;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .toggle-btn:first-child {
          border-right: 1px solid #e5e7eb;
        }

        .toggle-btn.active {
          background: #3b82f6;
          color: #ffffff;
        }

        .toggle-btn:hover:not(.active) {
          background: #f9fafb;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 8px;
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab:hover {
          color: #374151;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .badge {
          padding: 1px 6px;
          font-size: 10px;
          font-weight: 600;
          background: #3b82f6;
          color: white;
          border-radius: 10px;
        }

        .info-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          font-size: 11px;
          color: #92400e;
          background: #fef3c7;
          border-radius: 6px;
          margin-bottom: 8px;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          color: #9ca3af;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 32px;
          font-size: 13px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .quick-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .action-btn {
          flex: 1;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 500;
          color: #6b7280;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .action-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .pages-list {
          max-height: 180px;
          overflow-y: auto;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #ffffff;
          margin-top: 8px;
        }

        .empty-state {
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
        }

        .page-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.15s ease;
          border-bottom: 1px solid #f3f4f6;
        }

        .page-item:last-child {
          border-bottom: none;
        }

        .page-item:hover {
          background: #f9fafb;
        }

        .page-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .page-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .page-title {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .page-id {
          font-size: 11px;
          color: #9ca3af;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      `}</style>
    </div>
  );
}

export default GlobalSettingsField;
