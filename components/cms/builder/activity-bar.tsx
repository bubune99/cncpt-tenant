"use client"
import React from "react"
import {
  Blocks,
  ImageIcon,
  Type,
  Link2,
  Menu,
  Settings,
  Layers,
  Palette,
  Code,
  Globe,
  Sparkles,
  FolderOpen,
  History,
  Users,
  ShoppingCart,
} from "lucide-react"
import { cn } from "@/lib/cms/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/cms/ui/tooltip"

export type ActivityView =
  | "blocks"
  | "images"
  | "typography"
  | "links"
  | "navigation"
  | "layers"
  | "styles"
  | "code"
  | "global"
  | "ai"
  | "assets"
  | "history"
  | "users"
  | "ecommerce"
  | "settings"

interface ActivityBarProps {
  activeView: ActivityView
  onViewChange: (view: ActivityView) => void
}

const topActivities: { id: ActivityView; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "blocks", icon: Blocks, label: "Blocks & Elements" },
  { id: "images", icon: ImageIcon, label: "Images" },
  { id: "typography", icon: Type, label: "Typography" },
  { id: "links", icon: Link2, label: "Links" },
  { id: "navigation", icon: Menu, label: "Navigation" },
  { id: "layers", icon: Layers, label: "Layers" },
]

const middleActivities: { id: ActivityView; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "styles", icon: Palette, label: "Global Styles" },
  { id: "code", icon: Code, label: "Custom Code" },
  { id: "global", icon: Globe, label: "Global Blocks" },
  { id: "ai", icon: Sparkles, label: "AI Assistant" },
]

const bottomActivities: { id: ActivityView; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { id: "assets", icon: FolderOpen, label: "Assets" },
  { id: "history", icon: History, label: "History" },
  { id: "users", icon: Users, label: "Users & Roles" },
  { id: "ecommerce", icon: ShoppingCart, label: "E-commerce" },
  { id: "settings", icon: Settings, label: "Settings" },
]

export function ActivityBar({ activeView, onViewChange }: ActivityBarProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <div className="w-12 bg-muted/30 border-r border-border flex flex-col shrink-0">
        {/* Top section - Main tools */}
        <div className="flex flex-col items-center py-2 gap-1">
          {topActivities.map((activity) => (
            <Tooltip key={activity.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewChange(activity.id)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg transition-all",
                    activeView === activity.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <activity.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {activity.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-2 border-t border-border" />

        {/* Middle section - Design tools */}
        <div className="flex flex-col items-center py-2 gap-1">
          {middleActivities.map((activity) => (
            <Tooltip key={activity.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewChange(activity.id)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg transition-all",
                    activeView === activity.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <activity.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {activity.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Divider */}
        <div className="mx-2 border-t border-border" />

        {/* Bottom section - Management */}
        <div className="flex flex-col items-center py-2 gap-1">
          {bottomActivities.map((activity) => (
            <Tooltip key={activity.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onViewChange(activity.id)}
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-lg transition-all",
                    activeView === activity.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  <activity.icon className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>
                {activity.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  )
}
