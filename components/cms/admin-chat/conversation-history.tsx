'use client';

/**
 * Conversation History Component
 *
 * Displays past conversations for the admin chat panel.
 * Fetches conversation history from the API.
 */

import { useMemo } from 'react';
import useSWR from 'swr';
import { MessageSquare, Clock, Trash2, Package, ShoppingCart, FileText, Users, PenLine, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';
import { cn } from '../../lib/utils';
import { useChatStore } from '../../lib/ai/chat-store';
import { fetcher } from '../../lib/utils';

interface ConversationHistoryProps {
  onSelectConversation: (id: string) => void;
  onClose: () => void;
}

interface ConversationItem {
  id: string;
  title: string;
  contextType: string;
  updatedAt: string;
  lastMessage: string;
}

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

export function ConversationHistory({ onSelectConversation, onClose }: ConversationHistoryProps) {
  const conversationId = useChatStore((s) => s.conversationId);

  // Fetch conversation history from API
  const { data, error, isLoading, mutate } = useSWR<{ conversations: ConversationItem[] }>(
    '/api/chat',
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );

  const conversations = data?.conversations || [];

  // Delete a conversation
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/chat?id=${id}`, { method: 'DELETE' });
      mutate(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  // Clear all conversations
  const handleClearAll = async () => {
    if (!confirm('Clear all conversation history?')) return;

    try {
      // Delete each conversation
      await Promise.all(conversations.map((c) =>
        fetch(`/api/chat?id=${c.id}`, { method: 'DELETE' })
      ));
      mutate(); // Refresh the list
      onClose();
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading conversations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load history</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Please try again later
        </p>
        <Button onClick={onClose} variant="outline">
          Start New Conversation
        </Button>
      </div>
    );
  }

  if (conversations.length === 0) {
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
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with clear all button */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
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
          {conversations.map((conv) => {
            const ContextIcon = getContextIcon(conv.contextType);
            const isActive = conv.id === conversationId;

            return (
              <div key={conv.id} className="group relative">
                <button
                  onClick={() => onSelectConversation(conv.id)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg transition-all duration-200',
                    'hover:bg-muted/50',
                    isActive && 'bg-primary/5 ring-1 ring-primary/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-md',
                        'bg-muted/80',
                        isActive && 'bg-primary/10'
                      )}
                    >
                      <ContextIcon
                        className={cn(
                          'h-4 w-4',
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
                        {conv.contextType && conv.contextType !== 'general' && (
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded capitalize">
                            {conv.contextType}
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
                          e.stopPropagation();
                          handleDelete(conv.id);
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
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
