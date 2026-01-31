/**
 * User Entitlements for AI Chat
 *
 * Defines rate limits and available models based on user role.
 * Adapted from ChatSDK for Prisma/Stack Auth.
 */

import type { ChatModel } from './models';

// User types based on Prisma UserRole enum
export type UserType = 'guest' | 'customer' | 'admin';

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel['id'][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /**
   * For users without an account (not applicable in admin panel, but kept for completeness)
   */
  guest: {
    maxMessagesPerDay: 0,
    availableChatModelIds: [],
  },

  /**
   * For customers (limited access)
   */
  customer: {
    maxMessagesPerDay: 50,
    availableChatModelIds: ['anthropic/claude-sonnet-4.5'],
  },

  /**
   * For admin users (full access)
   */
  admin: {
    maxMessagesPerDay: 500,
    availableChatModelIds: ['anthropic/claude-sonnet-4.5', 'anthropic/claude-haiku-4.5', 'anthropic/claude-opus-4.5'],
  },
};

/**
 * Get user type from Prisma UserRole
 */
export function getUserType(role?: string): UserType {
  if (!role) return 'guest';

  switch (role.toUpperCase()) {
    case 'ADMIN':
      return 'admin';
    case 'CUSTOMER':
      return 'customer';
    default:
      return 'guest';
  }
}

/**
 * Get entitlements for a user role
 */
export function getEntitlements(role?: string): Entitlements {
  const userType = getUserType(role);
  return entitlementsByUserType[userType];
}
