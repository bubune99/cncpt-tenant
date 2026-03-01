"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface TenantAdminLogoProps {
  fallbackSiteName?: string;
}

interface BrandingData {
  siteName: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  logoAlt?: string;
}

/**
 * TenantAdminLogo
 *
 * Displays the tenant's own logo in the admin sidebar.
 * Falls back to the first-letter placeholder if no logo is configured.
 *
 * This is a client component because it needs:
 * 1. useParams() to get the subdomain
 * 2. useTheme() for dark mode logo switching
 * 3. Fetches from /api/cms/admin/branding endpoint
 */
export function TenantAdminLogo({ fallbackSiteName }: TenantAdminLogoProps) {
  const { resolvedTheme } = useTheme();
  const params = useParams();
  const subdomain = params?.subdomain as string;
  const [branding, setBranding] = useState<BrandingData | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!subdomain) return;

    fetch(`/api/cms/admin/branding?subdomain=${encodeURIComponent(subdomain)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.branding) {
          setBranding({
            siteName: data.branding.siteName || subdomain,
            logoUrl: data.branding.logoUrl,
            logoDarkUrl: data.branding.logoDarkUrl,
            logoAlt: data.branding.logoAlt,
          });
        }
      })
      .catch(() => {
        // Silently fail — fallback rendering will handle it
      });
  }, [subdomain]);

  const name = branding?.siteName || fallbackSiteName || subdomain || "Admin";

  // Determine which logo to use based on theme
  const logoUrl =
    mounted && resolvedTheme === "dark" && branding?.logoDarkUrl
      ? branding.logoDarkUrl
      : branding?.logoUrl;

  return (
    <>
      <Link
        href="/admin"
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={branding?.logoAlt || name}
            width={24}
            height={24}
            className="h-6 w-auto object-contain"
            priority
          />
        ) : (
          <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="font-semibold text-lg truncate max-w-[140px]">
          {name}
        </span>
      </Link>
      <p className="text-xs text-muted-foreground mt-1 pl-8">Admin Panel</p>
    </>
  );
}

export default TenantAdminLogo;
