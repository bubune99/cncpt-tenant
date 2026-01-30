"use client"

import { useEffect, useRef, useState } from "react"
import { useChat, type UIMessage } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { motion } from "framer-motion"
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Maximize2,
  Loader2,
  Bot,
  User,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  useDashboardChatPanel,
  useDashboardChatContext,
  useDashboardChatStore,
  type DashboardChatContext,
} from "./store"

// Helper to extract text content from UIMessage parts
function getMessageText(message: UIMessage): string {
  if (!message.parts) return ""
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

interface ChatPanelProps {
  className?: string
}

export function ChatPanel({ className }: ChatPanelProps) {
  const { mode, setMode, togglePanel } = useDashboardChatPanel()
  const { context } = useDashboardChatContext()
  const startNewConversation = useDashboardChatStore((s) => s.startNewConversation)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState("")

  // Store context in ref to access in transport without causing re-renders
  const contextRef = useRef<DashboardChatContext>(context)
  useEffect(() => {
    contextRef.current = context
  }, [context])

  const {
    messages,
    sendMessage,
    status,
    error,
    setMessages,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/dashboard-chat",
      prepareSendMessagesRequest(request) {
        return {
          body: {
            ...request.body,
            context: contextRef.current,
          },
        }
      },
    }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (mode === "side" || mode === "full") {
      inputRef.current?.focus()
    }
  }, [mode])

  const handleNewChat = () => {
    setMessages([])
    setInputValue("")
    startNewConversation()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const message = inputValue
    setInputValue("")
    await sendMessage({ text: message })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  // Collapsed state - floating button
  if (mode === "collapsed") {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        onClick={togglePanel}
        className={cn(
          "fixed bottom-6 right-6 z-50",
          "h-14 w-14 rounded-full",
          "bg-primary text-primary-foreground",
          "shadow-lg hover:shadow-xl",
          "flex items-center justify-center",
          "transition-shadow duration-200",
          className
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    )
  }

  // Minimized state - thin strip
  if (mode === "minimized") {
    return (
      <motion.div
        initial={{ x: 100 }}
        animate={{ x: 0 }}
        exit={{ x: 100 }}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-50",
          "w-12 py-4 px-2",
          "bg-background border-l border-y rounded-l-lg",
          "shadow-lg",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMode("side")}
            className="h-8 w-8"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {messages.length}
            </span>
          )}
        </div>
      </motion.div>
    )
  }

  // Side or Full panel
  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 20 }}
      className={cn(
        "fixed right-0 top-0 z-50 h-screen",
        "bg-background border-l shadow-xl",
        "flex flex-col",
        mode === "full" ? "w-full md:w-[600px]" : "w-full md:w-[400px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium">Dashboard Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNewChat}
            title="New conversation"
            className="h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMode(mode === "full" ? "side" : "full")}
            className="h-8 w-8"
          >
            {mode === "full" ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMode("minimized")}
            className="h-8 w-8"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMode("collapsed")}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">How can I help?</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-xs">
              Ask me about your subdomains, teams, custom domains, or billing.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Show my subdomains",
                "How do custom domains work?",
                "What plan am I on?",
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
          <div className="space-y-4">
            {messages.map((message: UIMessage) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="text-sm whitespace-pre-wrap prose prose-sm dark:prose-invert">
                    {getMessageText(message)}
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error.message || "An error occurred"}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
