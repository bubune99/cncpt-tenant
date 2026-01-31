'use client';

/**
 * Admin Chat Component
 *
 * Wrapper component that handles hydration and provides the chat panel
 * in the admin layout.
 */

import dynamic from 'next/dynamic';

// Dynamic import to avoid hydration issues with Zustand persist
const ChatPanel = dynamic(
  () => import('./chat-panel').then((mod) => ({ default: mod.ChatPanel })),
  { ssr: false }
);

export function AdminChat() {
  return <ChatPanel />;
}

export { ChatPanel } from './chat-panel';
