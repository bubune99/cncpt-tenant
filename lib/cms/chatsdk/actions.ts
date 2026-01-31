'use server';

/**
 * Chat Actions
 *
 * Server actions for chat operations.
 * Adapted from ChatSDK for Prisma/Stack Auth.
 */

import { prisma } from '../db';
import { ChatVisibility } from '@prisma/client';
import type { VisibilityType } from '@/components/cms/chatsdk/visibility-selector';

// Map UI visibility type to Prisma enum
function toDbVisibility(visibility: VisibilityType): ChatVisibility {
  return visibility === 'public' ? ChatVisibility.PUBLIC : ChatVisibility.PRIVATE;
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  await prisma.aiConversation.update({
    where: { id: chatId },
    data: { visibility: toDbVisibility(visibility) },
  });
}

export async function deleteChat({ chatId }: { chatId: string }) {
  // Delete messages first due to foreign key constraint
  await prisma.aiMessage.deleteMany({
    where: { conversationId: chatId },
  });

  // Then delete the conversation
  await prisma.aiConversation.delete({
    where: { id: chatId },
  });
}

export async function getChatById({ chatId }: { chatId: string }) {
  return prisma.aiConversation.findUnique({
    where: { id: chatId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });
}
