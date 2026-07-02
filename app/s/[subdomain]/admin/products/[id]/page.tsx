"use client";
/**
 * Product editor — route page.
 *
 * Route: /s/[subdomain]/admin/products/[id]
 *
 * Single editor target for all product types. Renders the Grainy ProductEditor
 * shell, which carries the full field set (featured, barcode, tax, shipping
 * dimensions, low-stock threshold, backorder, media, Stripe sync, variants,
 * pricing tiers, custom fields, and subscription/service/bundle/digital
 * type-specific tabs).
 *
 * Products list links here for "Configure". The legacy `/configure` sub-route
 * has been retired.
 */

import { useParams } from "next/navigation";
import { ProductEditor } from "@/components/cms/products/editor/product-editor";

export default function ProductEditorPage() {
  const params = useParams<{ subdomain: string; id: string }>();
  const { subdomain, id } = params;

  return <ProductEditor productId={id} subdomain={subdomain} />;
}
