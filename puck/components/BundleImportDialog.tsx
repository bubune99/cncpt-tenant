"use client";

import { useState, useCallback, useRef } from "react";
import { BundleManifest, BundleImportResult, ImportStatus } from '@/lib/cms/bundles/types";

interface BundleImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: BundleImportResult) => void;
}

type DialogStatus = "select" | "preview" | "importing" | "success" | "error";

interface PreviewData {
  manifest: BundleManifest;
  assetCount: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function BundleImportDialog({
  isOpen,
  onClose,
  onImportComplete,
}: BundleImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<DialogStatus>("select");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [importResult, setImportResult] = useState<BundleImportResult | null>(null);
  const [progress, setProgress] = useState(0);

  // Import options
  const [targetSlug, setTargetSlug] = useState("");
  const [storageProvider, setStorageProvider] = useState<string>("local");

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setSelectedFile(file);
      setStatus("preview");
      setError(null);

      // Preview the bundle
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("preview", "true");

        const response = await fetch("/api/bundles", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to preview bundle");
        }

        setPreviewData(data);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Failed to read bundle");
      }
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;

    setStatus("importing");
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (targetSlug) formData.append("targetSlug", targetSlug);
      formData.append("storageProvider", storageProvider);

      const response = await fetch("/api/bundles", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setImportResult(data);
      setStatus("success");
      onImportComplete?.(data);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Import failed");
    }
  }, [selectedFile, targetSlug, storageProvider, onImportComplete]);

  const resetState = () => {
    setStatus("select");
    setError(null);
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setProgress(0);
    setTargetSlug("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      const file = event.dataTransfer.files[0];
      if (file && (file.name.endsWith(".puckbundle") || file.name.endsWith(".zip"))) {
        setSelectedFile(file);
        setStatus("preview");

        // Preview the bundle
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("preview", "true");

          const response = await fetch("/api/bundles", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to preview bundle");
          }

          setPreviewData(data);
        } catch (err) {
          setStatus("error");
          setError(err instanceof Error ? err.message : "Failed to read bundle");
        }
      } else {
        setError("Please drop a .puckbundle file");
      }
    },
    []
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Import Bundle</h2>
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
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {status === "select" && (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".puckbundle,.zip"
                onChange={handleFileSelect}
                className="hidden"
              />
              <svg
                className="w-12 h-12 mx-auto text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="mt-4 text-sm font-medium text-gray-900">
                Drop your .puckbundle file here
              </p>
              <p className="mt-1 text-xs text-gray-500">or click to browse</p>
            </div>
          )}

          {status === "preview" && previewData && (
            <div className="space-y-4">
              {/* Bundle Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {previewData.manifest.page.title}
                    </h3>
                    {previewData.manifest.page.description && (
                      <p className="text-sm text-gray-500">
                        {previewData.manifest.page.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="px-2 py-1 bg-gray-200 rounded">
                        {previewData.assetCount} assets
                      </span>
                      {previewData.manifest.page.category && (
                        <span className="px-2 py-1 bg-gray-200 rounded">
                          {previewData.manifest.page.category}
                        </span>
                      )}
                      <span className="px-2 py-1 bg-gray-200 rounded">
                        v{previewData.manifest.version}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {previewData.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Warnings
                  </h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {previewData.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {previewData.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-800 mb-1">Errors</h4>
                  <ul className="text-xs text-red-700 space-y-1">
                    {previewData.errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Import Options */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Target Page Slug (optional)
                  </label>
                  <input
                    type="text"
                    value={targetSlug}
                    onChange={(e) => setTargetSlug(e.target.value)}
                    placeholder="Leave empty to auto-generate"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Storage Provider
                  </label>
                  <select
                    value={storageProvider}
                    onChange={(e) => setStorageProvider(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="local">Local Storage (Development)</option>
                    <option value="s3">Amazon S3</option>
                    <option value="r2">Cloudflare R2</option>
                    <option value="vercel-blob">Vercel Blob</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {status === "importing" && (
            <div className="flex flex-col items-center py-8">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-600">Importing bundle...</p>
              {progress > 0 && (
                <div className="w-full mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {progress}%
                  </p>
                </div>
              )}
            </div>
          )}

          {status === "success" && importResult && (
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
                Import successful!
              </p>
              <p className="text-xs text-gray-500">
                Page ID: {importResult.pageId}
              </p>
              {importResult.assets.total > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {importResult.assets.uploaded} of {importResult.assets.total} assets
                  uploaded
                </p>
              )}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="mt-4 w-full bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <p className="text-xs text-yellow-700">
                    {importResult.warnings.length} warning(s) during import
                  </p>
                </div>
              )}
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
              <p className="mt-4 text-sm font-medium text-red-900">Import failed</p>
              <p className="text-xs text-red-600 text-center max-w-xs">{error}</p>
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
        {(status === "select" || status === "preview") && (
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
            {status === "preview" && previewData?.valid && (
              <button
                onClick={handleImport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Import Bundle
              </button>
            )}
          </div>
        )}

        {status === "success" && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg">
            <button
              onClick={() => {
                onClose();
                resetState();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BundleImportDialog;
