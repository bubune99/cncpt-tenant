"use client";
/**
 * New Product page — Atlas editor in create mode.
 *
 * Passes productId="new" so ProductEditorAtlas knows to POST instead of PUT.
 * After successful create, the editor swaps the URL to /admin/products/[id]
 * (via window.history.replaceState — no full navigation, preserves dirty state if any).
 */

import { useParams } from "next/navigation";
import { ProductEditorAtlas } from "@/components/cms/products/ProductEditorAtlas";

export default function NewProductPage() {
  const params = useParams<{ subdomain: string }>();
  const subdomain = params?.subdomain ?? "";

  return <ProductEditorAtlas productId="new" subdomain={subdomain} />;
}
