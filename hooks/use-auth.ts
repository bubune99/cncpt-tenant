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

  // Sync Stack Auth user to both CMS (Prisma) and platform (raw SQL) databases
  useEffect(() => {
    if (stackUser && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;

      const syncUser = async () => {
        const syncPayload = {
          stackAuthId: stackUser.id,
          email: stackUser.primaryEmail,
          name: stackUser.displayName,
          avatar: stackUser.profileImageUrl,
        };

        // Sync to CMS User model (Prisma)
        try {
          const response = await fetch("/api/cms/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(syncPayload),
          });

          if (response.ok) {
            const data = await response.json();
            setDbUser(data.user);
          } else {
            const error = await response.json();
            console.error("CMS user sync failed:", error);
            setSyncError(error.error || "CMS sync failed");
          }
        } catch (error) {
          console.error("CMS user sync error:", error);
          setSyncError("Network error during CMS sync");
        }

        // Sync to platform users table (raw SQL) — fire-and-forget
        try {
          await fetch("/api/auth/sync-platform", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(syncPayload),
          });
        } catch (error) {
          // Platform sync failure is non-critical — webhook will catch up
          console.warn("Platform user sync error (non-critical):", error);
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