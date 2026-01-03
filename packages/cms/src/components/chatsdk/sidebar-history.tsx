'use client';

/**
 * Sidebar History Types and Utilities
 *
 * Provides types and pagination utilities for chat history in the sidebar.
 * Adapted from ChatSDK for Prisma/Stack Auth.
 */

import type { AiConversation } from '@prisma/client';

// Chat type alias using Prisma model
export type Chat = AiConversation;

export type ChatHistory = {
  chats: Chat[];
  hasMore: boolean;
};

const PAGE_SIZE = 20;

export function getChatHistoryPaginationKey(
  pageIndex: number,
  previousPageData: ChatHistory
) {
  if (previousPageData && previousPageData.hasMore === false) {
    return null;
  }

  if (pageIndex === 0) {
    return `/api/chat/history?limit=${PAGE_SIZE}`;
  }

  const firstChatFromPage = previousPageData.chats.at(-1);

  if (!firstChatFromPage) {
    return null;
  }

  return `/api/chat/history?ending_before=${firstChatFromPage.id}&limit=${PAGE_SIZE}`;
}

/**
 * Placeholder SidebarHistory component
 * To be implemented with actual chat history UI
 */
export function SidebarHistory({ user }: { user?: { id: string; email?: string } }) {
  // Placeholder - will be implemented with full chat history UI
  return null;
}
