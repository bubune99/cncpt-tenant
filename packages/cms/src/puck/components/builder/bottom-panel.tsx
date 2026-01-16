"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  ChevronDown,
  Terminal,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Code,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePuck } from "@measured/puck";

interface BottomPanelProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

type LogLevel = "info" | "warning" | "error" | "success";

interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
}

export function BottomPanel({ collapsed = true, onToggleCollapse }: BottomPanelProps) {
  const { appState } = usePuck();
  const [activeTab, setActiveTab] = useState<"console" | "json" | "preview">("console");

  // Sample console logs (in real implementation, these would be actual logs)
  const logs: LogEntry[] = [
    { id: "1", level: "info", message: "Editor initialized", timestamp: new Date() },
    { id: "2", level: "success", message: "Content loaded successfully", timestamp: new Date() },
  ];

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (collapsed) {
    return (
      <div className="h-8 border-t border-border bg-sidebar flex items-center px-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-xs gap-1"
          onClick={onToggleCollapse}
        >
          <ChevronUp className="h-3 w-3" />
          Console
        </Button>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Ready
          </span>
          <span>{appState.data.content.length} components</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-48 border-t border-border bg-sidebar flex flex-col shrink-0">
      {/* Header */}
      <div className="h-8 border-b border-border flex items-center px-2 shrink-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1">
          <TabsList className="h-7 bg-transparent gap-1">
            <TabsTrigger value="console" className="h-6 px-2 text-xs data-[state=active]:bg-secondary">
              <Terminal className="h-3 w-3 mr-1" />
              Console
            </TabsTrigger>
            <TabsTrigger value="json" className="h-6 px-2 text-xs data-[state=active]:bg-secondary">
              <Code className="h-3 w-3 mr-1" />
              JSON
            </TabsTrigger>
            <TabsTrigger value="preview" className="h-6 px-2 text-xs data-[state=active]:bg-secondary">
              <Eye className="h-3 w-3 mr-1" />
              Data Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onToggleCollapse}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "console" && (
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 py-1">
                  {getLogIcon(log.level)}
                  <span className="text-muted-foreground">
                    [{log.timestamp.toLocaleTimeString()}]
                  </span>
                  <span className={cn(
                    log.level === "error" && "text-destructive",
                    log.level === "warning" && "text-yellow-500",
                    log.level === "success" && "text-green-500"
                  )}>
                    {log.message}
                  </span>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-muted-foreground text-center py-4">
                  No console output
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {activeTab === "json" && (
          <ScrollArea className="h-full">
            <pre className="p-2 font-mono text-xs text-muted-foreground">
              {JSON.stringify(appState.data, null, 2)}
            </pre>
          </ScrollArea>
        )}

        {activeTab === "preview" && (
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="p-2 rounded bg-secondary">
                  <div className="text-muted-foreground">Components</div>
                  <div className="text-lg font-semibold">{appState.data.content.length}</div>
                </div>
                <div className="p-2 rounded bg-secondary">
                  <div className="text-muted-foreground">Zones</div>
                  <div className="text-lg font-semibold">{Object.keys(appState.data.zones || {}).length}</div>
                </div>
                <div className="p-2 rounded bg-secondary">
                  <div className="text-muted-foreground">Selected</div>
                  <div className="text-lg font-semibold">
                    {appState.ui.itemSelector ? "Yes" : "None"}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <strong>Component Types:</strong>{" "}
                {[...new Set(appState.data.content.map((c) => c.type))].join(", ") || "None"}
              </div>
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
