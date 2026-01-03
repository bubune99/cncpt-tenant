'use client';

/**
 * Admin Chat Panel
 *
 * A persistent chat panel for the admin dashboard with AI assistant.
 * Uses AI SDK v6 with proper streaming and tool support.
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { TextStreamChatTransport, type UIMessage } from 'ai';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  Send,
  Loader2,
  Plus,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Square,
  Settings,
  History,
  Trash2,
  Clock,
  ChevronLeft,
  Package,
  ShoppingCart,
  FileText,
  Users,
  PenLine,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useChatStore, useChatPanel, useChatContext } from '@/lib/ai/chat-store';
import { useAutoChatContext } from '@/hooks/use-chat-context';

// Animated typing dots component
const TypingDots = () => (
  <div className="flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className="size-1.5 rounded-full bg-primary"
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
      />
    ))}
  </div>
);

// Types for message parts
interface TextPart {
  type: 'text';
  text: string;
}

interface ToolInvocationPart {
  type: string;
  toolCallId: string;
  toolName?: string;
  state: 'call' | 'partial-call' | 'result';
  args?: Record<string, unknown>;
  result?: unknown;
}

interface ReasoningPart {
  type: 'reasoning';
  text: string;
}

type MessagePart = TextPart | ToolInvocationPart | ReasoningPart | { type: string; [key: string]: unknown };

// Helper to check if part is a text part
function isTextPart(part: MessagePart): part is TextPart {
  return part.type === 'text' && 'text' in part;
}

// Helper to check if part is a tool invocation
function isToolPart(part: MessagePart): part is ToolInvocationPart {
  return (
    (part.type.startsWith('tool-') || part.type === 'tool-invocation') &&
    'toolCallId' in part &&
    'state' in part
  );
}

// Helper to check if part is reasoning
function isReasoningPart(part: MessagePart): part is ReasoningPart {
  return part.type === 'reasoning' && 'text' in part;
}

// Get tool name from part
function getToolName(part: ToolInvocationPart): string {
  if (part.toolName) return part.toolName;
  if (part.type.startsWith('tool-')) return part.type.slice(5);
  return 'unknown';
}

// Process message parts for rendering
function processMessageParts(message: UIMessage): {
  textParts: TextPart[];
  toolParts: ToolInvocationPart[];
  reasoningParts: ReasoningPart[];
} {
  const parts = (message.parts || []) as MessagePart[];

  return {
    textParts: parts.filter(isTextPart),
    toolParts: parts.filter(isToolPart),
    reasoningParts: parts.filter(isReasoningPart),
  };
}

// Get combined text from message
function getMessageText(message: UIMessage): string {
  const { textParts } = processMessageParts(message);
  return textParts.map((part) => part.text).join('');
}

// Suggested actions for empty state
const SUGGESTED_ACTIONS = [
  { label: 'Show dashboard stats', icon: '📊' },
  { label: 'Search products', icon: '🔍' },
  { label: 'Recent orders', icon: '📦' },
  { label: 'Help me navigate', icon: '🧭' },
];

// Get icon for context type
function getContextIcon(type: string) {
  switch (type) {
    case 'product':
      return Package;
    case 'order':
      return ShoppingCart;
    case 'page':
      return FileText;
    case 'blog':
      return PenLine;
    case 'user':
      return Users;
    default:
      return MessageSquare;
  }
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString();
}

export function ChatPanel() {
  useAutoChatContext();
  const router = useRouter();
  const { mode, setMode, togglePanel } = useChatPanel();
  const { context } = useChatContext();
  const conversationId = useChatStore((s) => s.conversationId);
  const startNewConversation = useChatStore((s) => s.startNewConversation);
  const addToHistory = useChatStore((s) => s.addToHistory);
  const conversationHistory = useChatStore((s) => s.conversationHistory);
  const loadConversation = useChatStore((s) => s.loadConversation);
  const removeFromHistory = useChatStore((s) => s.removeFromHistory);
  const clearHistory = useChatStore((s) => s.clearHistory);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [aiError, setAiError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize conversation ID if not set
  useEffect(() => {
    if (!conversationId) {
      startNewConversation();
    }
  }, [conversationId, startNewConversation]);

  // Create transport with body that includes context
  const transport = useMemo(() => {
    return new TextStreamChatTransport({
      api: '/api/chat',
      body: {
        id: conversationId,
        context,
      },
    });
  }, [conversationId, context]);

  // Use the AI SDK v6 useChat hook
  const {
    messages,
    status,
    sendMessage,
    setMessages,
    stop,
    error,
  } = useChat({
    id: conversationId || undefined,
    transport,
    onError: (err) => {
      // Parse error for better display
      const errorMessage = err.message || 'An error occurred';
      if (errorMessage.includes('AI is not enabled') || errorMessage.includes('No API key')) {
        setAiError('AI is not configured. Please add your API key in Settings > AI.');
      } else if (errorMessage.includes('rate limit')) {
        setAiError('Rate limit reached. Please try again later.');
      } else {
        setAiError(errorMessage);
      }
    },
    onFinish: ({ message }) => {
      setAiError(null);
      // Update history
      if (conversationId && messages.length > 0) {
        const firstUserMessage = messages.find((m) => m.role === 'user');
        const firstUserText = firstUserMessage ? getMessageText(firstUserMessage) : '';
        const messageText = getMessageText(message);

        addToHistory({
          id: conversationId,
          title: firstUserText?.slice(0, 50) || 'New Chat',
          lastMessage: messageText?.slice(0, 100) || '',
          context: context,
        });
      }
    },
  });

  // Handle loading a conversation from history
  const handleLoadConversation = useCallback((id: string) => {
    loadConversation(id);
    setMessages([]);
    setShowHistory(false);
    setAiError(null);
  }, [loadConversation, setMessages]);

  const isLoading = status === 'submitted' || status === 'streaming';
  const isStreaming = status === 'streaming';

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setAiError(null);

    await sendMessage({ text: messageContent });

    inputRef.current?.focus();
  }, [inputValue, isLoading, sendMessage]);

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle new conversation
  const handleNewConversation = () => {
    startNewConversation();
    setMessages([]);
    setAiError(null);
  };

  // Handle stop
  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  // If collapsed, show only the floating button
  if (mode === 'collapsed') {
    return (
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={togglePanel}
                size="icon"
                className={cn(
                  'h-14 w-14 rounded-full shadow-lg',
                  'bg-gradient-to-br from-primary to-primary/80',
                  'hover:scale-110 hover:shadow-xl hover:shadow-primary/20',
                  'active:scale-95',
                  'transition-all duration-200'
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
    );
  }

  const isFullScreen = mode === 'full';

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed z-50 flex flex-col bg-background/95 backdrop-blur-xl border-l shadow-2xl',
        isFullScreen
          ? 'inset-0'
          : 'top-0 right-0 bottom-0 w-[420px] max-w-full'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-muted/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">AI Assistant</span>
            {context.type !== 'general' && (
              <span className="text-xs text-muted-foreground capitalize">
                {context.type}: {context.title || context.id}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(!showHistory)}
                  className={cn(
                    'rounded-lg transition-colors h-8 w-8',
                    showHistory ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  )}
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Conversation history</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewConversation}
                  className="rounded-lg hover:bg-muted transition-colors h-8 w-8"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New conversation</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMode(isFullScreen ? 'side' : 'full')}
                  className="rounded-lg hover:bg-muted transition-colors h-8 w-8"
                >
                  {isFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isFullScreen ? 'Minimize' : 'Maximize'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMode('collapsed')}
                  className="rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Close</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Error Banner */}
      <AnimatePresence>
        {aiError && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-destructive/20 bg-destructive/5 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive flex-1">{aiError}</p>
              {aiError.includes('Settings') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/settings')}
                  className="shrink-0"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b bg-muted/30 overflow-hidden"
          >
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Recent Conversations</span>
                  <span className="text-xs text-muted-foreground">
                    ({conversationHistory.length})
                  </span>
                </div>
                {conversationHistory.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Clear all conversation history?')) {
                              clearHistory();
                            }
                          }}
                          className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Clear history</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>

              {conversationHistory.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No conversation history yet</p>
                  <p className="text-xs mt-1">Start a conversation to see it here</p>
                </div>
              ) : (
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-1">
                    {conversationHistory.map((conv) => {
                      const ContextIcon = conv.context
                        ? getContextIcon(conv.context.type)
                        : MessageSquare;
                      const isActive = conv.id === conversationId;

                      return (
                        <motion.div
                          key={conv.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="group relative"
                        >
                          <button
                            onClick={() => handleLoadConversation(conv.id)}
                            className={cn(
                              'w-full text-left p-2.5 rounded-lg transition-all duration-200',
                              'hover:bg-background/80 hover:shadow-sm',
                              isActive && 'bg-primary/5 ring-1 ring-primary/20'
                            )}
                          >
                            <div className="flex items-start gap-2.5">
                              <div
                                className={cn(
                                  'flex size-7 shrink-0 items-center justify-center rounded-md',
                                  'bg-muted/80',
                                  isActive && 'bg-primary/10'
                                )}
                              >
                                <ContextIcon
                                  className={cn(
                                    'h-3.5 w-3.5',
                                    isActive ? 'text-primary' : 'text-muted-foreground'
                                  )}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'text-sm font-medium truncate',
                                      isActive && 'text-primary'
                                    )}
                                  >
                                    {conv.title || 'Untitled Chat'}
                                  </span>
                                  {isActive && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                      Active
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {conv.lastMessage || 'No messages'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {conv.context && conv.context.type !== 'general' && (
                                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded capitalize">
                                      {conv.context.type}
                                      {conv.context.id && `: ${conv.context.id.slice(0, 8)}...`}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-muted-foreground/70">
                                    {formatRelativeTime(conv.updatedAt)}
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
                                    e.stopPropagation();
                                    removeFromHistory(conv.id);
                                  }}
                                  className={cn(
                                    'absolute right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100',
                                    'hover:bg-destructive/10 hover:text-destructive transition-all'
                                  )}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remove from history</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </motion.div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(var(--primary), 0)',
                  '0 0 40px 10px rgba(var(--primary), 0.1)',
                  '0 0 0 0 rgba(var(--primary), 0)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 mb-6"
            >
              <Sparkles className="h-8 w-8 text-primary" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl font-semibold"
            >
              How can I help you?
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-sm mt-2 max-w-[280px] text-muted-foreground"
            >
              I can help you manage products, orders, content, navigate the admin panel, and more.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 grid grid-cols-2 gap-2 w-full max-w-[320px]"
            >
              {SUGGESTED_ACTIONS.map((action, i) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2.5 px-3 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
                    onClick={() => {
                      setInputValue(action.label);
                      inputRef.current?.focus();
                    }}
                  >
                    <span className="mr-2">{action.icon}</span>
                    <span className="truncate text-xs">{action.label}</span>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => {
                const { textParts, toolParts, reasoningParts } = processMessageParts(message);
                const isLastMessage = index === messages.length - 1;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20'
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div
                      className={cn(
                        'flex-1 max-w-[85%] space-y-2',
                        message.role === 'user' ? 'flex flex-col items-end' : ''
                      )}
                    >
                      {/* Reasoning parts (for reasoning models) */}
                      {reasoningParts.length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 border-l-2 border-primary/30">
                          <div className="flex items-center gap-1 mb-1 font-medium">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Thinking...
                          </div>
                          <p className="italic opacity-70">
                            {reasoningParts.map((p) => p.text).join('')}
                          </p>
                        </div>
                      )}

                      {/* Tool invocations - rendered inline as they stream */}
                      {toolParts.map((tool, i) => (
                        <motion.div
                          key={tool.toolCallId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={cn(
                            'text-xs rounded-lg px-3 py-2 flex items-center gap-2',
                            'bg-muted/50 border border-border/50'
                          )}
                        >
                          <div
                            className={cn(
                              'flex size-5 items-center justify-center rounded-md',
                              tool.state === 'result'
                                ? 'bg-green-500/10'
                                : 'bg-primary/10'
                            )}
                          >
                            {tool.state === 'result' ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <Loader2 className="h-3 w-3 animate-spin text-primary" />
                            )}
                          </div>
                          <span className="font-medium">{getToolName(tool)}</span>
                          {tool.state === 'result' && (
                            <span className="text-green-600 ml-auto">Done</span>
                          )}
                          {(tool.state === 'call' || tool.state === 'partial-call') && (
                            <span className="text-muted-foreground ml-auto">
                              {tool.state === 'partial-call' ? 'Preparing...' : 'Running...'}
                            </span>
                          )}
                        </motion.div>
                      ))}

                      {/* Text content */}
                      {textParts.length > 0 && (
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-3',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted/50 rounded-tl-sm'
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-pre:my-2 prose-code:bg-muted prose-code:px-1 prose-code:rounded">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {textParts.map((p) => p.text).join('')}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm whitespace-pre-wrap">
                              {textParts.map((p) => p.text).join('')}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Thinking indicator */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex gap-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 ring-1 ring-primary/20 flex items-center justify-center"
                  >
                    <Sparkles className="h-4 w-4 text-primary" />
                  </motion.div>
                  <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                    <TypingDots />
                    <span className="text-xs text-muted-foreground">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-gradient-to-t from-muted/30 to-transparent">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={cn(
            'flex items-end gap-2 rounded-xl border p-2',
            'bg-background/80 backdrop-blur-sm shadow-lg',
            'transition-all duration-300 ease-out',
            'border-border/50 hover:border-border',
            'focus-within:border-primary/50 focus-within:shadow-xl focus-within:shadow-primary/5',
            'focus-within:ring-2 focus-within:ring-primary/10'
          )}
        >
          <Textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className={cn(
              'min-h-[44px] max-h-[120px] resize-none flex-1',
              'border-none bg-transparent shadow-none',
              'focus-visible:ring-0 focus-visible:outline-none',
              'placeholder:text-muted-foreground/60'
            )}
            rows={1}
            disabled={isLoading}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            {isStreaming ? (
              <Button
                onClick={handleStop}
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full shrink-0 border-destructive/50 hover:bg-destructive/10 hover:border-destructive"
              >
                <Square className="h-4 w-4 text-destructive" />
              </Button>
            ) : (
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className={cn(
                  'h-10 w-10 rounded-full shrink-0',
                  'bg-gradient-to-br from-primary to-primary/80',
                  'shadow-md hover:shadow-lg hover:shadow-primary/20',
                  'transition-all duration-200',
                  'disabled:opacity-50 disabled:shadow-none'
                )}
              >
                {status === 'submitted' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            )}
          </motion.div>
        </motion.div>
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
}
