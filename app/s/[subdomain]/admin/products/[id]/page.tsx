"use client";
/**
 * Atlas Product Editor — route page
 *
 * Route: /s/[subdomain]/admin/products/[id]
 *
 * Renders the full Atlas product editor for an existing product.
 * The legacy `configure/` sub-route (ProductEditor) is preserved for rollback.
 *
 * A1 note: Products list links to `/admin/products/${product.id}` (this page).
 *          The old `/admin/products/${product.id}/configure` still works too.
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
