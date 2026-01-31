/**
 * ChatSDK Database Utilities
 */

import { generateId } from '../../utils';

/**
 * Generate a dummy password for guest users
 */
export function generateDummyPassword(): string {
  return `dummy-${generateId(24)}`;
}
