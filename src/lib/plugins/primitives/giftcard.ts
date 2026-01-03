/**
 * Gift Card Primitives
 *
 * AI-callable primitives for gift card functionality.
 * Enables purchasing, sending, and redeeming gift cards.
 */

import { CreatePrimitiveRequest } from '../types';

export const GIFTCARD_PRIMITIVES: Array<CreatePrimitiveRequest & { builtIn: true }> = [
  // ============================================================================
  // CHECK BALANCE
  // ============================================================================
  {
    name: 'giftcard.check',
    description: 'Check gift card balance and validity',
    category: 'giftcard',
    tags: ['giftcard', 'balance', 'check', 'storefront'],
    icon: 'CreditCard',
    timeout: 3000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Gift card code',
        },
      },
      required: ['code'],
    },
    handler: `
      const { code } = input;

      const giftCard = await prisma.giftCard.findFirst({
        where: { code: code.toUpperCase() },
      });

      if (!giftCard) {
        return {
          valid: false,
          error: 'Gift card not found',
        };
      }

      if (giftCard.status !== 'ACTIVE') {
        return {
          valid: false,
          error: 'Gift card is ' + giftCard.status.toLowerCase(),
          status: giftCard.status,
        };
      }

      if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
        return {
          valid: false,
          error: 'Gift card has expired',
          expiresAt: giftCard.expiresAt,
        };
      }

      if (giftCard.balance <= 0) {
        return {
          valid: false,
          error: 'Gift card has no remaining balance',
          balance: 0,
        };
      }

      return {
        valid: true,
        balance: giftCard.balance,
        originalAmount: giftCard.originalAmount,
        currency: giftCard.currency,
        expiresAt: giftCard.expiresAt,
        status: giftCard.status,
      };
    `,
  },

  // ============================================================================
  // REDEEM GIFT CARD
  // ============================================================================
  {
    name: 'giftcard.redeem',
    description: 'Redeem gift card balance towards an order',
    category: 'giftcard',
    tags: ['giftcard', 'redeem', 'payment', 'checkout'],
    icon: 'Gift',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Gift card code',
        },
        amount: {
          type: 'number',
          description: 'Amount to redeem',
          minimum: 0.01,
        },
        orderId: {
          type: 'string',
          description: 'Order ID to apply to',
        },
        userId: {
          type: 'string',
          description: 'User ID redeeming',
        },
      },
      required: ['code', 'amount', 'orderId'],
    },
    handler: `
      const { code, amount, orderId, userId } = input;

      const giftCard = await prisma.giftCard.findFirst({
        where: { code: code.toUpperCase() },
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      if (giftCard.status !== 'ACTIVE') {
        throw new Error('Gift card is not active');
      }

      if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
        throw new Error('Gift card has expired');
      }

      if (giftCard.balance < amount) {
        throw new Error('Insufficient gift card balance. Available: ' + giftCard.balance);
      }

      // Create transaction and update balance
      const [transaction, updatedCard] = await prisma.$transaction([
        prisma.giftCardTransaction.create({
          data: {
            giftCardId: giftCard.id,
            type: 'REDEMPTION',
            amount: -amount,
            balance: giftCard.balance - amount,
            orderId,
            userId: userId || null,
            description: 'Redeemed for order ' + orderId,
          },
        }),
        prisma.giftCard.update({
          where: { id: giftCard.id },
          data: {
            balance: { decrement: amount },
            usedAt: giftCard.usedAt || new Date(),
            status: giftCard.balance - amount <= 0 ? 'REDEEMED' : 'ACTIVE',
          },
        }),
      ]);

      return {
        redeemed: true,
        amountRedeemed: amount,
        remainingBalance: updatedCard.balance,
        transactionId: transaction.id,
        orderId,
      };
    `,
  },

  // ============================================================================
  // GET BALANCE
  // ============================================================================
  {
    name: 'giftcard.getBalance',
    description: 'Get detailed gift card information with transaction history',
    category: 'giftcard',
    tags: ['giftcard', 'balance', 'history'],
    icon: 'Wallet',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Gift card code',
        },
        includeHistory: {
          type: 'boolean',
          description: 'Include transaction history',
          default: false,
        },
      },
      required: ['code'],
    },
    handler: `
      const { code, includeHistory = false } = input;

      const giftCard = await prisma.giftCard.findFirst({
        where: { code: code.toUpperCase() },
        include: {
          transactions: includeHistory ? {
            orderBy: { createdAt: 'desc' },
            take: 20,
          } : false,
        },
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      return {
        code: giftCard.code,
        balance: giftCard.balance,
        originalAmount: giftCard.originalAmount,
        currency: giftCard.currency,
        status: giftCard.status,
        expiresAt: giftCard.expiresAt,
        activatedAt: giftCard.activatedAt,
        usedAt: giftCard.usedAt,
        transactions: giftCard.transactions?.map(t => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balance: t.balance,
          description: t.description,
          orderId: t.orderId,
          createdAt: t.createdAt,
        })) || [],
      };
    `,
  },

  // ============================================================================
  // PURCHASE GIFT CARD
  // ============================================================================
  {
    name: 'giftcard.purchase',
    description: 'Purchase a new gift card',
    category: 'giftcard',
    tags: ['giftcard', 'purchase', 'buy'],
    icon: 'ShoppingBag',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Gift card amount',
          minimum: 5,
          maximum: 1000,
        },
        currency: {
          type: 'string',
          description: 'Currency code',
          default: 'USD',
        },
        purchaserId: {
          type: 'string',
          description: 'Purchaser user ID',
        },
        delivery: {
          type: 'string',
          description: 'Delivery method',
          enum: ['EMAIL', 'PRINT', 'PHYSICAL'],
          default: 'EMAIL',
        },
        recipientEmail: {
          type: 'string',
          description: 'Recipient email (for EMAIL delivery)',
        },
        recipientName: {
          type: 'string',
          description: 'Recipient name',
        },
        senderName: {
          type: 'string',
          description: 'Sender name',
        },
        message: {
          type: 'string',
          description: 'Gift message',
          maxLength: 500,
        },
        scheduledFor: {
          type: 'string',
          description: 'Schedule delivery date (ISO 8601)',
        },
      },
      required: ['amount', 'purchaserId'],
    },
    handler: `
      const { amount, currency = 'USD', purchaserId, delivery = 'EMAIL', recipientEmail, recipientName, senderName, message, scheduledFor } = input;

      // Generate unique code
      const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 16; i++) {
          if (i > 0 && i % 4 === 0) code += '-';
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let code;
      let attempts = 0;
      do {
        code = generateCode();
        const existing = await prisma.giftCard.findFirst({ where: { code } });
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error('Failed to generate unique code');
      }

      // Set expiration (1 year from now by default)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const giftCard = await prisma.giftCard.create({
        data: {
          code,
          originalAmount: amount,
          balance: amount,
          currency,
          status: 'ACTIVE',
          purchaserId,
          recipientEmail: recipientEmail || null,
          recipientName: recipientName || null,
          senderName: senderName || null,
          message: message || null,
          delivery,
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          expiresAt,
          activatedAt: new Date(),
        },
      });

      // Create initial transaction
      await prisma.giftCardTransaction.create({
        data: {
          giftCardId: giftCard.id,
          type: 'PURCHASE',
          amount: amount,
          balance: amount,
          userId: purchaserId,
          description: 'Gift card purchased',
        },
      });

      return {
        id: giftCard.id,
        code: giftCard.code,
        amount: giftCard.originalAmount,
        currency: giftCard.currency,
        delivery: giftCard.delivery,
        recipientEmail: giftCard.recipientEmail,
        expiresAt: giftCard.expiresAt,
        message: 'Gift card created successfully',
      };
    `,
  },

  // ============================================================================
  // SEND GIFT CARD
  // ============================================================================
  {
    name: 'giftcard.send',
    description: 'Send/resend gift card to recipient',
    category: 'giftcard',
    tags: ['giftcard', 'send', 'email'],
    icon: 'Send',
    timeout: 10000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        giftCardId: {
          type: 'string',
          description: 'Gift card ID',
        },
        code: {
          type: 'string',
          description: 'Gift card code (alternative to ID)',
        },
        recipientEmail: {
          type: 'string',
          description: 'Email to send to (override)',
        },
      },
      required: [],
    },
    handler: `
      const { giftCardId, code, recipientEmail } = input;

      if (!giftCardId && !code) {
        throw new Error('Either giftCardId or code is required');
      }

      const giftCard = await prisma.giftCard.findFirst({
        where: giftCardId ? { id: giftCardId } : { code: code.toUpperCase() },
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      const email = recipientEmail || giftCard.recipientEmail;
      if (!email) {
        throw new Error('No recipient email available');
      }

      // Note: Actual email sending would be done via email service
      // This just records the send attempt
      await prisma.giftCard.update({
        where: { id: giftCard.id },
        data: {
          recipientEmail: email,
          sentAt: new Date(),
        },
      });

      return {
        sent: true,
        giftCardId: giftCard.id,
        recipientEmail: email,
        code: giftCard.code.substring(0, 4) + '-****-****-' + giftCard.code.slice(-4),
        note: 'Email will be sent via configured email service',
      };
    `,
  },

  // ============================================================================
  // REFUND TO GIFT CARD
  // ============================================================================
  {
    name: 'giftcard.refund',
    description: 'Add balance back to a gift card (for refunds)',
    category: 'giftcard',
    tags: ['giftcard', 'refund', 'balance'],
    icon: 'RefreshCw',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Gift card code',
        },
        amount: {
          type: 'number',
          description: 'Amount to refund',
          minimum: 0.01,
        },
        orderId: {
          type: 'string',
          description: 'Related order ID',
        },
        reason: {
          type: 'string',
          description: 'Refund reason',
        },
      },
      required: ['code', 'amount'],
    },
    handler: `
      const { code, amount, orderId, reason } = input;

      const giftCard = await prisma.giftCard.findFirst({
        where: { code: code.toUpperCase() },
      });

      if (!giftCard) {
        throw new Error('Gift card not found');
      }

      const newBalance = giftCard.balance + amount;

      // Cannot exceed original amount
      if (newBalance > giftCard.originalAmount) {
        throw new Error('Refund would exceed original gift card amount');
      }

      const [transaction, updatedCard] = await prisma.$transaction([
        prisma.giftCardTransaction.create({
          data: {
            giftCardId: giftCard.id,
            type: 'REFUND',
            amount: amount,
            balance: newBalance,
            orderId: orderId || null,
            description: reason || 'Refund to gift card',
          },
        }),
        prisma.giftCard.update({
          where: { id: giftCard.id },
          data: {
            balance: newBalance,
            status: 'ACTIVE',
          },
        }),
      ]);

      return {
        refunded: true,
        amountRefunded: amount,
        newBalance: updatedCard.balance,
        transactionId: transaction.id,
      };
    `,
  },

  // ============================================================================
  // GET USER GIFT CARDS
  // ============================================================================
  {
    name: 'giftcard.getUserCards',
    description: 'Get gift cards purchased by or sent to a user',
    category: 'giftcard',
    tags: ['giftcard', 'user', 'list'],
    icon: 'CreditCard',
    timeout: 5000,
    builtIn: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: {
          type: 'string',
          description: 'User ID',
        },
        type: {
          type: 'string',
          description: 'Filter type',
          enum: ['purchased', 'received', 'all'],
          default: 'all',
        },
        status: {
          type: 'string',
          description: 'Filter by status',
          enum: ['ACTIVE', 'REDEEMED', 'EXPIRED', 'DISABLED'],
        },
      },
      required: ['userId'],
    },
    handler: `
      const { userId, type = 'all', status } = input;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const where = {};

      if (type === 'purchased') {
        where.purchaserId = userId;
      } else if (type === 'received') {
        where.recipientEmail = user.email;
      } else {
        where.OR = [
          { purchaserId: userId },
          { recipientEmail: user.email },
        ];
      }

      if (status) where.status = status;

      const giftCards = await prisma.giftCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return {
        giftCards: giftCards.map(gc => ({
          id: gc.id,
          code: gc.code.substring(0, 4) + '-****-****-' + gc.code.slice(-4),
          fullCode: gc.purchaserId === userId ? gc.code : undefined,
          balance: gc.balance,
          originalAmount: gc.originalAmount,
          currency: gc.currency,
          status: gc.status,
          isPurchased: gc.purchaserId === userId,
          isReceived: gc.recipientEmail === user.email,
          recipientName: gc.recipientName,
          senderName: gc.senderName,
          expiresAt: gc.expiresAt,
          createdAt: gc.createdAt,
        })),
        total: giftCards.length,
      };
    `,
  },
];
