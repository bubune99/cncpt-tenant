"use client";

import { useState, useEffect, useCallback } from "react";

interface CustomComponent {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  category: string;
  tags: string[];
  sourceUrl?: string;
  version: number;
  status: "DRAFT" | "ACTIVE" | "DEPRECATED" | "ARCHIVED";
  isPublished: boolean;
  language: string;
  dependencies: string[];
  complexity: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomComponentsPanelProps {
  onOpenImport?: () => void;
}

export function CustomComponentsPanel({ onOpenImport }: CustomComponentsPanelProps) {
  const [components, setComponents] = useState<CustomComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<string[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchComponents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedStatus) params.set("status", selectedStatus);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/v0/components?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch components");
      }

      setComponents(data.components);
      setTotalPages(data.pagination.totalPages);
      setCategories(data.filters.categories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load components");
    } finally {
      setLoading(false);
    }
  }, [page, selectedCategory, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchComponents();
  }, [fetchComponents]);

  const handlePublish = async (id: string, publish: boolean) => {
    try {
      const response = await fetch(`/api/v0/components/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isPublished: publish,
          status: publish ? "ACTIVE" : "DRAFT",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update component");
      }

      fetchComponents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/v0/components/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete component");
      }

      fetchComponents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (isPublished) {
      return (
        <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
          Published
        </span>
      );
    }

    switch (status) {
      case "DRAFT":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
            Draft
          </span>
        );
      case "DEPRECATED":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
            Deprecated
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-600 rounded">
            Archived
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
            Active
          </span>
        );
    }
  };

  const getComplexityBadge = (complexity: string) => {
    switch (complexity) {
      case "simple":
        return (
          <span className="px-1.5 py-0.5 text-xs bg-green-50 text-green-600 rounded">
            Simple
          </span>
        );
      case "moderate":
        return (
          <span className="px-1.5 py-0.5 text-xs bg-yellow-50 text-yellow-600 rounded">
            Moderate
          </span>
        );
      case "complex":
        return (
          <span className="px-1.5 py-0.5 text-xs bg-red-50 text-red-600 rounded">
            Complex
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Custom Components</h3>
          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            + Import v0
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search components..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="DEPRECATED">Deprecated</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {error && (
          <div className="p-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-700">{error}</p>
              <button
                onClick={fetchComponents}
                className="mt-2 text-xs text-red-600 hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!loading && !error && components.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <svg
              className="w-12 h-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="mt-4 text-sm text-gray-600">No custom components yet</p>
            <p className="mt-1 text-xs text-gray-400">
              Import your first component from v0.dev
            </p>
            <button
              onClick={onOpenImport}
              className="mt-4 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              Import Component
            </button>
          </div>
        )}

        {!loading && !error && components.length > 0 && (
          <div className="divide-y divide-gray-100">
            {components.map((component) => (
              <div
                key={component.id}
                className="px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {component.displayName}
                      </h4>
                      {getStatusBadge(component.status, component.isPublished)}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500 truncate">
                      {component.name}
                    </p>
                    {component.description && (
                      <p className="mt-1 text-xs text-gray-400 line-clamp-2">
                        {component.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {component.category}
                      </span>
                      {getComplexityBadge(component.complexity)}
                      <span className="text-xs text-gray-400">
                        v{component.version}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!component.isPublished ? (
                      <button
                        onClick={() => handlePublish(component.id, true)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Publish"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePublish(component.id, false)}
                        className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                        title="Unpublish"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(component.id, component.displayName)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default CustomComponentsPanel;
