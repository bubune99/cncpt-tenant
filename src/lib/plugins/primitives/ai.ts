/**
 * AI Chat Primitives
 *
 * AI-callable primitives for AI chat functionality.
 * Enables store owners to build custom AI chat interfaces.
 */

import { CreatePrimitiveRequest } from '../types';

export const AI_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // SEND MESSAGE
  // ============================================================================
  {
    name: 'ai.chat',
    description: 'Send a message to the AI assistant and get a response',
    category: 'ai',
    tags: ['ai', 'chat', 'assistant', 'conversation'],
    icon: 'MessageSquare',
    timeout: 60000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'User message',
          minLength: 1,
        },
        conversationId: {
          type: 'string',
          description: 'Existing conversation ID to continue',
        },
        systemPrompt: {
          type: 'string',
          description: 'Custom system prompt (for new conversations)',
        },
        userId: {
          type: 'string',
          description: 'User ID',
        },
        context: {
          type: 'object',
          description: 'Additional context (product info, order details, etc.)',
        },
      },
      required: ['message'],
    },
    handler: `
      const { message, conversationId, systemPrompt, userId, context } = input;

      let conversation;

      if (conversationId) {
        conversation = await prisma.aIConversation.findFirst({
          where: { id: conversationId, deletedAt: null },
          include: {
            messages: { orderBy: { createdAt: 'asc' }, take: 20 },
          },
        });

        if (!conversation) {
          throw new Error('Conversation not found');
        }
      } else {
        // Create new conversation
        conversation = await prisma.aIConversation.create({
          data: {
            userId: userId || null,
            title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
            systemPrompt: systemPrompt || 'You are a helpful e-commerce assistant.',
            context: context || {},
          },
          include: { messages: true },
        });
      }

      // Save user message
      await prisma.aIMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: message,
        },
      });

      // Note: Actual AI response would be generated via API route using AI SDK
      // This primitive sets up the conversation structure
      return {
        conversationId: conversation.id,
        message,
        context: conversation.context,
        previousMessages: conversation.messages.map(m => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
        systemPrompt: conversation.systemPrompt,
        note: 'Use /api/ai/chat endpoint for actual AI responses with streaming',
      };
    `,
  },

  // ============================================================================
  // GET CONVERSATIONS
  // ============================================================================
  {
    name: 'ai.getConversations',
    description: 'Get list of AI chat conversations for a user',
    category: 'ai',
    tags: ['ai', 'chat', 'history', 'conversations'],
    icon: 'MessageCircle',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        page: {
          type: 'number',
          description: 'Page number',
          default: 1,
        },
        limit: {
          type: 'number',
          description: 'Items per page',
          default: 20,
        },
      },
      required: ['userId'],
    },
    handler: `
      const { userId, page = 1, limit = 20 } = input;

      const where = { userId, deletedAt: null };

      const [conversations, total] = await Promise.all([
        prisma.aIConversation.findMany({
          where,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.aIConversation.count({ where }),
      ]);

      return {
        conversations: conversations.map(c => ({
          id: c.id,
          title: c.title,
          lastMessage: c.messages[0]?.content?.substring(0, 100),
          messageCount: c._count.messages,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    `,
  },

  // ============================================================================
  // GET CONVERSATION
  // ============================================================================
  {
    name: 'ai.getConversation',
    description: 'Get a single conversation with all messages',
    category: 'ai',
    tags: ['ai', 'chat', 'conversation', 'messages'],
    icon: 'MessagesSquare',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'Conversation ID',
        },
        limit: {
          type: 'number',
          description: 'Max messages to return',
          default: 50,
        },
        before: {
          type: 'string',
          description: 'Get messages before this message ID (for pagination)',
        },
      },
      required: ['conversationId'],
    },
    handler: `
      const { conversationId, limit = 50, before } = input;

      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, deletedAt: null },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const messageWhere = { conversationId };
      if (before) {
        const beforeMsg = await prisma.aIMessage.findUnique({ where: { id: before } });
        if (beforeMsg) {
          messageWhere.createdAt = { lt: beforeMsg.createdAt };
        }
      }

      const messages = await prisma.aIMessage.findMany({
        where: messageWhere,
        orderBy: { createdAt: 'asc' },
        take: limit,
      });

      return {
        id: conversation.id,
        title: conversation.title,
        systemPrompt: conversation.systemPrompt,
        context: conversation.context,
        messages: messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          toolCalls: m.toolCalls,
          createdAt: m.createdAt,
        })),
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      };
    `,
  },

  // ============================================================================
  // DELETE CONVERSATION
  // ============================================================================
  {
    name: 'ai.deleteConversation',
    description: 'Delete an AI chat conversation',
    category: 'ai',
    tags: ['ai', 'chat', 'delete', 'conversation'],
    icon: 'Trash2',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'Conversation ID',
        },
        userId: {
          type: 'string',
          description: 'User ID (for authorization)',
        },
      },
      required: ['conversationId'],
    },
    handler: `
      const { conversationId, userId } = input;

      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, deletedAt: null },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Check ownership if userId provided
      if (userId && conversation.userId !== userId) {
        throw new Error('Not authorized to delete this conversation');
      }

      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { deletedAt: new Date() },
      });

      return {
        deleted: true,
        conversationId,
      };
    `,
  },

  // ============================================================================
  // UPDATE CONVERSATION
  // ============================================================================
  {
    name: 'ai.updateConversation',
    description: 'Update conversation title or context',
    category: 'ai',
    tags: ['ai', 'chat', 'update', 'conversation'],
    icon: 'Edit',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        conversationId: {
          type: 'string',
          description: 'Conversation ID',
        },
        title: {
          type: 'string',
          description: 'New conversation title',
        },
        context: {
          type: 'object',
          description: 'Updated context object',
        },
      },
      required: ['conversationId'],
    },
    handler: `
      const { conversationId, title, context } = input;

      const conversation = await prisma.aIConversation.findFirst({
        where: { id: conversationId, deletedAt: null },
      });

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (context !== undefined) updateData.context = context;

      const updated = await prisma.aIConversation.update({
        where: { id: conversationId },
        data: updateData,
      });

      return {
        id: updated.id,
        title: updated.title,
        context: updated.context,
        updatedAt: updated.updatedAt,
      };
    `,
  },
];
