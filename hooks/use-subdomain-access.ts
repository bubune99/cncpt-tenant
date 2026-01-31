"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export interface SubdomainAccess {
  hasAccess: boolean;
  accessType: "owner" | "team" | null;
  accessLevel: "view" | "edit" | "admin" | null;
  teamId?: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check if the current user has access to the current subdomain
 * Uses the subdomain from URL params and calls an API to verify access
 */
export function useSubdomainAccess(
  requiredAccessLevel: "view" | "edit" | "admin" = "view"
): SubdomainAccess {
  const params = useParams();
  const subdomain = params?.subdomain as string;

  const [access, setAccess] = useState<SubdomainAccess>({
    hasAccess: false,
    accessType: null,
    accessLevel: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!subdomain) {
      setAccess({
        hasAccess: false,
        accessType: null,
        accessLevel: null,
        isLoading: false,
        error: "No subdomain found",
      });
      return;
    }

    const checkAccess = async () => {
      try {
        const response = await fetch(
          `/api/subdomains/${subdomain}/access?level=${requiredAccessLevel}`
        );

        if (!response.ok) {
          if (response.status === 401) {
            setAccess({
              hasAccess: false,
              accessType: null,
              accessLevel: null,
              isLoading: false,
              error: "Not authenticated",
            });
            return;
          }
          throw new Error("Failed to check access");
        }

        const data = await response.json();
        setAccess({
          hasAccess: data.hasAccess,
          accessType: data.accessType,
          accessLevel: data.accessLevel,
          teamId: data.teamId,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("[useSubdomainAccess] Error:", error);
        setAccess({
          hasAccess: false,
          accessType: null,
          accessLevel: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    checkAccess();
  }, [subdomain, requiredAccessLevel]);

  return access;
}
