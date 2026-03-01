"use client"

import FeatureSettings from "@/components/cms/admin/settings/feature-settings"

/**
 * Standalone Feature Management Page
 *
 * Full-page feature settings accessible from /admin/features.
 * Same component as the Settings > Features tab but with page-level header.
 */
export default function FeaturesPage() {
  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Features & Modules
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable modules and sub-features for your site. Apply a
          vertical preset for quick setup, then customize as needed.
        </p>
      </div>
      <FeatureSettings />
    </div>
  )
}
