"use client";
/**
 * New Product page — Grainy ProductEditor in create mode.
 *
 * Passes productId="new" so the editor POSTs instead of PUTs. After a
 * successful create, the editor swaps the URL to /admin/products/[id] via
 * window.history.replaceState (no full navigation, dirty state preserved).
 */

import { useParams } from "next/navigation";
import { ProductEditor } from "@/components/cms/products/editor/product-editor";

export default function NewProductPage() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params?.subdomain ?? "";

  return <ProductEditor productId="new" subdomain={subdomain} />;
}
