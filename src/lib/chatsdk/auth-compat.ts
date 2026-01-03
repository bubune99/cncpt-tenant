"use client";

/**
 * Auth compatibility layer for chatsdk components
 * Wraps @stackframe/stack to provide similar interface to next-auth
 */

import { useUser } from "@stackframe/stack";
import type { User, Session } from "./auth-types";

// Compatibility hook for useSession
export function useSession(): {
  data: Session | null;
  status: "loading" | "authenticated" | "unauthenticated";
} {
  const user = useUser();

  if (user === undefined) {
    return { data: null, status: "loading" };
  }

  if (user === null) {
    return { data: null, status: "unauthenticated" };
  }

  return {
    data: {
      user: {
        id: user.id,
        name: user.displayName ?? null,
        email: user.primaryEmail ?? null,
        image: user.profileImageUrl ?? null,
        type: "regular",
      },
    },
    status: "authenticated",
  };
}

// Compatibility function for signOut
export async function signOut(options?: { redirectTo?: string }): Promise<void> {
  // @stackframe/stack signOut is handled via the user object
  // For now, redirect to a logout endpoint or home
  if (options?.redirectTo) {
    window.location.href = options.redirectTo;
  } else {
    window.location.href = "/";
  }
}

// Helper to get current user
export function getCurrentUser(): User | null {
  // This is a server-side placeholder - use useSession on client
  return null;
}
