"use client"

/**
 * Dashboard Chat Panel
 *
 * A persistent chat panel for the dashboard with AI assistant.
 * Uses Sheet-based layout matching the CMS admin chat pattern.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion } from "framer-motion"
import {
  MessageSquare,
  Sparkles,
  History,
  MessageSquarePlus,
  Minimize2,
  Maximize2,
  X,
  Send,
  Square,
  Bot,
  User,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  useDashboardChatPanel,
  useDashboardChatContext,
  useDashboardChatStore,
  useDashboardChatHistory,
  type DashboardChatContext,
} from "./store"
import { ConversationHistory } from "./conversation-history"
import ReactMarkdown from "react-markdown"

// Generate unique IDs
function generateUUID(): string {
  return crypto.randomUUID()
}

// Helper to extract text content from UIMessage parts
function getMessageText(message: UIMessage): string {
  if (!message.parts) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

// Check if message has tool invocations
function hasToolInvocations(message: UIMessage): boolean {
  if (!message.parts) return false
  return message.parts.some((p) => {
    const type = p.type as string
    return (
      type === "tool-invocation" ||
      type === "tool-call" ||
      type.startsWith("tool-")
    )
  })
}

// Context indicator component
function ContextIndicator({
  context,
}: {
  context: { type: string; subdomain?: string; teamId?: string }
}) {
  if (context.type === "general") {
    return null
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground capitalize">
        {context.type}
        {context.subdomain && `: ${context.subdomain}`}
      </span>
    </div>
  )
}

type ViewMode = "chat" | "history"

interface ChatPanelProps {
  className?: string
}

export function ChatPanel({ className }: ChatPanelProps) {
  const { mode, setMode, togglePanel, minimizePanel, expandPanel } =
    useDashboardChatPanel()
  const { context } = useDashboardChatContext()
  const conversationId = useDashboardChatStore((s) => s.conversationId)
  const startNewConversation = useDashboardChatStore(
    (s) => s.startNewConversation
  )
  const storeMessages = useDashboardChatStore((s) => s.messages)
  const { addToHistory, loadConversation } = useDashboardChatHistory()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [inputValue, setInputValue] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("chat")

  // Store context in ref to access in transport without causing re-renders
  const contextRef = useRef<DashboardChatContext>(context)
  useEffect(() => {
    contextRef.current = context
  }, [context])

  // Memoize transport to prevent recreation
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/dashboard-chat",
        fetch: async (url, options) => {
          const response = await fetch(url, options)
          if (!response.ok) {
            const error = await response.json().catch(() => ({}))
            throw new Error(error.message || "Chat request failed")
          }
          return response
        },
        prepareSendMessagesRequest(request) {
          return {
            body: {
              id: request.id,
              messages: request.messages,
              context: contextRef.current,
              ...request.body,
            },
          }
        },
      }),
    []
  )

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
    stop,
  } = useChat({
    id: conversationId || undefined,
    transport,
    experimental_throttle: 100,
    generateId: generateUUID,
    onError: (error) => {
      console.error("[dashboard-chat] Error:", error)
    },
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, status])

  // Focus input when panel opens
  useEffect(() => {
    if ((mode === "side" || mode === "full") && viewMode === "chat") {
      textareaRef.current?.focus()
    }
  }, [mode, viewMode])

  // Initialize conversation ID if needed
  useEffect(() => {
    if (!conversationId) {
      startNewConversation()
    }
  }, [conversationId, startNewConversation])

  // Save conversation to history when messages change
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user")
      const lastMessage = messages[messages.length - 1]

      // Convert UIMessage to stored format
      const storedMessages = messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant" | "system",
        content: getMessageText(m),
        parts: m.parts,
        timestamp: new Date(),
      }))

      addToHistory({
        id: conversationId,
        title: lastUserMessage
          ? getMessageText(lastUserMessage).slice(0, 50)
          : "New Chat",
        lastMessage: getMessageText(lastMessage).slice(0, 100),
        context: context,
        messages: storedMessages,
      })
    }
  }, [messages, conversationId, context, addToHistory])

  // Handle selecting a conversation from history
  const handleSelectConversation = useCallback(
    (id: string) => {
      // loadConversation updates store with saved messages
      loadConversation(id)

      // Get the loaded messages from store and set them in useChat
      const history = useDashboardChatStore.getState().conversationHistory.find((c) => c.id === id)
      if (history?.messages && history.messages.length > 0) {
        // Convert stored messages to UIMessage format
        const uiMessages = history.messages.map((m) => ({
          id: m.id,
          role: m.role,
          parts: m.parts || [{ type: "text" as const, text: m.content }],
        }))
        setMessages(uiMessages as any)
      } else {
        setMessages([])
      }
      setViewMode("chat")
    },
    [loadConversation, setMessages]
  )

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    setMessages([])
    setInputValue("")
    startNewConversation()
    setViewMode("chat")
  }, [setMessages, startNewConversation])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!inputValue.trim() || isLoading) return

      const message = inputValue.trim()
      setInputValue("")

      await sendMessage({
        role: "user" as const,
        parts: [{ type: "text", text: message }],
      })
    },
    [inputValue, isLoading, sendMessage]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion)
    textareaRef.current?.focus()
  }, [])

  const isOpen = mode !== "collapsed" && mode !== "minimized"
  const isMinimized = mode === "minimized"

  // Collapsed state - floating button
  if (mode === "collapsed") {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn("fixed bottom-6 right-6 z-50", className)}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={togglePanel}
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-full shadow-lg",
                  "bg-gradient-to-br from-primary to-primary/80",
                  "hover:scale-110 hover:shadow-xl hover:shadow-primary/20",
                  "active:scale-95",
                  "transition-all duration-200"
                )}
              >
                <Sparkles className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Open AI Assistant</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="absolute inset-0 -z-10 rounded-full bg-primary/20 animate-ping" />
      </motion.div>
    )
  }

  // Minimized state - thin strip on the right edge
  if (isMinimized) {
    const lastMessage = messages[messages.length - 1]
    const hasMessages = messages.length > 0

    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-50 w-12 bg-card border-l border-border shadow-lg flex flex-col",
          className
        )}
      >
        {/* Expand button at top */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={expandPanel}
                className="p-3 hover:bg-accent transition-colors border-b border-border"
              >
                <Maximize2 className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Expand chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* AI indicator */}
        <div className="flex-1 flex flex-col items-center py-4 gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>

          {/* Context indicator */}
          {context.type !== "general" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1.5 rounded-md bg-muted/50">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="capitalize">
                    {context.type}
                    {context.subdomain && `: ${context.subdomain}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Message count indicator */}
          {hasMessages && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    {messages.length}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>
                    {messages.length} message{messages.length !== 1 ? "s" : ""}
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                      Last: {getMessageText(lastMessage).slice(0, 50)}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Close button at bottom */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setMode("collapsed")}
                className="p-3 hover:bg-accent transition-colors border-t border-border"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Close chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </motion.div>
    )
  }

  // Main Sheet panel
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => setMode(open ? "side" : "collapsed")}
    >
      <SheetContent
        className={cn(
          "flex h-full w-full flex-col p-0 overflow-hidden",
          mode === "full" ? "sm:max-w-2xl" : "sm:max-w-md"
        )}
        side="right"
        hideCloseButton
      >
        {/* Header */}
        <div className="shrink-0 border-b bg-background p-4">
          <SheetHeader className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <SheetTitle>
                    {viewMode === "history"
                      ? "Conversation History"
                      : "Dashboard Assistant"}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {viewMode === "history"
                      ? "View and resume past conversations"
                      : "AI-powered help for your dashboard"}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  {viewMode === "chat" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewMode("history")}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View conversation history</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleNewConversation}
                        >
                          <MessageSquarePlus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Start new conversation</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setMode(mode === "full" ? "side" : "full")
                        }
                      >
                        {mode === "full" ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{mode === "full" ? "Shrink" : "Expand"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" onClick={minimizePanel}>
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Minimize chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMode("collapsed")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Close chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </SheetHeader>
          {viewMode === "chat" && <ContextIndicator context={context} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {viewMode === "history" ? (
            <ConversationHistory
              onSelectConversation={handleSelectConversation}
              onClose={handleNewConversation}
            />
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="flex flex-col gap-4 p-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 mb-4">
                        <Sparkles className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        How can I help?
                      </h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                        Ask me about your subdomains, teams, custom domains, or
                        billing.
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                        {[
                          "Show my subdomains",
                          "How do custom domains work?",
                          "What plan am I on?",
                          "List my teams",
                        ].map((suggestion) => (
                          <Button
                            key={suggestion}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((message: UIMessage) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-3",
                            message.role === "user"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          {message.role === "assistant" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 flex items-center justify-center">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={cn(
                              "max-w-[85%] rounded-2xl px-4 py-2.5",
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}
                          >
                            {message.role === "assistant" ? (
                              <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:my-2 [&>ol]:my-2">
                                <ReactMarkdown>
                                  {getMessageText(message)}
                                </ReactMarkdown>
                                {hasToolInvocations(message) && (
                                  <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    Working on it...
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm whitespace-pre-wrap">
                                {getMessageText(message)}
                              </div>
                            )}
                          </div>
                          {message.role === "user" && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <User className="h-4 w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Thinking indicator */}
                      {status === "submitted" && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="flex gap-3 justify-start"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2">
                            <div className="flex gap-1">
                              <span
                                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                style={{ animationDelay: "0ms" }}
                              />
                              <span
                                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                style={{ animationDelay: "150ms" }}
                              />
                              <span
                                className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                                style={{ animationDelay: "300ms" }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              Thinking...
                            </span>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>
              </div>

              {/* Error display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t"
                >
                  {error.message || "An error occurred"}
                </motion.div>
              )}

              {/* Input */}
              <div className="p-4 border-t shrink-0">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1 min-h-[44px] max-h-[120px] resize-none"
                    rows={1}
                  />
                  {isLoading ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={stop}
                      className="shrink-0"
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
