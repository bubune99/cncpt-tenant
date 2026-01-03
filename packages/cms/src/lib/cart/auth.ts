/**
 * Cart Authentication Helper
 *
 * Gets the current user's internal ID from Stack Auth session
 */

import { stackServerApp } from '../stack';
import { prisma } from '../db';

/**
 * Get the current user's internal database ID from Stack Auth session
 * Returns undefined if not authenticated (for guest carts)
 */
export async function getCurrentUserId(): Promise<string | undefined> {
  try {
    const stackUser = await stackServerApp.getUser();

    if (!stackUser) {
      return undefined;
    }

    // Look up our internal user by Stack Auth ID
    const user = await prisma.user.findUnique({
      where: { stackAuthId: stackUser.id },
      select: { id: true },
    });

    return user?.id;
  } catch (error) {
    // If auth fails, treat as guest (don't break cart functionality)
    console.error('Error getting current user for cart:', error);
    return undefined;
  }
}

/**
 * Get the current user's email from Stack Auth session
 * Useful for cart abandonment emails
 */
export async function getCurrentUserEmail(): Promise<string | undefined> {
  try {
    const stackUser = await stackServerApp.getUser();
    return stackUser?.primaryEmail ?? undefined;
  } catch {
    return undefined;
  }
}
