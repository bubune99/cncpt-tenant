"use client";

import React, { useState, useEffect } from "react";

interface Page {
  id: string;
  title: string;
  status?: string;
}

interface PageSelectorFieldProps {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  excludePageId?: string; // Exclude current page from selection
}

export function PageSelectorField({
  value = [],
  onChange,
  label = "Select Pages",
  excludePageId,
}: PageSelectorFieldProps) {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredPages = pages
    .filter((page) => page.id !== excludePageId)
    .filter(
      (page) =>
        page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        page.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const togglePage = (pageId: string) => {
    if (value.includes(pageId)) {
      onChange(value.filter((id) => id !== pageId));
    } else {
      onChange([...value, pageId]);
    }
  };

  const selectAll = () => {
    onChange(filteredPages.map((p) => p.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  if (loading) {
    return (
      <div className="page-selector-field">
        <div className="loading">Loading pages...</div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="page-selector-field">
      <div className="field-header">
        <span className="field-label">{label}</span>
        <span className="selected-count">{value.length} selected</span>
      </div>

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

      <div className="quick-actions">
        <button type="button" onClick={selectAll} className="action-btn">
          Select All
        </button>
        <button type="button" onClick={clearAll} className="action-btn">
          Clear All
        </button>
      </div>

      <div className="pages-list">
        {filteredPages.length === 0 ? (
          <div className="empty-state">
            {searchTerm ? "No pages match your search" : "No pages available"}
          </div>
        ) : (
          filteredPages.map((page) => (
            <label key={page.id} className="page-item">
              <input
                type="checkbox"
                checked={value.includes(page.id)}
                onChange={() => togglePage(page.id)}
                className="page-checkbox"
              />
              <div className="page-info">
                <span className="page-title">{page.title}</span>
                <span className="page-id">{page.id}</span>
              </div>
              {page.status && (
                <span className={`page-status ${page.status}`}>
                  {page.status}
                </span>
              )}
            </label>
          ))
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .page-selector-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .field-label {
    font-size: 12px;
    font-weight: 500;
    color: #374151;
  }

  .selected-count {
    font-size: 11px;
    color: #6b7280;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 10px;
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
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: #ffffff;
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

  .page-status {
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 500;
    border-radius: 4px;
    text-transform: capitalize;
  }

  .page-status.draft {
    background: #fef3c7;
    color: #92400e;
  }

  .page-status.published {
    background: #dcfce7;
    color: #166534;
  }

  .loading {
    padding: 20px;
    text-align: center;
    font-size: 12px;
    color: #6b7280;
  }
`;

export default PageSelectorField;
