"use client";

import { useState, useCallback } from "react";
import type { ParsedV0Component, V0ImportResult } from '@/lib/cms/v0/types";

interface V0ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: V0ImportResult) => void;
}

type DialogStatus = "input" | "preview" | "importing" | "success" | "error";

export function V0ImportDialog({
  isOpen,
  onClose,
  onImportComplete,
}: V0ImportDialogProps) {
  const [status, setStatus] = useState<DialogStatus>("input");
  const [error, setError] = useState<string | null>(null);

  // Input state
  const [inputMode, setInputMode] = useState<"code" | "url">("code");
  const [code, setCode] = useState("");
  const [url, setUrl] = useState("");

  // Override options
  const [componentName, setComponentName] = useState("");
  const [category, setCategory] = useState("Custom");
  const [description, setDescription] = useState("");

  // Preview & result state
  const [previewData, setPreviewData] = useState<{
    parsed: ParsedV0Component;
    warnings: string[];
    requiredSetup: string[];
  } | null>(null);
  const [importResult, setImportResult] = useState<V0ImportResult | null>(null);

  const handlePreview = useCallback(async () => {
    if (inputMode === "code" && !code.trim()) {
      setError("Please paste your component code");
      return;
    }
    if (inputMode === "url" && !url.trim()) {
      setError("Please enter a v0.dev URL");
      return;
    }

    setStatus("importing");
    setError(null);

    try {
      const response = await fetch("/api/v0/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: inputMode === "code" ? code : undefined,
          url: inputMode === "url" ? url : undefined,
          name: componentName || undefined,
          category: category || undefined,
          description: description || undefined,
        }),
      });

      const data: V0ImportResult = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.errors?.join(", ") || "Import failed");
      }

      setImportResult(data);
      setStatus("success");
      onImportComplete?.(data);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Import failed");
    }
  }, [inputMode, code, url, componentName, category, description, onImportComplete]);

  const resetState = () => {
    setStatus("input");
    setError(null);
    setCode("");
    setUrl("");
    setComponentName("");
    setCategory("Custom");
    setDescription("");
    setPreviewData(null);
    setImportResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Import v0 Component
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Import React components from v0.dev into your Puck editor
              </p>
            </div>
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
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {status === "input" && (
            <div className="space-y-4">
              {/* Input Mode Tabs */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setInputMode("code")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    inputMode === "code"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Paste Code
                </button>
                <button
                  onClick={() => setInputMode("url")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 ${
                    inputMode === "url"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  From URL
                </button>
              </div>

              {/* Code Input */}
              {inputMode === "code" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component Code
                  </label>
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your v0 component code here..."
                    rows={12}
                    className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    spellCheck={false}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Copy the complete React/TypeScript code from v0.dev
                  </p>
                </div>
              )}

              {/* URL Input */}
              {inputMode === "url" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    v0.dev URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://v0.dev/t/..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Note: URL import requires the code to be publicly accessible
                  </p>
                </div>
              )}

              {/* Options */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Import Options (Optional)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Component Name
                    </label>
                    <input
                      type="text"
                      value={componentName}
                      onChange={(e) => setComponentName(e.target.value)}
                      placeholder="Auto-detect from code"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Custom">Custom</option>
                      <option value="Layout">Layout</option>
                      <option value="Content">Content</option>
                      <option value="Navigation">Navigation</option>
                      <option value="Forms">Forms</option>
                      <option value="Cards">Cards</option>
                      <option value="Hero">Hero</option>
                      <option value="Pricing">Pricing</option>
                      <option value="Testimonials">Testimonials</option>
                      <option value="Features">Features</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}

          {status === "importing" && (
            <div className="flex flex-col items-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-600">
                Parsing and importing component...
              </p>
            </div>
          )}

          {status === "success" && importResult && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6">
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
                  Component imported successfully!
                </p>
              </div>

              {/* Component Details */}
              {importResult.component && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    {importResult.component.displayName}
                  </h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>
                      <span className="font-medium">Name:</span>{" "}
                      {importResult.component.name}
                    </p>
                    <p>
                      <span className="font-medium">Category:</span>{" "}
                      {importResult.component.category}
                    </p>
                    {importResult.parsed && (
                      <>
                        <p>
                          <span className="font-medium">Language:</span>{" "}
                          {importResult.parsed.language}
                        </p>
                        <p>
                          <span className="font-medium">Props:</span>{" "}
                          {importResult.parsed.props.length} detected
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">
                    Warnings
                  </h4>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    {importResult.warnings.map((w, i) => (
                      <li key={i}>• {w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Required Setup */}
              {importResult.requiredSetup &&
                importResult.requiredSetup.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      Required Setup
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      {importResult.requiredSetup.map((s: string, i: number) => (
                        <li key={i}>
                          <code className="bg-blue-100 px-1 rounded">{s}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  The component has been saved as a draft. You can publish it from
                  the Components panel to make it available in the editor.
                </p>
              </div>
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
              <p className="text-xs text-red-600 text-center max-w-xs mt-1">
                {error}
              </p>
              <button
                onClick={() => setStatus("input")}
                className="mt-4 px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === "input" && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
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
              onClick={handlePreview}
              disabled={
                (inputMode === "code" && !code.trim()) ||
                (inputMode === "url" && !url.trim())
              }
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import Component
            </button>
          </div>
        )}

        {status === "success" && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
            <button
              onClick={resetState}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Import Another
            </button>
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

export default V0ImportDialog;
