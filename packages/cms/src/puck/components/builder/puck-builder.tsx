"use client";

import { useState, useCallback } from "react";
import { Puck } from "@measured/puck";
import type { Config, Data, Plugin } from "@measured/puck";
import { ActivityBar } from "./activity-bar";
import { ActivityPanel } from "./activity-panel";
import { BuilderHeader } from "./builder-header";
import { RightPanel } from "./right-panel";
import { BottomPanel } from "./bottom-panel";
import type { ActivityView, Viewport, BuilderPage } from "./types";
import { cn } from "@/lib/utils";

// Import Puck styles
import "@measured/puck/puck.css";

interface PuckBuilderProps {
  config: Config;
  data: Data;
  onPublish: (data: Data) => void;
  page?: BuilderPage;
  onBack?: () => void;
  headerActions?: React.ReactNode;
  plugins?: Plugin[];
  children?: React.ReactNode; // For dialogs and other overlays
}

/**
 * PuckBuilder - A professional page builder UI wrapping Puck editor
 *
 * Uses VS Code-style layout:
 * - Activity Bar (left icons)
 * - Activity Panel (left sidebar content)
 * - Canvas (center - Puck preview)
 * - Right Panel (inspector/properties)
 * - Bottom Panel (console/preview modes)
 */
export function PuckBuilder({
  config,
  data,
  onPublish,
  page,
  onBack,
  headerActions,
  plugins = [],
  children,
}: PuckBuilderProps) {
  // UI State
  const [activeView, setActiveView] = useState<ActivityView>("blocks");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [zoom, setZoom] = useState(100);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(true);

  // Viewport dimensions
  const viewportWidths: Record<Viewport, string> = {
    desktop: "100%",
    tablet: "768px",
    mobile: "375px",
  };

  const handlePublish = useCallback((publishedData: Data) => {
    onPublish(publishedData);
  }, [onPublish]);

  return (
    <Puck
      config={config}
      data={data}
      onPublish={handlePublish}
      plugins={plugins}
    >
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header - Uses Puck context for undo/redo */}
        <BuilderHeader
          viewport={viewport}
          setViewport={setViewport}
          zoom={zoom}
          setZoom={setZoom}
          page={page}
          onBack={onBack}
          onPublish={() => {
            // Trigger Puck's internal publish
            const publishButton = document.querySelector('[data-puck-action="publish"]') as HTMLButtonElement;
            if (publishButton) {
              publishButton.click();
            }
          }}
          headerActions={headerActions}
        />

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Activity Bar - Icon strip */}
          <ActivityBar
            activeView={activeView}
            onViewChange={setActiveView}
          />

          {/* Activity Panel - Sidebar content (uses Puck.Components for blocks) */}
          <ActivityPanel activeView={activeView} />

          {/* Canvas + Bottom Panel Container */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Canvas Area */}
            <div className="flex-1 bg-muted/50 overflow-hidden relative">
              {/* Canvas Container with zoom and viewport */}
              <div
                className="absolute inset-4 overflow-auto flex items-start justify-center"
              >
                <div
                  className={cn(
                    "bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300",
                    viewport !== "desktop" && "mx-auto"
                  )}
                  style={{
                    width: viewportWidths[viewport],
                    maxWidth: viewport === "desktop" ? "none" : viewportWidths[viewport],
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "top center",
                    minHeight: "100%",
                  }}
                >
                  {/* Puck Preview - The actual editable canvas */}
                  <Puck.Preview />
                </div>
              </div>

              {/* Viewport indicator */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs text-muted-foreground border border-border">
                {viewport.charAt(0).toUpperCase() + viewport.slice(1)} • {viewportWidths[viewport]} • {zoom}%
              </div>
            </div>

            {/* Bottom Panel */}
            <BottomPanel
              collapsed={bottomPanelCollapsed}
              onToggleCollapse={() => setBottomPanelCollapsed(!bottomPanelCollapsed)}
            />
          </div>

          {/* Right Panel - Inspector */}
          <RightPanel
            collapsed={rightPanelCollapsed}
            onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          />
        </div>
      </div>

      {/* Dialogs and overlays */}
      {children}
    </Puck>
  );
}

export default PuckBuilder;
