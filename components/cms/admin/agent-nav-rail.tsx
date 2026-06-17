'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Event the chat interceptor dispatches to navigate from the correct (layout)
 * router context. The chat panel is portaled to <body>, so its own router is
 * detached and router.push() no-ops; this rail lives in the admin/dashboard
 * layout tree, so its listener navigates reliably for ANY path.
 *
 * (Minimal cncpt port of dzidzor's AgentNavRail — catch-all only; the
 * per-route hidden buttons were an optimization we don't need: the interceptor
 * falls through to dispatching this event for every path.)
 */
export const AGENT_NAVIGATE_EVENT = 'agent:navigate';

export function AgentNavRail() {
  const router = useRouter();

  useEffect(() => {
    function onNavigate(e: Event) {
      const path = (e as CustomEvent<{ path?: string }>).detail?.path;
      if (path && typeof path === 'string') router.push(path);
    }
    window.addEventListener(AGENT_NAVIGATE_EVENT, onNavigate as EventListener);
    return () =>
      window.removeEventListener(AGENT_NAVIGATE_EVENT, onNavigate as EventListener);
  }, [router]);

  return <div data-agent-nav-rail="" aria-hidden="true" style={{ display: 'none' }} />;
}
