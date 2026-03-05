"use client"

/**
 * ShopPageLayout Component
 *
 * Wraps the FilterableProductGrid with page title, description,
 * breadcrumbs, and result count display. Used by both the main
 * shop page and collection-filtered pages.
 */

import Link from "next/link"
import { Suspense } from "react"
import { FilterableProductGrid } from "./filterable-product-grid"

interface ShopPageLayoutProps {
  /** Page title (e.g., "Shop", collection name) */
  title?: string
  /** Optional description shown below the title */
  description?: string
  /** Pre-set collection filter handle */
  collection?: string
  /** Breadcrumb trail */
  breadcrumbs?: { label: string; href?: string }[]
  /** Number of products per page */
  pageSize?: number
}

export function ShopPageLayout({
  title = "Shop",
  description,
  collection,
  breadcrumbs,
  pageSize = 24,
}: ShopPageLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav
          className="mb-4 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center gap-1.5">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3 h-3"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {/* Filterable Grid - wrapped in Suspense for useSearchParams */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg overflow-hidden border border-border bg-card animate-pulse"
              >
                <div className="aspect-square bg-muted" />
                <div className="p-3 sm:p-4 space-y-2">
                  <div className="h-3 w-16 bg-muted rounded" />
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-4 w-1/3 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <FilterableProductGrid
          initialCollection={collection}
          collectionTitle={title}
          pageSize={pageSize}
        />
      </Suspense>
    </div>
  )
}
