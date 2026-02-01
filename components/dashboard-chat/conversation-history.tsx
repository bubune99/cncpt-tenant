"use client"

/**
 * Dashboard Conversation History Component
 *
 * Displays past conversations stored in local Zustand state.
 * Allows resuming or deleting conversations.
 */

import { MessageSquare, Clock, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  useDashboardChatStore,
  useDashboardChatHistory,
} from "./store"

interface ConversationHistoryProps {
  onSelectConversation: (id: string) => void
  onClose: () => void
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - new Date(date).getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(date).toLocaleDateString()
}

export function ConversationHistory({
  onSelectConversation,
  onClose,
}: ConversationHistoryProps) {
  const conversationId = useDashboardChatStore((s) => s.conversationId)
  const {
    conversationHistory,
    removeFromHistory,
    clearHistory,
  } = useDashboardChatHistory()

  // Clear all conversations
  const handleClearAll = () => {
    if (!confirm("Clear all conversation history?")) return
    clearHistory()
    onClose()
  }

  if (conversationHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">No conversation history</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Start a new conversation to see it here
        </p>
        <Button onClick={onClose} variant="outline">
          Start New Conversation
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with clear all button */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {conversationHistory.length} conversation
            {conversationHistory.length !== 1 ? "s" : ""}
          </span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </TooltipTrigger>
            <TooltipContent>Clear all history</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversationHistory.map((conv) => {
            const isActive = conv.id === conversationId

            return (
              <div key={conv.id} className="group relative">
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-all duration-200",
                    "hover:bg-muted/50",
                    isActive && "bg-primary/5 ring-1 ring-primary/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-md",
                        "bg-muted/80",
                        isActive && "bg-primary/10"
                      )}
                    >
                      <MessageSquare
                        className={cn(
                          "h-4 w-4",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isActive && "text-primary"
                          )}
                        >
                          {conv.title || "Untitled Chat"}
                        </span>
                        {isActive && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {conv.lastMessage || "No messages"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.context?.type && conv.context.type !== "general" && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded capitalize">
                            {conv.context.type}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatRelativeTime(new Date(conv.updatedAt))}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromHistory(conv.id)
                        }}
                        className={cn(
                          "absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100",
                          "hover:bg-destructive/10 hover:text-destructive transition-all"
                        )}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove from history</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
