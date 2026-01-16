"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  ChevronRight,
  Layers,
  Settings,
  Palette,
  MousePointer,
  PanelRightClose,
  PanelRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePuck, Puck } from "@measured/puck";
import type { RightPanelTab } from "./types";
import { Button } from "@/components/ui/button";

interface RightPanelProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function RightPanel({ collapsed = false, onToggleCollapse }: RightPanelProps) {
  const { appState } = usePuck();
  const [activeTab, setActiveTab] = useState<RightPanelTab>("inspector");

  const selectedItem = appState.ui.itemSelector;
  const hasSelection = selectedItem !== null;

  if (collapsed) {
    return (
      <div className="w-10 bg-sidebar border-l border-border flex flex-col items-center py-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onToggleCollapse}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-sidebar border-l border-border flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-border flex items-center justify-between px-3 shrink-0">
        <span className="text-sm font-medium">
          {hasSelection ? "Inspector" : "Properties"}
        </span>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={onToggleCollapse}
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as RightPanelTab)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mx-3 mt-2 grid grid-cols-4 h-9">
          <TabsTrigger value="layers" className="text-xs">
            <Layers className="h-3.5 w-3.5 mr-1" />
            Layers
          </TabsTrigger>
          <TabsTrigger value="inspector" className="text-xs">
            <Settings className="h-3.5 w-3.5 mr-1" />
            Props
          </TabsTrigger>
          <TabsTrigger value="styles" className="text-xs">
            <Palette className="h-3.5 w-3.5 mr-1" />
            Style
          </TabsTrigger>
          <TabsTrigger value="interactions" className="text-xs">
            <MousePointer className="h-3.5 w-3.5 mr-1" />
            Actions
          </TabsTrigger>
        </TabsList>

        {/* Layers Tab - Use Puck's Outline */}
        <TabsContent value="layers" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              <Puck.Outline />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Inspector Tab - Use Puck's Fields */}
        <TabsContent value="inspector" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              {hasSelection ? (
                <Puck.Fields />
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select an element to edit its properties
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Styles Tab - Custom style controls */}
        <TabsContent value="styles" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              {hasSelection ? (
                <div className="space-y-4">
                  {/* Spacing Section */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      SPACING
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Margin</label>
                        <div className="h-8 px-2 bg-input rounded-md flex items-center text-sm">
                          auto
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Padding</label>
                        <div className="h-8 px-2 bg-input rounded-md flex items-center text-sm">
                          16px
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Size Section */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      SIZE
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Width</label>
                        <div className="h-8 px-2 bg-input rounded-md flex items-center text-sm">
                          100%
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Height</label>
                        <div className="h-8 px-2 bg-input rounded-md flex items-center text-sm">
                          auto
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typography Section */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      TYPOGRAPHY
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Style controls coming soon...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Palette className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select an element to edit styles
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              {hasSelection ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      CLICK ACTIONS
                    </h4>
                    <div className="space-y-2">
                      <button className="w-full p-2 text-left text-sm rounded-lg border border-dashed border-border hover:border-primary hover:bg-secondary/50 transition-colors">
                        + Add click action
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      HOVER EFFECTS
                    </h4>
                    <div className="space-y-2">
                      <button className="w-full p-2 text-left text-sm rounded-lg border border-dashed border-border hover:border-primary hover:bg-secondary/50 transition-colors">
                        + Add hover effect
                      </button>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">
                      ANIMATIONS
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Animation controls coming soon...
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MousePointer className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Select an element to add interactions
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
