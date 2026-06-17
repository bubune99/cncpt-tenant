/**
 * Navigation feedback.
 *
 * The chat interceptor records whether a navigate tool call actually changed
 * the route (verified against window.location after the navigation settles).
 * The latest result is sent with the next chat request (see chat.tsx) and woven
 * into the system prompt (see api/chat/route.ts) so the agent learns the ground
 * truth and stops claiming a navigation succeeded when it didn't.
 *
 * Module-level singleton: it's read once at send time, so no reactivity needed.
 */

export interface NavFeedback {
  /** The path the agent asked to navigate to. */
  requested: string;
  /** The actual pathname after the navigation settled. */
  actual: string;
  /** Whether the route actually changed to the requested path. */
  success: boolean;
}

let lastNav: NavFeedback | null = null;

export function setLastNav(feedback: NavFeedback): void {
  lastNav = feedback;
}

export function getLastNav(): NavFeedback | null {
  return lastNav;
}
