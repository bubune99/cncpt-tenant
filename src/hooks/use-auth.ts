"use client";

import { useUser } from "@stackframe/stack";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface DbUser {
  id: string;
  stackAuthId: string;
  email: string;
  name: string | null;
  role: string;
}

export function useAuth() {
  const stackUser = useUser();
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const syncAttemptedRef = useRef(false);

  // Sync Stack Auth user to database
  useEffect(() => {
    if (stackUser && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;

      const syncUser = async () => {
        try {
          const response = await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stackAuthId: stackUser.id,
              email: stackUser.primaryEmail,
              name: stackUser.displayName,
              avatar: stackUser.profileImageUrl,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            setDbUser(data.user);
          } else {
            const error = await response.json();
            console.error("User sync failed:", error);
            setSyncError(error.error || "Sync failed");
          }
        } catch (error) {
          console.error("User sync error:", error);
          setSyncError("Network error during sync");
        }
      };

      syncUser();
    }
  }, [stackUser]);

  useEffect(() => {
    if (stackUser !== undefined) {
      setAuthChecked(true);
    }
    // Reset sync attempt when user changes
    if (!stackUser) {
      syncAttemptedRef.current = false;
      setDbUser(null);
      setSyncError(null);
    }
  }, [stackUser]);

  return {
    user: stackUser,
    dbUser, // The synced database user with local ID
    isLoading: stackUser === undefined,
    isAuthenticated: !!stackUser,
    authChecked,
    syncError,
    signOut: async () => {
      try {
        if (stackUser) {
          await stackUser.signOut();
        } else {
          router.push('/handler/sign-out');
        }
      } catch (error) {
        console.error('Sign out error:', error);
        router.push('/handler/sign-out');
      }
    }
  };
}