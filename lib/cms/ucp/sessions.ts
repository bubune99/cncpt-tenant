/**
 * UCP Checkout Session Store
 *
 * In-memory session store for UCP checkout sessions.
 * Sessions expire after 24 hours. For production scale, migrate to Redis or database.
 */

import type { UcpCheckoutSession } from './types';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const sessions = new Map<string, UcpCheckoutSession>();

/** Clean up expired sessions on read */
function cleanup(): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session._created_at && now - session._created_at > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

export function createUcpSession(session: UcpCheckoutSession): UcpCheckoutSession {
  session._created_at = Date.now();
  sessions.set(session.id, session);
  return session;
}

export function getUcpSession(id: string): UcpCheckoutSession | null {
  cleanup();
  return sessions.get(id) ?? null;
}

export function updateUcpSession(id: string, updates: Partial<UcpCheckoutSession>): UcpCheckoutSession | null {
  const existing = sessions.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  sessions.set(id, updated);
  return updated;
}

export function deleteUcpSession(id: string): boolean {
  return sessions.delete(id);
}
