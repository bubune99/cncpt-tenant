"use client";

import { useState, useCallback, useRef } from "react";

interface AnalyzedSection {
  name: string;
  type: "header" | "footer" | "hero" | "section";
  componentCount: number;
  sourceFile: string;
}

interface ThemeInfo {
  fonts: { serif?: string; sans?: string; mono?: string };
  colors: Record<string, string>;
}

interface AnalysisResult {
  sections: AnalyzedSection[];
  theme: ThemeInfo;
  pageTitle: string;
  totalSections: number;
  totalComponents: number;
}

interface ImportedTemplate {
  id: string;
  name: string;
  slug: string;
  type: string;
}

type DialogStatus =
  | "upload"
  | "processing"
  | "selection"
  | "importing"
  | "success"
  | "error";

interface V0ZipImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

const TYPE_BADGES: Record<string, { label: string; className: string }> = {
  header: { label: "Header", className: "bg-blue-100 text-blue-700" },
  footer: { label: "Footer", className: "bg-purple-100 text-purple-700" },
  hero: { label: "Hero", className: "bg-amber-100 text-amber-700" },
  section: { label: "Section", className: "bg-green-100 text-green-700" },
};

export function V0ZipImportDialog({
  isOpen,
  onClose,
  onImportComplete,
}: V0ZipImportDialogProps) {
  const [status, setStatus] = useState<DialogStatus>("upload");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [createFullPage, setCreateFullPage] = useState(true);
  const [importedTemplates, setImportedTemplates] = useState<ImportedTemplate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStatus("upload");
    setError(null);
    setFile(null);
    setAnalysis(null);
    setSelectedSections(new Set());
    setCreateFullPage(true);
    setImportedTemplates([]);
  };

  const handleFile = useCallback(async (zipFile: File) => {
    if (!zipFile.name.endsWith(".zip")) {
      setError("Please select a .zip file");
      return;
    }

    setFile(zipFile);
    setStatus("processing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", zipFile);

      const res = await fetch("/api/v0/zip", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }

      const data: AnalysisResult = await res.json();
      setAnalysis(data);
      setSelectedSections(new Set(data.sections.map((s) => s.name)));
      setStatus("selection");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze ZIP");
      setStatus("error");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleImport = useCallback(async () => {
    if (!file || !analysis) return;

    setStatus("importing");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "selectedSections",
        JSON.stringify(Array.from(selectedSections))
      );
      formData.append("createFullPage", String(createFullPage));

      const res = await fetch("/api/v0/zip/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Import failed");
      }

      const data = await res.json();
      setImportedTemplates(data.templates || []);
      setStatus("success");
      onImportComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStatus("error");
    }
  }, [file, analysis, selectedSections, createFullPage, onImportComplete]);

  const toggleSection = (name: string) => {
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectAll = () => {
    if (analysis) {
      setSelectedSections(new Set(analysis.sections.map((s) => s.name)));
    }
  };

  const deselectAll = () => {
    setSelectedSections(new Set());
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
                Import v0 ZIP
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Convert v0.dev ZIP exports into page templates
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
          {/* Upload state */}
          {status === "upload" && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center cursor-pointer">
                  <svg
                    className="w-10 h-10 text-gray-400 mb-3"
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
                  <p className="text-sm font-medium text-gray-700">
                    Drop your v0 ZIP file here
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    or click to browse
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  Export your v0.dev project as a ZIP file, then upload it here.
                  The engine will extract section components, parse theme settings,
                  and convert everything to page templates.
                </p>
              </div>
            </div>
          )}

          {/* Processing state */}
          {status === "processing" && (
            <div className="flex flex-col items-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-600">
                Analyzing ZIP structure...
              </p>
              {file && (
                <p className="text-xs text-gray-400 mt-1">{file.name}</p>
              )}
            </div>
          )}

          {/* Section selection */}
          {status === "selection" && analysis && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-900">
                  {analysis.pageTitle}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Found {analysis.totalSections} sections with{" "}
                  {analysis.totalComponents} total components
                </p>
                {/* Theme info */}
                {(analysis.theme.fonts.serif || analysis.theme.fonts.sans) && (
                  <p className="text-xs text-gray-500 mt-1">
                    Fonts:{" "}
                    {[analysis.theme.fonts.serif, analysis.theme.fonts.sans]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>

              {/* Select all / deselect all */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {selectedSections.size} of {analysis.sections.length} selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Select all
                  </button>
                  <button
                    onClick={deselectAll}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Deselect all
                  </button>
                </div>
              </div>

              {/* Section list */}
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 max-h-[300px] overflow-y-auto">
                {analysis.sections.map((section) => {
                  const badge = TYPE_BADGES[section.type] || TYPE_BADGES.section;
                  return (
                    <label
                      key={section.name}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSections.has(section.name)}
                        onChange={() => toggleSection(section.name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {section.name}
                          </span>
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {section.componentCount} components &middot;{" "}
                          {section.sourceFile}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Full page option */}
              <label className="flex items-center gap-3 px-4 py-3 bg-blue-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={createFullPage}
                  onChange={(e) => setCreateFullPage(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Also create full-page template
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Combines all selected sections into a single PAGE template
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Importing state */}
          {status === "importing" && (
            <div className="flex flex-col items-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              <p className="mt-4 text-sm text-gray-600">
                Creating templates...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Importing {selectedSections.size} sections
                {createFullPage ? " + full page" : ""}
              </p>
            </div>
          )}

          {/* Success state */}
          {status === "success" && (
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
                  Import complete!
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {importedTemplates.length} template
                  {importedTemplates.length !== 1 ? "s" : ""} created
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {importedTemplates.map((t) => (
                  <div key={t.id} className="px-4 py-3 flex items-center gap-3">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        t.type === "PAGE"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {t.type}
                    </span>
                    <span className="text-sm text-gray-900">{t.name}</span>
                  </div>
                ))}
              </div>

              <div className="bg-gray-100 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  Templates are now available in the Templates panel in the
                  editor. Click a template to insert it into your page.
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
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
              <p className="mt-4 text-sm font-medium text-red-900">
                Import failed
              </p>
              <p className="text-xs text-red-600 text-center max-w-xs mt-1">
                {error}
              </p>
              <button
                onClick={() => setStatus("upload")}
                className="mt-4 px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {status === "selection" && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
            <button
              onClick={() => {
                setStatus("upload");
                setFile(null);
                setAnalysis(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={selectedSections.size === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {selectedSections.size} Section
              {selectedSections.size !== 1 ? "s" : ""}
              {createFullPage ? " + Page" : ""}
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

        {status === "upload" && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end rounded-b-lg flex-shrink-0">
            <button
              onClick={() => {
                onClose();
                resetState();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default V0ZipImportDialog;
