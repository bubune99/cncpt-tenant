"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import Image from "next/image";

interface LogoProps {
  href?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

interface BrandingData {
  siteName: string;
  siteTagline?: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  logoAlt?: string;
}

const sizeClasses = {
  sm: "h-6",
  md: "h-8",
  lg: "h-12",
};

const textSizeClasses = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

export function Logo({
  href = "/",
  className = "",
  size = "md",
  showText = true,
}: LogoProps) {
  const { resolvedTheme } = useTheme();
  const [branding, setBranding] = useState<BrandingData>({
    siteName: "My Site",
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const response = await fetch("/api/settings?group=branding");
      if (response.ok) {
        const data = await response.json();
        if (data.branding) {
          setBranding(data.branding);
        }
      }
    } catch (error) {
      console.error("Failed to fetch branding:", error);
    }
  };

  // Determine which logo to use based on theme
  const logoUrl =
    mounted && resolvedTheme === "dark" && branding.logoDarkUrl
      ? branding.logoDarkUrl
      : branding.logoUrl;

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={branding.logoAlt || branding.siteName}
          width={size === "sm" ? 24 : size === "md" ? 32 : 48}
          height={size === "sm" ? 24 : size === "md" ? 32 : 48}
          className={`${sizeClasses[size]} w-auto object-contain`}
          priority
        />
      ) : (
        // Default logo placeholder - first letter of site name
        <div
          className={`${sizeClasses[size]} aspect-square rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold ${
            size === "sm" ? "text-sm" : size === "md" ? "text-base" : "text-xl"
          }`}
        >
          {branding.siteName.charAt(0).toUpperCase()}
        </div>
      )}
      {showText && (
        <span className={`font-semibold ${textSizeClasses[size]}`}>
          {branding.siteName}
        </span>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
