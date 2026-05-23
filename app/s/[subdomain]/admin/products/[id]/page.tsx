"use client";
/**
 * Atlas Product Editor — route page
 *
 * Route: /s/[subdomain]/admin/products/[id]
 *
 * Single editor target. The Atlas editor handles all product types and now
 * carries the full legacy-parity field set (featured, barcode, tax, shipping
 * dimensions, low-stock threshold, backorder, Media tab, Stripe sync action,
 * subscription/service/bundle/digital type-specific fields, SEO).
 *
 * Products list links here for "Configure". The legacy `/configure` sub-route
 * has been retired (see ATLAS-COMPLETENESS-AUDIT R21).
 */

import { useParams } from "next/navigation";
import { ProductEditorAtlas } from "@/components/cms/products/ProductEditorAtlas";

export default function AtlasProductPage() {
  const params = useParams<{ subdomain: string; id: string }>();
  const { subdomain, id } = params;

  return (
    <ProductEditorAtlas
      productId={id}
      subdomain={subdomain}
    />
  );
}
