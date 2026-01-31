/**
 * ChatSDK Database Queries
 *
 * Prisma-based implementations for ChatSDK database operations.
 * Replaces Drizzle ORM queries with Prisma equivalents.
 */

import { prisma } from '../../db';
import type { AiDocument, AiSuggestion, AiConversation, AiMessage, ChatVisibility } from '@prisma/client';

// Re-export types for convenience
export type { AiDocument, AiSuggestion, AiConversation, AiMessage };

// Type aliases for ChatSDK compatibility
export type Document = AiDocument;
export type Suggestion = AiSuggestion;
export type Chat = AiConversation;
export type DBMessage = AiMessage;

// =============================================================================
// DOCUMENT QUERIES
// =============================================================================

export async function getDocumentById(id: string): Promise<AiDocument | null> {
  return prisma.aiDocument.findUnique({
    where: { id },
  });
}

export async function getDocumentsByUserId(userId: string): Promise<AiDocument[]> {
  return prisma.aiDocument.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveDocument(doc: {
  id?: string;
  title: string;
  content?: string;
  kind: string;
  userId: string;
}): Promise<AiDocument> {
  if (doc.id) {
    return prisma.aiDocument.upsert({
      where: { id: doc.id },
      update: {
        title: doc.title,
        content: doc.content,
        kind: doc.kind,
      },
      create: {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        kind: doc.kind,
        userId: doc.userId,
      },
    });
  }

  return prisma.aiDocument.create({
    data: {
      title: doc.title,
      content: doc.content,
      kind: doc.kind,
      userId: doc.userId,
    },
  });
}

export async function deleteDocument(id: string): Promise<void> {
  await prisma.aiDocument.delete({
    where: { id },
  });
}

// =============================================================================
// SUGGESTION QUERIES
// =============================================================================

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}): Promise<AiSuggestion[]> {
  return prisma.aiSuggestion.findMany({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function saveSuggestion(suggestion: {
  id?: string;
  documentId: string;
  userId: string;
  originalText: string;
  suggestedText: string;
  description?: string;
  documentCreatedAt: Date;
}): Promise<AiSuggestion> {
  if (suggestion.id) {
    return prisma.aiSuggestion.upsert({
      where: { id: suggestion.id },
      update: {
        originalText: suggestion.originalText,
        suggestedText: suggestion.suggestedText,
        description: suggestion.description,
      },
      create: {
        id: suggestion.id,
        documentId: suggestion.documentId,
        userId: suggestion.userId,
        originalText: suggestion.originalText,
        suggestedText: suggestion.suggestedText,
        description: suggestion.description,
        documentCreatedAt: suggestion.documentCreatedAt,
      },
    });
  }

  return prisma.aiSuggestion.create({
    data: {
      documentId: suggestion.documentId,
      userId: suggestion.userId,
      originalText: suggestion.originalText,
      suggestedText: suggestion.suggestedText,
      description: suggestion.description,
      documentCreatedAt: suggestion.documentCreatedAt,
    },
  });
}

export async function deleteSuggestion(id: string): Promise<void> {
  await prisma.aiSuggestion.delete({
    where: { id },
  });
}

export async function resolveSuggestion(id: string): Promise<void> {
  await prisma.aiSuggestion.update({
    where: { id },
    data: { isResolved: true },
  });
}

// =============================================================================
// CHAT/CONVERSATION QUERIES
// =============================================================================

export async function getChatById(id: string): Promise<AiConversation | null> {
  return prisma.aiConversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}

export async function getChatsByUserId(
  userId: string,
  options?: { limit?: number; cursor?: string }
): Promise<{ chats: AiConversation[]; hasMore: boolean }> {
  const limit = options?.limit ?? 20;

  const chats = await prisma.aiConversation.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(options?.cursor && {
      cursor: { id: options.cursor },
      skip: 1,
    }),
  });

  const hasMore = chats.length > limit;
  if (hasMore) {
    chats.pop();
  }

  return { chats, hasMore };
}

export async function saveChat(chat: {
  id?: string;
  userId: string;
  title: string;
  visibility?: ChatVisibility;
}): Promise<AiConversation> {
  if (chat.id) {
    return prisma.aiConversation.upsert({
      where: { id: chat.id },
      update: {
        title: chat.title,
        visibility: chat.visibility,
      },
      create: {
        id: chat.id,
        userId: chat.userId,
        title: chat.title,
        visibility: chat.visibility ?? 'PRIVATE',
      },
    });
  }

  return prisma.aiConversation.create({
    data: {
      userId: chat.userId,
      title: chat.title,
      visibility: chat.visibility ?? 'PRIVATE',
    },
  });
}

export async function deleteChat(id: string): Promise<void> {
  // Cascade delete handles messages, votes, streams
  await prisma.aiConversation.delete({
    where: { id },
  });
}

export async function updateChatVisibility(
  id: string,
  visibility: ChatVisibility
): Promise<void> {
  await prisma.aiConversation.update({
    where: { id },
    data: { visibility },
  });
}

// =============================================================================
// MESSAGE QUERIES
// =============================================================================

export async function getMessagesByChatId(chatId: string): Promise<AiMessage[]> {
  return prisma.aiMessage.findMany({
    where: { conversationId: chatId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function saveMessage(message: {
  id?: string;
  conversationId: string;
  role: string;
  content?: string;
  parts?: unknown;
  attachments?: unknown;
  toolCalls?: unknown;
  toolResults?: unknown;
  metadata?: unknown;
}): Promise<AiMessage> {
  const data = {
    conversationId: message.conversationId,
    role: message.role,
    content: message.content,
    parts: message.parts as object | undefined,
    attachments: message.attachments as object | undefined,
    toolCalls: message.toolCalls as object | undefined,
    toolResults: message.toolResults as object | undefined,
    metadata: message.metadata as object | undefined,
  };

  if (message.id) {
    return prisma.aiMessage.upsert({
      where: { id: message.id },
      update: data,
      create: { id: message.id, ...data },
    });
  }

  return prisma.aiMessage.create({ data });
}

export async function saveMessages(
  messages: Array<{
    id?: string;
    conversationId: string;
    role: string;
    content?: string;
    parts?: unknown;
    attachments?: unknown;
  }>
): Promise<void> {
  await prisma.aiMessage.createMany({
    data: messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      parts: m.parts as object | undefined,
      attachments: m.attachments as object | undefined,
    })),
    skipDuplicates: true,
  });
}

export async function deleteMessage(id: string): Promise<void> {
  await prisma.aiMessage.delete({
    where: { id },
  });
}

// =============================================================================
// VOTE QUERIES
// =============================================================================

export async function getVoteByMessageId(
  chatId: string,
  messageId: string
): Promise<{ isUpvoted: boolean } | null> {
  return prisma.aiVote.findUnique({
    where: {
      conversationId_messageId: {
        conversationId: chatId,
        messageId,
      },
    },
    select: { isUpvoted: true },
  });
}

export async function saveVote(vote: {
  chatId: string;
  messageId: string;
  isUpvoted: boolean;
}): Promise<void> {
  await prisma.aiVote.upsert({
    where: {
      conversationId_messageId: {
        conversationId: vote.chatId,
        messageId: vote.messageId,
      },
    },
    update: { isUpvoted: vote.isUpvoted },
    create: {
      conversationId: vote.chatId,
      messageId: vote.messageId,
      isUpvoted: vote.isUpvoted,
    },
  });
}

export async function deleteVote(chatId: string, messageId: string): Promise<void> {
  await prisma.aiVote.delete({
    where: {
      conversationId_messageId: {
        conversationId: chatId,
        messageId,
      },
    },
  });
}

// =============================================================================
// STREAM QUERIES
// =============================================================================

export async function createStream(chatId: string): Promise<{ id: string }> {
  return prisma.aiStream.create({
    data: { conversationId: chatId },
    select: { id: true },
  });
}

export async function getStreamByChatId(chatId: string): Promise<{ id: string } | null> {
  return prisma.aiStream.findFirst({
    where: { conversationId: chatId },
    select: { id: true },
  });
}

export async function deleteStream(id: string): Promise<void> {
  await prisma.aiStream.delete({
    where: { id },
  });
}

export async function deleteStreamsByChatId(chatId: string): Promise<void> {
  await prisma.aiStream.deleteMany({
    where: { conversationId: chatId },
  });
}
