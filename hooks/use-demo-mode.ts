"use client";

import { useParams } from "next/navigation";
import { isDemoSubdomain } from "@/lib/demo";

/**
 * Hook to check if the current subdomain is in demo mode
 */
export function useDemoMode() {
  const params = useParams();
  const subdomain = params?.subdomain as string;

  const isDemo = isDemoSubdomain(subdomain);

  return {
    isDemo,
    subdomain,
    // Demo mode is always read-only
    isReadOnly: isDemo,
  };
}
