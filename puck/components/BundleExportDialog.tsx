"use client";

import { useState, useCallback } from "react";
import { BundleExportOptions, BundleManifest } from "@/lib/cms/bundles/types";

interface BundleExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pageId: string;
  pageTitle: string;
}

type ExportStatus = "idle" | "exporting" | "success" | "error";

export function BundleExportDialog({
  isOpen,
  onClose,
  pageId,
  pageTitle,
}: BundleExportDialogProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [manifest, setManifest] = useState<BundleManifest | null>(null);

  // Export options
  const [includeAssets, setIncludeAssets] = useState(true);
  const [includeAnimations, setIncludeAnimations] = useState(true);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [author, setAuthor] = useState("");

  const handleExport = useCallback(async () => {
    setStatus("exporting");
    setError(null);

    try {
      const options: BundleExportOptions = {
        pageId,
        includeAssets,
        includeAnimations,
        metadata: {
          description: description || undefined,
          category: category || undefined,
          tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
          author: author || undefined,
        },
      };

      const response = await fetch("/api/bundles/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Export failed");
      }

      // Get the filename from headers
      const contentDisposition = response.headers.get("content-disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${pageId}.puckbundle`;

      // Get bundle metadata from headers
      const bundleId = response.headers.get("x-bundle-id");

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setStatus("success");

      // Auto-close after success
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  }, [
    pageId,
    includeAssets,
    includeAnimations,
    description,
    category,
    tags,
    author,
    onClose,
  ]);

  const resetState = () => {
    setStatus("idle");
    setError(null);
    setManifest(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Export Bundle</h2>
            <button
              onClick={() => {
                onClose();
                resetState();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Export "{pageTitle}" as a portable bundle
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {status === "idle" && (
            <>
              {/* Include Options */}
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeAssets}
                    onChange={(e) => setIncludeAssets(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Include Assets
                    </span>
                    <p className="text-xs text-gray-500">
                      Images, videos, and fonts used in the page
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeAnimations}
                    onChange={(e) => setIncludeAnimations(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      Include Animations
                    </span>
                    <p className="text-xs text-gray-500">
                      Custom and Lottie animation definitions
                    </p>
                  </div>
                </label>
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Optional Metadata
                </h3>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description of this page..."
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g., Landing Page"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="e.g., marketing, hero, modern"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}

          {status === "exporting" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-600">Creating bundle...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
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
              </div>
              <p className="mt-4 text-sm font-medium text-gray-900">
                Bundle exported successfully!
              </p>
              <p className="text-xs text-gray-500">Download started...</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-medium text-red-900">Export failed</p>
              <p className="text-xs text-red-600">{error}</p>
              <button
                onClick={resetState}
                className="mt-4 px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === "idle" && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
            <button
              onClick={() => {
                onClose();
                resetState();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Export Bundle
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BundleExportDialog;
