"use client"

/**
 * Product Card Component
 *
 * Individual product card for the shop grid. Displays product image with
 * hover effect (second image), title, price, sale badge, and stock status.
 */

import Image from "next/image"
import Link from "next/link"
import type { CommerceProduct } from "@/lib/cms/commerce/types"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  product: CommerceProduct
  className?: string
}

function formatPrice(amount: number, currencyCode: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}

export function ProductCard({ product, className }: ProductCardProps) {
  const primaryImage = product.images[0]
  const secondaryImage = product.images[1]
  const hasDiscount =
    product.compareAtPrice != null &&
    product.compareAtPrice.amount > 0 &&
    product.compareAtPrice.amount > product.price.amount
  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compareAtPrice!.amount - product.price.amount) /
          product.compareAtPrice!.amount) *
          100
      )
    : 0

  return (
    <Link
      href={`/shop/${product.handle}`}
      className={cn(
        "group block rounded-lg overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300",
        className
      )}
    >
      {/* Image container */}
      <div className="relative aspect-square bg-muted overflow-hidden">
        {primaryImage ? (
          <>
            <Image
              src={primaryImage.url}
              alt={primaryImage.alt || product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn(
                "object-cover transition-opacity duration-500",
                secondaryImage
                  ? "group-hover:opacity-0"
                  : "group-hover:scale-105 transition-transform duration-500"
              )}
            />
            {secondaryImage && (
              <Image
                src={secondaryImage.url}
                alt={secondaryImage.alt || product.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-12 h-12"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
              />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {hasDiscount && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercent}%
            </Badge>
          )}
          {!product.available && (
            <Badge variant="secondary" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>
      </div>

      {/* Product info */}
      <div className="p-3 sm:p-4">
        {/* Vendor or product type */}
        {(product.vendor || product.productType) && (
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1 truncate">
            {product.vendor || product.productType}
          </p>
        )}

        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {formatPrice(product.price.amount, product.price.currencyCode)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatPrice(
                product.compareAtPrice!.amount,
                product.compareAtPrice!.currencyCode
              )}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
