"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Upload,
  Grid3X3,
  List,
  Sparkles,
  Send,
  Clock,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePuck, Puck } from "@measured/puck";
import type { ActivityView } from "./types";

interface ActivityPanelProps {
  activeView: ActivityView;
}

export function ActivityPanel({ activeView }: ActivityPanelProps) {
  const { appState } = usePuck();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [aiMessage, setAiMessage] = useState("");

  const renderPanelHeader = (title: string, showViewToggle = false) => (
    <div className="p-3 border-b border-border flex items-center justify-between">
      <span className="font-medium text-sm">{title}</span>
      {showViewToggle && (
        <div className="flex items-center gap-1 bg-secondary rounded-md p-0.5">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-background/50"
            )}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-background/50"
            )}
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );

  const renderSearch = (placeholder: string) => (
    <div className="p-3 border-b border-border">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-9 bg-input border-0"
        />
      </div>
    </div>
  );

  // Blocks & Elements View - Uses Puck's built-in Components drawer
  if (activeView === "blocks") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Blocks & Elements")}
        <ScrollArea className="flex-1">
          <div className="puck-components-panel">
            {/* Use Puck's built-in Components which handles drag-and-drop correctly */}
            <Puck.Components />
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Layers View - Shows outline of current content
  if (activeView === "layers") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Layers")}
        {renderSearch("Search layers...")}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <Puck.Outline />
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Images View
  if (activeView === "images") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Images", true)}
        <Tabs defaultValue="gallery" className="flex-1 flex flex-col">
          <TabsList className="mx-3 mt-2 grid grid-cols-2">
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="gallery" className="flex-1 m-0 p-3">
            <p className="text-xs text-muted-foreground text-center py-8">
              Media library coming soon...
            </p>
          </TabsContent>
          <TabsContent value="upload" className="flex-1 m-0 p-3">
            <div className="h-full flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Upload Images</p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to upload
                </p>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 transition-colors">
                Browse Files
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // AI Assistant View
  if (activeView === "ai") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("AI Assistant")}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-3">
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                <div>
                  <p className="text-sm">How can I help you build your page?</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask me to generate sections, improve content, or suggest designs.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick Actions</p>
              <button className="w-full p-2 text-left text-sm rounded-lg border border-border hover:bg-secondary transition-colors">
                Generate hero section
              </button>
              <button className="w-full p-2 text-left text-sm rounded-lg border border-border hover:bg-secondary transition-colors">
                Improve copy for selected
              </button>
              <button className="w-full p-2 text-left text-sm rounded-lg border border-border hover:bg-secondary transition-colors">
                Suggest color palette
              </button>
            </div>
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask AI anything..."
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              className="flex-1 h-9 bg-input border-0"
            />
            <button className="p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Styles View
  if (activeView === "styles") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("Global Styles")}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Colors</p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  "#3B82F6",
                  "#10B981",
                  "#F59E0B",
                  "#EF4444",
                  "#8B5CF6",
                  "#EC4899",
                  "#06B6D4",
                  "#84CC16",
                  "#F97316",
                  "#6366F1",
                ].map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded-lg border border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Spacing</p>
              <div className="space-y-2">
                {["xs", "sm", "md", "lg", "xl"].map((size) => (
                  <div
                    key={size}
                    className="flex items-center justify-between p-2 rounded-lg bg-card border border-border"
                  >
                    <span className="text-xs uppercase">{size}</span>
                    <span className="text-xs text-muted-foreground">
                      {size === "xs"
                        ? "4px"
                        : size === "sm"
                        ? "8px"
                        : size === "md"
                        ? "16px"
                        : size === "lg"
                        ? "24px"
                        : "32px"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // History View
  if (activeView === "history") {
    return (
      <div className="w-64 bg-sidebar flex flex-col border-r border-border">
        {renderPanelHeader("History")}
        <ScrollArea className="flex-1">
          <div className="p-3 text-center">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              History tracking coming soon...
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Use Undo/Redo in the header for now.
            </p>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Default / Coming Soon views
  return (
    <div className="w-64 bg-sidebar flex flex-col border-r border-border">
      {renderPanelHeader(activeView.charAt(0).toUpperCase() + activeView.slice(1))}
      <div className="flex-1 flex items-center justify-center p-6 text-center">
        <div>
          <Settings className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {activeView.charAt(0).toUpperCase() + activeView.slice(1)} panel
          </p>
          <p className="text-xs text-muted-foreground mt-1">Coming soon...</p>
        </div>
      </div>
    </div>
  );
}
