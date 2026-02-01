'use client';

/**
 * Admin Chat Panel
 *
 * A persistent chat panel for the admin dashboard with AI assistant.
 * Uses Sheet-based layout matching the LMS BuilderChatPanel pattern.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  Sparkles,
  History,
  MessageSquarePlus,
  Package,
  ShoppingCart,
  FileText,
  Users,
  PenLine,
  Minimize2,
  Maximize2,
  X,
  FlaskConical,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { useChatStore, useChatPanel, useChatContext } from '../../lib/ai/chat-store';
import { useAutoChatContext } from '../../hooks/use-chat-context';
import { DataStreamProvider } from '../chatsdk/data-stream-provider';
import { SidebarProvider } from '../chatsdk/ui/sidebar';
import { Chat } from '../chatsdk/chat';
import { ConversationHistory } from './conversation-history';

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

// Context indicator component
function ContextIndicator({ context }: { context: { type: string; id?: string; title?: string } }) {
  const ContextIcon = getContextIcon(context.type);

  if (context.type === 'general') {
    return null;
  }

  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
      <ContextIcon className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground capitalize">
        {context.type}: {context.title || context.id}
      </span>
    </div>
  );
}

type ViewMode = 'chat' | 'history';

export function ChatPanel() {
  useAutoChatContext();
  const { mode, setMode, togglePanel, minimizePanel, expandPanel } = useChatPanel();
  const { context } = useChatContext();
  const conversationId = useChatStore((s) => s.conversationId);
  const startNewConversation = useChatStore((s) => s.startNewConversation);
  const loadConversation = useChatStore((s) => s.loadConversation);
  const messages = useChatStore((s) => s.messages);

  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [chatKey, setChatKey] = useState(0);
  const [loadedMessages, setLoadedMessages] = useState<any[]>([]);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  // Close demo menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target as Node)) {
        setShowDemoMenu(false);
      }
    };
    if (showDemoMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDemoMenu]);

  // Demo prompts for testing multi-step tool execution with taskComplete
  // These prompts are designed to test the termination pattern
  const demoPrompts = [
    {
      label: 'Demo: Help Workflow',
      prompt: `Execute a complete help content workflow:

STEP 1: Call \`listHelpKeys\` with category "sidebar" to find available help keys.
STEP 2: Pick one key from the results and call \`getHelpContent\` to read its current content.
STEP 3: Call \`updateHelpContent\` to update that key with improved content.
STEP 4: Call \`taskComplete\` with summary, stepsCompleted=3, and toolsUsed array.

You MUST complete all 4 steps. Do NOT stop until you call taskComplete.`,
    },
    {
      label: 'Demo: Create Help',
      prompt: `Create new help content using these exact parameters:

STEP 1: Call \`updateHelpContent\` with:
- elementKey: "sidebar.dashboard"
- title: "Dashboard Overview"
- summary: "Your central hub for store metrics and quick actions"
- details: "The dashboard shows real-time sales data, recent orders, and inventory alerts."

STEP 2: Call \`taskComplete\` with summary of what was created, stepsCompleted=1, toolsUsed=['updateHelpContent'].

You MUST call taskComplete when done.`,
    },
    {
      label: 'Demo: Help Audit',
      prompt: `Audit help coverage for the products section:

STEP 1: Call \`listHelpKeys\` with category "products" to see all registered keys.
STEP 2: Report coverage stats (hasDefaultContent vs hasCustomContent).
STEP 3: If missing keys exist, call \`batchGenerateHelp\` for up to 3 keys.
STEP 4: Call \`taskComplete\` with audit summary, stepsCompleted count, and toolsUsed array.

You MUST call taskComplete to signal completion.`,
    },
    {
      label: 'Demo: Entity Stats',
      prompt: `Demonstrate entity tools by gathering statistics:

STEP 1: Call \`getEntityStats\` for entityType "products".
STEP 2: Call \`searchEntities\` with entityType "products" and query "" (empty).
STEP 3: Pick one product and call \`getEntityDetails\` with its ID.
STEP 4: Call \`taskComplete\` with summary of findings, stepsCompleted=3, and toolsUsed array.

Do NOT stop until you call taskComplete.`,
    },
  ];

  // Handle demo prompt selection
  const handleDemoPrompt = useCallback((prompt: string) => {
    // Start a new conversation with the demo prompt as initial message
    startNewConversation();
    setLoadedMessages([{
      id: `demo-${Date.now()}`,
      role: 'user',
      content: prompt,
    }]);
    setChatKey((prev) => prev + 1);
    setViewMode('chat');
    setShowDemoMenu(false);
  }, [startNewConversation]);

  // Initialize conversation ID if not set
  useEffect(() => {
    if (!conversationId) {
      startNewConversation();
    }
  }, [conversationId, startNewConversation]);

  // Handle selecting a conversation from history
  const handleSelectConversation = useCallback(async (id: string) => {
    // Load the conversation
    loadConversation(id);
    // In production, you would fetch the messages from an API here
    // For now, just switch to chat view with the new conversation ID
    setLoadedMessages([]);
    setChatKey((prev) => prev + 1);
    setViewMode('chat');
  }, [loadConversation]);

  // Handle new conversation
  const handleNewConversation = useCallback(() => {
    startNewConversation();
    setLoadedMessages([]);
    setChatKey((prev) => prev + 1);
    setViewMode('chat');
  }, [startNewConversation]);

  const isOpen = mode !== 'collapsed' && mode !== 'minimized';
  const isFullScreen = mode === 'full';
  const isMinimized = mode === 'minimized';

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

  // If minimized, show a thin strip on the right edge
  if (isMinimized) {
    const lastMessage = messages[messages.length - 1];
    const hasMessages = messages.length > 0;

    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-12 bg-card border-l border-border shadow-lg flex flex-col"
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
          {context.type !== 'general' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="p-1.5 rounded-md bg-muted/50">
                    {(() => {
                      const ContextIcon = getContextIcon(context.type);
                      return <ContextIcon className="h-4 w-4 text-muted-foreground" />;
                    })()}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p className="capitalize">{context.type}: {context.title || context.id}</p>
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
                  <p>{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
                  {lastMessage && (
                    <p className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate">
                      Last: {typeof lastMessage.content === 'string'
                        ? lastMessage.content.slice(0, 50)
                        : 'Message'}
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
                onClick={() => setMode('collapsed')}
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
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => setMode(open ? 'side' : 'collapsed')}>
      <SheetContent
        className={cn(
          'flex h-full w-full flex-col p-0 overflow-hidden',
          isFullScreen ? 'sm:max-w-full' : 'sm:max-w-2xl'
        )}
        side="right"
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
                    {viewMode === 'history' ? 'Conversation History' : 'AI Assistant'}
                  </SheetTitle>
                  <SheetDescription className="text-xs">
                    {viewMode === 'history'
                      ? 'View and resume past conversations'
                      : 'Your AI-powered admin assistant'}
                  </SheetDescription>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Demo button with dropdown */}
                <div className="relative" ref={demoMenuRef}>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDemoMenu(!showDemoMenu)}
                          className={showDemoMenu ? 'bg-accent' : ''}
                        >
                          <FlaskConical className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Test AI tool demos</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {showDemoMenu && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-md border bg-popover p-1 shadow-md">
                      <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Multi-Step Tool Demos
                      </div>
                      {demoPrompts.map((demo, i) => (
                        <button
                          key={i}
                          onClick={() => handleDemoPrompt(demo.prompt)}
                          className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        >
                          {demo.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <TooltipProvider>
                  {viewMode === 'chat' ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setViewMode('history')}>
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
                        <Button variant="ghost" size="sm" onClick={handleNewConversation}>
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
                      <Button variant="ghost" size="sm" onClick={minimizePanel}>
                        <Minimize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Minimize chat</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </SheetHeader>
          {viewMode === 'chat' && <ContextIndicator context={context} />}
        </div>

        {/* Content - fills remaining space */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {viewMode === 'history' ? (
            <ConversationHistory
              onSelectConversation={handleSelectConversation}
              onClose={handleNewConversation}
            />
          ) : (
            <SidebarProvider className="min-h-0 flex-1 flex-col">
              <DataStreamProvider>
                {conversationId && (
                  <Chat
                    key={chatKey}
                    id={conversationId}
                    initialMessages={loadedMessages}
                    initialChatModel="anthropic/claude-sonnet-4.5"
                    initialVisibilityType="private"
                    isReadonly={false}
                    autoResume={loadedMessages.length > 0}
                    apiEndpoint="/api/chat"
                    customBody={{
                      contextType: 'admin',
                      contextId: context.id,
                      adminContext: context,
                      conversationId,
                    }}
                    customHeader={<></>}
                    containerClassName="flex flex-1 min-h-0 flex-col bg-background overflow-hidden"
                  />
                )}
              </DataStreamProvider>
            </SidebarProvider>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
